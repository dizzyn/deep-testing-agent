"use client";

import { useState } from "react";
import {
  resetSession,
  fetchSessionData,
  type SessionData,
} from "@/lib/session";

interface SessionControlsProps {
  sessionData: SessionData | null;
  onSessionReset: () => void;
  onSessionLoad: (data: SessionData) => void;
}

export function SessionControls({
  sessionData,
  onSessionReset,
  onSessionLoad,
}: SessionControlsProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetSession = async () => {
    if (
      !confirm(
        "Are you sure you want to reset the session? This will delete all chat history, documents, and screenshots."
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      await resetSession();
      // Clear conversation via API call
      await fetch("/api/conversation", { method: "DELETE" });
      onSessionReset();
      // Force page reload to clear chat state
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset session:", error);
      alert("Failed to reset session. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleLoadSession = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSessionData();
      onSessionLoad(data);
    } catch (error) {
      console.error("Failed to load session:", error);
      alert("Failed to load session data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 p-4 border-b">
      <button
        onClick={handleLoadSession}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "Load Session"}
      </button>

      <button
        onClick={handleResetSession}
        disabled={isResetting}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
      >
        {isResetting ? "Resetting..." : "Reset Session"}
      </button>

      {sessionData && (
        <div className="flex items-center gap-4 ml-auto text-sm text-gray-600">
          <span>Messages: {sessionData.sessionMeta.messageCount || 0}</span>
          <span>Files: {sessionData.files.length}</span>
          <span>
            Status:{" "}
            {JSON.stringify(sessionData.sessionState.briefStatus) || "No brief"}
          </span>
          <span>
            Updated:{" "}
            {new Date(sessionData.sessionMeta.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
