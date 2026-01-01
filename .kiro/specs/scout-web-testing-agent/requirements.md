# Requirements Document

## Introduction

Scout is a disposable, human-in-the-loop web testing agent designed for Product Managers. It translates vague testing intents into rigorous testing scenarios through active negotiation and immediate engagement with target websites.

## Glossary

- **Scout**: The web testing agent system
- **Planner**: The DeepSeek-R1 AI component via OpenRouter responsible for complex reasoning, plan generation, and decision-making
- **Executor**: The Qwen-2.5-72B-Instruct AI component via OpenRouter that executes browser actions, calls tools, and generates structured outputs based on plans
- **OpenRouter**: The model gateway providing access to multiple AI providers with fallback capabilities
- **Entry_Point**: The target URL provided by the user
- **Vague_Goal**: User's initial testing objective (e.g., "Check if I can buy a backpack")
- **Mission_Brief**: The negotiated and approved testing contract document
- **Acceptance_Criteria**: Specific success conditions for the test
- **Smoke_Test**: Initial validation that the entry point is accessible
- **Execution_Journal**: Retrospective log of actions taken during testing
- **MCP**: Model Context Protocol for browser automation
- **Session**: A complete testing workflow from initiation to reporting

## Status Definitions

- **DRAFT**: Mission brief created but awaiting user approval
- **APPROVED**: User has confirmed the mission brief and test can proceed
- **IN_PROGRESS**: Test execution is currently running
- **COMPLETED**: Test finished with definitive PASS/FAIL result
- **FAILED**: Test terminated due to technical error or inaccessible target
- **CANCELLED**: User terminated the session before completion

## Requirements

### Requirement 1: Immediate Entry Point Validation

As a Product Manager, I want Scout to immediately validate my target URL and provide instant feedback about site accessibility, capturing initial state through screenshots and accessibility trees while handling authentication and errors gracefully to maintain the illusion of instant engagement.

### Requirement 2: Scope Negotiation and Validation

As a Product Manager, I want Scout to transform my vague testing goals into specific, measurable criteria through conversational negotiation, generating Mission Brief documents that capture agreed-upon objectives and constraints while requiring explicit approval before execution to ensure perfect alignment with my intent.

### Requirement 3: Autonomous Test Execution

As a Product Manager, I want Scout to execute tests autonomously using Planner reasoning and Executor actions, building retrospective execution journals while pausing for human guidance when uncertain, handling errors gracefully, and making contextual decisions based on current screenshots and Mission Brief objectives.

### Requirement 4: Session Management and Persistence

As a Product Manager, I want Scout sessions to be completely isolated and disposable with unique session directories, local artifact storage, and complete cleanup capabilities that ensure no sensitive data persists between tests, enabling fresh starts without cross-contamination.

### Requirement 5: Comprehensive Test Reporting

As a Product Manager, I want clear, objective test reports with definitive PASS/FAIL results based on Acceptance Criteria, concise exploration summaries, final screenshots as evidence, and professional markdown formatting that focuses on facts over interpretation for easy consumption and sharing.

### Requirement 6: Browser Automation Integration

As a system administrator, I want Scout to integrate seamlessly with browser automation through chrome-devtools-mcp, executing raw MCP/CDP calls for maximum control, capturing comprehensive state information, handling browser-level errors with specific diagnostics, and communicating via STDIO for efficient, isolated operation.

### Requirement 7: User Interface and Experience

As a Product Manager, I want an intuitive split-screen interface that separates interaction from observation, enabling conversational testing through chat with the Planner, real-time context display through Live View showing execution progress and screenshots, and formatted documentation through Report tab rendering while maintaining a professional, helpful tone.

### Requirement 8: OpenRouter Planner-Executor Architecture with Mandatory Library Versions

As a system architect, I want Scout to use a cost-effective Planner-Executor hybrid pattern via OpenRouter with strict library version requirements: Next.js 16.1.1 (LTS) enforcing React 19, Turbopack, and async request APIs; LangGraph 1.0.7 using stable v1 StateGraph API (no legacy createReactAgent or AgentExecutor); Vercel AI SDK 6.0.5 with Agent Abstraction and Data Stream Protocol v2; React 19.0.0; Node.js 22.x (LTS); and LangChain OpenAI 1.2.0 for OpenRouter compatibility, with DeepSeek-R1 as the Planner for reasoning and plan generation, Qwen-2.5-72B-Instruct as the Executor for tool calling and action execution, LangGraph.js for orchestrating the multi-agent workflow, and environment-based model switching for flexibility while achieving 95% cost reduction compared to GPT-4o with SOTA reasoning performance.

## Real-World Example: SauceDemo Testing Scenario

This example demonstrates how Scout translates a vague user request into a structured mission brief using the SauceDemo testing sandbox.

### 1. The Vague User Request

**User:**

> "Go to `https://www.saucedemo.com/` using `standard_user` / `secret_sauce` and verify that I can add the most expensive item to the cart."

**Why it's vague:** The request doesn't define what "verify" means (UI check? Database validation? Cart page inspection?). It also requires logic to identify the "most expensive" item without specifying how to handle ties or sorting criteria.

### 2. Scout's Analysis Process

1. **Smoke Test:** Scout visits the URL and confirms the login page is accessible
2. **Requirement Analysis:** Identifies the need to sort/scan prices and define success criteria
3. **Scope Definition:** Since checkout wasn't mentioned, Scout focuses on cart badge as objective proof

### 3. Generated Mission Brief

Scout produces this contract for user approval:

```markdown
# Mission Brief: Add Highest Priced Item

**Target URL:** https://www.saucedemo.com/
**Status:** DRAFT (Waiting for Approval)

## 🎯 Mission Goal

Log in and objectively verify that the inventory system allows adding the most expensive product to the shopping cart.

## ⚙️ Configuration

- **Credentials:** Provided (`standard_user` / `secret_sauce`)
- **Constraint:** Must identify the item with the highest numerical price value on the inventory page

## ✅ Acceptance Criteria (The Contract)

The test is considered **PASSED** only if the following evidence is collected:

1. **Primary Indicator:** The shopping cart icon (top-right) updates to display the number `1`
2. **Secondary Indicator:** The button on the specific high-price item changes text from "Add to cart" to "Remove"

---

_Agent Note: I will scan the default inventory list to find the highest price. I will not proceed to the checkout page unless requested._
```

### 4. Why This Demonstrates Scout's Philosophy

- **Scope Narrowing:** Explicitly states it won't proceed to checkout, saving time and tokens
- **Logic Definition:** Transforms vague "most expensive" into specific "highest numerical price value"
- **Binary Success:** Cart badge is either '1' or it isn't - no ambiguity
- **User Control:** Requires approval before execution, ensuring alignment with user intent

This example shows how Scout's negotiation process transforms ambiguous requests into testable, measurable objectives while maintaining user control over the testing scope.
