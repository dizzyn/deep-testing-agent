import {
  generateText,
  ToolLoopAgent,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessageStreamWriter,
} from "ai";
import { createModelInstance } from "@/lib/model-factory";
import type { ModelConfiguration } from "@/lib/model-context";
import type { ModelId } from "@/lib/models";
import { createChromeTools } from "@/lib/chrome-tools";
import { agentTools } from "@/lib/agent-tools";

const THINKER_PROMPT = `
You are the Thinker agent.

Your name is "thinker"!!

YOU HAVE ONLY TWO RESPONSE OPTIONS:

1️⃣ TASK: <task description for Doer>
2️⃣ FINISH: <final answer for user>

RULES:
- Never provide information from your own knowledge
- Any query for external data (weather, time, API, web)
  MUST lead to TASK
- If you don't have a result from Doer yet, you CANNOT use FINISH
- You may only use FINISH if you have a result from Doer
- Never mention TASK, Doer, or internal steps

EXAMPLES:

User: What's the weather in Prague?
Response: TASK: get current weather in Prague

User: Hello
Response: FINISH: Hello! How can I help you?
`;

const DOER_PROMPT = `
You are the Doer agent.

Your task:
- execute the exact assigned task
- use available tools
- repeat tool calls until you have a result
- don't plan or evaluate
- return clean result or report failure
`;

const THINKER_SUMMARIZE_PROMPT = (doerResultStr: string) => `
RESULT FROM DOER:
${doerResultStr}

Use this data to create a FINISH response.
`;

async function runThinkerLoop(
  uiMessages: UIMessage[],
  modelConfiguration: ModelConfiguration,
  writer: UIMessageStreamWriter
): Promise<string> {
  const messages = await convertToModelMessages(uiMessages);

  let steps = 0;
  const MAX_STEPS = 10;

  // Get the thinker model from configuration
  const thinkerModelId: ModelId =
    (modelConfiguration.roleModels.thinker as ModelId) || "devstral-latest";
  const doerModelId: ModelId =
    (modelConfiguration.roleModels.doer as ModelId) || "devstral-latest";

  // Stream initial status
  writer.write({
    type: "data-message-thinker",
    data: {
      type: "thinker-status",
      message: "Thinker starting analysis...",
      step: 0,
    },
  });

  while (steps++ < MAX_STEPS) {
    // Stream thinker thinking status
    writer.write({
      type: "data-message-thinker",
      data: {
        type: "thinker-thinking",
        message: `Thinker step ${steps}/${MAX_STEPS}`,
        step: steps,
      },
    });

    const { text } = await generateText({
      model: createModelInstance(thinkerModelId),
      system: THINKER_PROMPT,
      messages,
    });

    const output = text.trim();

    // Stream thinker decision
    writer.write({
      type: "data-message-thinker",
      data: {
        type: "thinker-decision",
        decision: output.startsWith("TASK:")
          ? "TASK"
          : output.startsWith("FINISH:")
          ? "FINISH"
          : "UNKNOWN",
        content: output,
        step: steps,
      },
    });

    // 🧠 delegation
    if (output.startsWith("TASK:")) {
      const task = output.replace("TASK:", "").trim();

      // Stream task delegation
      writer.write({
        type: "data-message-thinker",
        data: {
          type: "task-delegation",
          task: task,
          step: steps,
        },
      });

      // Create Doer agent with Chrome tools
      const chromeTools = createChromeTools();
      const doerAgent = new ToolLoopAgent({
        model: createModelInstance(doerModelId),
        instructions: DOER_PROMPT,
        tools: chromeTools,
        stopWhen: stepCountIs(10),
      });

      // Stream doer start
      writer.write({
        type: "data-message-doer",
        data: {
          type: "doer-start",
          task: task,
          step: steps,
        },
      });

      const doerResult = await doerAgent.generate({
        prompt: task,
      });

      // Stream doer completion
      writer.write({
        type: "data-message-doer",
        data: {
          type: "doer-completion",
          result: doerResult.text,
          step: steps,
        },
      });

      messages.push({
        role: "system",
        content: THINKER_SUMMARIZE_PROMPT(
          JSON.stringify(doerResult.text, null, 2)
        ),
      });

      continue;
    }

    // ✅ finished response
    if (output.startsWith("FINISH:")) {
      const finalAnswer = output.replace("FINISH:", "").trim();

      // Stream completion status
      writer.write({
        type: "data-message-thinker",
        data: {
          type: "thinker-completion",
          message: "Thinker completed task",
          finalAnswer: finalAnswer,
          step: steps,
        },
      });

      return finalAnswer;
    }

    // Stream error for invalid response
    writer.write({
      type: "data-message-thinker",
      data: {
        type: "thinker-error",
        error: "Thinker violated contract (TASK | FINISH): " + output,
        step: steps,
      },
    });

    throw new Error("Thinker violated contract (TASK | FINISH): " + output);
  }

  // Stream max steps error
  writer.write({
    type: "data-message-thinker",
    data: {
      type: "thinker-error",
      error: "Thinker did not complete task in MAX_STEPS",
      step: steps,
    },
  });

  throw new Error("Thinker did not complete task in MAX_STEPS");
}

export async function executeThinkerDoerOrchestrator(
  messages: UIMessage[],
  modelConfiguration: ModelConfiguration
) {
  const uiStream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      try {
        // Run the Thinker-Doer loop with streaming
        const finalAnswer = await runThinkerLoop(
          messages,
          modelConfiguration,
          writer
        );

        // Write the response as a streaming text message
        writer.write({
          type: "text-start",
          id: "thinker-doer-response",
        });

        writer.write({
          type: "text-delta",
          id: "thinker-doer-response",
          delta: finalAnswer,
        });

        writer.write({
          type: "text-end",
          id: "thinker-doer-response",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        // Stream error data
        writer.write({
          type: "data-orchestrator-error",
          data: {
            type: "orchestrator-error",
            error: errorMessage,
          },
        });

        writer.write({
          type: "text-start",
          id: "thinker-doer-error",
        });

        writer.write({
          type: "text-delta",
          id: "thinker-doer-error",
          delta: `Error: ${errorMessage}`,
        });

        writer.write({
          type: "text-end",
          id: "thinker-doer-error",
        });
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: uiStream,
  });
}
