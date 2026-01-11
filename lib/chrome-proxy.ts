import { getSharedMCPClient } from "./mcp-client";

// Essential Chrome DevTools operations for agents
export interface ChromeProxy {
  click: (uid: string, dblClick?: boolean) => Promise<string>;
  openPage: (url: string) => Promise<string>;
  evaluateScript: (
    functionCode: string,
    args?: Array<{ uid: string }>
  ) => Promise<string>;
  takeSnapshot: (verbose?: boolean) => Promise<string>;
  fill: (uid: string, value: string) => Promise<string>;
  takeScreenshot: (uid?: string, fullPage?: boolean) => Promise<string>;
}

/**
 * Simplified Chrome DevTools proxy that manages the shared session
 * and exposes only essential tools for agents
 */
export class SimpleChromeProxy implements ChromeProxy {
  private mcpTools: Record<string, unknown> | null = null;

  private async getMCPTools(): Promise<Record<string, unknown>> {
    if (!this.mcpTools) {
      const mcpClient = await getSharedMCPClient();
      this.mcpTools = await mcpClient.tools();
    }
    return this.mcpTools;
  }

  private async callMCPTool(
    toolName: string,
    params: Record<string, unknown>
  ): Promise<string> {
    try {
      const tools = await this.getMCPTools();
      const tool = tools[toolName];

      if (!tool || typeof tool !== "object" || !("execute" in tool)) {
        throw new Error(`Tool ${toolName} not found or not executable`);
      }

      const toolObject = tool as {
        execute: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const result = await toolObject.execute(params);

      // Handle different result formats
      if (result && typeof result === "object" && "content" in result) {
        const content = (result as { content: Array<{ text: string }> })
          .content;
        return content?.[0]?.text || JSON.stringify(result);
      }

      return JSON.stringify(result);
    } catch (error) {
      throw new Error(
        `MCP tool ${toolName} failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Click on an element by its UID
   */
  async click(uid: string, dblClick = false): Promise<string> {
    return this.callMCPTool("click", { uid, dblClick });
  }

  /**
   * Open a new page or navigate to URL
   */
  async openPage(url: string): Promise<string> {
    return this.callMCPTool("new_page", { url });
  }

  /**
   * Evaluate JavaScript on the current page
   */
  async evaluateScript(
    functionCode: string,
    args?: Array<{ uid: string }>
  ): Promise<string> {
    return this.callMCPTool("evaluate_script", {
      function: functionCode,
      args,
    });
  }

  /**
   * Take a text snapshot of the current page
   */
  async takeSnapshot(verbose = false): Promise<string> {
    return this.callMCPTool("take_snapshot", { verbose });
  }

  /**
   * Fill an input element with text
   */
  async fill(uid: string, value: string): Promise<string> {
    return this.callMCPTool("fill", { uid, value });
  }

  /**
   * Take a screenshot of the page or specific element
   */
  async takeScreenshot(uid?: string, fullPage = false): Promise<string> {
    const params: Record<string, unknown> = { fullPage };
    if (uid) {
      params.uid = uid;
    }
    return this.callMCPTool("take_screenshot", params);
  }
}

// Singleton instance for all agents to share
let sharedChromeProxy: SimpleChromeProxy | null = null;

/**
 * Get the shared Chrome proxy instance
 */
export function getSharedChromeProxy(): SimpleChromeProxy {
  if (!sharedChromeProxy) {
    sharedChromeProxy = new SimpleChromeProxy();
  }
  return sharedChromeProxy;
}
