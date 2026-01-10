"use client";

import { useMemo } from "react";
import type { ExplorerAgentUIMessage } from "@/agents/explorer";

interface MessageSizeCounterProps {
  messages: ExplorerAgentUIMessage[];
  position: "top-left" | "top-right" | "inline";
}

export function MessageSizeCounter({
  messages,
  position,
}: MessageSizeCounterProps) {
  const sizeInfo = useMemo(() => {
    const payload = JSON.stringify(messages);
    const sizeInBytes = Buffer.byteLength(payload, "utf8");

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    return {
      count: messages.length,
      size: formatSize(sizeInBytes),
    };
  }, [messages]);

  if (messages.length === 0) return null;

  if (position === "inline") {
    return (
      <div className="text-xs text-zinc-500 font-mono">
        {sizeInfo.count}:{sizeInfo.size}
      </div>
    );
  }

  const positionClass =
    position === "top-left" ? "top-2 left-2" : "top-2 right-2";

  return (
    <div
      className={`absolute ${positionClass} z-50 text-xs text-zinc-600 font-mono opacity-50`}
    >
      {sizeInfo.count}:{sizeInfo.size}
    </div>
  );
}
