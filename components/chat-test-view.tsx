"use client";

import { Chat } from "./chat";
import { useModel } from "@/lib/model-context";

export function TestRun({ children }: { children?: React.ReactNode }) {
  const { modelConfiguration } = useModel();

  return (
    <Chat
      service="testing"
      modelConfiguration={modelConfiguration}
      emptyState={({ isGenerating, addMessage }) => (
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                Agentic Test Runner
              </h2>
              <p className="text-zinc-400 text-sm">
                The test will analyze the application and provide feedback
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => addMessage("Start the test")}
                disabled={isGenerating}
                className="w-full bg-black border border-gray-400 hover:border-white disabled:border-gray-600 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
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
                    Starting Test...
                  </>
                ) : (
                  <>Start Test</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      inputGenerator={() => <></>}
    />
  );
}
