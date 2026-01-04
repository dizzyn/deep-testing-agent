"use client";

import { Chat } from "@/components/chat";
import { TestRun } from "@/components/test-run";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [artifactExists, setArtifactExists] = useState<boolean>(false);
  const [artifactContent, setArtifactContent] = useState<string>("");

  // Check for artifact file existence
  useEffect(() => {
    const checkArtifact = async () => {
      try {
        const response = await fetch("/session/test_brief.md");
        if (response.ok) {
          const content = await response.text();
          setArtifactExists(true);
          setArtifactContent(content);
        } else {
          setArtifactExists(false);
        }
      } catch {
        setArtifactExists(false);
      }
    };

    checkArtifact();
    // Check periodically for updates
    const interval = setInterval(checkArtifact, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Artifact Status Banner */}
      {artifactExists && (
        <div className="bg-green-900 border-b border-green-700 px-6 py-3">
          <div className="max-w-full mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-100 font-medium">
                Test Brief Artifact Available
              </span>
            </div>
            <a
              href="/session/test_brief.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 hover:text-green-100 text-sm underline transition-colors"
            >
              View Brief →
            </a>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Section */}
        <div className={`${artifactExists ? "w-1/2" : "w-full"} relative`}>
          <Chat
            artifactExists={artifactExists}
            artifactContent={artifactContent}
          />
        </div>

        {/* Test Run Section - Only show when brief exists */}
        {artifactExists && (
          <div className="w-1/2">
            <TestRun artifactContent={artifactContent} />
          </div>
        )}
      </div>
    </div>
  );
}
