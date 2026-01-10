"use client";

import { useChat } from "@ai-sdk/react";
import type { ExplorerAgentUIMessage } from "@/agents/explorer";
import { ChatBubble } from "./common/chat-bubble";
import { MessageSizeCounter } from "./common/message-size-counter";
import { useState, useRef, useEffect, useCallback } from "react";
import type { ConversationType } from "@/lib/conversation";
import { loadConversationHistory } from "@/lib/conversation-client";

const conversationType = "default" satisfies ConversationType;

interface ChatProps {
  selectedModel: string;
  children?: React.ReactNode;
}

export function Chat({ selectedModel, children }: ChatProps) {
  // 1. Setup & State
  const { messages, sendMessage, setMessages, status } =
    useChat<ExplorerAgentUIMessage>({
      // transport: new DefaultChatTransport({
      //   // api: "/api/thinker",
      // }),
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

  // Auto-resize textarea when input changes (including from demo tasks)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Fixed Header Bar */}
      <header className="flex-none bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-2 z-40 relative">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
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
            ? children || (
                <div className="flex flex-col min-h-[calc(100vh-200px)] py-8">
                  {/* Default empty state if no children provided */}
                  <div className="flex-none text-center space-y-6 mb-12">
                    <h1 className="text-4xl font-bold text-zinc-100">
                      Deep Testing Agent
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                      QA testing on autopilot. Just point me to a URL, and
                      I&apos;ll handle the rest.
                    </p>
                  </div>
                </div>
              )
            : messages.map((msg, idx) => (
                <ChatBubble
                  key={msg.id || idx}
                  message={msg}
                  messageIndex={idx}
                />
              ))}
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
    </div>
  );
}
