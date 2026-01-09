import {
  generateText,
  ToolLoopAgent,
  createUIMessageStreamResponse,
  convertToModelMessages,
  UIMessage,
  tool,
  stepCountIs,
} from "ai";
import { createModelInstance } from "@/lib/model-factory";
import { createUIMessageStream } from "ai";
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

async function runThinkerLoop(uiMessages: UIMessage[]): Promise<string> {
  const messages = await convertToModelMessages(uiMessages);

  let steps = 0;
  const MAX_STEPS = 10;

  while (steps++ < MAX_STEPS) {
    const { text } = await generateText({
      model: createModelInstance("devstral-latest"),
      system: THINKER_PROMPT,
      messages,
    });

    const output = text.trim();

    // 🧠 delegace
    if (output.startsWith("TASK:")) {
      const task = output.replace("TASK:", "").trim();

      // const doerResult = await runDoer(task, (str) => console.log("STR", str));
      const doerAgent = new ToolLoopAgent({
        model: createModelInstance("devstral-latest"),
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
        stopWhen: stepCountIs(10), // Default state: stop after 20 steps maximum
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

export async function POST(req: Request) {
  const { messages } = await req.json();
  const uiStream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      // 1️⃣ Thinker–Doer (offline)
      const finalAnswer = await runThinkerLoop(messages);

      writer.write({
        type: "text-start",
        id: "example-text",
      });

      // Write a message chunk
      writer.write({
        type: "text-delta",
        id: "example-text",
        delta: finalAnswer,
      });

      // End the text message
      writer.write({
        type: "text-end",
        id: "example-text",
      });
    },
  });

  return createUIMessageStreamResponse({ stream: uiStream });
}
