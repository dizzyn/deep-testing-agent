import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Environment variables
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL_PLANNER: process.env.OPENROUTER_MODEL_PLANNER,
    OPENROUTER_MODEL_EXECUTOR: process.env.OPENROUTER_MODEL_EXECUTOR,
  },
};

export default nextConfig;
