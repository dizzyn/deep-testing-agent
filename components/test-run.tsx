"use client";

interface TestRunProps {
  artifactContent: string;
}

export function TestRun({ artifactContent }: TestRunProps) {
  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          <h2 className="text-white font-semibold">Test Run</h2>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="text-gray-400 text-center">
          Test run component - coming soon
        </div>
      </div>
    </div>
  );
}
