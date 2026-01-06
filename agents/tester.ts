import { InferAgentUIMessage, ToolLoopAgent } from "ai";
import { createModelInstance } from "../lib/model-factory";
import { getChromeTools } from "../lib/mcp-client";
import { agentTools } from "../lib/agent-tools";

const instructions = `
You are a web testing agent with Chrome DevTools.

- Be brief, save time and tokens
- don't provide tool results, user see them

# Your goal is: 
1. Take the test brief document
2. Consider how to test the task
3. Iterate until done:
    a. Consider next step and verbalize briefly
    b. Call chrome tools
    c. Evaluate the result
4. If PASSED/FAILED provide a brief explanation and a proof

# Tools:
- When taking screenshots, always save them to the public/session/ directory.
`;

const chromeTools = await getChromeTools("tester");

export function createTesterAgent(modelId: string) {
  if (!modelId) throw "Missing model type";

  const model = createModelInstance(modelId);

  return new ToolLoopAgent({
    model,
    instructions,
    tools: { ...chromeTools, ...agentTools },
  });
}

export type TesterAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createTesterAgent>
>;
