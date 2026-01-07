"use client";

import { useChat } from "@ai-sdk/react";
import type { ExplorerAgentUIMessage } from "@/agents/explorer";
import { ChatBubble } from "./common/chat-bubble";
import { useState, useRef, useEffect, useCallback } from "react";
import type { ConversationType } from "@/lib/conversation";
import { loadConversationHistory } from "@/lib/conversation-client";
import { ModelSelectorText } from "./model-selector-text";
import {
  CHAT_MODELS,
  CHAT_STORAGE_KEY,
  DEFAULT_CHAT_MODEL,
} from "@/lib/models";

const conversationType = "default" satisfies ConversationType;

export function Chat() {
  // 1. Setup & State
  const { messages, sendMessage, setMessages, status } =
    useChat<ExplorerAgentUIMessage>();

  // Derive loading state from status
  const isGenerating = status === "submitted" || status === "streaming";

  const [input, setInput] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CHAT_MODEL;
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    return saved && CHAT_MODELS.find((m) => m.id === saved)
      ? saved
      : DEFAULT_CHAT_MODEL;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle model selection
  const handleModelChange = (modelId: string): void => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_STORAGE_KEY, modelId);
    }
  };

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

  return (
    <>
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth relative"
      >
        <div className="max-w-3xl mx-auto space-y-8 pb-4">
          {messages.map((msg, idx) => (
            <ChatBubble key={msg.id || idx} message={msg} messageIndex={idx} />
          ))}
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
          {/* Model Selector above input */}
          <div className="text-center mb-3 text-[11px] text-zinc-400 font-mono">
            <ModelSelectorText
              models={CHAT_MODELS}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              className="mx-auto"
            />
          </div>

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
              className="absolute bottom-3 right-3 text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
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
