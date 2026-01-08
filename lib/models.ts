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

// Default model
export const DEFAULT_MODEL = "mistral/devstral-latest";

// Storage key
export const MODEL_STORAGE_KEY = "selected-model";
