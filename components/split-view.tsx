"use client";

import { ReactNode } from "react";

interface SplitViewProps {
  left: ReactNode;
  right?: ReactNode;
}

export function SplitView({ left, right }: SplitViewProps) {
  if (!right) {
    return <div className="h-full">{left}</div>;
  }

  return (
    <div className="h-full w-full flex overflow-hidden">
      <div className="flex-1 flex flex-col border-r border-zinc-800">
        {left}
      </div>
      <div className="flex-1 flex flex-col">{right}</div>
    </div>
  );
}
