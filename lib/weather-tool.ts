import { InferUITool } from "ai";
import { z } from "zod";

export const weatherTool = {
  description: "Get the current weather",
  inputSchema: z.object({
    location: z.string().describe("The city and state"),
  }),
  execute: async ({ location }: { location: string }) => {
    // Return structured weather data
    return {
      location,
      temperature: 72,
      condition: "sunny",
      humidity: 45,
    };
  },
};

export type WeatherUITool = InferUITool<typeof weatherTool>;
