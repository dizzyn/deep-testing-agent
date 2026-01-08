"use client";

import { ReactNode } from "react";

interface TestViewTemplateProps {
  title: string;
  icon: string;
  content: ReactNode;
  actions?: ReactNode;
  smallFont?: boolean;
}

export function TestViewTemplate({
  title,
  icon,
  content,
  actions,
  smallFont = false,
}: TestViewTemplateProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-left">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={smallFont ? "text-sm" : "text-base"}>{icon}</span>
            <h3
              className={`font-semibold text-white ${
                smallFont ? "text-xs" : "text-sm"
              }`}
            >
              {title}
            </h3>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded p-2">
          {content}
        </div>

        {actions && <div className="flex justify-end">{actions}</div>}
      </div>
    </div>
  );
}
