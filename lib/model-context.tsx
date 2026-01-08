"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { MODELS, DEFAULT_MODEL, MODEL_STORAGE_KEY } from "./models";

interface ModelContextType {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL;
    const saved = localStorage.getItem(MODEL_STORAGE_KEY);
    return saved && MODELS.find((m) => m.id === saved) ? saved : DEFAULT_MODEL;
  });

  const setSelectedModel = (modelId: string) => {
    setSelectedModelState(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
    }
  };

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
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
