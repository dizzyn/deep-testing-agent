import { InferAgentUIMessage, ToolLoopAgent } from "ai";
import { createModelInstance } from "../lib/model-factory";
import { getChromeTools } from "../lib/mcp-client";
import { agentTools } from "../lib/agent-tools";

const instructions = `
You are a web testing agent with Chrome DevTools.

- Be brief, save time and tokens

# Your goal is: 
1. Take the test brief document
2. Consider how to test the task
3. Iterate until done:
    a. Consider next step and verbalize briefly
    b. Call chrome tools
    c. Evaluate the result
4. If PASSED/FAILED
    a. Show some proof to user as result
    b.write a *test protocol document* that contains:
      - professional but brief result
      - provided steps
      - acceptance criteria from the brief (use checkboxes)
      - potential differences from the brief

# Tools:
- When taking screenshots, always save them to the public/session/ directory.
- When the brief is generated, send the content to tool:updateTestProtocol,
  - don't retrieve as text response
  - just ask user if we can start test.
- Don't repeat information from the tool calls, user see them all 

<report example>
# 📋 Test Protocol: Add Highest Priced Item

**Result:** PASSED - Successfully added the highest Priced Item to Cart

## 👣 Execution Steps

| # | Action | Expected Result |
| :--- | :--- | :--- |
| **1** | Navigate to \`https://www.saucedemo.com/\` | Login page loads successfully. |
| **2** | Enter Username...

## Acceptance Criteria (The Contract)
[x] **Primary Indicator:** The shopping cart icon (top-right) updates to display the number \`1\`
[x] **Secondary Indicator:** The shopping cart if visited contains the specific high-price item

</report example>
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
