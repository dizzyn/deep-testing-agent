"use client";

import { useChat } from "@ai-sdk/react";
import type { ExplorerAgentUIMessage } from "@/agents/explorer";
import { ChatBubble } from "./common/chat-bubble";
import { useState, useRef, useEffect, useCallback } from "react";
import type { ConversationType } from "@/lib/conversation";
import {
  loadConversationHistory,
  clearConversation,
} from "@/lib/conversation-client";
import { ModelSelector } from "@/lib/model-selector";
import {
  TEST_MODELS,
  TEST_STORAGE_KEY,
  DEFAULT_TEST_MODEL,
} from "@/lib/models";

const conversationType = "testing" satisfies ConversationType;

export function TestRun() {
  // 1. Setup & State
  const { messages, sendMessage, setMessages, status, stop } =
    useChat<ExplorerAgentUIMessage>();

  // Derive loading state from status
  const isGenerating = status === "submitted" || status === "streaming";

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_TEST_MODEL;
    const saved = localStorage.getItem(TEST_STORAGE_KEY);
    return saved && TEST_MODELS.find((m) => m.id === saved)
      ? saved
      : DEFAULT_TEST_MODEL;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle model selection
  const handleModelChange = (modelId: string): void => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem(TEST_STORAGE_KEY, modelId);
    }
  };

  function startTesting() {
    sendMessage(
      {
        text: `Read brief, start testing!`,
      },
      {
        body: { model: selectedModel, conversationType },
      }
    );
  }

  function handlePause() {
    stop();
    setIsPaused(true);
  }

  function handleResume() {
    setIsPaused(false);
    sendMessage(
      {
        text: "Resume the testing",
      },
      {
        body: { model: selectedModel, conversationType },
      }
    );
  }

  async function handleReset() {
    if (!showResetConfirmation) {
      await stop();
      setShowResetConfirmation(true);
      return;
    }

    setIsResetting(true);
    setShowResetConfirmation(false);
    try {
      await clearConversation(conversationType);
      setMessages([]);
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to reset conversation:", error);
      alert("Failed to reset conversation. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  // 2. Scroll Logic
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setShowScrollButton(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Show button if user is more than 100px from the bottom
    setShowScrollButton(distanceFromBottom > 100);
  }, []);

  // 3. Auto-scroll on new messages
  useEffect(() => {
    // Only auto-scroll if the user hasn't manually scrolled up
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages, showScrollButton, scrollToBottom]);

  // 4. Load History
  useEffect(() => {
    if (hasLoadedHistory) return;

    const loadHistory = async () => {
      try {
        const formatted = await loadConversationHistory(conversationType);
        if (formatted.length > 0) {
          setMessages(formatted);
        }
      } catch (err) {
        console.error("History load error:", err);
      } finally {
        setHasLoadedHistory(true);
      }
    };
    loadHistory();
  }, [hasLoadedHistory, setMessages]);

  return (
    <>
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth relative"
      >
        {messages.length ? (
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {messages.map((msg, idx) => (
              <ChatBubble
                key={msg.id || idx}
                message={msg}
                messageIndex={idx}
              />
            ))}
          </div>
        ) : (
          // Centered controls when test is empty
          <div className="flex items-center justify-center min-h-full">
            <div className="text-center space-y-6 max-w-md">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">
                  Test Configuration
                </h2>
                <p className="text-zinc-400 text-sm">
                  Select a model and start testing your application
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Test Model
                  </label>
                  <ModelSelector
                    models={TEST_MODELS}
                    selectedModel={selectedModel}
                    onModelChange={handleModelChange}
                    label="Test Models"
                  />
                </div>

                <button
                  onClick={startTesting}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Start Test
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-zinc-500 space-y-1">
                <p>
                  The test will analyze your application and provide feedback
                </p>
                <p>Make sure your application is running before starting</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Scroll Button */}
      {showScrollButton && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <button
            onClick={() => scrollToBottom(true)}
            className="pointer-events-auto bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full shadow-lg border border-zinc-700 transition-all animate-in fade-in slide-in-from-bottom-2"
            aria-label="Scroll to bottom"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      )}

      <footer className="flex-none bg-zinc-950 border-t border-zinc-800 p-4 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {messages.length > 0 && (
              <div className="text-sm text-zinc-400">
                Model:{" "}
                {TEST_MODELS.find((m) => m.id === selectedModel)?.name ||
                  selectedModel}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            {/* Control buttons */}
            {isGenerating ? (
              <div className="flex items-center gap-2">
                [
                <a
                  onClick={handlePause}
                  className="cursor-pointer hover:text-white"
                >
                  pause
                </a>
                ]
              </div>
            ) : isPaused ? (
              <div className="flex items-center gap-2">
                [
                <a
                  onClick={handleResume}
                  className="cursor-pointer hover:text-white"
                >
                  resume
                </a>
                ]
              </div>
            ) : messages.length > 0 ? (
              <div className="flex items-center gap-2">
                [
                <a
                  onClick={startTesting}
                  className="cursor-pointer hover:text-white"
                >
                  restart test
                </a>
                ]
              </div>
            ) : null}

            {/* Reset button - always available when there are messages */}
            {messages.length > 0 && (
              <div className="flex items-center gap-2">
                {isResetting ? (
                  <>...resetting</>
                ) : showResetConfirmation ? (
                  <>
                    Are you sure [
                    <a
                      onClick={handleReset}
                      className="cursor-pointer hover:text-white"
                    >
                      yes
                    </a>
                    ] [
                    <a
                      onClick={() => setShowResetConfirmation(false)}
                      className="cursor-pointer hover:text-white"
                    >
                      no
                    </a>
                    ]
                  </>
                ) : (
                  <>
                    [
                    <a
                      onClick={handleReset}
                      className="cursor-pointer hover:text-white"
                    >
                      reset
                    </a>
                    ]
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
