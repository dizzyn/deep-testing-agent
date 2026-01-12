import { NextRequest, NextResponse } from "next/server";
import {
  clearConversation,
  loadConversation,
  type ServiceType,
} from "@/lib/conversation";
import { safeValidateUIMessages, validateUIMessages, type UIMessage } from "ai";
import { saveMessage } from "@/lib/conversation";
import type { ModelConfiguration } from "@/lib/model-context";
import { ORCHESTRATORS, type ModelId, type OrchestratorId } from "@/lib/models";
import { executeAgentOrchestrator } from "@/lib/orchestrators/agent";
import { executeThinkerDoerOrchestrator } from "@/lib/orchestrators/thinker-doer";
import { executeThinkerDoerLangGraphOrchestrator } from "@/lib/orchestrators/thinker-doer-langgraph";

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

  // Handle both old string format and new ModelConfiguration format
  let modelConfiguration: ModelConfiguration;
  if (typeof model === "string") {
    // Backward compatibility: convert string to ModelConfiguration
    const orchestrator = ORCHESTRATORS[0]; // Default to first orchestrator
    const roleModels: Record<string, ModelId> = {};
    roleModels[orchestrator.models[0]] = model as ModelId;
    modelConfiguration = {
      orchestratorId: orchestrator.id as OrchestratorId,
      roleModels,
    };
  } else {
    modelConfiguration = model as ModelConfiguration;
  }

  // For now, use the first role's model for single-model agents
  const orchestrator =
    ORCHESTRATORS.find((o) => o.id === modelConfiguration.orchestratorId) ||
    ORCHESTRATORS[0];
  const primaryModelId = modelConfiguration.roleModels[orchestrator.models[0]];

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

  validateUIMessages({ messages });

  // Route to appropriate orchestrator based on configuration
  switch (modelConfiguration.orchestratorId) {
    case "agent":
      return executeAgentOrchestrator(
        messages,
        primaryModelId,
        service,
        onFinish
      );

    case "thinker-doer":
      return executeThinkerDoerOrchestrator(
        messages,
        modelConfiguration,
        service,
        onFinish
      );

    case "thinker-doer-langgraph":
      return executeThinkerDoerLangGraphOrchestrator(
        messages,
        modelConfiguration,
        service,
        onFinish
      );

    default:
      throw "Unknown orchestrator configuration";
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
