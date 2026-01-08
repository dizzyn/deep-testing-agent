"use client";

import { useState } from "react";
import Image from "next/image";
import { TestBriefView } from "../test-brief-view";
import { TestProtocolView } from "../test-protocol-view";

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
      // Legacy tool names
      take_screenshot: "Screenshot",
      navigate_page: "Navigate",
      updateTestBrief: "Test Brief",
      take_snapshot: "Page Snapshot",
      click: "Click Element",
      fill: "Fill Form",
      wait_for: "Wait For Element",
      getSessionMeta: "Session Info",

      // Chrome DevTools MCP tools
      mcp_chrome_devtools_take_screenshot: "Screenshot",
      mcp_chrome_devtools_navigate_page: "Navigate",
      mcp_chrome_devtools_take_snapshot: "Page Snapshot",
      mcp_chrome_devtools_click: "Click Element",
      mcp_chrome_devtools_fill: "Fill Form",
      mcp_chrome_devtools_fill_form: "Fill Form",
      mcp_chrome_devtools_wait_for: "Wait For Element",
      mcp_chrome_devtools_hover: "Hover Element",
      mcp_chrome_devtools_press_key: "Press Key",
      mcp_chrome_devtools_drag: "Drag Element",
      mcp_chrome_devtools_upload_file: "Upload File",
      mcp_chrome_devtools_evaluate_script: "Run Script",
      mcp_chrome_devtools_list_pages: "List Pages",
      mcp_chrome_devtools_new_page: "New Page",
      mcp_chrome_devtools_select_page: "Select Page",
      mcp_chrome_devtools_close_page: "Close Page",
      mcp_chrome_devtools_resize_page: "Resize Page",
      mcp_chrome_devtools_emulate: "Emulate Device",
      mcp_chrome_devtools_handle_dialog: "Handle Dialog",
      mcp_chrome_devtools_list_network_requests: "Network Requests",
      mcp_chrome_devtools_get_network_request: "Get Network Request",
      mcp_chrome_devtools_list_console_messages: "Console Messages",
      mcp_chrome_devtools_get_console_message: "Get Console Message",
      mcp_chrome_devtools_performance_start_trace: "Start Performance Trace",
      mcp_chrome_devtools_performance_stop_trace: "Stop Performance Trace",
      mcp_chrome_devtools_performance_analyze_insight: "Analyze Performance",

      // Agent tools
      updateTestProtocol: "Test Protocol",
    };

    return (
      toolNames[toolName] ||
      toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const getToolIcon = (toolName?: string): string => {
    const icons: Record<string, string> = {
      // Legacy tool names
      take_screenshot: "📸",
      navigate_page: "🌐",
      updateTestBrief: "📋",
      take_snapshot: "📄",
      click: "👆",
      fill: "✏️",
      wait_for: "⏳",
      getSessionMeta: "ℹ️",

      // Chrome DevTools MCP tools
      mcp_chrome_devtools_take_screenshot: "📸",
      mcp_chrome_devtools_navigate_page: "🌐",
      mcp_chrome_devtools_take_snapshot: "📄",
      mcp_chrome_devtools_click: "👆",
      mcp_chrome_devtools_fill: "✏️",
      mcp_chrome_devtools_fill_form: "📝",
      mcp_chrome_devtools_wait_for: "⏳",
      mcp_chrome_devtools_hover: "👋",
      mcp_chrome_devtools_press_key: "⌨️",
      mcp_chrome_devtools_drag: "🫳",
      mcp_chrome_devtools_upload_file: "📤",
      mcp_chrome_devtools_evaluate_script: "⚡",
      mcp_chrome_devtools_list_pages: "📑",
      mcp_chrome_devtools_new_page: "🆕",
      mcp_chrome_devtools_select_page: "👁️",
      mcp_chrome_devtools_close_page: "❌",
      mcp_chrome_devtools_resize_page: "📐",
      mcp_chrome_devtools_emulate: "📱",
      mcp_chrome_devtools_handle_dialog: "💬",
      mcp_chrome_devtools_list_network_requests: "🌐",
      mcp_chrome_devtools_get_network_request: "📡",
      mcp_chrome_devtools_list_console_messages: "🖥️",
      mcp_chrome_devtools_get_console_message: "💻",
      mcp_chrome_devtools_performance_start_trace: "🚀",
      mcp_chrome_devtools_performance_stop_trace: "🛑",
      mcp_chrome_devtools_performance_analyze_insight: "📊",

      // Agent tools
      updateTestProtocol: "📋",
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
    (part.toolName === "take_screenshot" ||
      part.toolName === "mcp_chrome_devtools_take_screenshot") &&
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

  // Handle test protocol updates
  if (
    part.toolName === "updateTestProtocol" ||
    part.type === "tool-updateTestProtocol"
  ) {
    const input = part.input as { content?: string };
    const testProtocol = input?.content || "";

    return (
      <div key={`${messageIndex}-${partIndex}`} className="mb-4">
        <TestProtocolView testProtocol={testProtocol} />
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
