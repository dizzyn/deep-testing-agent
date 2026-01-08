# Web App Testing Agent

AI-powered testing agent that automates web application testing through natural language commands.

## Quick Start

```bash
pnpm install
cd chrome-devtools-mcp && pnpm build
cp .env.example .env.local  # Configure your API keys
pnpm dev
```

## Usage Examples

- "Check if we can still add items to shopping cart"
- "Confirm that login works as described in documentation"
- "Try to break registration with invalid emails"

## Tech Stack

- Chrome DevTools MCP for browser automation
- AI SDK 6 for intelligent test generation
- OpenRouter for LLM access
- Next.js for the web interface
