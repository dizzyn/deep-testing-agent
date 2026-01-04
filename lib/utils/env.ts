/**
 * Environment variable validation and configuration
 */

export interface EnvironmentConfig {
  openrouter: {
    apiKey: string;
    plannerModel: string;
    executorModel: string;
  };
  nodeEnv: string;
}

/**
 * Validate and load environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const requiredVars = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL_PLANNER: process.env.OPENROUTER_MODEL_PLANNER,
    OPENROUTER_MODEL_EXECUTOR: process.env.OPENROUTER_MODEL_EXECUTOR,
  };

  // Check for missing required variables
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env.local file and ensure all OpenRouter configuration is set."
    );
  }

  return {
    openrouter: {
      apiKey: requiredVars.OPENROUTER_API_KEY!,
      plannerModel: requiredVars.OPENROUTER_MODEL_PLANNER!,
      executorModel: requiredVars.OPENROUTER_MODEL_EXECUTOR!,
    },
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

/**
 * Check if environment is properly configured
 */
export function validateEnvironment(): boolean {
  try {
    loadEnvironmentConfig();
    return true;
  } catch (error) {
    console.error("Environment validation failed:", error);
    return false;
  }
}
