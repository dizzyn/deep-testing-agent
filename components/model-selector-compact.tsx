"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { ModelConfig } from "@/lib/models";

interface ModelSelectorCompactProps {
  models: ModelConfig[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

const linkCls = "cursor-pointer hover:text-white hover:underline";

export function ModelSelectorCompact({
  models,
  selectedModel,
  onModelChange,
  className = "",
}: ModelSelectorCompactProps) {
  const [showModal, setShowModal] = useState(false);
  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  const handleModelChange = (modelId: string): void => {
    onModelChange(modelId);
    setShowModal(false);
  };

  const modalContent = showModal ? (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowModal(false)}
      />

      {/* Modal Content */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Select Model</h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-zinc-400 hover:text-white transition-colors"
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

          <div className="space-y-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelChange(model.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-zinc-800 transition-colors ${
                  selectedModel === model.id
                    ? "bg-zinc-800 border border-zinc-600"
                    : "border border-transparent"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    model.available ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">
                    {model.name}
                  </div>
                  <div className="text-zinc-400 text-xs">{model.provider}</div>
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
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className={`text-[11px] text-zinc-400 font-mono ${className}`}>
        (
        <a onClick={() => setShowModal(true)} className={linkCls}>
          {currentModel.name}
        </a>
        )
      </div>

      {/* Render modal in document body using portal */}
      {typeof window !== "undefined" &&
        modalContent &&
        createPortal(modalContent, document.body)}
    </>
  );
}
