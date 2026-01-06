import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const SESSION_DIR = join(process.cwd(), "public/session");
const CONVERSATION_ID = "default-session";
const TESTING_CONVERSATION_ID = "testing-session";

type ConversationType = "default" | "testing";

function getConversationFileName(type: ConversationType): string {
  return type === "testing" ? "testing.json" : "conversation.json";
}

function getConversationId(type: ConversationType): string {
  return type === "testing" ? TESTING_CONVERSATION_ID : CONVERSATION_ID;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: unknown[];
  createdAt: string;
}

async function ensureSessionDir(): Promise<void> {
  if (!existsSync(SESSION_DIR)) {
    await mkdir(SESSION_DIR, { recursive: true });
  }
}

export async function loadConversation(
  type: ConversationType
): Promise<Message[]> {
  try {
    await ensureSessionDir();
    const fileName = getConversationFileName(type);
    const filePath = join(SESSION_DIR, fileName);

    if (!existsSync(filePath)) {
      return [];
    }

    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error loading conversation:", error);
    return [];
  }
}

export async function saveMessage(
  type: ConversationType,
  message: Message
): Promise<void> {
  try {
    await ensureSessionDir();
    const fileName = getConversationFileName(type);
    const filePath = join(SESSION_DIR, fileName);
    const conversationId = getConversationId(type);

    // Load existing messages
    const existingMessages = await loadConversation(type);

    // Add new message
    const updatedMessages = [
      ...existingMessages,
      {
        ...message,
        createdAt: new Date().toISOString(),
      },
    ];

    // Save back to file
    await writeFile(filePath, JSON.stringify(updatedMessages, null, 2), "utf8");

    // Update session meta while preserving existing data
    let existingMeta: Record<string, unknown> = {};
    try {
      const metaContent = await readFile(
        join(SESSION_DIR, "session_meta.json"),
        "utf8"
      );
      existingMeta = JSON.parse(metaContent);
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    const sessionMeta: Record<string, unknown> = {
      ...existingMeta,
      lastUpdated: new Date().toISOString(),
      status: "active",
      conversationId,
    };

    // Preserve testBrief if it exists
    if (existingMeta.testBrief) {
      sessionMeta.testBrief = existingMeta.testBrief;
    }

    await writeFile(
      join(SESSION_DIR, "session_meta.json"),
      JSON.stringify(sessionMeta, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error saving message:", error);
  }
}

export async function clearConversation(type: ConversationType): Promise<void> {
  try {
    await ensureSessionDir();
    const fileName = getConversationFileName(type);
    const filePath = join(SESSION_DIR, fileName);
    await writeFile(filePath, "[]", "utf8");
  } catch (error) {
    console.error("Error clearing conversation:", error);
  }
}

export { CONVERSATION_ID, TESTING_CONVERSATION_ID, type ConversationType };
