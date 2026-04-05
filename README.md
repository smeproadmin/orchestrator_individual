# Orchestrator - Intelligence Orchestration System

**Empowering with AI, not replacing.**

A multi-agent Intelligence Orchestration System that dynamically spins up specialized SME (Subject Matter Expert) AI agents based on user intent. Built on the **Yellow Brick Road** architecture.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsmeproadmin%2Forchestrator_individual&env=ANTHROPIC_API_KEY&envDescription=Your%20Anthropic%20API%20key%20for%20powering%20the%20multi-agent%20orchestration&envLink=https%3A%2F%2Fconsole.anthropic.com%2Fsettings%2Fkeys&project-name=orchestrator&repository-name=orchestrator)

## Quick Deploy to Vercel

1. Click the **"Deploy with Vercel"** button above
2. If prompted, connect your GitHub account
3. When asked for environment variables, paste your **Anthropic API key** (`sk-ant-...`)
   - Get one at: https://console.anthropic.com/settings/keys
4. Click **Deploy** — your app will be live in ~60 seconds

## Architecture

### Multi-Agent Orchestration

The Orchestrator analyzes each user query and dynamically selects the best SME agent(s):

| Agent | Specialization |
|-------|---------------|
| Real Estate Intelligence | Property search, FSBO, MLS, market analysis, valuations |
| Compliance & Regulatory | GDPR, HIPAA, SOX, PCI-DSS, audit frameworks, gap analysis |
| Risk Analysis | Threat modeling, impact analysis, risk heat maps, mitigation |
| Automation & Workflow | Pipeline design, CI/CD, process optimization, RPA |
| Financial Analysis | Markets, portfolio, valuations, forecasting, M&A |
| Software Engineering | Code generation, architecture design, debugging |
| Research & Intelligence | Market research, competitive analysis, trends |
| General Intelligence | Catch-all for queries that span multiple domains |

### How It Works

1. User sends a natural language query
2. **Agent Router** analyzes intent, extracts entities (locations, prices, regulations, etc.)
3. Router selects a **primary agent** + up to 2 **supporting agents**
4. Primary agent generates the main response via Claude API
5. Supporting agents run **in parallel** for additional expert perspectives
6. Orchestrator synthesizes everything into a unified response with workflow steps and artifacts

### Yellow Brick Road Pipeline

```
[User Input] → [Intent Analysis] → [Agent Router] → [Primary Agent] → [Response Synthesis]
                                        ↓                                      ↑
                                 [Supporting Agents] ────── (parallel) ────────┘
```

## Features

- **8 Specialized SME Agents** — dynamically selected per query
- **Multi-agent collaboration** — primary + supporting agents work together
- **Pay-as-you-go model** — gas credits track usage, no user API keys needed
- **Rich responses** — markdown rendering, data tables, code blocks, checklists
- **Interactive workflows** — expandable orchestration step visualization
- **Artifact system** — tables, code, checklists with copy/expand
- **Category modes** — Compliance Audit, Risk Analysis, Automation Plan, For You
- **Session management** — conversation history, project organization
- **Vault** — save and reuse snippets, templates, and configurations

## Local Development

```bash
git clone https://github.com/smeproadmin/orchestrator_individual.git
cd orchestrator_individual
npm install

# Create .env.local with your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for multi-agent AI orchestration |

## Tech Stack

- Next.js 16 (App Router, API Routes)
- TypeScript
- Tailwind CSS 4
- React 19
- Claude API (Anthropic)
- Lucide Icons
