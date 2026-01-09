"use client";

import { useChat } from "@ai-sdk/react";
import type { ExplorerAgentUIMessage } from "@/agents/explorer";
import { ChatBubble } from "./common/chat-bubble";
import { MessageSizeCounter } from "./common/message-size-counter";
import { DemoTasks } from "./demo-tasks";
import { useState, useRef, useEffect, useCallback } from "react";
import type { ConversationType } from "@/lib/conversation";
import { loadConversationHistory } from "@/lib/conversation-client";
import { DefaultChatTransport } from "ai";

const conversationType = "default" satisfies ConversationType;

interface ChatProps {
  selectedModel: string;
}

export function Chat({ selectedModel }: ChatProps) {
  // 1. Setup & State
  const { messages, sendMessage, setMessages, status } =
    useChat<ExplorerAgentUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/thinker",
      }),
    });

  // Derive loading state from status
  const isGenerating = status === "submitted" || status === "streaming";

  const [input, setInput] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // 5. Handlers
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    const text = input.trim();
    setInput("");

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Force scroll to bottom when sending
    scrollToBottom();

    await sendMessage(
      { text },
      {
        body: { model: selectedModel, conversationType },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleTaskClick = (task: { title: string; description: string }) => {
    setInput(task.description);
  };

  // Auto-resize textarea when input changes (including from demo tasks)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  return (
    <>
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth relative"
      >
        <MessageSizeCounter messages={messages} position="top-left" />
        <div className="max-w-3xl mx-auto space-y-8 pb-4">
          {messages.length === 0 && hasLoadedHistory ? (
            <div className="flex flex-col min-h-[calc(100vh-200px)] py-8">
              {/* Header Section - Top */}
              <div className="flex-none text-center space-y-6 mb-12">
                <h1 className="text-4xl font-bold text-zinc-100">
                  Deep Testing Agent
                </h1>
                <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  QA testing on autopilot. Just point me to a URL, and I’ll
                  handle the rest.
                </p>
              </div>

              {/* How it works - Middle */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center space-y-4 mb-16">
                  <div className="max-w-2xl mx-auto">
                    <ul className="space-y-4 text-center">
                      <li className="flex flex-col items-center space-y-2">
                        <div>
                          <div className="text-zinc-100 font-medium mb-1">
                            1. Input Goal
                          </div>
                          <div className="text-zinc-400 text-sm">
                            Input a loose goal: &quot;Check the
                            checkout...&quot;
                          </div>
                        </div>
                      </li>
                      <li className="flex flex-col items-center space-y-2">
                        <div>
                          <div className="text-zinc-100 font-medium mb-1">
                            2. Get Test Brief
                          </div>
                          <div className="text-zinc-400 text-sm">
                            Agent generates a strategy
                          </div>
                        </div>
                      </li>
                      <li className="flex flex-col items-center space-y-2">
                        <div>
                          <div className="text-zinc-100 font-medium mb-1">
                            3. Approve
                          </div>
                          <div className="text-zinc-400 text-sm">
                            You accept the plan
                          </div>
                        </div>
                      </li>
                      <li className="flex flex-col items-center space-y-2">
                        <div>
                          <div className="text-zinc-100 font-medium mb-1">
                            4. Execution
                          </div>
                          <div className="text-zinc-400 text-sm">
                            Agent delivers the full Test Protocol
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Demo Tasks - Bottom */}
              <div className="flex-none max-w-md mx-auto w-full">
                <DemoTasks onTaskClick={handleTaskClick} />
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatBubble
                key={msg.id || idx}
                message={msg}
                messageIndex={idx}
              />
            ))
          )}
        </div>
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
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Type your message..."
              className="w-full bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-xl px-4 py-3 pr-12 resize-none overflow-hidden min-h-[48px] max-h-48 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="absolute top-1/2 -translate-y-[12px] right-3 text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" x2="11" y1="2" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </footer>
    </>
  );
}
