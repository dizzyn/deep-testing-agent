import { tool } from "ai";
import { z } from "zod";
import { getSharedMCPClient } from "./mcp-client";

/**
 * Direct MCP tool execution
 */
async function callMCPTool(
  toolName: string,
  params: Record<string, unknown>
): Promise<string> {
  const mcpClient = await getSharedMCPClient();
  const tools = await mcpClient.tools();
  const mcpTool = tools[toolName];

  if (!mcpTool || typeof mcpTool !== "object" || !("execute" in mcpTool)) {
    throw new Error(`Tool ${toolName} not found`);
  }

  const result = await (
    mcpTool as unknown as {
      execute: (params: Record<string, unknown>) => Promise<{
        content?: Array<{ text?: string }>;
      }>;
    }
  ).execute(params);

  // Extract text content from MCP response
  if (result && typeof result === "object" && "content" in result) {
    const content = result.content;
    if (
      Array.isArray(content) &&
      content[0] &&
      typeof content[0] === "object" &&
      "text" in content[0]
    ) {
      return content[0].text as string;
    }
  }

  return JSON.stringify(result);
}

/**
 * Create Chrome DevTools tools using the original MCP tool names
 * This provides full compatibility with both MCP server and UI components
 */
export function createChromeTools() {
  return {
    click: tool({
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
      execute: async (params: { uid: string; dblClick?: boolean }) => {
        return callMCPTool("click", params);
      },
    }),

    take_snapshot: tool({
      description:
        "Take a text snapshot of the currently selected page based on the a11y tree",
      inputSchema: z.object({
        verbose: z
          .boolean()
          .optional()
          .describe(
            "Whether to include all possible information available in the full a11y tree"
          ),
        filePath: z
          .string()
          .optional()
          .describe(
            "Path to save the snapshot to instead of attaching it to the response"
          ),
      }),
      execute: async (params: { verbose?: boolean; filePath?: string }) => {
        return callMCPTool("take_snapshot", params);
      },
    }),

    take_screenshot: tool({
      description: "Take a screenshot of the page or element",
      inputSchema: z.object({
        uid: z
          .string()
          .optional()
          .describe("The uid of an element on the page"),
        fullPage: z
          .boolean()
          .optional()
          .describe("Take screenshot of full page instead of viewport"),
        filePath: z
          .string()
          .optional()
          .describe("Path to save the screenshot to"),
        format: z
          .enum(["png", "jpeg", "webp"])
          .optional()
          .describe("Screenshot format"),
        quality: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe("Compression quality for JPEG/WebP"),
      }),
      execute: async (params: {
        uid?: string;
        fullPage?: boolean;
        filePath?: string;
        format?: "png" | "jpeg" | "webp";
        quality?: number;
      }) => {
        return callMCPTool("take_screenshot", params);
      },
    }),

    fill: tool({
      description:
        "Type text into an input, text area or select an option from a <select> element",
      inputSchema: z.object({
        uid: z.string().describe("The uid of an element on the page"),
        value: z.string().describe("The value to fill in"),
      }),
      execute: async (params: { uid: string; value: string }) => {
        return callMCPTool("fill", params);
      },
    }),

    new_page: tool({
      description: "Creates a new page",
      inputSchema: z.object({
        url: z.string().describe("URL to load in a new page"),
        timeout: z
          .number()
          .optional()
          .describe("Maximum wait time in milliseconds"),
      }),
      execute: async (params: { url: string; timeout?: number }) => {
        return callMCPTool("new_page", params);
      },
    }),

    evaluate_script: tool({
      description:
        "Evaluate a JavaScript function inside the currently selected page",
      inputSchema: z.object({
        function: z
          .string()
          .describe("A JavaScript function declaration to be executed"),
        args: z
          .array(
            z.object({
              uid: z.string().describe("The uid of an element on the page"),
            })
          )
          .optional()
          .describe("Optional list of element arguments"),
      }),
      execute: async (params: {
        function: string;
        args?: Array<{ uid: string }>;
      }) => {
        return callMCPTool("evaluate_script", params);
      },
    }),

    hover: tool({
      description: "Hover over the provided element",
      inputSchema: z.object({
        uid: z.string().describe("The uid of an element on the page"),
      }),
      execute: async (params: { uid: string }) => {
        return callMCPTool("hover", params);
      },
    }),

    drag: tool({
      description: "Drag an element onto another element",
      inputSchema: z.object({
        from_uid: z.string().describe("The uid of the element to drag"),
        to_uid: z.string().describe("The uid of the element to drop into"),
      }),
      execute: async (params: { from_uid: string; to_uid: string }) => {
        return callMCPTool("drag", params);
      },
    }),

    fill_form: tool({
      description: "Fill out multiple form elements at once",
      inputSchema: z.object({
        elements: z
          .array(
            z.object({
              uid: z.string().describe("The uid of the element to fill out"),
              value: z.string().describe("Value for the element"),
            })
          )
          .describe("Elements from snapshot to fill out"),
      }),
      execute: async (params: {
        elements: Array<{ uid: string; value: string }>;
      }) => {
        return callMCPTool("fill_form", params);
      },
    }),

    upload_file: tool({
      description: "Upload a file through a provided element",
      inputSchema: z.object({
        uid: z.string().describe("The uid of the file input element"),
        filePath: z.string().describe("The local path of the file to upload"),
      }),
      execute: async (params: { uid: string; filePath: string }) => {
        return callMCPTool("upload_file", params);
      },
    }),

    press_key: tool({
      description: "Press a key or key combination",
      inputSchema: z.object({
        key: z
          .string()
          .describe("A key or combination (e.g., 'Enter', 'Control+A')"),
      }),
      execute: async (params: { key: string }) => {
        return callMCPTool("press_key", params);
      },
    }),

    list_pages: tool({
      description: "Get a list of pages open in the browser",
      inputSchema: z.object({}),
      execute: async () => {
        return callMCPTool("list_pages", {});
      },
    }),

    select_page: tool({
      description: "Select a page as a context for future tool calls",
      inputSchema: z.object({
        pageIdx: z.number().describe("The index of the page to select"),
        bringToFront: z
          .boolean()
          .optional()
          .describe("Whether to focus the page and bring it to the top"),
      }),
      execute: async (params: { pageIdx: number; bringToFront?: boolean }) => {
        return callMCPTool("select_page", params);
      },
    }),

    close_page: tool({
      description: "Closes the page by its index",
      inputSchema: z.object({
        pageIdx: z.number().describe("The index of the page to close"),
      }),
      execute: async (params: { pageIdx: number }) => {
        return callMCPTool("close_page", params);
      },
    }),

    navigate_page: tool({
      description: "Navigates the currently selected page to a URL",
      inputSchema: z.object({
        type: z
          .enum(["url", "back", "forward", "reload"])
          .optional()
          .describe("Navigate by URL, back/forward in history, or reload"),
        url: z.string().optional().describe("Target URL (only type=url)"),
        ignoreCache: z
          .boolean()
          .optional()
          .describe("Whether to ignore cache on reload"),
        timeout: z
          .number()
          .optional()
          .describe("Maximum wait time in milliseconds"),
      }),
      execute: async (params: {
        type?: "url" | "back" | "forward" | "reload";
        url?: string;
        ignoreCache?: boolean;
        timeout?: number;
      }) => {
        return callMCPTool("navigate_page", params);
      },
    }),

    resize_page: tool({
      description: "Resizes the selected page's window",
      inputSchema: z.object({
        width: z.number().describe("Page width"),
        height: z.number().describe("Page height"),
      }),
      execute: async (params: { width: number; height: number }) => {
        return callMCPTool("resize_page", params);
      },
    }),

    handle_dialog: tool({
      description: "Handle a browser dialog",
      inputSchema: z.object({
        action: z
          .enum(["accept", "dismiss"])
          .describe("Whether to dismiss or accept the dialog"),
        promptText: z
          .string()
          .optional()
          .describe("Optional prompt text to enter into the dialog"),
      }),
      execute: async (params: {
        action: "accept" | "dismiss";
        promptText?: string;
      }) => {
        return callMCPTool("handle_dialog", params);
      },
    }),

    wait_for: tool({
      description: "Wait for the specified text to appear on the selected page",
      inputSchema: z.object({
        text: z.string().describe("Text to appear on the page"),
        timeout: z
          .number()
          .optional()
          .describe("Maximum wait time in milliseconds"),
      }),
      execute: async (params: { text: string; timeout?: number }) => {
        return callMCPTool("wait_for", params);
      },
    }),

    emulate: tool({
      description: "Emulates various features on the selected page",
      inputSchema: z.object({
        networkConditions: z
          .enum([
            "No emulation",
            "Offline",
            "Slow 3G",
            "Fast 3G",
            "Slow 4G",
            "Fast 4G",
          ])
          .optional()
          .describe("Throttle network"),
        cpuThrottlingRate: z
          .number()
          .min(1)
          .max(20)
          .optional()
          .describe("CPU slowdown factor"),
        geolocation: z
          .object({
            latitude: z
              .number()
              .min(-90)
              .max(90)
              .describe("Latitude between -90 and 90"),
            longitude: z
              .number()
              .min(-180)
              .max(180)
              .describe("Longitude between -180 and 180"),
          })
          .nullable()
          .optional()
          .describe("Geolocation to emulate"),
      }),
      execute: async (params: {
        networkConditions?: string;
        cpuThrottlingRate?: number;
        geolocation?: { latitude: number; longitude: number } | null;
      }) => {
        return callMCPTool("emulate", params);
      },
    }),

    list_network_requests: tool({
      description: "List all requests for the currently selected page",
      inputSchema: z.object({
        pageSize: z
          .number()
          .optional()
          .describe("Maximum number of requests to return"),
        pageIdx: z
          .number()
          .optional()
          .describe("Page number to return (0-based)"),
        resourceTypes: z
          .array(
            z.enum([
              "document",
              "stylesheet",
              "image",
              "media",
              "font",
              "script",
              "texttrack",
              "xhr",
              "fetch",
              "prefetch",
              "eventsource",
              "websocket",
              "manifest",
              "signedexchange",
              "ping",
              "cspviolationreport",
              "preflight",
              "fedcm",
              "other",
            ])
          )
          .optional()
          .describe("Filter requests by resource types"),
        includePreservedRequests: z
          .boolean()
          .optional()
          .describe("Include preserved requests over last 3 navigations"),
      }),
      execute: async (params: {
        pageSize?: number;
        pageIdx?: number;
        resourceTypes?: string[];
        includePreservedRequests?: boolean;
      }) => {
        return callMCPTool("list_network_requests", params);
      },
    }),

    get_network_request: tool({
      description: "Gets a network request by its ID",
      inputSchema: z.object({
        reqid: z
          .number()
          .optional()
          .describe("The reqid of the network request"),
      }),
      execute: async (params: { reqid?: number }) => {
        return callMCPTool("get_network_request", params);
      },
    }),

    list_console_messages: tool({
      description: "List all console messages for the currently selected page",
      inputSchema: z.object({
        pageSize: z
          .number()
          .optional()
          .describe("Maximum number of messages to return"),
        pageIdx: z
          .number()
          .optional()
          .describe("Page number to return (0-based)"),
        types: z
          .array(
            z.enum([
              "log",
              "debug",
              "info",
              "error",
              "warn",
              "dir",
              "dirxml",
              "table",
              "trace",
              "clear",
              "startGroup",
              "startGroupCollapsed",
              "endGroup",
              "assert",
              "profile",
              "profileEnd",
              "count",
              "timeEnd",
              "verbose",
              "issue",
            ])
          )
          .optional()
          .describe("Filter messages by types"),
        includePreservedMessages: z
          .boolean()
          .optional()
          .describe("Include preserved messages over last 3 navigations"),
      }),
      execute: async (params: {
        pageSize?: number;
        pageIdx?: number;
        types?: string[];
        includePreservedMessages?: boolean;
      }) => {
        return callMCPTool("list_console_messages", params);
      },
    }),

    get_console_message: tool({
      description: "Gets a console message by its ID",
      inputSchema: z.object({
        msgid: z.number().describe("The msgid of a console message"),
      }),
      execute: async (params: { msgid: number }) => {
        return callMCPTool("get_console_message", params);
      },
    }),

    performance_start_trace: tool({
      description: "Starts a performance trace recording on the selected page",
      inputSchema: z.object({
        reload: z
          .boolean()
          .describe("Whether to reload the page after starting trace"),
        autoStop: z
          .boolean()
          .describe("Whether to automatically stop the trace"),
      }),
      execute: async (params: { reload: boolean; autoStop: boolean }) => {
        return callMCPTool("performance_start_trace", params);
      },
    }),

    performance_stop_trace: tool({
      description: "Stops the active performance trace recording",
      inputSchema: z.object({}),
      execute: async () => {
        return callMCPTool("performance_stop_trace", {});
      },
    }),

    performance_analyze_insight: tool({
      description:
        "Provides detailed information on a specific Performance Insight",
      inputSchema: z.object({
        insightSetId: z
          .string()
          .describe("The id for the specific insight set"),
        insightName: z.string().describe("The name of the Insight to analyze"),
      }),
      execute: async (params: {
        insightSetId: string;
        insightName: string;
      }) => {
        return callMCPTool("performance_analyze_insight", params);
      },
    }),
  };
}
