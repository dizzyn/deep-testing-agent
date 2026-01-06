import { createMCPClient, MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioClientTransport } from "@ai-sdk/mcp/mcp-stdio";

let explorerMCPClient: MCPClient | null = null;
let testerMCPClient: MCPClient | null = null;
let browserInitialized = false;

/**
 * Creates and configures the MCP client for Chrome DevTools integration
 */
export async function createChromeMCPClient(profileSuffix?: string) {
  const args = ["./chrome-devtools-mcp/build/src/index.js"];

  // Add unique profile path if specified
  if (profileSuffix) {
    args.push("--user-data-dir", `/tmp/chrome-profile-${profileSuffix}`);
  }

  const mcpClient = await createMCPClient({
    transport: new StdioClientTransport({
      command: "node",
      args,
    }),
  });

  return mcpClient;
}

/**
 * Gets or creates the MCP client for explorer agent
 */
export async function getExplorerMCPClient() {
  if (!explorerMCPClient) {
    explorerMCPClient = await createChromeMCPClient("explorer");
  }
  return explorerMCPClient;
}

/**
 * Gets or creates the MCP client for tester agent
 */
export async function getTesterMCPClient() {
  if (!testerMCPClient) {
    testerMCPClient = await createChromeMCPClient("tester");
  }
  return testerMCPClient;
}

/**
 * Gets or creates the shared MCP client instance
 * @deprecated Use getExplorerMCPClient or getTesterMCPClient instead
 */
export async function getSharedChromeMCPClient() {
  return await getExplorerMCPClient();
}

/**
 * Gets Chrome DevTools tools from the MCP client for specific agent
 */
export async function getChromeTools(
  agentType: "explorer" | "tester" = "explorer"
) {
  const mcpClient =
    agentType === "explorer"
      ? await getExplorerMCPClient()
      : await getTesterMCPClient();
  return await mcpClient.tools();
}

/**
 * Checks if browser session is already initialized
 */
export function isBrowserInitialized(): boolean {
  return browserInitialized;
}

/**
 * Marks browser as initialized (call after first agent creates pages)
 */
export function setBrowserInitialized(): void {
  browserInitialized = true;
}

/**
 * Resets browser state (for cleanup)
 */
export function resetBrowserState(): void {
  browserInitialized = false;
  explorerMCPClient = null;
  testerMCPClient = null;
}
