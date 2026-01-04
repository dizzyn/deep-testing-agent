"use client";

import { Chat } from "@/components/chat";
import { TestRun } from "@/components/test-run";
import { SessionControls } from "@/components/session-controls";
import { useEffect, useState } from "react";
import { fetchSessionData, type SessionData } from "@/lib/session";

export default function HomePage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // Derived state from sessionData
  const artifactExists = Boolean(sessionData?.sessionMeta?.testBrief);
  const artifactContent = sessionData?.sessionMeta?.testBrief || "";

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

  const handleSessionLoad = (data: SessionData): void => {
    setSessionData(data);
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Session Controls */}
      <SessionControls
        sessionData={sessionData}
        onSessionReset={handleSessionReset}
        onSessionLoad={handleSessionLoad}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Section */}
        <div className={`${artifactExists ? "w-1/2" : "w-full"} relative`}>
          <Chat
            artifactExists={artifactExists}
            artifactContent={artifactContent}
            sessionData={sessionData}
          />
        </div>

        {/* Test Run Section - Only show when brief exists */}
        {artifactExists && (
          <div className="w-1/2">
            <TestRun artifactContent={artifactContent} />
          </div>
        )}
      </div>
    </div>
  );
}
