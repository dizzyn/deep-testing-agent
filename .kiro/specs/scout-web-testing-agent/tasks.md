# Implementation Plan: Scout Web Testing Agent POC

## Overview

This POC demonstrates a sophisticated Planner-Executor architecture using **mandatory library versions**:

- **Next.js 16.1.1 (LTS)** with React 19, Turbopack, and async request APIs
- **LangGraph 1.0.7** with stable v1 StateGraph API (no legacy createReactAgent/AgentExecutor)
- **Vercel AI SDK 6.0.5** with Agent Abstraction and Data Stream Protocol v2
- **React 19.0.0** with enhanced concurrent features
- **Node.js 22.x (LTS)** for optimal performance
- **LangChain OpenAI 1.2.0** for OpenRouter compatibility

**Architecture**: Planner-Executor Hybrid Pattern with OpenRouter gateway:

1. **CHAT MODE**: Interactive conversation and mission brief negotiation
2. **TEST MODE**: Autonomous testing with real-time Planner reasoning and Executor actions
3. **RESULT MODE**: Formatted test results and reports

Built with OpenRouter integration for cost-effective AI model access (95% cheaper than GPT-4o) using DeepSeek-R1 for planning (no tools) and Qwen-2.5-72B-Instruct for execution (with .bind_tools()).

## Tasks

- [ ] 1. Next.js 16.1.1 Project Setup with Mandatory Library Versions

  - Initialize Next.js 16.1.1 (LTS) project with App Router, React 19, and TypeScript
  - Install exact dependencies: @langchain/openai@1.2.0, @langchain/langgraph@1.0.7, ai@6.0.5, chrome-devtools-mcp, tailwindcss, zod
  - Configure OpenRouter client with environment variables (OPENROUTER_API_KEY, OPENROUTER_MODEL_PLANNER, OPENROUTER_MODEL_EXECUTOR)
  - Set up basic project structure with lib/openrouter/ directory
  - Enable Turbopack and async request APIs (await params)
  - _Requirements: 8.1_

- [ ] 2. OpenRouter Gateway and Rigid Zod Validation

  - [ ] 2.1 Create OpenRouter gateway configuration

    - Set up lib/openrouter/client.ts with OPENROUTER_API_KEY and baseURL configuration
    - Implement environment-based model switching (OPENROUTER_MODEL_PLANNER, OPENROUTER_MODEL_EXECUTOR)
    - Add fallback model logic for high availability during provider congestion
    - Create lib/openrouter/models.ts with DeepSeek-R1 and Qwen-2.5-72B definitions
    - Use OpenRouter exclusively to abstract model providers
    - _Requirements: 8.1_

  - [ ] 2.2 Build rigid Zod schema validation system
    - Create lib/utils/zod-schemas.ts for rigid tool input validation
    - Implement type-safe JSON generation and validation for reliability
    - Add fallback parsing logic for robust error handling
    - Set up automatic schema generation for tool parameters
    - Ensure rigid validation for Executor tool calling reliability
    - _Requirements: 6.1_

- [ ] 3. LangGraph.js v1.0.7 StateGraph Implementation

  - [ ] 3.1 Create v1.0.7 StateGraph definition

    - Build lib/graph/scout-graph.ts with stable v1 StateGraph API (no legacy createReactAgent/AgentExecutor)
    - Define ScoutState interface in lib/graph/state.ts
    - Implement channels for messages, plan, and current_step tracking
    - Add state persistence and management utilities
    - _Requirements: 8.1_

  - [ ] 3.2 Implement Planner Node (DeepSeek-R1) - NO Tool Calling

    - Create lib/graph/nodes/planner.ts with DeepSeek-R1 integration via OpenRouter
    - Build prompt specialized for creating execution plans and mission briefs
    - Implement reasoning output with `<think>` tag parsing for transparency
    - Add state updates for plan generation and decision-making
    - CRITICAL: Ensure NO tool calling - pure reasoning agent only
    - _Requirements: 2.1, 3.1_

  - [ ] 3.3 Build Executor Node (Qwen-2.5-72B-Instruct) - Tool Calling with .bind_tools()
    - Create lib/graph/nodes/executor.ts with Qwen-2.5 integration via OpenRouter
    - Implement LangChain's `.bind_tools()` method for tool calling with fallback parsing logic
    - Add browser automation with MCP integration and rigid Zod validation
    - Build action execution with screenshot capture
    - Ensure robustness with fallback parsing for tool reliability
    - _Requirements: 3.1, 6.1_

- [ ] 4. Self-Correction with Fallback Parsing and MCP Integration

  - [ ] 4.1 Create Self-Correction Node with fallback parsing

    - Build lib/graph/nodes/correction.ts for JSON validation with fallback parsing logic
    - Implement automatic retry logic for invalid outputs with robust error handling
    - Add rigid Zod schema validation integration for reliability
    - Create error feedback loop to Executor for correction with fallback parsing
    - _Requirements: 6.1_

  - [ ] 4.2 Build MCP browser integration with rigid validation
    - Set up lib/mcp/browser.ts with chrome-devtools-mcp
    - Implement browser launch, navigation, and screenshot capture
    - Add rigid Zod validation for all MCP tool inputs to ensure reliability
    - Create error handling for browser-level failures with fallback logic
    - _Requirements: 6.1_

