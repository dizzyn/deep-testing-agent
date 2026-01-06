"use client";

interface ArtifactPreviewProps {
  artifactExists: boolean;
  artifactContent: string;
}

export function ArtifactPreview({
  artifactExists,
  artifactContent,
}: ArtifactPreviewProps) {
  if (!artifactExists) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        <h3 className="text-white font-semibold">Active Test Brief</h3>
      </div>

      <div className="text-gray-300 text-sm space-y-2">
        {artifactContent
          .split("\n")
          .slice(0, 8)
          .map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
        {artifactContent.split("\n").length > 8 && (
          <div className="text-gray-500 italic">... (view full brief)</div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <a
          href="/session/session_meta.json"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-green-300 hover:text-green-100 text-sm transition-colors"
        >
          <span>View Session Metadata</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
