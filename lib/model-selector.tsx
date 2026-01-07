"use client";

import { useState } from "react";
import type { ModelConfig } from "./models";

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  label?: string;
  className?: string;
}

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
  label = "Available Models",
  className = "",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  const handleModelChange = (modelId: string): void => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg hover:bg-zinc-700 transition-colors text-sm min-w-[200px]"
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              currentModel.available ? "bg-green-400" : "bg-red-400"
            }`}
          />
          <span className="text-white">{currentModel.name}</span>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform ml-auto ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs text-zinc-400 px-2 py-1 mb-1">
                {label}
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-zinc-700 transition-colors ${
                    selectedModel === model.id
                      ? "bg-zinc-700 border border-zinc-500"
                      : ""
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      model.available ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-white text-sm">{model.name}</div>
                    <div className="text-zinc-400 text-xs">
                      {model.provider}
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <svg
                      className="w-4 h-4 text-green-400"
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
        </>
      )}
    </div>
  );
}
