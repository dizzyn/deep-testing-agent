# Scout POC Design

## Mandatory Library Versions (Strict Pinning)

All implementations must use these exact stable releases:

- **Next.js:** `16.1.1` (LTS) - Enforce usage of React 19, Turbopack, and async request APIs (e.g., `await params`)
- **LangGraph:** `1.0.7` - Use the stable v1 `StateGraph` API. Do not use legacy `createReactAgent` or `AgentExecutor`
- **Vercel AI SDK:** `6.0.5` - Use the "Agent Abstraction" and Data Stream Protocol v2
- **React:** `19.0.0`
- **Node.js:** `22.x` (LTS)
- **LangChain OpenAI:** `1.2.0` (for OpenRouter compatibility)

## Tech Stack

- **TypeScript**, Next.js 16.1.1, LangGraph.js 1.0.7, Tailwind CSS, Chrome Dev Tools MCP
- **OpenRouter** as model gateway with DeepSeek-R1 (Planner) and Qwen-2.5-72B-Instruct (Executor)
- **Vercel AI SDK 6.0.5** with Agent Abstraction and Data Stream Protocol v2
- **No Database** - local file system storage

## Strategic Architecture: Planner-Executor Hybrid Pattern

Scout implements the **"Planner-Executor" Hybrid Pattern** that optimizes for cost (~95% cheaper than GPT-4o), speed (fast inference), and performance (SOTA reasoning):

### Agent Roles

1. **Agent A (Planner/Thinker) - DeepSeek-R1**

   - **Responsibility**: Complex reasoning, plan decomposition, decision-making
   - **Model**: DeepSeek-R1 via OpenRouter
   - **Capabilities**: Generates step-by-step execution plans, analyzes user requests, creates mission briefs
   - **No Tool Calling**: Pure reasoning agent that outputs structured plans but does NOT call tools
   - **Streaming Support**: UI must handle DeepSeek's "thinking" phase transparently using AI SDK `useChat` hook

2. **Agent B (Executor/Doer) - Qwen-2.5-72B-Instruct**
   - **Responsibility**: Action execution, tool calling, structured output generation
   - **Model**: Qwen-2.5-72B-Instruct via OpenRouter
   - **Capabilities**: Browser automation, API calls, JSON generation with rigid Zod schema validation
   - **Tool Integration**: Uses LangChain's `.bind_tools()` method with fallback parsing logic for robustness
   - **Reliability**: Rigid Zod schema validation ensures tool reliability

### OpenRouter Gateway Integration

- **Gateway Configuration**: Use **OpenRouter exclusively** to abstract model providers
- **Environment Variables**: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL_PLANNER`, `OPENROUTER_MODEL_EXECUTOR` for runtime switching
- **Fallback Strategy**: Configurable fallback models for high availability during provider congestion
- **Cost Optimization**: Automatic routing to lowest-cost providers while maintaining performance

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                Next.js Application                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ CHAT MODE   │  │ TEST MODE   │  │ RESULT MODE │  │
│  │ Interactive │  │ Autonomous  │  │ Report      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │         LangGraph.js Orchestrator               │ │
│  │  StateGraph: messages | plan | current_step    │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────┐
│                 OpenRouter Gateway                  │
│  Environment: OPENROUTER_MODEL_PLANNER/EXECUTOR    │
└─────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Planner   │───▶│  Executor   │───▶│   Browser   │
│ DeepSeek-R1 │    │ Qwen-2.5-72B│    │    (MCP)    │
│ (Reasoning) │    │(Tool Calls) │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│              Local File System                      │
│  • /tmp/scout-sessions/  • screenshots/  • logs/   │
└─────────────────────────────────────────────────────┘
```

### LangGraph.js State Management (v1.0.7 StateGraph API)

```typescript
interface ScoutState {
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
```

### Graph Flow: Start → Planner → Executor → End (v1 StateGraph)

1. **Start Node**: Initialize session and capture user request
2. **Planner Node**: DeepSeek-R1 analyzes request and generates execution plan (NO tool calls)
3. **Executor Node**: Qwen-2.5-72B executes plan steps with `.bind_tools()` method and rigid Zod validation
4. **Self-Correction Node**: Validates JSON outputs with fallback parsing, retries on errors
5. **End Node**: Compile results and generate final report

**Loop Conditions**:

- Executor can loop back to Planner for re-planning
- Self-correction loops on invalid JSON/tool outputs with fallback parsing logic
- Human-in-the-loop pauses can interrupt any node

## User Interface Design

### UI Modes

The interface operates in three distinct modes, inspired by Gemini Deep Research:

#### 1. CHAT MODE (Interactive)

