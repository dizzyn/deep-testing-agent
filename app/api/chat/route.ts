import { NextRequest, NextResponse } from "next/server";
import {
  loadConversation,
  clearConversation,
  type ConversationType,
} from "@/lib/conversation";
import { createAgentUIStreamResponse } from "ai";
import { createExplorerAgent } from "@/agents/explorer";
import { createTesterAgent } from "@/agents/tester";
import { saveMessage } from "@/lib/conversation";

export async function GET(request: NextRequest) {
  const conversationType =
    request?.nextUrl?.searchParams.get("conversationType");

  if (!conversationType) throw "Empty conversationType";

  try {
    const messages = await loadConversation(
      conversationType as ConversationType
    );
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  console.log(body);

  const { messages, model, conversationType } = body;

  if (!model) throw "Empty model parameter";
  if (!conversationType) throw "Empty conversationType";

  // Filter out messages with empty parts to prevent validation errors
  const validMessages = messages.filter(
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (msg: any) => msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0
  );

  // Create agent with the selected model
  console.log("conversationType", conversationType);
  const agent =
    conversationType == "testing"
      ? createTesterAgent(model)
      : createExplorerAgent(model);

  // Persist the latest user message
  const lastUserMessage = validMessages[validMessages.length - 1];
  if (lastUserMessage && lastUserMessage.role === "user") {
    await saveMessage(conversationType, {
      id: lastUserMessage.id || crypto.randomUUID(),
      role: "user",
      content: JSON.stringify(lastUserMessage.parts || []),
      parts: lastUserMessage.parts,
      createdAt: new Date().toISOString(),
    });
  }

  return createAgentUIStreamResponse({
    agent,
    uiMessages: validMessages,
    onFinish: async ({ messages: finalMessages }) => {
      // Find and save the assistant's response
      const lastAssistantMessage = finalMessages[finalMessages.length - 1];
      if (
        lastAssistantMessage &&
        lastAssistantMessage.role === "assistant" &&
        lastAssistantMessage.parts &&
        lastAssistantMessage.parts.length > 0
      ) {
        await saveMessage(conversationType, {
          id: lastAssistantMessage.id || crypto.randomUUID(),
          role: "assistant",
          content: JSON.stringify(lastAssistantMessage.parts || []),
          parts: lastAssistantMessage.parts,
          createdAt: new Date().toISOString(),
        });
      }
    },
  });
}

export async function DELETE(request: NextRequest) {
  const conversationType =
    request?.nextUrl?.searchParams.get("conversationType");

  if (!conversationType) throw "Empty conversationType";

  try {
    await clearConversation(conversationType as ConversationType);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing conversation:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
