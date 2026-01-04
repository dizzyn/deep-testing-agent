import { createAgentUIStreamResponse } from "ai";
import { chromeAgent } from "@/agents/explorer";

export async function POST(request: Request) {
  const { messages } = await request.json();
  return createAgentUIStreamResponse({
    agent: chromeAgent,
    uiMessages: messages,
  });
}