- **Purpose**: User-agent conversation and negotiation
- **Features**:
  - Standard chat interface with input field and message history
  - User can type messages and receive agent responses
  - Mission brief displayed as formatted markdown snippet (special design)
  - User can approve/reject/modify mission briefs
- **State**: User has full control, can interrupt or redirect

#### 2. TEST MODE (Autonomous)

- **Purpose**: Agent executes testing autonomously with LangGraph v1.0.7 StateGraph orchestration
- **Features**:
  - User cannot send chat messages (input disabled)
  - **Planner Reasoning Visualization**: Parse and display DeepSeek-R1's `<think>` tags in collapsible UI elements for transparency
  - **Streaming Support**: UI must support streaming responses using AI SDK `useChat` hook to handle DeepSeek's "thinking" phase transparently
  - Real-time display of Executor actions and tool calls with `.bind_tools()` method
  - Live screenshots from browser as Executor navigates
  - Action log showing current step in execution plan
  - "STOP" button to interrupt LangGraph execution
- **State**: LangGraph has control, user observes Planner reasoning and Executor actions

#### 3. RESULT MODE (Report Display)

- **Purpose**: Present final test results
- **Features**:
  - Formatted markdown report in chat stream
  - PASS/FAIL determination with evidence
  - Final screenshots and summary
  - Option to start new test or modify current one
- **State**: Static display, user can initiate new workflow

### User Workflow (Gemini Deep Research Inspired)

```
1. User Input (CHAT MODE)
   ↓
2. Agent Questions/Clarification (CHAT MODE)
   ↓
3. Site Visit & Analysis (TEST MODE)
   ↓
4. Mission Brief Proposal (CHAT MODE - special markdown)
   ↓
5. User Approval/Modification (CHAT MODE)
   ↓
6. Test Execution (TEST MODE)
   ↓ (if guidance needed)
7. Human-in-the-Loop (CHAT MODE - suspended testing)
   ↓
8. Final Results (RESULT MODE in chat)
```

### Detailed Workflow Steps

1. **Initial Request (CHAT MODE)**

   - User describes entry point URL and test goal
   - Standard chat interface, user types freely

2. **Clarification Phase (CHAT MODE)**

   - Planner (DeepSeek-R1) asks questions if goal is vague
   - OR Planner directly proceeds to site visit if clear

3. **Initial Site Analysis (TEST MODE)**

   - UI switches to TEST MODE automatically
   - User sees: "Planner analyzing site requirements..."
   - **Planner Reasoning Display**: DeepSeek-R1's `<think>` tags shown in collapsible sections
   - Executor takes screenshots and gathers initial context
   - User can observe Planner reasoning and Executor actions, or click STOP

4. **Mission Brief Presentation (CHAT MODE)**

   - UI returns to CHAT MODE
   - Mission brief appears as special markdown snippet (generated by Planner)
   - Different visual design from regular chat messages
   - Clear approve/reject buttons or text commands

5. **Mission Brief Negotiation (CHAT MODE)**

   - User can request changes to mission brief
   - Planner modifies and re-presents via LangGraph state updates
   - Continues until user explicitly approves

6. **Test Execution (TEST MODE)**

   - UI switches to TEST MODE again
   - **Planner Reasoning**: "Analyzing current step...", "Determining next action..."
   - **Executor Actions**: "Clicking login button", "Typing username", "Capturing screenshot"
   - Live screenshots showing browser state
   - Progress indicator showing current step in execution plan

7. **Human-in-the-Loop Interruptions (CHAT MODE)**

   - If Planner needs guidance: LangGraph pauses, UI switches back to CHAT MODE
   - Planner asks: "I need the password for..." or "Should I proceed to checkout?"
   - User responds, LangGraph resumes, UI returns to TEST MODE
   - Testing continues from current state

8. **Final Results (RESULT MODE)**
   - Formatted markdown report appears in chat (generated by Planner)
   - Clear PASS/FAIL with evidence screenshots (captured by Executor)
   - Professional formatting for easy sharing
   - Options to start new test or export results

## Core Components

### Next.js App Router Structure (v16.1.1 with React 19)

