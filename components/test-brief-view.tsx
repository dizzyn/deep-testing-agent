"use client";

import { useState, useEffect } from "react";
import { fetchSessionData, updateSessionData } from "@/lib/session";
import { TestViewTemplate } from "./common/test-view-template";

interface TestBriefData {
  testBrief: string;
}

export function TestBriefView({ testBrief }: TestBriefData) {
  const [status, setStatus] = useState<"brief" | "testing">("brief");

  useEffect(() => {
    const loadSessionStatus = async () => {
      try {
        const sessionData = await fetchSessionData();
        setStatus(sessionData.status);
      } catch (error) {
        console.error("Failed to load session data:", error);
      }
    };

    loadSessionStatus();
  }, []);

  const handleRunTest = async () => {
    try {
      await updateSessionData({
        status: "testing",
        testBrief,
      });
      setStatus("testing");
    } catch (error) {
      console.error("Failed to update session:", error);
    }
  };

  const content = (
    <pre className="whitespace-pre-wrap text-gray-300 text-xs leading-relaxed">
      {testBrief}
    </pre>
  );

  const actions =
    status === "brief" ? (
      <button
        onClick={handleRunTest}
        className="px-3 py-1 rounded text-xs font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
      >
        Run Test
      </button>
    ) : undefined;

  return (
    <TestViewTemplate
      title="Test Brief"
      icon="📋"
      content={content}
      actions={actions}
      smallFont={true}
    />
  );
}