- [ ] 5. Next.js 16.1.1 UI with AI SDK 6.0.5 Streaming

  - [ ] 5.1 Create main page layout with LangGraph v1.0.7 integration

    - Build app/page.tsx with React 19 Context for mode switching
    - Implement CHAT/TEST/RESULT mode components with async request APIs
    - Add LangGraph v1.0.7 StateGraph execution integration via API routes
    - Style with Tailwind CSS for responsive design
    - Enable Turbopack for enhanced development experience
    - _Requirements: 7.1_

  - [ ] 5.2 Implement CHAT MODE interface with AI SDK 6.0.5

    - Create components/ChatMode.tsx with AI SDK useChat hook for streaming
    - Add API route for chat message handling with async request APIs (app/api/chat/route.ts)
    - Build mission brief component with special styling
    - Add approve/reject buttons for mission briefs
    - Support streaming responses to handle DeepSeek's "thinking" phase transparently
    - _Requirements: 7.1, 2.1_

  - [ ] 5.3 Build TEST MODE with Planner reasoning streaming visualization
    - Create components/TestMode.tsx for real-time monitoring with AI SDK 6.0.5
    - Build components/PlannerThoughts.tsx for `<think>` tag parsing and streaming display
    - Implement collapsible UI elements for DeepSeek-R1 reasoning transparency
    - Add real-time Executor action display with screenshots using Data Stream Protocol v2
    - Include STOP button for LangGraph interruption
    - Support streaming to handle DeepSeek's "thinking" phase transparently
    - _Requirements: 7.1_

- [ ] 6. LangGraph v1.0.7 Orchestrator and AI SDK 6.0.5 Streaming

  - [ ] 6.1 Create LangGraph v1.0.7 StateGraph execution API

    - Build app/api/graph/route.ts for LangGraph v1.0.7 StateGraph orchestration with async request APIs
    - Implement Start → Planner (no tools) → Executor (.bind_tools()) → End workflow
    - Add loop handling for multiple tool calls and re-planning
    - Create human-in-the-loop pause/resume functionality
    - _Requirements: 3.1, 8.1_

  - [ ] 6.2 Build SSE streaming system with AI SDK 6.0.5

    - Create app/api/stream/route.ts for real-time updates with Data Stream Protocol v2
    - Implement Planner reasoning streaming (`<think>` tags) for transparency
    - Add Executor action streaming with screenshots
    - Build progress tracking for current execution step
    - Support streaming to handle DeepSeek's "thinking" phase transparently
    - _Requirements: 7.1_

  - [ ] 6.3 Add session management with LangGraph v1.0.7 state
    - Create lib/utils/session.ts for session handling
    - Implement local file storage for screenshots and logs
    - Add LangGraph v1.0.7 StateGraph state persistence across interruptions
    - Build session cleanup and isolation
    - _Requirements: 4.1_

- [ ] 7. Complete User Experience Integration

  - [ ] 7.1 Implement RESULT MODE

    - Create components/ResultMode.tsx for report display
    - Add PASS/FAIL determination with evidence (generated by Planner)
    - Include final screenshots and formatted summary
    - Add options for new tests and export functionality
    - _Requirements: 5.1_

  - [ ] 7.2 Add human-in-the-loop features

    - Implement LangGraph pause/resume via state management
    - Add password/credential request handling in CHAT MODE
    - Create mission brief modification workflow
    - Handle seamless mode transitions for guidance requests
    - _Requirements: 2.1, 3.1_

  - [ ] 7.3 Polish UI and streaming experience
    - Add Tailwind loading states and smooth transitions
    - Implement proper error handling and recovery
    - Add visual indicators for current LangGraph node and progress
    - Optimize SSE connection management and reconnection
    - _Requirements: 7.1_

- [ ] 8. Integration Demo with Mandatory Library Versions
  - [ ] 8.1 Create end-to-end SauceDemo demo with strict version compliance
    - Demonstrate complete Planner-Executor workflow with SauceDemo testing using exact library versions
    - Show all three UI modes and LangGraph v1.0.7 StateGraph transitions
    - Test human-in-the-loop interruptions and resume functionality
    - Validate mission brief negotiation process with DeepSeek-R1 reasoning transparency
    - Verify cost optimization and model switching capabilities via OpenRouter
    - Confirm streaming support for DeepSeek's "thinking" phase using AI SDK 6.0.5
    - Test rigid Zod validation and fallback parsing logic for robustness
    - _Requirements: All_

## Notes

- **Mandatory Library Versions**: Strict pinning to Next.js 16.1.1, LangGraph 1.0.7, AI SDK 6.0.5, React 19.0.0, Node.js 22.x, LangChain OpenAI 1.2.0
- **OpenRouter Gateway**: Use OpenRouter exclusively with OPENROUTER_API_KEY for all model access
- **Planner-Executor Pattern**: DeepSeek-R1 for reasoning (NO tools), Qwen-2.5-72B for execution (with .bind_tools())
- **LangGraph.js v1.0.7**: Stable v1 StateGraph API orchestrates multi-agent workflow (no legacy APIs)
- **Environment Variables**: OPENROUTER_API_KEY, OPENROUTER_MODEL_PLANNER, OPENROUTER_MODEL_EXECUTOR for runtime switching
- **Rigid Zod Validation**: Type-safe tool calling with fallback parsing logic for reliability
- **AI SDK 6.0.5 Streaming**: Real-time Planner reasoning and Executor action updates with Data Stream Protocol v2
- **Tailwind CSS**: Custom components for `<think>` tag visualization with streaming support
- **File System**: Local storage for session data and screenshots
- **Self-Correction**: Automatic retry logic with fallback parsing for invalid JSON outputs
- **Turbopack**: Enhanced build performance and development experience with Next.js 16.1.1
