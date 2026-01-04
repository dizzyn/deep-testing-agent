import Link from "next/link";

export function FileWriterToolView({ invocation }: { invocation: unknown }) {
  const tool = invocation as {
    type?: string;
    toolName?: string;
    state?: string;
    output?: {
      success?: boolean;
      message?: string;
      path?: string;
    };
  };

  // Check if this is a file writing tool with successful output
  const isFileWritten =
    tool.state === "output-available" &&
    tool.output?.success &&
    tool.output?.path;

  if (!isFileWritten) {
    // Show generic tool state for non-file-writing or failed operations
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left">
        {tool.state === "input-streaming" ||
        tool.state === "input-available" ? (
          <div className="text-gray-300">Preparing to write file...</div>
        ) : tool.state === "executing" ? (
          <div className="text-gray-300">Writing file...</div>
        ) : tool.state === "approval-requested" ? (
          <div className="text-yellow-400">
            Waiting for approval to write file...
          </div>
        ) : tool.state === "output-available" && !tool.output?.success ? (
          <div className="text-red-400">
            Failed to write file: {tool.output?.message || "Unknown error"}
          </div>
        ) : (
          <div className="text-gray-400">
            File writer tool state: {tool.state || "unknown"}
          </div>
        )}
      </div>
    );
  }

  const filePath = tool.output!.path!;
  const fileName = filePath.split("/").pop() || filePath;
  const isPublicFile =
    filePath.startsWith("public/") || filePath.startsWith("/public/");

  return (
    <div className="bg-gray-900 border-2 border-green-600 rounded-lg p-4 text-left">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="text-sm text-green-400 font-medium">File Created</div>
        </div>

        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-white font-mono text-sm">{fileName}</span>
            </div>

            {isPublicFile && (
              <Link
                href={filePath.replace(/^(\/)?public/, "")}
                target="_blank"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                View File
              </Link>
            )}
          </div>

          <div className="text-xs text-gray-400 mt-2 font-mono">{filePath}</div>
        </div>

        {tool.output?.message && (
          <div className="text-sm text-gray-300">{tool.output.message}</div>
        )}
      </div>
    </div>
  );
}
