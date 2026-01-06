"use client";

import { useState } from "react";
import Image from "next/image";
import { TestBriefView } from "../test-brief-view";

interface ToolCallProps {
  part: {
    type: string;
    toolName?: string;
    state?: string;
    input?: unknown;
    output?: unknown;
    toolCallId?: string;
  };
  messageIndex: number;
  partIndex: number;
}

export function ToolCall({ part, messageIndex, partIndex }: ToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolDisplayName = (toolName?: string): string => {
    if (!toolName) return "Unknown Tool";

    const toolNames: Record<string, string> = {
      take_screenshot: "Screenshot",
      navigate_page: "Navigate",
      updateTestBrief: "Test Brief",
      take_snapshot: "Page Snapshot",
      click: "Click Element",
      fill: "Fill Form",
      wait_for: "Wait For Element",
      getSessionMeta: "Session Info",
    };

    return (
      toolNames[toolName] ||
      toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const getToolIcon = (toolName?: string): string => {
    const icons: Record<string, string> = {
      take_screenshot: "📸",
      navigate_page: "🌐",
      updateTestBrief: "📋",
      take_snapshot: "📄",
      click: "👆",
      fill: "✏️",
      wait_for: "⏳",
      getSessionMeta: "ℹ️",
    };

    return icons[toolName || ""] || "🔧";
  };

  const getStateColor = (state?: string): string => {
    switch (state) {
      case "output-available":
        return "text-green-400";
      case "executing":
        return "text-yellow-400";
      case "input-streaming":
        return "text-blue-400";
      case "approval-requested":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  const getStateText = (state?: string): string => {
    switch (state) {
      case "output-available":
        return "Completed";
      case "executing":
        return "Running...";
      case "input-streaming":
        return "Preparing...";
      case "approval-requested":
        return "Awaiting approval";
      default:
        return state || "Unknown";
    }
  };

  // Handle screenshot display
  if (
    part.toolName === "take_screenshot" &&
    part.state === "output-available"
  ) {
    const output = part.output as { content?: Array<{ text?: string }> };
    const outputText = output?.content?.[0]?.text || "";
    const match = outputText.match(/Saved screenshot to (.+)\.$/m);

    if (match) {
      const filePath = match[1];
      const displayPath = filePath.replace(/^(\/)?public/, "");

      return (
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-48">
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <Image
                src={displayPath}
                alt="Screenshot"
                width={400}
                height={300}
                className="w-full h-auto"
                style={{ maxHeight: "200px", objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      );
    }
  }

  // Handle test brief updates - check by type since toolName might not be set
  if (
    part.toolName === "updateTestBrief" ||
    part.type === "tool-updateTestBrief"
  ) {
    const input = part.input as { content?: string };
    const testBrief = input?.content || "";

    return (
      <div key={`${messageIndex}-${partIndex}`} className="mb-4">
        <TestBriefView testBrief={testBrief} />
      </div>
    );
  }

  return (
    <div className="mb-2">
      <div
        className="bg-gray-800 border border-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">{getToolIcon(part.toolName)}</span>
            <span className="font-medium text-white text-sm">
              {getToolDisplayName(part.toolName)}
            </span>
            <span className={`text-xs ${getStateColor(part.state)}`}>
              {getStateText(part.state)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="space-y-2">
              {part.input !== undefined && (
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-1">
                    Input:
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-400 font-mono">
                    <pre className="whitespace-pre-wrap">
                      {String(
                        JSON.stringify(
                          part.input as Record<string, unknown>,
                          null,
                          2
                        )
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {part.output !== undefined && (
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-1">
                    Output:
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-400 font-mono">
                    <pre className="whitespace-pre-wrap">
                      {String(
                        JSON.stringify(
                          part.output as Record<string, unknown>,
                          null,
                          2
                        )
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
