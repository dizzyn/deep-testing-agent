import { OpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

/**
 * OpenRouter configuration for Scout web testing agent
 * Provides centralized access to AI models via OpenRouter gateway
 */

export interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  plannerModel: string;
  executorModel: string;
  fallbackModels: {
    planner: string[];
    executor: string[];
  };
}

/**
 * Get OpenRouter configuration from environment variables
 */
export function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  return {
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    plannerModel:
      process.env.OPENROUTER_MODEL_PLANNER || "deepseek/deepseek-r1",
    executorModel:
      process.env.OPENROUTER_MODEL_EXECUTOR || "qwen/qwen-2.5-72b-instruct",
    fallbackModels: {
      planner: [
        "deepseek/deepseek-r1",
        "anthropic/claude-3.5-sonnet",
        "openai/gpt-4o",
      ],
      executor: [
        "qwen/qwen-2.5-72b-instruct",
        "anthropic/claude-3.5-sonnet",
        "openai/gpt-4o",
      ],
    },
  };
}

/**
 * Custom OpenRouter client that handles the API correctly
 */
class OpenRouterClient {
  private config: OpenRouterConfig;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(
    model: string,
    temperature: number = 0.7,
    maxTokens: number = 4000
  ) {
    this.config = getOpenRouterConfig();
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  async invoke(messages: BaseMessage[]): Promise<{ content: string }> {
    try {
      // Convert LangChain messages to OpenRouter format
      const openRouterMessages = messages.map((msg) => ({
        role: msg._getType() === "human" ? "user" : "assistant",
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      }));

      console.log("🔄 OpenRouter request:", {
        model: this.model,
        messages: openRouterMessages.length,
        firstMessage: openRouterMessages[0]?.content?.substring(0, 100) + "...",
      });

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://scout-web-testing.vercel.app",
          "X-Title": "Scout Web Testing Agent",
        },
        body: JSON.stringify({
          model: this.model,
          messages: openRouterMessages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ OpenRouter API error:", response.status, errorText);
        throw new Error(
          `OpenRouter API error: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ OpenRouter response:", {
        model: data.model,
        usage: data.usage,
        contentLength: data.choices?.[0]?.message?.content?.length,
      });

      const content = data.choices?.[0]?.message?.content || "";
      return { content };
    } catch (error) {
      console.error("❌ OpenRouter client error:", error);
      throw error;
    }
  }
}

/**
 * Create OpenRouter client for Planner (DeepSeek-R1)
 * Pure reasoning agent - NO tool calling
 */
export function createPlannerClient(): OpenRouterClient {
  const config = getOpenRouterConfig();
  return new OpenRouterClient(config.plannerModel, 0.7, 4000);
}

/**
 * Create OpenRouter client for Executor (Qwen-2.5-72B-Instruct)
 * Tool calling agent with .bind_tools() method
 */
export function createExecutorClient(): OpenRouterClient {
  const config = getOpenRouterConfig();
  return new OpenRouterClient(config.executorModel, 0.1, 2000);
}

/**
 * Create fallback client when primary model fails
 */
export async function createFallbackClient(
  role: "planner" | "executor",
  excludeModels: string[] = []
): Promise<OpenRouterClient> {
  const config = getOpenRouterConfig();
  const availableModels = config.fallbackModels[role].filter(
    (model) => !excludeModels.includes(model)
  );

  if (availableModels.length === 0) {
    throw new Error(`No fallback models available for ${role}`);
  }

  const fallbackModel = availableModels[0];
  const temperature = role === "planner" ? 0.7 : 0.1;
  const maxTokens = role === "planner" ? 4000 : 2000;

  return new OpenRouterClient(fallbackModel, temperature, maxTokens);
}

/**
 * Test OpenRouter connectivity and model availability
 */
export async function testOpenRouterConnection(): Promise<{
  success: boolean;
  plannerAvailable: boolean;
  executorAvailable: boolean;
  error?: string;
}> {
  try {
    const config = getOpenRouterConfig();

    // Test basic connectivity
    const response = await fetch(`${config.baseURL}/models`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        plannerAvailable: false,
        executorAvailable: false,
        error: `OpenRouter API error: ${response.status} ${response.statusText}`,
      };
    }

    const models = (await response.json()) as { data?: Array<{ id: string }> };
    const modelIds = models.data?.map((m) => m.id) || [];

    return {
      success: true,
      plannerAvailable: modelIds.includes(config.plannerModel),
      executorAvailable: modelIds.includes(config.executorModel),
    };
  } catch (error) {
    return {
      success: false,
      plannerAvailable: false,
      executorAvailable: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
