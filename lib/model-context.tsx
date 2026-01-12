"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  DEFAULT_MODEL,
  MODEL_STORAGE_KEY,
  ORCHESTRATORS,
  DEFAULT_ORCHESTRATOR,
  ORCHESTRATOR_STORAGE_KEY,
  ORCHESTRATOR_MODELS_STORAGE_KEY,
  type ModelId,
  type OrchestratorId,
  type OrchestratorModelAssignment,
} from "./models";

export interface ModelConfiguration {
  orchestratorId: OrchestratorId;
  roleModels: Record<string, ModelId>;
}

interface ModelContextType {
  selectedModel: string; // Keep for backward compatibility
  modelConfiguration: ModelConfiguration;
  setSelectedModel: (modelId: string) => void; // Keep for backward compatibility
  setModelConfiguration: (config: ModelConfiguration) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

function getStoredOrchestrator(): OrchestratorId {
  if (typeof window === "undefined") return DEFAULT_ORCHESTRATOR;
  const saved = localStorage.getItem(
    ORCHESTRATOR_STORAGE_KEY
  ) as OrchestratorId;
  return saved && ORCHESTRATORS.find((o) => o.id === saved)
    ? saved
    : DEFAULT_ORCHESTRATOR;
}

function getStoredOrchestratorModels(): Record<string, ModelId> {
  if (typeof window === "undefined") return {};
  const savedAssignment = localStorage.getItem(ORCHESTRATOR_MODELS_STORAGE_KEY);
  if (savedAssignment) {
    try {
      const assignment: OrchestratorModelAssignment =
        JSON.parse(savedAssignment);
      return assignment.roleModels;
    } catch {
      return {};
    }
  }
  return {};
}

function initializeModelsForOrchestrator(
  orchestratorId: OrchestratorId
): Record<string, ModelId> {
  const stored = getStoredOrchestratorModels();
  const orchestrator =
    ORCHESTRATORS.find((o) => o.id === orchestratorId) || ORCHESTRATORS[0];
  const initialized: Record<string, ModelId> = {};

  orchestrator.models.forEach((role) => {
    initialized[role] = stored[role] || DEFAULT_MODEL;
  });

  return initialized;
}

function getBackwardCompatibleModel(config: ModelConfiguration): string {
  const orchestrator = ORCHESTRATORS.find(
    (o) => o.id === config.orchestratorId
  );
  if (!orchestrator) return DEFAULT_MODEL;

  // For single-role orchestrators, return the model for that role
  if (orchestrator.models.length === 1) {
    return config.roleModels[orchestrator.models[0]] || DEFAULT_MODEL;
  }

  // For multi-role orchestrators, return the first model (for backward compatibility)
  return config.roleModels[orchestrator.models[0]] || DEFAULT_MODEL;
}

export function ModelProvider({ children }: { children: ReactNode }) {
  const [modelConfiguration, setModelConfigurationState] =
    useState<ModelConfiguration>(() => {
      const orchestratorId = getStoredOrchestrator();
      const roleModels = initializeModelsForOrchestrator(orchestratorId);
      return { orchestratorId, roleModels };
    });

  const selectedModel = getBackwardCompatibleModel(modelConfiguration);

  const setSelectedModel = (modelId: string) => {
    // For backward compatibility, update the first role with the new model
    const orchestrator = ORCHESTRATORS.find(
      (o) => o.id === modelConfiguration.orchestratorId
    );
    if (!orchestrator) return;

    const newRoleModels = { ...modelConfiguration.roleModels };
    newRoleModels[orchestrator.models[0]] = modelId as ModelId;

    const newConfig = {
      orchestratorId: modelConfiguration.orchestratorId,
      roleModels: newRoleModels,
    };

    setModelConfigurationState(newConfig);

    if (typeof window !== "undefined") {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
      const assignment: OrchestratorModelAssignment = {
        orchestratorId: newConfig.orchestratorId,
        roleModels: newConfig.roleModels,
      };
      localStorage.setItem(
        ORCHESTRATOR_MODELS_STORAGE_KEY,
        JSON.stringify(assignment)
      );
    }
  };

  const setModelConfiguration = (config: ModelConfiguration) => {
    setModelConfigurationState(config);

    if (typeof window !== "undefined") {
      localStorage.setItem(ORCHESTRATOR_STORAGE_KEY, config.orchestratorId);
      const assignment: OrchestratorModelAssignment = {
        orchestratorId: config.orchestratorId,
        roleModels: config.roleModels,
      };
      localStorage.setItem(
        ORCHESTRATOR_MODELS_STORAGE_KEY,
        JSON.stringify(assignment)
      );

      // Also update the backward-compatible model storage
      const backwardCompatibleModel = getBackwardCompatibleModel(config);
      localStorage.setItem(MODEL_STORAGE_KEY, backwardCompatibleModel);
    }
  };

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        modelConfiguration,
        setSelectedModel,
        setModelConfiguration,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