```
app/
├── page.tsx                 # Main UI with three modes + LangGraph v1.0.7 integration
├── api/
│   ├── chat/route.ts       # Server Action for chat messages with async request APIs
│   ├── graph/route.ts      # LangGraph v1.0.7 StateGraph execution endpoint
│   └── stream/route.ts     # SSE endpoint for real-time updates with AI SDK 6.0.5
├── components/
│   ├── ChatMode.tsx        # Chat interface component with AI SDK useChat hook
│   ├── TestMode.tsx        # Real-time test monitoring with Planner reasoning streaming
│   ├── ResultMode.tsx      # Report display
│   ├── MissionBrief.tsx    # Special markdown component
│   └── PlannerThoughts.tsx # DeepSeek-R1 <think> tag visualization with streaming
└── lib/
    ├── graph/
    │   ├── scout-graph.ts  # LangGraph.js v1.0.7 StateGraph definition (no legacy APIs)
    │   ├── nodes/
    │   │   ├── planner.ts  # DeepSeek-R1 planner node (NO tool calling)
    │   │   ├── executor.ts # Qwen-2.5-72B executor node with .bind_tools()
    │   │   └── correction.ts # Self-correction node with fallback parsing
    │   └── state.ts        # ScoutState interface and management
    ├── openrouter/
    │   ├── client.ts       # OpenRouter client with OPENROUTER_API_KEY
    │   └── models.ts       # Model definitions and fallback logic
    ├── mcp/
    │   └── browser.ts      # Chrome DevTools MCP integration with rigid Zod validation
    └── utils/
        ├── session.ts      # Session management
        ├── streaming.ts    # SSE utilities with AI SDK 6.0.5 Data Stream Protocol v2
        └── zod-schemas.ts  # Rigid tool input validation schemas
```

### LangGraph.js Integration (v1.0.7 StateGraph API)

- **StateGraph Definition**: Central orchestrator managing Planner-Executor workflow using stable v1 API
- **Node Implementation**: Separate nodes for planning (no tools), execution (with .bind_tools()), and self-correction
- **State Persistence**: Maintains conversation context and execution progress
- **Error Recovery**: Self-correction node handles invalid JSON with fallback parsing logic
- **Streaming Integration**: Real-time updates via SSE during graph execution with AI SDK 6.0.5

### OpenRouter Client Configuration

- **Base URL**: Single endpoint configuration for all model access via OpenRouter exclusively
- **Environment Variables**: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL_PLANNER`, `OPENROUTER_MODEL_EXECUTOR` for runtime switching
- **Fallback Logic**: Automatic failover during provider congestion
- **Cost Optimization**: Route to lowest-cost providers while maintaining performance
- **API Key Management**: Secure credential handling for OpenRouter access

### Rigid Zod Schema Validation

- **Tool Input Validation**: Type-safe tool calling with automatic error detection for reliability
- **JSON Schema Generation**: Automatic schema generation for tool parameters
- **Runtime Validation**: Catch invalid inputs before tool execution
- **Error Messages**: Descriptive validation errors for debugging
- **Self-Correction Integration**: Feed validation errors back to Executor with fallback parsing for retry

### Planner Node (DeepSeek-R1) - NO Tool Calling

- **Input**: User goal + current screenshot + LangGraph state
- **Output**: Structured execution plan + mission brief + reasoning (`<think>` tags)
- **Model**: DeepSeek-R1 via OpenRouter
- **Implementation**: lib/graph/nodes/planner.ts
- **State Management**: Updates LangGraph state with plans and decisions
- **CRITICAL**: NO Tool Calling - Pure reasoning agent focused on planning and analysis only

### Executor Node (Qwen-2.5-72B-Instruct) - Tool Calling Only

- **Input**: Execution plan + current browser state + tool definitions
- **Output**: Browser commands + structured JSON + action reports
- **Model**: Qwen-2.5-72B-Instruct via OpenRouter
- **Implementation**: lib/graph/nodes/executor.ts
- **Tool Integration**: Uses LangChain's `.bind_tools()` method with rigid Zod validation for robustness
- **State Updates**: Captures screenshots and updates execution progress

### Self-Correction Node with Fallback Parsing

- **Input**: Tool execution results + validation errors
- **Output**: Corrected JSON + retry commands + error reports
- **Purpose**: Handle invalid JSON outputs and tool failures with fallback parsing logic
- **Implementation**: lib/graph/nodes/correction.ts
- **Integration**: Feeds errors back to Executor for automatic retry with robust error handling
- **Validation**: Uses rigid Zod schemas for type-safe error detection

### Session Manager

- **Storage:** `/tmp/scout-{uuid}/`
- **Implementation:** Next.js lib/utils/session.ts
- **Cleanup:** Auto-delete on exit
- **Artifacts:** Screenshots, logs, mission brief
- **Integration:** Provides data for all UI modes via Server Actions

## Data Flow

1. **User Input (CHAT)** → LangGraph Start Node → Planner Node → **Questions OR Site Visit Plan**
2. **Site Visit (TEST)** → Executor Node → **SSE Stream** → **Screenshots + Analysis** → Planner Node → **Mission Brief**
3. **Mission Brief (CHAT)** → User Approval → LangGraph State Update → **Test Execution Plan**
4. **Test Execution (TEST)** → Executor Node → **Tool Calls + SSE Stream** → **Actions + Screenshots** → **Results**
5. **Human-in-Loop (CHAT)** → LangGraph Pause → User Guidance → **Resume Execution (TEST)**
6. **Final Results (RESULT)** → Planner Node → **Formatted Report Generation**

### LangGraph State Transitions

```
START → PLANNER → EXECUTOR → SELF_CORRECTION → END
  ↑         ↓         ↓            ↓
  └─────────┴─────────┴────────────┘
     (Human-in-the-loop interruptions)
