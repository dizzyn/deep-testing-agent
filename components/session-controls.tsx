"use client";

import { useState } from "react";
import { resetSession } from "@/lib/session";
import { SessionData } from "@/app/api/session/route";

interface SessionControlsProps {
  sessionData: SessionData | null;
  onSessionReset: () => void;
}

export function SessionControls({
  sessionData,
  onSessionReset,
}: SessionControlsProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleResetSession = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsResetting(true);
    setShowConfirmation(false);
    try {
      await resetSession();
      // Clear conversation via API call
      // await fetch("/api/conversation", { method: "DELETE" });
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

  return (
    <>
      {/* Reset Session Button */}
      <button
        onClick={handleResetSession}
        disabled={isResetting}
        className="px-4 py-2 border border-white text-white bg-transparent rounded hover:bg-white hover:text-black disabled:opacity-50 transition-colors"
        onBlur={() => setShowConfirmation(false)}
      >
        {isResetting
          ? "Resetting..."
          : showConfirmation
          ? "Are you sure?"
          : "Reset Session"}
      </button>
    </>
  );
}
