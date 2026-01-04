import { ToolLoopAgent, InferAgentUIMessage, tool } from "ai";
import { createMistral } from "@ai-sdk/mistral";
import { createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioClientTransport } from "@ai-sdk/mcp/mcp-stdio";
import { writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

const instructions = `
You are a web testing agent with Chrome DevTools.

- Be brief, save time and tokens

Your goal is: Ask for a vague test task -> visit the website only once -> Prepare a test brief document

# WORKFLOW
1. Speak with the User by chat
2. Ask for test task, example: "Visit https://www.saucedemo.com/ test if it is possible put the most expensive item into the basket."
3. Visit the entry point as health-check, serve a screenshot
  - (Don't navigate deeper, don't test anything right now)
4. Consider how to test the task, what you will need (password, human assistance, documentation link)
5. Write as file \`test_brief.md\` a *test brief document* that contains:
    - professional but still vague task description
    - acceptance criteria
    - supposed agent instruction
    - given passwords, links, ids (if any)
    - status (DRAFT, APPROVED, IN_TEST, INTERRUPTED, PASSED, FAILED)
6. Once the brief is approved by user, you have done

# Tools:
- When taking screenshots, always save them to the public/session/ directory.
- When writing a document, always save it to the public/session/ directory.

<test brief example>
# Mission Brief: Add Highest Priced Item

**Target URL:** https://www.saucedemo.com/
**Status:** DRAFT (Waiting for Approval)

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

const myTools = {
  saveDocument: tool({
    description: "Save a markdown document to the public/session directory",
    inputSchema: z.object({
      filename: z
        .string()
        .describe("The filename for the document (without .md extension)"),
      content: z.string().describe("The markdown content to save"),
    }),
    execute: async ({ filename, content }) => {
      // Ensure filename has .md extension
      const safeFilename = filename.endsWith(".md")
        ? filename
        : `${filename}.md`;
      const filePath = join("public/session", safeFilename);

      try {
        await writeFile(filePath, content, "utf8");
        return {
          success: true,
          message: `Document saved to ${filePath}`,
          path: filePath,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to save document: ${error}`,
          path: null,
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
