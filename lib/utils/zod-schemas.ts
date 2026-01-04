import { z } from "zod";

/**
 * Rigid Zod schema validation system for Scout web testing agent
 * Ensures type-safe tool calling and robust error handling
 */

// ============================================================================
// Core Browser Action Schemas
// ============================================================================

/**
 * Browser navigation schema
 */
export const NavigateSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  waitForLoad: z.boolean().default(true),
  timeout: z
    .number()
    .min(1000, "Timeout must be at least 1000ms")
    .max(30000, "Timeout cannot exceed 30000ms")
    .default(10000),
});

/**
 * Element interaction schemas
 */
export const ClickSchema = z.object({
  selector: z.string().min(1, "Selector cannot be empty"),
  waitForElement: z.boolean().default(true),
  timeout: z
    .number()
    .min(1000, "Timeout must be at least 1000ms")
    .max(10000, "Timeout cannot exceed 10000ms")
    .default(5000),
});

export const TypeSchema = z.object({
  selector: z.string().min(1, "Selector cannot be empty"),
  text: z.string(),
  clear: z.boolean().default(true),
  timeout: z
    .number()
    .min(1000, "Timeout must be at least 1000ms")
    .max(10000, "Timeout cannot exceed 10000ms")
    .default(5000),
});

export const WaitForElementSchema = z.object({
  selector: z.string().min(1, "Selector cannot be empty"),
  timeout: z
    .number()
    .min(1000, "Timeout must be at least 1000ms")
    .max(30000, "Timeout cannot exceed 30000ms")
    .default(10000),
  visible: z.boolean().default(true),
});

/**
 * Screenshot and capture schemas
 */
export const ScreenshotSchema = z.object({
  fullPage: z.boolean().default(true),
  quality: z
    .number()
    .min(0, "Quality must be at least 0")
    .max(100, "Quality cannot exceed 100")
    .default(90),
  format: z.enum(["png", "jpeg"]).default("png"),
});

export const GetElementTextSchema = z.object({
  selector: z.string().min(1, "Selector cannot be empty"),
  timeout: z
    .number()
    .min(1000, "Timeout must be at least 1000ms")
    .max(10000, "Timeout cannot exceed 10000ms")
    .default(5000),
});

export const GetPageInfoSchema = z.object({
  includeTitle: z.boolean().default(true),
  includeUrl: z.boolean().default(true),
  includeMetadata: z.boolean().default(false),
});

// ============================================================================
// Tool Response Schemas
// ============================================================================

/**
 * Standard tool response wrapper
 */
export const ToolResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
  executionTime: z.number().min(0, "Execution time cannot be negative"),
});

/**
 * Browser action result schemas
 */
export const NavigateResultSchema = ToolResponseSchema.extend({
  data: z
    .object({
      url: z.string().url(),
      title: z.string(),
      loadTime: z.number(),
    })
    .optional(),
});

export const ClickResultSchema = ToolResponseSchema.extend({
  data: z
    .object({
      selector: z.string(),
      elementFound: z.boolean(),
      clicked: z.boolean(),
    })
    .optional(),
});

export const TypeResultSchema = ToolResponseSchema.extend({
  data: z
    .object({
      selector: z.string(),
      textEntered: z.string(),
      success: z.boolean(),
    })
    .optional(),
});

export const ScreenshotResultSchema = ToolResponseSchema.extend({
  data: z
    .object({
      path: z.string(),
      size: z.object({
        width: z.number(),
        height: z.number(),
      }),
      format: z.string(),
    })
    .optional(),
});

// ============================================================================
// Planner Output Schemas
// ============================================================================

/**
 * Mission brief schema for Planner output
 */
export const MissionBriefSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  targetUrl: z.string().url("Must be a valid URL"),
  goal: z.string().min(10, "Goal must be descriptive"),
  acceptanceCriteria: z
    .array(z.string().min(5, "Each criterion must be descriptive"))
    .min(1),
  constraints: z.array(z.string()).default([]),
  estimatedSteps: z
    .number()
    .min(1, "Must have at least 1 step")
    .max(20, "Cannot exceed 20 steps"),
  status: z.enum([
    "DRAFT",
    "APPROVED",
    "IN_PROGRESS",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
  ]),
  createdAt: z.string().datetime(),
});

/**
 * Execution plan schema for Planner output
 */
export const ExecutionPlanSchema = z.object({
  id: z.string().uuid(),
  missionBriefId: z.string().uuid(),
  steps: z
    .array(
      z.object({
        id: z.string(),
        description: z.string().min(5, "Step description required"),
        action: z.enum([
          "navigate",
          "click",
          "type",
          "wait",
          "screenshot",
          "validate",
          "analyze",
        ]),
        parameters: z.record(z.string(), z.unknown()),
        expectedOutcome: z.string(),
        priority: z
          .enum(["critical", "important", "optional"])
          .default("important"),
      })
    )
    .min(1, "At least one step required"),
  currentStep: z.number().min(0, "Current step cannot be negative").default(0),
  status: z
    .enum(["pending", "executing", "paused", "completed", "failed"])
    .default("pending"),
  createdAt: z.string().datetime(),
});

/**
 * Planner reasoning output schema (for <think> tags)
 */
export const PlannerReasoningSchema = z.object({
  thoughts: z.string().min(10, "Reasoning must be substantive"),
  analysis: z.array(z.string()).default([]),
  decision: z.string().min(5, "Decision must be clear"),
  confidence: z
    .number()
    .min(0, "Confidence cannot be negative")
    .max(1, "Confidence cannot exceed 1"),
  nextAction: z.string().optional(),
});

