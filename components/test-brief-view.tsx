"use client";

import { useState, useEffect } from "react";
import { fetchSessionData, updateSessionData } from "@/lib/session";

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

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-left">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="text-sm font-semibold text-white">Test Brief</h3>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded p-2">
          <pre className="whitespace-pre-wrap text-gray-300 text-xs leading-relaxed">
            {testBrief}
          </pre>
        </div>

        {status === "brief" && (
          <div className="flex justify-end">
            <button
              onClick={handleRunTest}
              className="px-3 py-1 rounded text-xs font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              Run Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
