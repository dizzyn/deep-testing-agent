"use client";

import { useState, useRef, useEffect } from "react";
import { Chat, InputFn } from "./chat";

function Form({ isGenerating, addMessage }: Parameters<InputFn>[0]) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    const text = input.trim();
    setInput("");

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Force scroll to bottom when sending

    await addMessage(text);
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
    <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
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
  );
}

export function ChatView({
  selectedModel,
}: {
  selectedModel: string;
  children?: React.ReactNode;
}) {
  return (
    <Chat
      selectedModel={selectedModel}
      emptyState={
        <div className="flex-none text-center space-y-6 mb-12">
          <h1 className="text-4xl font-bold text-zinc-100">
            Deep Testing Agent
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            QA testing on autopilot. Just point me to a URL, and I&apos;ll
            handle the rest.
          </p>
        </div>
      }
      inputGenerator={(props) => <Form {...props} />}
    />
  );
}
