"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { ModelConfig, ModelId, OrchestratorId } from "@/lib/models";
import { ORCHESTRATORS, MODELS } from "@/lib/models";
import { useModel } from "@/lib/model-context";

interface ModelSelectorCompactProps {
  className?: string;
}

const linkCls = "cursor-pointer hover:text-white hover:underline";

export function ModelSelectorCompact({
  className = "",
}: ModelSelectorCompactProps) {
  const { modelConfiguration, setModelConfiguration } = useModel();
  const [showModal, setShowModal] = useState(false);

  const currentOrchestrator =
    ORCHESTRATORS.find((o) => o.id === modelConfiguration.orchestratorId) ||
    ORCHESTRATORS[0];

  const handleOrchestratorChange = (orchestratorId: OrchestratorId): void => {
    const orchestrator =
      ORCHESTRATORS.find((o) => o.id === orchestratorId) || ORCHESTRATORS[0];
    const newRoleModels: Record<string, ModelId> = {};

    orchestrator.models.forEach((role) => {
      newRoleModels[role] = modelConfiguration.roleModels[role] || MODELS[0].id;
    });

    setModelConfiguration({
      orchestratorId,
      roleModels: newRoleModels,
    });
  };

  const handleRoleModelChange = (role: string, modelId: ModelId): void => {
    const newRoleModels = { ...modelConfiguration.roleModels, [role]: modelId };

    setModelConfiguration({
      orchestratorId: modelConfiguration.orchestratorId,
      roleModels: newRoleModels,
    });
  };

  const getDisplayText = (): string => {
    if (currentOrchestrator.models.length === 1) {
      const role = currentOrchestrator.models[0];
      const model = MODELS.find(
        (m) => m.id === modelConfiguration.roleModels[role]
      );
      return model ? model.name : "No model";
    }

    // For multi-role orchestrators, show the model names
    const modelNames = currentOrchestrator.models.map((role) => {
      const model = MODELS.find(
        (m) => m.id === modelConfiguration.roleModels[role]
      );
      return model ? model.name : "No model";
    });

    return `${currentOrchestrator.name} (${modelNames.join(", ")})`;
  };

  const modalContent = showModal ? (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={() => setShowModal(false)}
      />

      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl mx-4 max-h-[80vh] overflow-hidden transition-all duration-300 ease-out ${
          currentOrchestrator.models.length === 1
            ? "max-w-2xl w-full"
            : "max-w-4xl w-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              {currentOrchestrator.models.length === 1
                ? "Select Model"
                : "Select Orchestrator & Models"}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-12 gap-6 h-96">
            {/* Left Column - Orchestrators */}
            <div className="col-span-4">
              <h4 className="text-sm font-medium text-white mb-3">
                Orchestrator
              </h4>
              <div className="space-y-2 overflow-y-auto h-full">
                {ORCHESTRATORS.map((orchestrator) => (
                  <button
                    key={orchestrator.id}
                    onClick={() => handleOrchestratorChange(orchestrator.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-zinc-800 transition-all duration-200 ${
                      modelConfiguration.orchestratorId === orchestrator.id
                        ? "bg-zinc-800 border border-zinc-600"
                        : "border border-transparent"
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {orchestrator.name}
                      </div>
                      <div className="text-zinc-400 text-xs">
                        {orchestrator.models.length} role
                        {orchestrator.models.length > 1 ? "s" : ""}
                      </div>
                    </div>
                    {modelConfiguration.orchestratorId === orchestrator.id && (
                      <svg
                        className="w-4 h-4 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Columns - Models for Each Role */}
            <div className="col-span-8">
              <h4 className="text-sm font-medium text-white mb-3">
                {currentOrchestrator.models.length === 1
                  ? `${currentOrchestrator.models[0]} Model`
                  : "Models for Each Role"}
              </h4>
              <div
                className={`grid gap-4 h-full overflow-y-auto transition-all duration-300 ${
                  currentOrchestrator.models.length === 1
                    ? "grid-cols-1"
                    : currentOrchestrator.models.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3"
                }`}
              >
                {currentOrchestrator.models.map((role) => (
                  <div key={role} className="space-y-2">
                    {currentOrchestrator.models.length > 1 && (
                      <div className="text-xs font-medium text-zinc-300 border-b border-zinc-700 pb-1">
                        {role}
                      </div>
                    )}
                    <div className="space-y-1">
                      {MODELS.map((model) => {
                        const isSelected =
                          modelConfiguration.roleModels[role] === model.id;

                        return (
                          <button
                            key={`${role}-${model.id}`}
                            onClick={() =>
                              handleRoleModelChange(role, model.id)
                            }
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left hover:bg-zinc-800 transition-all duration-200 ${
                              isSelected
                                ? "bg-zinc-800 border border-zinc-600"
                                : "border border-transparent"
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-medium truncate">
                                {model.name}
                              </div>
                              <div className="text-zinc-400 text-xs truncate">
                                {model.provider}
                              </div>
                            </div>
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-green-400 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className={`text-[11px] text-zinc-400 font-mono ${className}`}>
        (
        <a onClick={() => setShowModal(true)} className={linkCls}>
          {getDisplayText()}
        </a>
        )
      </div>

      {typeof window !== "undefined" &&
        modalContent &&
        createPortal(modalContent, document.body)}
    </>
  );
}
