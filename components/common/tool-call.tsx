"use client";
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
  const getToolDisplayName = (toolName?: string): string => {
    if (!toolName) return "Unknown Tool";

    // Remove prefixes and convert to display format
    const displayName = toolName
      .replace(/^mcp_chrome_devtools_/, "")
      .replace(/^tool[-_]/, "");

    // Convert snake_case or kebab-case to Title Case
    return displayName
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const isCompleted = part.state === "output-available";

  const formatJsonForDisplay = (data: unknown): string => {
    if (data === undefined || data === null) return "";

    try {
      const jsonString = JSON.stringify(data, null, 2);
      // Format for display with proper line breaks
      return jsonString
        .split("\n")
        .map((line) => line.replace(/^  /, ""))
        .join("<br/>");
    } catch {
      return String(data);
    }
  };

  // Render custom components for specific tools
  const renderCustomComponent = () => {
    // Handle screenshot display - check both toolName and type fields
    if (
      (part.toolName === "take_screenshot" ||
        part.type === "tool-take_screenshot") &&
      part.state === "output-available"
    ) {
      // Handle both string output and object output formats
      let outputText = "";
      if (typeof part.output === "string") {
        outputText = part.output;
      } else {
        const output = part.output as { content?: Array<{ text?: string }> };
        outputText = output?.content?.[0]?.text || "";
      }

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
      part.toolName === "set_test_brief" ||
      part.type === "tool-set_test_brief"
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
      part.toolName === "set_test_protocol" ||
      part.type === "tool-set_test_protocol"
    ) {
      const input = part.input as { content?: string };
      const testProtocol = input?.content || "";

      return (
        <div key={`${messageIndex}-${partIndex}`} className="mb-4">
          <TestProtocolView testProtocol={testProtocol} />
        </div>
      );
    }

    return null;
  };

  const customComponent = renderCustomComponent();

  return (
    <div className="space-y-2">
      {/* Always render the common tool details first */}
      <details className="group w-full my-1 rounded-md border border-transparent open:bg-zinc-900/50 open:border-zinc-800 transition-all duration-200 max-w-full">
        <summary className="flex items-center gap-3 px-2 py-1.5 cursor-pointer list-none select-none text-zinc-500 hover:text-zinc-300 transition-colors min-w-0">
          <div className="transition-transform duration-200 group-open:rotate-90 opacity-50 flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono min-w-0 flex-1">
            <div className="text-emerald-500 flex-shrink-0">
              {isCompleted ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              )}
            </div>
            <span className="flex-shrink-0">Used tool:</span>
            <span className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50 truncate">
              {getToolDisplayName(part.toolName ?? part.type)}
            </span>
          </div>
        </summary>
        <div className="px-3 pb-3 pt-1 space-y-3 ml-5 border-l border-zinc-800 max-w-full overflow-hidden">
          {part.input !== undefined && (
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-zinc-600 mb-1 tracking-wider">
                Input
              </div>
              <div className="bg-black/50 border border-zinc-800 rounded p-2 overflow-x-auto max-w-full">
                <pre
                  className="font-mono text-[11px] text-zinc-400 whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: formatJsonForDisplay(part.input),
                  }}
                />
              </div>
            </div>
          )}
          {part.output !== undefined && isCompleted && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300 min-w-0">
              <div className="text-[10px] uppercase font-bold text-emerald-600 mb-1 tracking-wider">
                Result
              </div>
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded p-2 overflow-x-auto max-w-full">
                <pre
                  className="font-mono text-[11px] text-emerald-400 whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: formatJsonForDisplay(part.output),
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Render custom component after the tool details */}
      {customComponent}
    </div>
  );
}
