import { InferAgentUIMessage, stepCountIs, ToolLoopAgent } from "ai";
import { createModelInstance } from "../lib/model-factory";
import { createChromeTools } from "../lib/chrome-tools";
import { agentTools } from "../lib/agent-tools";
import { ModelId } from "@/lib/models";

const instructions = `
You are a web testing agent with Chrome DevTools.

- Be brief, save time and tokens

# Your process
1. Take the test brief document, don't ask start testing
2. Consider how to test the task, create test protocol
3. Iterate until done:

# The testing iteration

1. Consider next step and verbalize briefly, verbalize in chat and create the protocol draft
2. Call chrome tools
3. Evaluate the result
4. Update the protocol walkthrough and acceptance criteria, feel free to change test plan any time if needed

# The expected result

1. If PASSED/FAILED - testing has been finished 
    a. Show or explain some proof to user as result, preferable screenshot
    b. Write a *test protocol document* that contains:
      - the status PASSED/FAILED/IN_PROGRESS
      - the real walk thought
      - acceptance criteria based on the brief
      - potential differences from the brief
2. Check the test protocol if it is complete

Expected: **The test protocol is completed on the end by writing PASSED/FAILED in it**

# Tools:
- When taking screenshots, always save them to the public/session/ directory.
- When the brief is generated, send the content to tool:set_test_protocol,
  - don't retrieve as text response
  - just ask user if we can start test.
- Don't repeat information from the tool calls, user see the tools results 

Important:
- **Don't ask user in any case, he can not answer**
- **Update the protocol after every step**
- **NEVER stop until you have the final test result**

<report example>
# 📋 Test Protocol: Add Highest Priced Item

Statius: **PASSED** - Successfully added the highest Priced Item to Cart

## 👣 Execution Steps
1. Step 1 - result of the step

## Acceptance Criteria (The Contract)
[x] **Name** the test from the brief

Note: (optional) any additional note if needed - eg. brief was not followed fully._
</report example>
`;

const chromeTools = createChromeTools();

export function createTesterAgent(modelId: string) {
  if (!modelId) throw "Missing model type";

  const model = createModelInstance(modelId as ModelId);

  const { getTestBrief, getTestProtocol, set_test_protocol } = agentTools;

  return new ToolLoopAgent({
    model,
    temperature: 0.2,
    instructions,
    prepareCall: (settings) => {
      return {
        ...settings,
        stopWhen: stepCountIs(50),
      };
    },
    tools: {
      ...chromeTools,
      getTestBrief,
      getTestProtocol,
      set_test_protocol, //Known type issue with set_test_brief tool
    },
    // experimental_telemetry: {
    //   isEnabled: true,
    //   recordInputs: true,
    //   recordOutputs: true,
    // },
  });
}

export type TesterAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createTesterAgent>
>;
