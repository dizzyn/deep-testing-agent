import { createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioClientTransport } from "@ai-sdk/mcp/mcp-stdio";

/**
 * Creates and configures the MCP client for Chrome DevTools integration
 */
export async function createChromeMCPClient() {
  const mcpClient = await createMCPClient({
    transport: new StdioClientTransport({
      command: "node",
      args: ["./chrome-devtools-mcp/build/src/index.js"],
    }),
  });

  return mcpClient;
}

/**
 * Gets Chrome DevTools tools from the MCP client
 */
export async function getChromeTools() {
  const mcpClient = await createChromeMCPClient();
  return await mcpClient.tools();
}
