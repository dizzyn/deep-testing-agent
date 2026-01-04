import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const SESSION_DIR = join(process.cwd(), "public/session");
const CONVERSATION_ID = "default-session";

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

export async function loadConversation(): Promise<Message[]> {
  try {
    await ensureSessionDir();
    const filePath = join(SESSION_DIR, "conversation.json");

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

export async function saveMessage(message: Message): Promise<void> {
  try {
    await ensureSessionDir();
    const filePath = join(SESSION_DIR, "conversation.json");

    // Load existing messages
    const existingMessages = await loadConversation();

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
    let existingMeta = {};
    try {
      const metaContent = await readFile(
        join(SESSION_DIR, "session_meta.json"),
        "utf8"
      );
      existingMeta = JSON.parse(metaContent);
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    const sessionMeta = {
      ...existingMeta,
      lastUpdated: new Date().toISOString(),
      messageCount: updatedMessages.length,
      status: "active",
      conversationId: CONVERSATION_ID,
    };

    await writeFile(
      join(SESSION_DIR, "session_meta.json"),
      JSON.stringify(sessionMeta, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error saving message:", error);
  }
}

export async function clearConversation(): Promise<void> {
  try {
    await ensureSessionDir();
    const filePath = join(SESSION_DIR, "conversation.json");
    await writeFile(filePath, "[]", "utf8");
  } catch (error) {
    console.error("Error clearing conversation:", error);
  }
}

export { CONVERSATION_ID };