```

## Next.js Technical Implementation

### Frontend Stack (Next.js 16.1.1 + React 19)

- **Framework**: Next.js 16.1.1 (LTS) with App Router and async request APIs
- **React**: 19.0.0 with enhanced concurrent features
- **Styling**: Tailwind CSS for responsive design
- **State Management**: LangGraph.js v1.0.7 StateGraph + React Context
- **Real-time Updates**: Server-Sent Events (SSE) via EventSource with AI SDK 6.0.5 Data Stream Protocol v2
- **Markdown**: react-markdown for mission briefs and reports
- **Planner Visualization**: Custom component for DeepSeek-R1 `<think>` tag parsing with streaming support
- **AI Integration**: Vercel AI SDK 6.0.5 with Agent Abstraction and `useChat` hook for streaming

### Server Integration

- **LangGraph Execution**: Handle v1.0.7 StateGraph orchestration via API routes with async request APIs
- **SSE Endpoints**: Stream Planner reasoning and Executor actions with AI SDK 6.0.5
- **OpenRouter Integration**: Centralized model access with `OPENROUTER_API_KEY` and fallback logic
- **File System**: Local storage for session data and screenshots
- **Rigid Validation**: Zod schema validation for type-safe tool input validation and error handling

### Key Next.js Features Used (v16.1.1)

- **API Routes**: LangGraph v1.0.7 StateGraph execution and OpenRouter integration with async request APIs
- **Streaming**: SSE for real-time Planner reasoning and Executor updates using AI SDK 6.0.5
- **Server Components**: Optimized rendering for chat and reports with React 19
- **Tailwind CSS**: Utility-first styling with custom components for `<think>` tags
- **Environment Variables**: Runtime model switching via `OPENROUTER_MODEL_PLANNER`, `OPENROUTER_MODEL_EXECUTOR`
- **Turbopack**: Enhanced build performance and development experience

## POC Scope

### Included

- Single-page testing only
- Basic form interactions (click, type, submit)
- Screenshot-based validation
- Simple mission brief generation
- Local file storage

### Excluded

- Multi-page workflows
- Complex authentication flows
- Database validation
- Performance testing
- Advanced error recovery

## Technical Stack

- **Framework**: Next.js 16.1.1 (LTS) with App Router and React 19.0.0
- **Orchestration**: LangGraph.js 1.0.7 for Planner-Executor workflow using stable v1 StateGraph API
- **AI Models**: DeepSeek-R1 (Planner) + Qwen-2.5-72B-Instruct (Executor) via OpenRouter exclusively
- **AI SDK**: Vercel AI SDK 6.0.5 with Agent Abstraction and Data Stream Protocol v2
- **Styling**: Tailwind CSS with custom components for reasoning visualization
- **Runtime**: Node.js 22.x (LTS) with TypeScript
- **Browser**: Chrome via chrome-devtools-mcp
- **Validation**: Rigid Zod schemas for type-safe tool calling with fallback parsing
- **Storage**: Local filesystem with session isolation
- **Streaming**: Server-Sent Events (SSE) for real-time updates with AI SDK streaming support
- **Interface**: Next.js web app with three distinct modes (CHAT/TEST/RESULT)
- **LangChain**: LangChain OpenAI 1.2.0 for OpenRouter compatibility with `.bind_tools()` method

## Session Structure

```
/tmp/scout-{uuid}/
├── mission_brief.md
├── execution_journal.md
├── final_report.md
└── screenshots/
    ├── initial.png
    ├── step_001.png
    └── final.png
```

## Implementation Priority

1. **Core Loop:** URL → Screenshot → Mission Brief → Approval
2. **Basic Actions:** Navigate, click, type, screenshot
3. **Simple Validation:** Element presence, text content
4. **Report Generation:** PASS/FAIL with evidence

## Success Criteria

POC demonstrates:

- Vague goal → Specific mission brief
- Autonomous browser interaction
- Objective PASS/FAIL determination
- Clean session isolation
