"use client";

import { useChat } from "@ai-sdk/react";
import type { ChromeAgentUIMessage } from "@/agents/explorer";
import { ScreenshotToolView } from "./screenshot-tool-view";
import { TestBriefView } from "./test-brief-view";
import { getSelectedModel } from "./model-switcher";
import type { SessionData } from "@/lib/session";
import { useState, useRef, useEffect, useActionState } from "react";

interface ChatProps {
  artifactExists: boolean;
  artifactContent: string;
  sessionData: SessionData | null;
}

export function Chat({ artifactExists, artifactContent }: ChatProps) {
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const { messages, sendMessage, setMessages } =
    useChat<ChromeAgentUIMessage>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      if (!hasLoadedHistory) {
        try {
          const response = await fetch("/api/conversation");
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
  }, [hasLoadedHistory, setMessages]);

  const [, dispatch] = useActionState<unknown, FormData>(
    async (_, formData) => {
      const text = formData.get("text") as string;
      if (text.trim()) {
        sendMessage(
          { text },
          {
            body: {
              model: getSelectedModel(),
            },
          }
        );
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
      return null;
    },
    null
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="space-y-6">
              <div className="text-gray-400 text-left">
                Ask me to test websites, take screenshots, or analyze web
                performance...
              </div>

              {/* Artifact Preview */}
              {artifactExists && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <h3 className="text-white font-semibold">
                      Active Test Brief
                    </h3>
                  </div>

                  <div className="text-gray-300 text-sm space-y-2">
                    {artifactContent
                      .split("\n")
                      .slice(0, 8)
                      .map((line, index) => (
                        <div key={index} className="whitespace-pre-wrap">
                          {line}
                        </div>
                      ))}
                    {artifactContent.split("\n").length > 8 && (
                      <div className="text-gray-500 italic">
                        ... (view full brief)
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <a
                      href="/session/session_meta.json"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-green-300 hover:text-green-100 text-sm transition-colors"
                    >
                      <span>View Session Metadata</span>
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((message, messageIndex) =>
              message.parts.map((part, partIndex) => {
                switch (part.type) {
                  case "tool-updateTestBrief":
                    const testBriefPart = part as {
                      input?: { content?: string };
                      output?: { meta?: { testBrief?: string } };
                    };
                    return (
                      <div
                        key={`${messageIndex}-${partIndex}`}
                        className="mb-6"
                      >
                        <TestBriefView
                          testBrief={
                            testBriefPart.input?.content ||
                            testBriefPart.output?.meta?.testBrief ||
                            ""
                          }
                        />
                      </div>
                    );

                  case "dynamic-tool":
                    const toolPart = part as {
                      toolName?: string;
                      state?: string;
                      input?: { content?: string };
                      output?: {
                        success?: boolean;
                        path?: string;
                        message?: string;
                        meta?: {
                          testBrief?: string;
                        };
                      };
                    };

                    // Handle Chrome DevTools screenshot tool
                    if (toolPart.toolName === "take_screenshot") {
                      return (
                        <div
                          key={`${messageIndex}-${partIndex}`}
                          className="mb-6"
                        >
                          <ScreenshotToolView invocation={part} />
                        </div>
                      );
                    }

                    // Handle test brief update tool
                    if (toolPart.toolName === "updateTestBrief") {
                      return (
                        <div
                          key={`${messageIndex}-${partIndex}`}
                          className="mb-6"
                        >
                          <TestBriefView
                            testBrief={
                              toolPart.input?.content ||
                              toolPart.output?.meta?.testBrief ||
                              ""
                            }
                          />
                        </div>
                      );
                    }

                    // Handle file writing tools (detect by output having success and path)
                    if (toolPart.output?.success && toolPart.output?.path) {
                      return (
                        <div
                          key={`${messageIndex}-${partIndex}`}
                          className="mb-6 bg-gray-900 border border-gray-700 rounded-lg p-4"
                        >
                          <div className="text-sm text-gray-400 mb-2">
                            File: {toolPart.output.path}
                          </div>
                          <div className="text-sm text-green-300">
                            {toolPart.output.message ||
                              "File operation completed"}
                          </div>
                        </div>
                      );
                    }

                    // For other dynamic tools, show a generic tool view
                    return (
                      <div
                        key={`${messageIndex}-${partIndex}`}
                        className="mb-6 bg-gray-900 border border-gray-700 rounded-lg p-4"
                      >
                        <div className="text-sm text-gray-400 mb-2">
                          Tool: {toolPart.toolName || "unknown"}
                        </div>
                        <div className="text-sm text-gray-300">
                          {toolPart.state || "unknown"}
                        </div>
                      </div>
                    );

                  case "text":
                    return (
                      <div
                        key={`${messageIndex}-${partIndex}`}
                        className={`mb-6 text-left ${
                          message.role === "user"
                            ? "text-blue-300"
                            : "text-white"
                        }`}
                      >
                        <div className="text-sm text-gray-400 mb-1">
                          {message.role === "user" ? "You" : "Assistant"}
                        </div>
                        <div className="whitespace-pre-wrap">
                          {(part as { text: string }).text}
                        </div>
                      </div>
                    );

                  case "reasoning":
                    return null;

                  case "step-start":
                    return null;

                  default:
                    // Handle any tool invocation that starts with "tool-"
                    if (part.type.startsWith("tool-")) {
                      const toolPart = part as {
                        toolName?: string;
                        state?: string;
                        output?: {
                          success?: boolean;
                          path?: string;
                          message?: string;
                          meta?: {
                            testBrief?: string;
                          };
                        };
                      };

                      // Check if it's a file writing tool
                      if (toolPart.output?.success && toolPart.output?.path) {
                        return (
                          <div
                            key={`${messageIndex}-${partIndex}`}
                            className="mb-6 bg-gray-900 border border-gray-700 rounded-lg p-4"
                          >
                            <div className="text-sm text-gray-400 mb-2">
                              File: {toolPart.output.path}
                            </div>
                            <div className="text-sm text-green-300">
                              {toolPart.output.message ||
                                "File operation completed"}
                            </div>
                          </div>
                        );
                      }

                      // Default to screenshot tool view for other tool- types
                      return (
                        <div
                          key={`${messageIndex}-${partIndex}`}
                          className="mb-6"
                        >
                          <ScreenshotToolView invocation={part} />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${messageIndex}-${partIndex}`}
                        className="mb-6 text-left text-red-400"
                      >
                        Unsupported message type - {part.type}
                      </div>
                    );
                }
              })
            )
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <form action={dispatch} className="flex gap-3">
            <input
              ref={inputRef}
              placeholder="Ask me to test a website or take a screenshot..."
              name="text"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
