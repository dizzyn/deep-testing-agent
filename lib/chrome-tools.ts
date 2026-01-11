import { tool } from "ai";
import { z } from "zod";
import { getSharedChromeProxy } from "./chrome-proxy";

/**
 * Create AI SDK tools that wrap the Chrome DevTools MCP functionality
 */
export function createChromeTools() {
  const chrome = getSharedChromeProxy();

  return {
    mcp_chrome_devtools_click: tool({
      description: "Clicks on the provided element",
      inputSchema: z.object({
        uid: z
          .string()
          .describe(
            "The uid of an element on the page from the page content snapshot"
          ),
        dblClick: z
          .boolean()
          .optional()
          .describe("Set to true for double clicks. Default is false."),
      }),
      execute: async ({
        uid,
        dblClick,
      }: {
        uid: string;
        dblClick?: boolean;
      }) => {
        return await chrome.click(uid, dblClick);
      },
    }),

    mcp_chrome_devtools_new_page: tool({
      description: "Creates a new page",
      inputSchema: z.object({
        url: z.string().describe("URL to load in a new page."),
      }),
      execute: async ({ url }: { url: string }) => {
        return await chrome.openPage(url);
      },
    }),

    mcp_chrome_devtools_evaluate_script: tool({
      description:
        "Evaluate a JavaScript function inside the currently selected page. Returns the response as JSON so returned values have to JSON-serializable.",
      inputSchema: z.object({
        function: z
          .string()
          .describe(
            "A JavaScript function declaration to be executed by the tool in the currently selected page."
          ),
        args: z
          .array(
            z.object({
              uid: z
                .string()
                .describe(
                  "The uid of an element on the page from the page content snapshot"
                ),
            })
          )
          .optional()
          .describe("An optional list of arguments to pass to the function."),
      }),
      execute: async ({
        function: functionCode,
        args,
      }: {
        function: string;
        args?: Array<{ uid: string }>;
      }) => {
        return await chrome.evaluateScript(functionCode, args);
      },
    }),

    mcp_chrome_devtools_take_snapshot: tool({
      description:
        "Take a text snapshot of the currently selected page based on the a11y tree. The snapshot lists page elements along with a unique identifier (uid). Always use the latest snapshot. Prefer taking a snapshot over taking a screenshot.",
      inputSchema: z.object({
        verbose: z
          .boolean()
          .optional()
          .describe(
            "Whether to include all possible information available in the full a11y tree. Default is false."
          ),
      }),
      execute: async ({ verbose }: { verbose?: boolean }) => {
        return await chrome.takeSnapshot(verbose);
      },
    }),

    mcp_chrome_devtools_fill: tool({
      description:
        "Type text into a input, text area or select an option from a <select> element.",
      inputSchema: z.object({
        uid: z
          .string()
          .describe(
            "The uid of an element on the page from the page content snapshot"
          ),
        value: z.string().describe("The value to fill in"),
      }),
      execute: async ({ uid, value }: { uid: string; value: string }) => {
        return await chrome.fill(uid, value);
      },
    }),

    mcp_chrome_devtools_take_screenshot: tool({
      description: "Take a screenshot of the page or element.",
      inputSchema: z.object({
        uid: z
          .string()
          .optional()
          .describe(
            "The uid of an element on the page from the page content snapshot. If omitted takes a pages screenshot."
          ),
        fullPage: z
          .boolean()
          .optional()
          .describe(
            "If set to true takes a screenshot of the full page instead of the currently visible viewport. Incompatible with uid."
          ),
      }),
      execute: async ({
        uid,
        fullPage,
      }: {
        uid?: string;
        fullPage?: boolean;
      }) => {
        return await chrome.takeScreenshot(uid, fullPage);
      },
    }),
  };
}
