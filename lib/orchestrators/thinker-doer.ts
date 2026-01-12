import {
  generateText,
  ToolLoopAgent,
  convertToModelMessages,
  type UIMessage,
  tool,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { createModelInstance } from "@/lib/model-factory";
import type { ModelConfiguration } from "@/lib/model-context";
import type { ModelId } from "@/lib/models";
import z from "zod";

const THINKER_PROMPT = `
Jsi Thinker agent.

Your name is "thinker"!!

MÁŠ POUZE DVĚ MOŽNOSTI ODPOVĚDI:

1️⃣ TASK: <popis úkolu pro Doera>
2️⃣ FINISH: <finální odpověď pro uživatele>

PRAVIDLA:
- Nikdy neposkytuj informace z vlastní znalosti
- Jakýkoli dotaz na externí data (počasí, čas, API, web)
  MUSÍ vést k TASK
- Pokud ještě nemáš výsledek od Doera, NESMÍŠ použít FINISH
- FINISH smíš použít pouze pokud máš výsledek od Doera
- Nikdy nezmiňuj TASK, Doera ani interní kroky

PŘÍKLADY:

Uživatel: Jaké je počasí v Praze?
Odpověď: TASK: zjisti aktuální počasí v Praze

Uživatel: Ahoj
Odpověď: FINISH: Ahoj! Jak ti mohu pomoct?
`;

const DOER_PROMPT = `
Jsi Doer agent.

Tvůj úkol:
- vykonat přesně zadaný úkol
- používat dostupné nástroje
- opakovat volání nástrojů, dokud nemáš výsledek
- neplánovat a nehodnotit
- vrátit čistý výsledek nebo reportovat selhání
`;

const THINKER_SUMMARIZE_PROMPT = (doerResultStr: string) => `
VÝSLEDEK OD DOERA:
${doerResultStr}

Použij tato data k vytvoření FINISH odpovědi.
`;

async function runThinkerLoop(
  uiMessages: UIMessage[],
  modelConfiguration: ModelConfiguration
): Promise<string> {
  const messages = await convertToModelMessages(uiMessages);

  let steps = 0;
  const MAX_STEPS = 10;

  // Get the thinker model from configuration
  const thinkerModelId: ModelId =
    (modelConfiguration.roleModels.thinker as ModelId) || "devstral-latest";
  const doerModelId: ModelId =
    (modelConfiguration.roleModels.doer as ModelId) || "devstral-latest";

  while (steps++ < MAX_STEPS) {
    const { text } = await generateText({
      model: createModelInstance(thinkerModelId),
      system: THINKER_PROMPT,
      messages,
    });

    const output = text.trim();

    // 🧠 delegace
    if (output.startsWith("TASK:")) {
      const task = output.replace("TASK:", "").trim();

      const doerAgent = new ToolLoopAgent({
        model: createModelInstance(doerModelId),
        instructions: DOER_PROMPT,
        tools: {
          weather: tool({
            description: "Get the weather in a location",
            inputSchema: z.object({
              location: z
                .string()
                .describe("The location to get the weather for"),
            }),
            execute: async ({ location }) => ({
              location,
              temperature: 99,
            }),
          }),
          joke: tool({
            description: "Get a joke for today",
            inputSchema: z.object(),
            execute: async () => ({
              joke: "No jokes today :)",
            }),
          }),
        },
        stopWhen: stepCountIs(10),
      });

      const doerResult = await doerAgent.generate({
        prompt: task,
      });

      console.log("doerResult", doerResult.text);

      messages.push({
        role: "system",
        content: THINKER_SUMMARIZE_PROMPT(
          JSON.stringify(doerResult.text, null, 2)
        ),
      });

      continue;
    }

    // ✅ hotová odpověď
    if (output.startsWith("FINISH:")) {
      return output.replace("FINISH:", "").trim();
    }

    throw new Error("Thinker porušil kontrakt (TASK | FINISH): " + output);
  }

  throw new Error("Thinker nedokončil úlohu v MAX_STEPS");
}

export async function executeThinkerDoerOrchestrator(
  messages: UIMessage[],
  modelConfiguration: ModelConfiguration,
  service: string
) {
  const uiStream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      try {
        // Run the Thinker-Doer loop
        const finalAnswer = await runThinkerLoop(messages, modelConfiguration);

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
