import { tool } from "ai";
import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import sharp from "sharp";

interface MessagePart {
  type: string;
  [key: string]: unknown;
}

// interface ToolCallPart extends MessagePart {
//   toolCallId: string;
//   state: string;
//   input: Record<string, unknown>;
//   output?: unknown;
// }

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

const warning = "(User sees the full content, don't repeat in chat)";

/**
 * Custom tools for the Chrome testing agent
 */
export const agentTools = {
  setTestBrief: tool({
    description:
      "Create/Update the test brief markdown content in session metadata." +
      warning,
    inputSchema: z.object({
      content: z.string().describe("The complete test brief markdown content"),
    }),
    execute: async ({ content }: { content: string }) => {
      return await updateSessionMeta({ testBrief: content });
    },
  }),

  setTestProtocol: tool({
    description:
      "Create/Update the test protocol markdown content in session metadata." +
      warning,
    inputSchema: z.object({
      content: z
        .string()
        .describe("The complete test protocol markdown content"),
    }),
    execute: async ({ content }: { content: string }) => {
      return await updateSessionMeta({ testProtocol: content });
    },
  }),

  getTestBrief: tool({
    description: "Get the current test brief markdown content. " + warning,
    inputSchema: z.object({}).strict(),
    execute: async () => {
      return await getContent("testBrief");
    },
  }),

  getTestProtocol: tool({
    description: "Get the current test protocol markdown content" + warning,
    inputSchema: z.object({}).strict(),
    execute: async () => {
      return await getContent("testProtocol");
    },
  }),

  readScreenshot: tool({
    description:
      "Read and analyze screenshot content. Returns compressed base64 encoded image data that the AI can process. " +
      warning,
    inputSchema: z.object({
      filename: z
        .string()
        .describe("The screenshot filename (e.g., 'todomvc_test.png')"),
      maxWidth: z
        .number()
        .optional()
        .describe("Maximum width in pixels (default: 800)"),
      quality: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("JPEG quality 1-100 (default: 70)"),
    }),
    execute: async ({
      filename,
      maxWidth = 800,
      quality = 70,
    }: {
      filename: string;
      maxWidth?: number;
      quality?: number;
    }) => {
      try {
        const sessionDir = join("public/session");
        const filePath = join(sessionDir, filename);

        const originalBuffer = await readFile(filePath);

        // Compress and resize the image
        const compressedBuffer = await sharp(originalBuffer)
          .resize({ width: maxWidth, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();

        const base64Data = compressedBuffer.toString("base64");
        const mimeType = "image/jpeg"; // Always JPEG after compression

        const compressionRatio = Math.round(
          (1 - compressedBuffer.length / originalBuffer.length) * 100
        );

        return {
          success: true,
          filename,
          mimeType,
          base64Data,
          dataUrl: `data:${mimeType};base64,${base64Data}`,
          originalSize: originalBuffer.length,
          compressedSize: compressedBuffer.length,
          compressionRatio,
          maxWidth,
          quality,
          message: `Screenshot '${filename}' compressed: ${Math.round(
            originalBuffer.length / 1024
          )}KB → ${Math.round(
            compressedBuffer.length / 1024
          )}KB (${compressionRatio}% reduction)`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to read screenshot '${filename}': ${error}`,
          filename,
          base64Data: null,
        };
      }
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
