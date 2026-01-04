/**
 * Core type definitions for Scout Web Testing Agent
 */

export interface ScoutState {
  messages: Array<{ role: string; content: string }>;
  plan: {
    steps: string[];
    current_step: number;
    status: "planning" | "executing" | "paused" | "complete";
  };
  session_id: string;
  mission_brief?: MissionBrief;
  execution_context: {
    screenshots: string[];
    actions_taken: Action[];
    current_url: string;
  };
}

export interface MissionBrief {
  id: string;
  target_url: string;
  goal: string;
  acceptance_criteria: string[];
  status:
    | "DRAFT"
    | "APPROVED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
  created_at: string;
  approved_at?: string;
}

export interface Action {
  id: string;
  type: "navigate" | "click" | "type" | "screenshot" | "wait";
  target?: string;
  value?: string;
  timestamp: string;
  result: "success" | "error";
  error_message?: string;
}

export interface TestResult {
  session_id: string;
  mission_brief: MissionBrief;
  result: "PASS" | "FAIL";
  evidence: {
    screenshots: string[];
    actions_taken: Action[];
    final_url: string;
  };
  summary: string;
  completed_at: string;
}

export type UIMode = "CHAT" | "TEST" | "RESULT";

export interface SessionConfig {
  session_id: string;
  storage_path: string;
  cleanup_on_exit: boolean;
}
