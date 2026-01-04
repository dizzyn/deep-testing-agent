import { ToolLoopAgent, InferAgentUIMessage, tool } from "ai";
import { createMistral } from "@ai-sdk/mistral";
import { createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioClientTransport } from "@ai-sdk/mcp/mcp-stdio";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

const instructions = `
You are a web testing agent with Chrome DevTools.

- Be brief, save time and tokens
- don't provide tool results, user see them

Your goal is: Ask for a vague test task -> visit the website only once -> Prepare a test brief document

# WORKFLOW
1. Speak with the User by chat
2. Ask for test task, example: "Visit https://www.saucedemo.com/ test if it is possible put the most expensive item into the basket."
3. Visit the entry point as health-check, serve a screenshot
  - (Don't navigate deeper, don't test anything right now)
4. Consider how to test the task, what you will need (password, human assistance, documentation link)
5. Update the session metadata with a *test brief document* that contains:
    - professional but still vague task description
    - acceptance criteria
    - supposed agent instruction
    - given passwords, links, ids (if any)
6. Once the brief is approved by user, you have done

# Tools:
- When taking screenshots, always save them to the public/session/ directory.
- When the brief is generated, send the content to tool:updateTestBrief, don't retrieve as text response.

<test brief example>
# Mission Brief: Add Highest Priced Item

**Target URL:** https://www.saucedemo.com/

## 🎯 Mission Goal

Log in and objectively verify that the inventory system allows adding the most expensive product to the shopping cart.

## ⚙️ Configuration

- **Credentials:** Provided (\`standard_user\` / \`secret_sauce\`)
- **Constraints:**
  - Must identify the item with the highest numerical price value on the inventory page
  - Verify that the basket doesn't include the item already  
  - Must add the identified item to the shopping cart
  - Must verify that the item has been successfully added to the cart

## ✅ Acceptance Criteria (The Contract)

The test is considered **PASSED** only if the following evidence is collected:

1. **Primary Indicator:** The shopping cart icon (top-right) updates to display the number \`1\`
2. **Secondary Indicator:** The shopping cart if visited contains the specific high-price item

---

_Agent Note: I will scan the default inventory list to find the highest price. I will not proceed to the checkout page unless requested._
</test brief example>
.`;

const mcpClient = await createMCPClient({
  transport: new StdioClientTransport({
    command: "node",
    args: ["./chrome-devtools-mcp/build/src/index.js"],
  }),
});

const chromeTools = await mcpClient.tools();

async function updateSessionMeta(updates: Record<string, unknown>) {
  const filePath = join("public/session", "session_meta.json");

  try {
    let currentMeta = {};
    try {
      const content = await readFile(filePath, "utf8");
      currentMeta = JSON.parse(content);
    } catch {
      // File doesn't exist yet, start with empty meta
    }

    const newMeta = {
      ...currentMeta,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    await writeFile(filePath, JSON.stringify(newMeta, null, 2), "utf8");

    return {
      success: true,
      message: "Session metadata updated",
      meta: newMeta,
    };
  } catch (updateError) {
    return {
      success: false,
      message: `Failed to update session metadata: ${updateError}`,
      meta: null,
    };
  }
}

const myTools = {
  updateTestBrief: tool({
    description:
      "Create/Update the test brief markdown content in session metadata",
    inputSchema: z.object({
      content: z.string().describe("The complete test brief markdown content"),
    }),
    execute: async ({ content }) => {
      return await updateSessionMeta({ testBrief: content });
    },
  }),

  updateSessionMeta: tool({
    description: "Update session metadata with key-value pairs",
    inputSchema: z.object({
      updates: z
        .record(z.string(), z.unknown())
        .describe("Metadata updates to apply"),
    }),
    execute: async ({ updates }) => {
      return await updateSessionMeta(updates);
    },
  }),

  getSessionMeta: tool({
    description: "Get current session metadata including test brief",
    inputSchema: z.object({}),
    execute: async () => {
      const filePath = join("public/session", "session_meta.json");

      try {
        const content = await readFile(filePath, "utf8");
        return {
          success: true,
          meta: JSON.parse(content),
        };
      } catch {
        return {
          success: true,
          meta: {},
        };
      }
    },
  }),
};

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY || "",
});

export const chromeAgent = new ToolLoopAgent({
  model: mistral("devstral-latest"),
  instructions,
  tools: { ...chromeTools, ...myTools },
});

export type ChromeAgentUIMessage = InferAgentUIMessage<typeof chromeAgent>;
