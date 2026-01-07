export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

// Chat models configuration
export const CHAT_MODELS: ModelConfig[] = [
  {
    id: "mistral/devstral-latest",
    name: "Devstral",
    provider: "mistral",
    available: true,
  },
  {
    id: "mistral/devstral-small-latest",
    name: "Devstral Small",
    provider: "mistral",
    available: true,
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash Experimental",
    provider: "openrouter",
    available: true,
  },
  {
    id: "nex-agi/deepseek-v3.1-nex-n1:free",
    name: "DeepSeek v3.1 Nex N1",
    provider: "openrouter",
    available: true,
  },
  {
    id: "qwen/qwen3-4b:free",
    name: "Qwen3 4B",
    provider: "openrouter",
    available: true,
  },
];

// Test models configuration
export const TEST_MODELS: ModelConfig[] = [
  {
    id: "mistral/devstral-latest",
    name: "Devstral",
    provider: "mistral",
    available: true,
  },
  {
    id: "mistral/devstral-small-latest",
    name: "Devstral Small",
    provider: "mistral",
    available: true,
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash Experimental",
    provider: "openrouter",
    available: true,
  },
  {
    id: "nex-agi/deepseek-v3.1-nex-n1:free",
    name: "DeepSeek v3.1 Nex N1",
    provider: "openrouter",
    available: true,
  },
];

// Default models
export const DEFAULT_CHAT_MODEL = "mistral/devstral-latest";
export const DEFAULT_TEST_MODEL = "mistral/devstral-latest";

// Storage keys
export const CHAT_STORAGE_KEY = "selected-chat-model";
export const TEST_STORAGE_KEY = "selected-test-model";
