# Orchestrator - Intelligence Orchestration System

**Empowering with AI, not replacing.**

An Intelligence Orchestration System that combines copilot task engine capabilities, skill-based orchestration, and multi-model AI coordination through a novel architecture called the **Yellow Brick Road**.

## Architecture

### Yellow Brick Road

The core orchestration pipeline that routes intelligence through a directed graph of processing nodes:

- **Ingress** - Input reception and normalization
- **Decode** - Universal Decoding Matrix processing
- **Route** - Claw technology assignment
- **Transform** - Result transformation and enrichment
- **Egress** - Output synthesis and delivery

### Compliance OS Universal Decoding Matrix

Multi-layer semantic, structural, and compliance decoder that analyzes inputs through five specialized layers:

1. **Semantic Analysis** - Entity extraction, action detection, numeric parsing
2. **Structural Analysis** - List detection, code block extraction
3. **Compliance Check** - PII detection, regulation flagging (GDPR, HIPAA, SOX, PCI)
4. **Risk Assessment** - Severity scoring, impact analysis
5. **Intent Classification** - Query vs command classification

### Claw Technologies

Three integrated intelligence engines, each optimized for different workloads:

- **OpenClaw** - General-purpose reasoning and analysis (cost-efficient)
- **SwarmAgents** - Distributed multi-agent parallel processing (high throughput)
- **KimiClaw** - Deep analysis and precision domain expertise (high accuracy)

## Features

- Multi-category orchestration (Compliance Audit, Risk Analysis, Automation Plan)
- Session management with full message history
- Project organization with vault item storage
- Gas-based resource tracking and cost management
- Auto-orchestrate with configurable cost/performance profiles
- Real-time orchestration status and confidence scoring

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the Orchestrator.

## API Endpoints

- `POST /api/orchestrate` - Execute an orchestration request
- `GET /api/orchestrate` - Get engine status and registered paths
- `GET/POST /api/vault` - Manage vault items
- `GET/POST /api/sessions` - Manage sessions
- `GET/POST /api/projects` - Manage projects

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- React 19
- Lucide Icons
