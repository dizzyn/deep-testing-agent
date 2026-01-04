/**
 * Scout LangGraph v1.0.7 StateGraph Implementation
 *
 * This module provides the core graph orchestration for the Scout web testing agent
 * using LangGraph's stable v1 StateGraph API.
 */

// Core graph and state exports
export {
  createScoutGraph,
  ScoutStateAnnotation,
  GraphUtils,
  type ScoutNodeFunction,
  type ScoutConditionalFunction,
} from "./scout-graph.js";

// State management exports
export {
  type ScoutState,
  type MissionBrief,
  type Action,
  type ExecutionPlan,
  type ExecutionContext,
  createInitialState,
  StateUpdaters,
} from "./state.js";

// Session management exports
export {
  SessionManager,
  defaultSessionManager,
  SessionUtils,
} from "./session-manager.js";

// Import for convenience function
import { createScoutGraph, GraphUtils } from "./scout-graph.js";
import { defaultSessionManager } from "./session-manager.js";

/**
 * Convenience function to create a new Scout graph instance
 */
export function createScoutInstance() {
  const graph = createScoutGraph();
  return {
    graph,
    utils: GraphUtils,
    sessionManager: defaultSessionManager,
  };
}
