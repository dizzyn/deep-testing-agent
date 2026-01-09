export type ModelProvider = "mistral" | "openrouter";

export interface OrchestratorConfig {
  id: string;
  name: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
}

export const ORCHESTRATORS = [
  {
    id: "agent",
    name: "Agent",
    // models: ["executor"],
  },
  {
    id: "doer-thinker",
    name: "Doer-Thinker",
  },
  {
    id: "doer-thinker-langgraph",
    name: "LangGraph Doer-Thinker",
  },
] as const satisfies OrchestratorConfig[];

export const MODELS = [
  {
    id: "devstral-latest",
    name: "Devstral",
    provider: "mistral",
  },
  {
    id: "devstral-small-latest",
    name: "Devstral Small",
    provider: "mistral",
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash Experimental",
    provider: "openrouter",
  },
  {
    id: "deepseek/deepseek-chat-v3.1",
    name: "DeepSeek v3.1",
    provider: "openrouter",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "openrouter",
  },
] as const satisfies ModelConfig[];

export type ModelId = (typeof MODELS)[number]["id"];

// Default model
export const DEFAULT_MODEL: ModelId = "devstral-latest";

// Storage key
export const MODEL_STORAGE_KEY = "selected-model";
