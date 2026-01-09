export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

// Test models configuration
export const MODELS: ModelConfig[] = [
  {
    id: "mistral/devstral-latest",
    name: "Devstral",
    provider: "mistral",
    available: true,
    price: 0,
  },
  {
    id: "mistral/devstral-small-latest",
    name: "Devstral Small",
    provider: "mistral",
    available: true,
    price: 0,
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash Experimental",
    provider: "openrouter",
    available: true,
    price: 0,
  },
  {
    id: "deepseek/deepseek-chat-v3.1",
    name: "DeepSeek v3.1",
    provider: "openrouter",
    available: true,
    price: 0,
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "openrouter",
    available: true,
    price: 0,
  },
];

// Default model
export const DEFAULT_MODEL = "mistral/devstral-latest";

// Storage key
export const MODEL_STORAGE_KEY = "selected-model";
