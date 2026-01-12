import { InferAgentUIMessage, ToolLoopAgent } from "ai";
import { createModelInstance } from "../lib/model-factory";
import { agentTools } from "../lib/agent-tools";
import { ModelId } from "@/lib/models";

const instructions = `
You are the Thinker agent with access to session management and analysis tools.

- Be brief, save time and tokens
- Focus on analysis, planning, and session management
- Use available tools to read/write test briefs, protocols, and analyze screenshots

Your goal is: Analyze, plan, and manage test sessions and documentation

# WORKFLOW
1. Analyze user requests for testing or documentation needs
2. Use session tools to read existing test briefs and protocols
3. Create or update test documentation as needed
4. Analyze screenshots when provided
5. Provide structured analysis and recommendations

# Tools Available:
- Session metadata management (test briefs, protocols)
- Screenshot analysis and compression
- Content reading and writing

# Guidelines:
- Always check existing session data before creating new content
- Use structured markdown for test briefs and protocols
- Compress and analyze screenshots efficiently
- Provide clear, actionable recommendations
`;

export function createThinkerAgent(modelId: string) {
  if (!modelId) throw "Missing model type";

  const model = createModelInstance(modelId as ModelId);

  const {
    get_test_brief,
    set_test_brief,
    get_test_protocol,
    set_test_protocol,
    read_screenshot,
  } = agentTools;

  return new ToolLoopAgent({
    model,
    temperature: 0.2,
    instructions,
    tools: {
      get_test_brief,
      set_test_brief,
      get_test_protocol,
      set_test_protocol,
      read_screenshot,
    },
  });
}

export type ThinkerAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createThinkerAgent>
>;
