"use client";

import { Chat } from "@/components/chat";
import { TestRun } from "@/components/test-run";
import { SessionControls } from "@/components/session-controls";
import { ModelSwitcher } from "@/components/model-switcher";
import { useEffect, useState } from "react";
import type { SessionData } from "./api/session/route";
import { fetchSessionData } from "@/lib/session";

export default function HomePage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const loadSessionData = async (): Promise<void> => {
    try {
      const data = await fetchSessionData();
      setSessionData(data);
    } catch (error) {
      console.error("Failed to load session data:", error);
    }
  };

  const handleSessionReset = (): void => {
    setSessionData(null);
    // Clear chat history flag so it can be reloaded
    if (typeof window !== "undefined") {
      window.location.reload();
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

  if (!sessionData) return <div>...loading</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 max-w-full">
          <div className="flex items-center gap-4">
            <SessionControls
              sessionData={sessionData}
              onSessionReset={handleSessionReset}
            />
          </div>

          {/* Right: Model Switcher */}
          <div className="flex items-center">
            <ModelSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 h-full">
        {!sessionData?.testBrief ? (
          <Chat sessionData={sessionData} />
        ) : (
          <TestRun sessionData={sessionData} />
        )}
      </div>
    </div>
  );
}
