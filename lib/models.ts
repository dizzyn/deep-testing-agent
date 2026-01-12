export type ModelProvider = "mistral" | "openrouter";

export interface OrchestratorConfig {
  id: string;
  name: string;
  models: string[];
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
    models: ["Model"],
  },
  {
    id: "thinker-doer",
    name: "Thinker-Doer",
    models: ["Doer", "Thinker"],
  },
  {
    id: "thinker-doer-langgraph",
    name: "LangGraph Thinker-Doer",
    models: ["Doer", "Thinker"],
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
export type OrchestratorId = (typeof ORCHESTRATORS)[number]["id"];

// Default model
export const DEFAULT_MODEL: ModelId = "devstral-latest";

// Default orchestrator
export const DEFAULT_ORCHESTRATOR: OrchestratorId = "agent";

// Storage keys
export const MODEL_STORAGE_KEY = "selected-model";
export const ORCHESTRATOR_STORAGE_KEY = "selected-orchestrator";
export const ORCHESTRATOR_MODELS_STORAGE_KEY = "orchestrator-models";

// Type for storing orchestrator model assignments
export interface OrchestratorModelAssignment {
  orchestratorId: OrchestratorId;
  roleModels: Record<string, ModelId>; // role name -> model id
}
