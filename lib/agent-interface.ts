import { getSharedChromeProxy, ChromeProxy } from "./chrome-proxy.js";

/**
 * Base interface for web testing agents
 * All agents share the same Chrome session and tab
 */
export abstract class WebTestingAgent {
  protected chrome: ChromeProxy;

  constructor() {
    this.chrome = getSharedChromeProxy();
  }

  /**
   * Execute the agent's main task
   */
  abstract execute(instruction: string): Promise<string>;

  /**
   * Helper method to safely click elements
   */
  protected async safeClick(uid: string, dblClick = false): Promise<string> {
    try {
      return await this.chrome.click(uid, dblClick);
    } catch (error) {
      return `Failed to click element ${uid}: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  /**
   * Helper method to safely fill forms
   */
  protected async safeFill(uid: string, value: string): Promise<string> {
    try {
      return await this.chrome.fill(uid, value);
    } catch (error) {
      return `Failed to fill element ${uid}: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  /**
   * Helper method to get current page state
   */
  protected async getPageState(): Promise<string> {
    try {
      return await this.chrome.takeSnapshot();
    } catch (error) {
      return `Failed to take snapshot: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  /**
   * Helper method to navigate to a page
   */
  protected async navigateToPage(url: string): Promise<string> {
    try {
      return await this.chrome.openPage(url);
    } catch (error) {
      return `Failed to navigate to ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  /**
   * Helper method to run JavaScript
   */
  protected async runScript(
    code: string,
    elements?: Array<{ uid: string }>
  ): Promise<string> {
    try {
      return await this.chrome.evaluateScript(code, elements);
    } catch (error) {
      return `Failed to execute script: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }
}
