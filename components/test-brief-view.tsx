"use client";

import { useState } from "react";

interface TestBriefData {
  testBrief: string;
}

export function TestBriefView({ testBrief }: TestBriefData) {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "running" | "approved" | "error"
  >("idle");

  const handleRunTest = async () => {
    setIsRunning(true);
    setStatus("running");

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionMeta: {
            status: "APPROVED",
            testBrief,
          },
        }),
      });

      if (response.ok) {
        setStatus("approved");
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Failed to update session:", error);
      setStatus("error");
    } finally {
      setIsRunning(false);
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

          {status === "approved" && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Approved
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded p-2">
          <pre className="whitespace-pre-wrap text-gray-300 text-xs leading-relaxed">
            {testBrief}
          </pre>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRunTest}
            disabled={isRunning || status === "approved"}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              status === "approved"
                ? "bg-green-600 text-white cursor-not-allowed"
                : isRunning
                ? "bg-blue-600 text-white cursor-not-allowed"
                : status === "error"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isRunning ? (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3 h-3 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Running...
              </div>
            ) : status === "approved" ? (
              "Test Approved"
            ) : status === "error" ? (
              "Retry Test"
            ) : (
              "Run Test"
            )}
          </button>
        </div>

        {status === "error" && (
          <div className="text-red-400 text-xs">
            Failed to update session. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
