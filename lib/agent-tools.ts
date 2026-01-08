import { tool } from "ai";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

/**
 * Updates session metadata with the provided key-value pairs
 */
async function updateSessionMeta(updates: Record<string, unknown>) {
  const filePath = join("public/session", "session_meta.json");

  try {
    let currentMeta = {};
    try {
      const content = await readFile(filePath, "utf8");
      currentMeta = JSON.parse(content);
    } catch {
      // File doesn't exist yet, start with empty meta
    }

    const newMeta = {
      ...currentMeta,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    await writeFile(filePath, JSON.stringify(newMeta, null, 2), "utf8");

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

  // updateSessionMeta: tool({
  //   description: "Update session metadata with key-value pairs",
  //   inputSchema: z.object({
  //     updates: z
  //       .record(z.string(), z.unknown())
  //       .describe("Metadata updates to apply"),
  //   }),
  //   execute: async ({ updates }) => {
  //     return await updateSessionMeta(updates);
  //   },
  // }),

  getSessionMeta: tool({
    description: "Get current session metadata including test brief",
    inputSchema: z.object({}),
    execute: async () => {
      const filePath = join("public/session", "session_meta.json");

      try {
        const content = await readFile(filePath, "utf8");
        return {
          success: true,
          meta: JSON.parse(content),
        };
      } catch {
        return {
          success: true,
          meta: {},
        };
      }
    },
  }),
};
