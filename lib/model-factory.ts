import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { ModelId, ModelProvider, MODELS, type ModelConfig } from "./models";

export interface ModelFactoryConfig {
  provider: ModelProvider;
  modelId: string;
}

export function findModelById(modelId: ModelId): ModelConfig | undefined {
  return MODELS.find((model) => model.id === modelId);
}

export function createModelInstance(modelId: ModelId) {
  const modelConfig = findModelById(modelId);

  if (!modelConfig) {
    throw new Error(`Model with id "${modelId}" not found`);
  }

  const config: ModelFactoryConfig = {
    provider: modelConfig.provider as ModelProvider,
    modelId: modelConfig.id,
  };

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
