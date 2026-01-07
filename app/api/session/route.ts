import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile, writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const SESSION_DIR = join(process.cwd(), "public/session");

export interface SessionData {
  createdAt: string;
  lastUpdated: string;
  sessionId: string;
  status: "brief" | "testing";
  chatHistory: unknown[];
  testHistory: unknown[];
  testBrief?: string;
  files: string[];
}

// Ensure session directory exists
async function ensureSessionDir() {
  if (!existsSync(SESSION_DIR)) {
    await mkdir(SESSION_DIR, { recursive: true });
  }
}

// GET - Fetch all session data
export async function GET() {
  try {
    await ensureSessionDir();

    const files = await readdir(SESSION_DIR);
    let sessionData: SessionData = {
      chatHistory: [],
      testHistory: [],
      files: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      sessionId: "default",
      status: "brief",
    };

    // Read session meta
    if (files.includes("session_meta.json")) {
      const metaContent = await readFile(
        join(SESSION_DIR, "session_meta.json"),
        "utf8"
      );
      sessionData = {
        ...sessionData,
        ...JSON.parse(metaContent),
      };
    }

    // Read chat history
    if (files.includes("chat_history.json")) {
      const chatContent = await readFile(
        join(SESSION_DIR, "chat_history.json"),
        "utf8"
      );
      sessionData.chatHistory = JSON.parse(chatContent);
    }

    // Read chat history
    if (files.includes("test_history.json")) {
      const testContent = await readFile(
        join(SESSION_DIR, "test_history.json"),
        "utf8"
      );
      sessionData.testHistory = JSON.parse(testContent);
    }

    // List all files
    // sessionData.files = files;

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Error fetching session data:", error);
    return NextResponse.json(
      { error: "Failed to fetch session data" },
      { status: 500 }
    );
  }
}

// POST - Update session data
export async function POST(request: NextRequest) {
  try {
    await ensureSessionDir();
    const sessionMeta = await request.json();

    const timestamp = new Date().toISOString();

    // Save/update session meta
    if (sessionMeta) {
      const updatedMeta = {
        ...sessionMeta,
        lastUpdated: timestamp,
      };
      await writeFile(
        join(SESSION_DIR, "session_meta.json"),
        JSON.stringify(updatedMeta, null, 2),
        "utf8"
      );
    }

    return NextResponse.json({ success: true, timestamp });
  } catch (error) {
    console.error("Error updating session data:", error);
    return NextResponse.json(
      { error: "Failed to update session data" },
      { status: 500 }
    );
  }
}

// DELETE - Reset session (purge folder)
export async function DELETE() {
  try {
    await ensureSessionDir();
    const files = await readdir(SESSION_DIR);

    // Delete all files in session directory
    await Promise.all(files.map((file) => unlink(join(SESSION_DIR, file))));

    return NextResponse.json({
      success: true,
      message: "Session reset successfully",
    });
  } catch (error) {
    console.error("Error resetting session:", error);
    return NextResponse.json(
      { error: "Failed to reset session" },
      { status: 500 }
    );
  }
}