// ============================================================================
// Executor Output Schemas
// ============================================================================

/**
 * Tool call schema for Executor output
 */
export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tool name required"),
  parameters: z.record(z.string(), z.unknown()),
  timestamp: z.string().datetime(),
});

/**
 * Executor action report schema
 */
export const ExecutorActionSchema = z.object({
  stepId: z.string(),
  action: z.string().min(1, "Action description required"),
  toolCalls: z.array(ToolCallSchema).default([]),
  results: z.array(ToolResponseSchema).default([]),
  screenshot: z.string().optional(), // Path to screenshot
  success: z.boolean(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
  executionTime: z.number().min(0, "Execution time cannot be negative"),
});

// ============================================================================
// Session and State Schemas
// ============================================================================

/**
 * Session schema for state management
 */
export const SessionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "paused", "completed", "failed", "cancelled"]),
  missionBrief: MissionBriefSchema.optional(),
  executionPlan: ExecutionPlanSchema.optional(),
  actions: z.array(ExecutorActionSchema).default([]),
  screenshots: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Type-safe validation with detailed error reporting
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
        return `${path}${err.message}`;
      });

      if (context) {
        errors.unshift(`Validation failed for ${context}`);
      }

      return { success: false, errors };
    }

    return {
      success: false,
      errors: [context ? `${context}: ${String(error)}` : String(error)],
    };
  }
}

/**
 * Fallback parsing with multiple attempts
 */
export function parseWithFallback<T>(
  primarySchema: z.ZodSchema<T>,
  fallbackSchemas: z.ZodSchema<T>[],
  data: unknown,
  context?: string
):
  | { success: true; data: T; schemaUsed: number }
  | { success: false; errors: string[] } {
  // Try primary schema first
  const primaryResult = validateWithSchema(primarySchema, data, context);
  if (primaryResult.success) {
    return { ...primaryResult, schemaUsed: 0 };
  }

  // Try fallback schemas
  for (let i = 0; i < fallbackSchemas.length; i++) {
    const fallbackResult = validateWithSchema(
      fallbackSchemas[i],
      data,
      context
    );
    if (fallbackResult.success) {
      return { ...fallbackResult, schemaUsed: i + 1 };
    }
  }

  // All schemas failed
  return { success: false, errors: primaryResult.errors };
}

/**
 * Safe JSON parsing with schema validation
 */
export function parseJsonWithSchema<T>(
  jsonString: string,
  schema: z.ZodSchema<T>,
  context?: string
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const parsed = JSON.parse(jsonString);
    return validateWithSchema(schema, parsed, context);
  } catch (error) {
    return {
      success: false,
      errors: [
        context ? `JSON parsing failed for ${context}` : "JSON parsing failed",
        error instanceof Error ? error.message : String(error),
      ],
    };
  }
}

/**
 * Generate JSON schema from Zod schema for tool definitions
 */
export function zodToJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
  // This is a simplified implementation
  // In production, you might want to use a library like zod-to-json-schema

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      if (value instanceof z.ZodString) {
        properties[key] = { type: "string" };
        if (!value.isOptional()) required.push(key);
      } else if (value instanceof z.ZodNumber) {
        properties[key] = { type: "number" };
        if (!value.isOptional()) required.push(key);
      } else if (value instanceof z.ZodBoolean) {
        properties[key] = { type: "boolean" };
        if (!value.isOptional()) required.push(key);
      } else if (value instanceof z.ZodArray) {
        properties[key] = { type: "array" };
        if (!value.isOptional()) required.push(key);
      } else {
        properties[key] = { type: "object" };
        if (!value.isOptional()) required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return { type: "object" };
}

// ============================================================================
// Tool Schema Registry
// ============================================================================

/**
 * Registry of all tool schemas for easy lookup
 */
export const TOOL_SCHEMAS = {
  // Browser actions
  navigate: NavigateSchema,
  click: ClickSchema,
  type: TypeSchema,
  waitForElement: WaitForElementSchema,
  screenshot: ScreenshotSchema,
  getElementText: GetElementTextSchema,
  getPageInfo: GetPageInfoSchema,

  // Results
  navigateResult: NavigateResultSchema,
  clickResult: ClickResultSchema,
  typeResult: TypeResultSchema,
  screenshotResult: ScreenshotResultSchema,

  // Planner outputs
  missionBrief: MissionBriefSchema,
  executionPlan: ExecutionPlanSchema,
  plannerReasoning: PlannerReasoningSchema,

  // Executor outputs
  toolCall: ToolCallSchema,
  executorAction: ExecutorActionSchema,

  // Session management
  session: SessionSchema,
} as const;

/**
 * Get schema by name with type safety
 */
export function getToolSchema(name: keyof typeof TOOL_SCHEMAS) {
  return TOOL_SCHEMAS[name];
}

// ============================================================================
// Type Exports
// ============================================================================

export type Navigate = z.infer<typeof NavigateSchema>;
export type Click = z.infer<typeof ClickSchema>;
export type Type = z.infer<typeof TypeSchema>;
export type Screenshot = z.infer<typeof ScreenshotSchema>;
export type MissionBrief = z.infer<typeof MissionBriefSchema>;
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;
export type ExecutorAction = z.infer<typeof ExecutorActionSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type ToolResponse = z.infer<typeof ToolResponseSchema>;
