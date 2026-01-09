import { NextRequest, NextResponse } from "next/server";
import {
  clearConversation,
  loadConversation,
  type ConversationType,
} from "@/lib/conversation";
import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { createExplorerAgent } from "@/agents/explorer";
import { createTesterAgent } from "@/agents/tester";
import { saveMessage } from "@/lib/conversation";
import { cleanMessages } from "@/lib/agent-tools";

interface MessagePart {
  type: string;
  [key: string]: unknown;
}

interface Message {
  id: string;
  role: string;
  content: string;
  parts: MessagePart[];
  createdAt: string;
}

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

  const { messages, model, conversationType } = body;

  if (!model) throw "Empty model parameter";
  if (!conversationType) throw "Empty conversationType";

  // Clean up messages to save tokens - replace old tool outputs with "removed"
  const validMessages = cleanMessages(messages).filter(
    (msg: Message) =>
      msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0
  );

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

  const onFinish = async ({
    messages,
    usage,
  }: {
    messages: UIMessage[];
    isContinuation: boolean;
    isAborted: boolean;
    responseMessage: UIMessage;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }) => {
    console.log("Token usage:", usage);

    // Find and save the assistant's response
    const lastAssistantMessage = messages[messages.length - 1];

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
  };

  // Create agent with the selected model and return appropriate response
  console.log("conversationType", conversationType);

  if (conversationType === "testing") {
    const agent = createTesterAgent(model);
    return createAgentUIStreamResponse({
      agent,
      uiMessages: validMessages,
      onFinish,
    });
  } else {
    const agent = createExplorerAgent(model);
    return createAgentUIStreamResponse({
      agent,
      uiMessages: validMessages,
      onFinish,
    });
  }
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
