"use client";

import { useState, useEffect } from "react";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

const MODELS: ModelConfig[] = [
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

const STORAGE_KEY = "selected-model";
const DEFAULT_MODEL = "mistral/devstral-latest";

export function ModelSwitcher() {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only run on client side after hydration
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && MODELS.find((m) => m.id === saved)) {
      setSelectedModel(saved);
    }
    setIsLoaded(true);
  }, []);

  const handleModelChange = (modelId: string): void => {
    setSelectedModel(modelId);
    localStorage.setItem(STORAGE_KEY, modelId);
    setIsOpen(false);
  };

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  // Show loading state until client-side hydration is complete
  if (!isLoaded) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
            <span className="text-gray-400">Loading...</span>
          </div>
          <svg
            className="w-4 h-4 text-gray-400"
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
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-sm"
        suppressHydrationWarning
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
          className={`w-4 h-4 text-gray-400 transition-transform ${
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
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs text-gray-400 px-2 py-1 mb-1">
                Available Models
              </div>
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-gray-800 transition-colors ${
                    selectedModel === model.id
                      ? "bg-gray-800 border border-gray-600"
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
                    <div className="text-gray-400 text-xs">
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

export function getSelectedModel(): string {
  if (typeof window === "undefined") {
    return DEFAULT_MODEL;
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && MODELS.find((m) => m.id === saved) ? saved : DEFAULT_MODEL;
}
