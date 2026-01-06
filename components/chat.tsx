"use client";

import { useChat } from "@ai-sdk/react";
import type { ExplorerAgentUIMessage } from "@/agents/explorer";
import { ChatBubble } from "./common/chat-bubble";
import { getSelectedModel } from "./model-switcher";
import { useState, useRef, useEffect } from "react";
import type { SessionData } from "@/app/api/session/route";
import type { ConversationType } from "@/lib/conversation";

interface ChatProps {
  sessionData: SessionData;
}

export function Chat({ sessionData: { testBrief } }: ChatProps) {
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, setMessages } =
    useChat<ExplorerAgentUIMessage>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // const handleTaskClick = (task: {
  //   title: string;
  //   description: string;
  // }): void => {
  //   setInputValue(task.description);
  // };

  const conversationType = "default" satisfies ConversationType;

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      if (!hasLoadedHistory) {
        try {
          const response = await fetch(
            "/api/chat?conversationType=" + conversationType
          );
          if (response.ok) {
            const conversationMessages = await response.json();
            if (conversationMessages.length > 0) {
              // Transform the conversation messages to match the expected format
              const transformedMessages = conversationMessages.map(
                (msg: {
                  id: string;
                  role: string;
                  content: string;
                  parts?: unknown[];
                  createdAt: string;
                }) => ({
                  ...msg,
                  parts: Array.isArray(msg.parts)
                    ? msg.parts
                    : JSON.parse(msg.content || "[]"),
                })
              );
              setMessages(transformedMessages);
            }
          }
        } catch (error) {
          console.error("Failed to load conversation history:", error);
        } finally {
          setHasLoadedHistory(true);
        }
      }
    };

    loadHistory();
  }, [conversationType, hasLoadedHistory, setMessages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(
        { text: inputValue.trim() },
        {
          body: {
            model: getSelectedModel(),
            conversationType,
          },
        }
      );
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-6 py-8 pb-4">
          {messages.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-4">
                  Ask me to test websites, take screenshots, or analyze web
                  performance...
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, messageIndex) => (
                <ChatBubble
                  key={message.id || messageIndex}
                  message={message}
                  messageIndex={messageIndex}
                />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Input Area */}
      <div className="flex-shrink-0 bg-black border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to test a website or take a screenshot..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors resize-none min-h-[48px] max-h-[120px]"
                rows={1}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
