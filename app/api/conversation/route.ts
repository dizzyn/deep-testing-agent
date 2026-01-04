import { NextResponse } from "next/server";
import { loadConversation, clearConversation } from "@/lib/conversation";

export async function GET() {
  try {
    const messages = await loadConversation();
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearConversation();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing conversation:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
