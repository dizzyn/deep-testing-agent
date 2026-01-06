"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface DraggableSeparatorProps {
  onResize: (leftWidth: number) => void;
  initialLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export function DraggableSeparator({
  onResize,
  minLeftWidth = 20,
  maxLeftWidth = 80,
}: DraggableSeparatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const separatorRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const containerWidth = window.innerWidth;
      const newLeftWidth = (e.clientX / containerWidth) * 100;

      // Clamp the width between min and max
      const clampedWidth = Math.min(
        Math.max(newLeftWidth, minLeftWidth),
        maxLeftWidth
      );

      onResize(clampedWidth);
    },
    [isDragging, onResize, minLeftWidth, maxLeftWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={separatorRef}
      className={`
        w-1 bg-gray-700 hover:bg-gray-500 cursor-col-resize relative
        transition-colors duration-150 ease-in-out
        ${isDragging ? "bg-blue-500" : ""}
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator */}
      <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-current opacity-50" />

      {/* Hover area for easier grabbing */}
      <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
    </div>
  );
}
