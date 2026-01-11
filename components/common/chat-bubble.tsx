"use client";

import { UIMessage } from "ai";
import { ToolCall } from "./tool-call";

// --- Icons ---
const UserIcon = () => (
  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

const AIIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 shadow-sm">
    <span className="text-lg">🤖</span>
  </div>
);

const SparkleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="opacity-80"
  >
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

// --- Types ---

interface ChatBubbleProps {
  message: UIMessage;
  messageIndex: number;
}

export function ChatBubble({ message, messageIndex }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-4 mb-6 ${
        isUser ? "flex-row-reverse" : "flex-row"
      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {/* Avatar Column */}
      <div className="shrink-0 flex flex-col relative items-center">
        {isUser ? <UserIcon /> : <AIIcon />}
      </div>

      {/* Content Column */}
      <div
        className={`flex flex-col gap-2 max-w-[85%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Name Label (Optional - usually redundant with Avatars but kept for consistency) */}
        <span className="text-[10px] text-zinc-500 font-mono mb-1 select-none">
          {isUser ? "You" : "Assistant"}
        </span>

        {message.parts.map((part, partIndex) => {
          switch (part.type) {
            case "text":
              const textPart = part as { text: string };
              // Don't render empty text parts
              if (!textPart.text) return null;

              return (
                <div
                  key={partIndex}
                  className={`
                    px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                    ${
                      isUser
                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-none"
                        : "bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-2xl rounded-tl-none"
                    }
                  `}
                >
                  {textPart.text}
                </div>
              );

            case "reasoning":
              // Chain of Thoughts / Reasoning Design
              const reasonPart = part as { text: string };
              if (!reasonPart.text) return null;

              return (
                <div key={partIndex} className="flex gap-4 w-full my-2">
                  {/* Left Line */}
                  <div className="flex flex-col items-center shrink-0 w-8">
                    <div className="w-8 h-8 flex items-center justify-center text-zinc-500">
                      <SparkleIcon />
                    </div>
                    {/* The growing vertical line */}
                    <div className="w-[2px] grow bg-zinc-800 rounded-full mt-1 mb-2"></div>
                  </div>

                  {/* Content */}
                  <div className="py-1 pb-4 w-full text-zinc-400 text-sm leading-relaxed">
                    <p className="whitespace-pre-wrap">{reasonPart.text}</p>
                  </div>
                </div>
              );

            // case "tool-getTestBrief":
            // case "tool-getTestProtocol":
            //   return null;

            case "step-start":
              return null;

            // case "tool-setTestBrief":
            // case "tool-setTestTestProtocol":
            case "dynamic-tool":
              // Handle tool types
              if (
                part.type.startsWith("tool-") ||
                part.type === "dynamic-tool"
              ) {
                return (
                  <div key={partIndex} className="w-full max-w-full">
                    <ToolCall
                      part={part}
                      messageIndex={messageIndex}
                      partIndex={partIndex}
                    />
                  </div>
                );
              }
              return null;

            default:
              // Handle generic tools
              if (part.type.startsWith("tool-")) {
                return (
                  <div key={partIndex} className="w-full max-w-full">
                    <ToolCall
                      part={part}
                      messageIndex={messageIndex}
                      partIndex={partIndex}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={partIndex}
                  className="text-red-400 text-xs bg-red-950/30 border border-red-900 p-2 rounded"
                >
                  Unsupported: {part.type}
                </div>
              );
          }
        })}
      </div>
    </div>
  );
}
