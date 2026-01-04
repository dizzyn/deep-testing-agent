import { createAgentUIStreamResponse } from "ai";
import { chromeAgent } from "@/agents/explorer";
import { saveMessage } from "@/lib/conversation";

export async function POST(request: Request) {
  const { messages } = await request.json();

  // Persist the latest user message
  const lastUserMessage = messages[messages.length - 1];
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
    agent: chromeAgent,
    uiMessages: messages,
    onFinish: async ({ messages: finalMessages }) => {
      // Find and save the assistant's response
      const lastAssistantMessage = finalMessages[finalMessages.length - 1];
      if (lastAssistantMessage && lastAssistantMessage.role === "assistant") {
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
