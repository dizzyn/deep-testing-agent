import { createMCPClient, MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioClientTransport } from "@ai-sdk/mcp/mcp-stdio";

// Shared MCP client instance for all agents
let sharedMCPClient: MCPClient | null = null;

/**
 * Initialize the shared Chrome DevTools MCP client
 */
async function initializeSharedClient(): Promise<MCPClient> {
  const args = ["./chrome-devtools-mcp/build/src/index.js"];

  // Use a shared profile directory so all agents share the same browser session
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
 * Get the singleton MCP client instance
 */
export async function getSharedMCPClient(): Promise<MCPClient> {
  if (!sharedMCPClient) {
    sharedMCPClient = await initializeSharedClient();
  }
  return sharedMCPClient;
}
