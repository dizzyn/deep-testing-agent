import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export type ModelProvider = "mistral" | "openrouter";

export interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
}

export function parseModelId(modelId: string): ModelConfig {
  const [provider] = modelId.split("/");

  switch (provider) {
    case "mistral":
      return { provider: "mistral", modelId: modelId.replace("mistral/", "") };
    default:
      // Everything else goes through OpenRouter
      return { provider: "openrouter", modelId };
  }
}

export function createModelInstance(modelId: string) {
  const config = parseModelId(modelId);

  switch (config.provider) {
    case "mistral":
      const mistral = createMistral({
        apiKey: process.env.MISTRAL_API_KEY || "",
      });
      return mistral(config.modelId);

    case "openrouter":
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY || "",
      });
      return openrouter(config.modelId);

    default:
      // Fallback to mistral
      const fallbackMistral = createMistral({
        apiKey: process.env.MISTRAL_API_KEY || "",
      });
      return fallbackMistral("devstral-latest");
  }
}
