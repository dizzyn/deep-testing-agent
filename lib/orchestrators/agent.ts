import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { createExplorerAgent } from "@/agents/explorer";
import { createTesterAgent } from "@/agents/tester";
import type { ModelId } from "@/lib/models";

export async function executeAgentOrchestrator(
  messages: UIMessage[],
  primaryModelId: ModelId,
  service: string,
  onFinish: (result: any) => Promise<void>
) {
  // Create agent with the selected model and return appropriate response
  if (service === "testing") {
    const agent = createTesterAgent(primaryModelId);
    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      onFinish,
    });
  } else {
    const agent = createExplorerAgent(primaryModelId);
    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      onFinish,
    });
  }
}
