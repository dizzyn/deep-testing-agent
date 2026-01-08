"use client";

import { Chat } from "./chat";
import { TestRun } from "./test-run";

export function SplitView() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col border-r border-zinc-800">
        <div className="flex-none bg-zinc-900/50 border-b border-zinc-800 px-4 py-2">
          <h2 className="text-xs font-medium text-zinc-300 uppercase tracking-wide">
            Chat
          </h2>
        </div>
        <Chat />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-none bg-zinc-900/50 border-b border-zinc-800 px-4 py-2">
          <h2 className="text-xs font-medium text-zinc-300 uppercase tracking-wide">
            Test Run
          </h2>
        </div>
        <TestRun />
      </div>
    </div>
  );
}
