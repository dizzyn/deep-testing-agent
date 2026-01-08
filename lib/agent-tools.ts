import { tool } from "ai";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

const SESSION_META_PATH = join("public/session", "session_meta.json");

/**
 * Reads session metadata from file
 */
async function getSessionMeta(): Promise<Record<string, unknown>> {
  try {
    const content = await readFile(SESSION_META_PATH, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Updates session metadata with the provided key-value pairs
 */
async function updateSessionMeta(updates: Record<string, unknown>) {
  try {
    const currentMeta = await getSessionMeta();
    const newMeta = {
      ...currentMeta,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    await writeFile(
      SESSION_META_PATH,
      JSON.stringify(newMeta, null, 2),
      "utf8"
    );

    return {
      success: true,
      message: "Session metadata updated",
      meta: newMeta,
    };
  } catch (updateError) {
    return {
      success: false,
      message: `Failed to update session metadata: ${updateError}`,
      meta: null,
    };
  }
}

/**
 * Generic function to get specific content from session metadata
 */
async function getContent(key: string, defaultValue = "") {
  try {
    const meta = await getSessionMeta();
    return {
      success: true,
      content: (meta[key] as string) || defaultValue,
    };
  } catch {
    return {
      success: false,
      content: defaultValue,
    };
  }
}

/**
 * Custom tools for the Chrome testing agent
 */
export const agentTools = {
  updateTestBrief: tool({
    description:
      "Create/Update the test brief markdown content in session metadata",
    inputSchema: z.object({
      content: z.string().describe("The complete test brief markdown content"),
    }),
    execute: async ({ content }) => {
      return await updateSessionMeta({ testBrief: content });
    },
  }),

  updateTestProtocol: tool({
    description:
      "Create/Update the test protocol markdown content in session metadata",
    inputSchema: z.object({
      content: z
        .string()
        .describe("The complete test protocol markdown content"),
    }),
    execute: async ({ content }) => {
      return await updateSessionMeta({ testProtocol: content });
    },
  }),

  getTestBrief: tool({
    description: "Get the current test brief markdown content",
    inputSchema: z.object({}),
    execute: async () => {
      return await getContent("testBrief");
    },
  }),

  getTestProtocol: tool({
    description: "Get the current test protocol markdown content",
    inputSchema: z.object({}),
    execute: async () => {
      return await getContent("testProtocol");
    },
  }),

  // getSessionMeta: tool({
  //   description:
  //     "Get current session metadata including test brief and test protocol",
  //   inputSchema: z.object({}),
  //   execute: async () => {
  //     const filePath = join("public/session", "session_meta.json");

  //     try {
  //       const content = await readFile(filePath, "utf8");
  //       return {
  //         success: true,
  //         meta: JSON.parse(content),
  //       };
  //     } catch {
  //       return {
  //         success: true,
  //         meta: {},
  //       };
  //     }
  //   },
  // }),
};
