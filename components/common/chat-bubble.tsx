"use client";

import { ToolCall } from "./tool-call";

interface MessagePart {
  type: string;
  text?: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  toolCallId?: string;
}

interface Message {
  id?: string;
  role: string;
  parts: MessagePart[];
}

interface ChatBubbleProps {
  message: Message;
  messageIndex: number;
}

export function ChatBubble({ message, messageIndex }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
        {/* Avatar and name - more compact */}
        <div
          className={`flex items-center gap-2 mb-1 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-xs text-gray-500">
            {isUser ? "You" : "Assistant"}
          </span>
        </div>

        {/* Message content */}
        <div className="space-y-2">
          {message.parts.map((part, partIndex) => {
            switch (part.type) {
              case "text":
                const textPart = part as { text: string };
                return (
                  <div
                    key={partIndex}
                    className={`rounded-lg p-3 ${
                      isUser
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 border border-gray-600 text-gray-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {textPart.text}
                    </div>
                  </div>
                );

              case "tool-updateTestBrief":
              case "dynamic-tool":
                // Handle all tool types
                if (
                  part.type.startsWith("tool-") ||
                  part.type === "dynamic-tool"
                ) {
                  return (
                    <ToolCall
                      key={partIndex}
                      part={part}
                      messageIndex={messageIndex}
                      partIndex={partIndex}
                    />
                  );
                }
                return null;

              case "reasoning":
              case "step-start":
                return null;

              default:
                // Handle all tool types that start with "tool-"
                if (part.type.startsWith("tool-")) {
                  return (
                    <ToolCall
                      key={partIndex}
                      part={part}
                      messageIndex={messageIndex}
                      partIndex={partIndex}
                    />
                  );
                }

                // Only show unsupported message for non-tool types
                return (
                  <div key={partIndex} className="text-red-400 text-sm">
                    Unsupported message type: {part.type}
                  </div>
                );
            }
          })}
        </div>
      </div>
    </div>
  );
}
