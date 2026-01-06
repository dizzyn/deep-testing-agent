import Image from "next/image";

export function ScreenshotToolView({ invocation }: { invocation: unknown }) {
  const tool = invocation as {
    type?: string;
    toolName?: string;
    state?: string;
    output?: {
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    };
  };

  // Extract file path from dynamic-tool output
  let outputFilePath: string | undefined;

  if (tool.toolName === "take_screenshot" && tool.output?.content?.[0]?.text) {
    const outputText = tool.output.content[0].text;
    const match = outputText.match(/Saved screenshot to (.+)\.$/m);
    if (match) {
      outputFilePath = match[1];
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left">
      {tool.state === "output-available" && outputFilePath ? (
        <div className="space-y-3">
          <div className="space-y-2">
            {outputFilePath.startsWith("/public/") ||
            outputFilePath.startsWith("public/") ? (
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <Image
                  src={outputFilePath.replace(/^(\/)?public/, "")}
                  alt="Screenshot"
                  width={800}
                  height={600}
                  className="w-full h-auto max-w-full"
                  style={{ maxHeight: "400px", objectFit: "contain" }}
                />
              </div>
            ) : (
              <div className="text-sm text-yellow-400">
                Screenshot saved outside public folder - cannot display in chat
              </div>
            )}
          </div>
        </div>
      ) : tool.state === "input-streaming" ||
        tool.state === "input-available" ? (
        <div className="text-gray-300">Preparing to take screenshot...</div>
      ) : tool.state === "executing" ? (
        <div className="text-gray-300">Taking screenshot...</div>
      ) : tool.state === "approval-requested" ? (
        <div className="text-yellow-400">
          Waiting for approval to take screenshot...
        </div>
      ) : (
        <div className="text-gray-400">
          Screenshot tool state: {tool.state || "unknown"}
        </div>
      )}
    </div>
  );
}
