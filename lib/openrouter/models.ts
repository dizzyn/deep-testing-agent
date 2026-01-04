/**
 * OpenRouter model definitions for Scout web testing agent
 * Defines capabilities and configurations for Planner and Executor models
 */

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  role: "planner" | "executor";
  capabilities: {
    reasoning: boolean;
    toolCalling: boolean;
    streaming: boolean;
    contextWindow: number;
    maxTokens: number;
  };
  pricing: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  description: string;
}

/**
 * DeepSeek-R1 - Primary Planner Model
 * Specialized for complex reasoning and plan generation
 * NO tool calling - pure reasoning agent
 */
export const DEEPSEEK_R1: ModelDefinition = {
  id: "deepseek/deepseek-r1",
  name: "DeepSeek-R1",
  provider: "DeepSeek",
  role: "planner",
  capabilities: {
    reasoning: true,
    toolCalling: false, // CRITICAL: No tool calling for planner
    streaming: true,
    contextWindow: 128000,
    maxTokens: 8192,
  },
  pricing: {
    input: 0.14, // $0.14 per 1M input tokens
    output: 0.28, // $0.28 per 1M output tokens
  },
  description:
    "Advanced reasoning model for planning and decision-making with <think> tag support",
};

/**
 * Qwen-2.5-72B-Instruct - Primary Executor Model
 * Specialized for tool calling and action execution
 */
export const QWEN_2_5_72B: ModelDefinition = {
  id: "qwen/qwen-2.5-72b-instruct",
  name: "Qwen-2.5-72B-Instruct",
  provider: "Qwen",
  role: "executor",
  capabilities: {
    reasoning: true,
    toolCalling: true, // Primary capability for executor
    streaming: true,
    contextWindow: 32768,
    maxTokens: 8192,
  },
  pricing: {
    input: 0.4, // $0.40 per 1M input tokens
    output: 1.2, // $1.20 per 1M output tokens
  },
  description:
    "High-performance model for tool calling and structured output generation",
};

/**
 * Fallback Models for High Availability
 */

export const CLAUDE_3_5_SONNET: ModelDefinition = {
  id: "anthropic/claude-3.5-sonnet",
  name: "Claude-3.5-Sonnet",
  provider: "Anthropic",
  role: "planner", // Can serve both roles
  capabilities: {
    reasoning: true,
    toolCalling: true,
    streaming: true,
    contextWindow: 200000,
    maxTokens: 8192,
  },
  pricing: {
    input: 3.0,
    output: 15.0,
  },
  description:
    "Versatile model for both planning and execution with excellent reasoning",
};

export const GPT_4O: ModelDefinition = {
  id: "openai/gpt-4o",
  name: "GPT-4o",
  provider: "OpenAI",
  role: "executor", // Can serve both roles
  capabilities: {
    reasoning: true,
    toolCalling: true,
    streaming: true,
    contextWindow: 128000,
    maxTokens: 4096,
  },
  pricing: {
    input: 2.5,
    output: 10.0,
  },
  description: "OpenAI flagship model with strong tool calling capabilities",
};

/**
 * Model registry for easy lookup and configuration
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  [DEEPSEEK_R1.id]: DEEPSEEK_R1,
  [QWEN_2_5_72B.id]: QWEN_2_5_72B,
  [CLAUDE_3_5_SONNET.id]: CLAUDE_3_5_SONNET,
  [GPT_4O.id]: GPT_4O,
};

/**
 * Get model definition by ID
 */
export function getModelDefinition(modelId: string): ModelDefinition | null {
  return MODEL_REGISTRY[modelId] || null;
}

/**
 * Get all models for a specific role
 */
export function getModelsByRole(
  role: "planner" | "executor"
): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter(
    (model) =>
      model.role === role ||
      (model.capabilities.reasoning && model.capabilities.toolCalling)
  );
}

/**
 * Calculate estimated cost for a request
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelDefinition(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1_000_000) * model.pricing.input;
  const outputCost = (outputTokens / 1_000_000) * model.pricing.output;

  return inputCost + outputCost;
}

/**
 * Validate model capabilities for role
 */
export function validateModelForRole(
  modelId: string,
  role: "planner" | "executor"
): { valid: boolean; reason?: string } {
  const model = getModelDefinition(modelId);

  if (!model) {
    return { valid: false, reason: `Model ${modelId} not found in registry` };
  }

  if (role === "planner" && !model.capabilities.reasoning) {
    return {
      valid: false,
      reason: "Planner models must have reasoning capabilities",
    };
  }

  if (role === "executor" && !model.capabilities.toolCalling) {
    return {
      valid: false,
      reason: "Executor models must have tool calling capabilities",
    };
  }

  return { valid: true };
}

/**
 * Get optimal model configuration for cost vs performance
 */
export function getOptimalModelConfig(): {
  planner: string;
  executor: string;
  estimatedCostPer1kRequests: number;
} {
  // Use primary models for best cost/performance ratio
  const plannerCost = calculateCost(DEEPSEEK_R1.id, 2000, 1000); // Estimated tokens per request
  const executorCost = calculateCost(QWEN_2_5_72B.id, 1500, 500);

  return {
    planner: DEEPSEEK_R1.id,
    executor: QWEN_2_5_72B.id,
    estimatedCostPer1kRequests: (plannerCost + executorCost) * 1000,
  };
}
