import { createMCPClient, MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioClientTransport } from "@ai-sdk/mcp/mcp-stdio";

// 1. Use a single variable to hold the shared instance
let sharedMCPClient: MCPClient | null = null;

/**
 * Internal function to initialize the connection once.
 * We use a fixed profile path so both "logical" agents share the session.
 */
async function initializeSharedClient() {
  const args = ["./chrome-devtools-mcp/build/src/index.js"];

  // Use a SINGLE shared directory for the session
  args.push("--user-data-dir", "/tmp/chrome-profile-shared");

  const client = await createMCPClient({
    transport: new StdioClientTransport({
      command: "node",
      args,
    }),
  });

  return client;
}

/**
 * Gets the singleton MCP client.
 * If it doesn't exist, it creates it. If it does, it reuses it.
 */
export async function getSharedMCPClient() {
  if (!sharedMCPClient) {
    sharedMCPClient = await initializeSharedClient();
  }
  return sharedMCPClient;
}

/**
 * Gets Chrome DevTools tools.
 * Both agents now receive tools connected to the SAME browser instance.
 */
export async function getChromeTools() {
  const mcpClient = await getSharedMCPClient();
  return await mcpClient.tools();
}
