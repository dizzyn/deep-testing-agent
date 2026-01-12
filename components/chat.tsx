"use client";

import { useChat } from "@ai-sdk/react";
import type { ExplorerAgentUIMessage } from "@/agents/explorer";
import { ChatBubble } from "./common/chat-bubble";
import { MessageSizeCounter } from "./common/message-size-counter";
import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import type { ServiceType } from "@/lib/conversation";
import { loadConversationHistory } from "@/lib/conversation-client";
import { ModelConfiguration } from "@/lib/model-context";

export type InputFn = (props: {
  isGenerating: boolean;
  addMessage: (s: string) => void;
}) => ReactNode;

export function Chat({
  modelConfiguration,
  emptyState,
  inputGenerator,
  service,
}: {
  modelConfiguration: ModelConfiguration;
  emptyState: InputFn;
  inputGenerator: InputFn;
  service: ServiceType;
}) {
  // 1. Setup & State
  const { messages, sendMessage, setMessages, status } =
    useChat<ExplorerAgentUIMessage>({
      // transport: new DefaultChatTransport({
      //   // api: "/api/thinker",
      // }),
    });

  // Derive loading state from status
  const isGenerating = status === "submitted" || status === "streaming";

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        const formatted = await loadConversationHistory(service);
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
  }, [hasLoadedHistory, service, setMessages]);

  function addMessage(text: string) {
    sendMessage(
      { text },
      {
        body: { model: modelConfiguration, service },
      }
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Sub-header Bar */}
      <header className="flex-none bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-8 py-2 z-40 relative">
        <div className=" mx-auto flex justify-between items-center">
          <div className="text-sm text-zinc-400">Deep Testing Agent</div>
          <MessageSizeCounter messages={messages} position="inline" />
        </div>
      </header>

      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth relative"
      >
        <div className="max-w-3xl mx-auto space-y-8 pb-4">
          {messages.length === 0 && hasLoadedHistory
            ? emptyState({ addMessage, isGenerating })
            : messages.map((msg, idx) => {
                return (
                  <ChatBubble
                    key={msg.id || idx}
                    message={msg}
                    messageIndex={idx}
                  />
                );
              })}
        </div>
      </main>

      <footer className="flex-none bg-zinc-950 border-t border-zinc-800 p-4 z-20 relative">
        {/* Floating Scroll Button - Part of footer, positioned above */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute -top-14 right-6 bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-full shadow-lg border border-zinc-700 transition-all animate-in fade-in slide-in-from-bottom-2 z-10"
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
        )}

        {inputGenerator({ isGenerating, addMessage })}
      </footer>
    </div>
  );
}
