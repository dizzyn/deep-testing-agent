"use client";

import { useState } from "react";
import { resetSession } from "@/lib/session";

interface SessionControlsProps {
  onSessionReset: () => void;
}

const linkCls = "cursor-pointer hover:text-white";

export function SessionControls({ onSessionReset }: SessionControlsProps) {
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

  if (isResetting) {
    return <>...reseting</>;
  }

  if (showConfirmation) {
    return (
      <>
        Are you sure [
        <a onClick={handleResetSession} className={linkCls}>
          yes
        </a>
        ] [
        <a className={linkCls} onClick={() => setShowConfirmation(false)}>
          no
        </a>
        ]
      </>
    );
  }

  return (
    <>
      [
      <a
        onClick={handleResetSession}
        onBlur={() => setShowConfirmation(false)}
        className={linkCls}
      >
        Reset Session
      </a>
      ]
    </>
  );
}
