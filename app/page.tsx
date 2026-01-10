"use client";

import { Chat } from "@/components/chat";
import { SplitView } from "@/components/split-view";
import { SessionControls } from "@/components/session-controls";
import { ModelSelectorCompact } from "@/components/model-selector-compact";
import { ModelProvider, useModel } from "@/lib/model-context";
import { MODELS } from "@/lib/models";
import { useEffect, useState } from "react";
import type { SessionData } from "./api/session/route";
import { fetchSessionData } from "@/lib/session";
import { TestRun } from "@/components/test-run";

function AppContent() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const { selectedModel, setSelectedModel } = useModel();

  const loadSessionData = async (): Promise<void> => {
    try {
      const data = await fetchSessionData();
      setSessionData(data);
    } catch (error) {
      console.error("Failed to load session data:", error);
    }
  };

  useEffect(() => {
    const initializeSession = async (): Promise<void> => {
      await loadSessionData();
    };

    initializeSession();

    const interval = setInterval(() => {
      loadSessionData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  const showSideBySide = sessionData.status === "testing";

  return (
    <>
      <header className="flex-none bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4 z-20">
        <div className="max-w-full mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-bold text-sm leading-tight text-zinc-100">
                Deep Testing Agent
              </h1>
            </div>
            <ModelSelectorCompact
              models={MODELS}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            <SessionControls onSessionReset={() => window.location.reload()} />
          </p>
        </div>
      </header>

      <SplitView
        left={<Chat selectedModel={selectedModel} />}
        right={
          showSideBySide ? <TestRun selectedModel={selectedModel} /> : null
        }
      />
    </>
  );
}

export default function HomePage() {
  return (
    <ModelProvider>
      <AppContent />
    </ModelProvider>
  );
}
