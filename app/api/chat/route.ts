import { createAgentUIStreamResponse } from "ai";
import { createChromeAgent } from "@/agents/explorer";
import { saveMessage } from "@/lib/conversation";

export async function POST(request: Request) {
  const { messages, model } = await request.json();

  // Filter out messages with empty parts to prevent validation errors
  const validMessages = messages.filter(
    (msg: any) => msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0
  );

  // Create agent with the selected model
  const agent = createChromeAgent(model || "mistral/devstral-latest");

  // Persist the latest user message
  const lastUserMessage = validMessages[validMessages.length - 1];
  if (lastUserMessage && lastUserMessage.role === "user") {
    await saveMessage({
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
        await saveMessage({
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
