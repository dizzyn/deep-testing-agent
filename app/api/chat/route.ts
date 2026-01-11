import { NextRequest, NextResponse } from "next/server";
import {
  clearConversation,
  loadConversation,
  type ServiceType,
} from "@/lib/conversation";
import {
  convertToModelMessages,
  createAgentUIStreamResponse,
  safeValidateUIMessages,
  validateUIMessages,
  type UIMessage,
} from "ai";
import { createExplorerAgent } from "@/agents/explorer";
import { createTesterAgent } from "@/agents/tester";
import { saveMessage } from "@/lib/conversation";

export async function GET(request: NextRequest) {
  const serviceType = request?.nextUrl?.searchParams.get("service");

  if (!serviceType) throw "Empty ServiceType";

  try {
    const messages = await loadConversation(serviceType as ServiceType);
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

  const { messages, model, service } = body;

  if (!model) throw "Empty model parameter";
  if (!service) throw "Empty ServiceType";

  // Clean up messages to save tokens - replace old tool outputs with "removed"
  // const validMessages = messages.filter(
  //   (msg: UIMessage) =>
  //     msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0
  // );

  // Persist the latest user message
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage && lastUserMessage.role === "user") {
    await saveMessage(service, {
      id: lastUserMessage.id || crypto.randomUUID(),
      role: "user",

      // content: JSON.stringify(lastUserMessage.parts || []),
      parts: lastUserMessage.parts,
      // createdAt: new Date().toISOString(),
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
    if (usage) console.log("Token usage:", usage);

    // Find and save the assistant's response
    const lastAssistantMessage = messages[messages.length - 1];

    if (
      lastAssistantMessage &&
      lastAssistantMessage.role === "assistant" &&
      lastAssistantMessage.parts &&
      lastAssistantMessage.parts.length > 0
    ) {
      await saveMessage(service, {
        id: lastAssistantMessage.id || crypto.randomUUID(),
        role: "assistant",
        // content: JSON.stringify(lastAssistantMessage.parts || []),
        parts: lastAssistantMessage.parts,
        // createdAt: new Date().toISOString(),
      });
    }
  };

  const result = await safeValidateUIMessages({
    messages,
  });

  if (!result.success) {
    console.error("ERR: " + result.error.message);
  }

  // Create agent with the selected model and return appropriate response
  if (service === "testing") {
    const agent = createTesterAgent(model);
    validateUIMessages({ messages });
    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      onFinish,
    });
  } else {
    const agent = createExplorerAgent(model);
    validateUIMessages({ messages });
    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      onFinish,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const ServiceType = request?.nextUrl?.searchParams.get("ServiceType");

  if (!ServiceType) throw "Empty ServiceType";

  try {
    await clearConversation(ServiceType as ServiceType);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing conversation:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
