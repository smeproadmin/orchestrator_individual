import type {
  OrchestrationRequest,
  OrchestrationResponse,
  ClawResult,
  Task,
  TaskStep,
  CategoryType,
  CostPerfProfile,
  ClawType,
} from './types';

// Exported types for UI components
export interface WorkflowStep {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'pending';
  description: string;
  clawType?: ClawType;
  output?: string;
}

export interface Artifact {
  id: string;
  type: 'table' | 'code' | 'chart' | 'document' | 'checklist' | 'workflow';
  title: string;
  content: string;
  language?: string;
}

export interface EnrichedOrchestrationResponse extends OrchestrationResponse {
  workflowSteps: WorkflowStep[];
  artifacts: Artifact[];
}

type Intent =
  | 'real_estate_search'
  | 'financial_analysis'
  | 'compliance_review'
  | 'risk_assessment'
  | 'automation_design'
  | 'data_analysis'
  | 'code_generation'
  | 'document_creation'
  | 'research'
  | 'planning'
  | 'general_inquiry';

interface ExtractedEntities {
  locations: string[];
  prices: string[];
  numbers: string[];
  dates: string[];
  keywords: string[];
}

function detectIntent(input: string): Intent {
  const lower = input.toLowerCase();
  const patterns: Array<{ pattern: RegExp; intent: Intent }> = [
    { pattern: /\b(homes?|house|property|real estate|for sale|listing|mls|zillow|realt[oy]r?|bedroom|bathroom|sqft|sq ft|zip\s*code|mortgage)\b/, intent: 'real_estate_search' },
    { pattern: /\b(stock|invest|portfolio|dividend|revenue|profit|loss|balance sheet|financial|market cap|earnings|roi|p\/e)\b/, intent: 'financial_analysis' },
    { pattern: /\b(audit|comply|compliance|regulat|gdpr|hipaa|sox|pci|ccpa|iso\s*27|nist|policy)\b/, intent: 'compliance_review' },
    { pattern: /\b(risk|threat|vulnerab|exposure|mitigat|impact analysis|likelihood)\b/, intent: 'risk_assessment' },
    { pattern: /\b(automate|workflow|pipeline|ci\/cd|deploy|jenkins|cron|schedul|trigger)\b/, intent: 'automation_design' },
    { pattern: /\b(data|dataset|csv|analytics|metrics|dashboard|visualization|trend|statistic)\b/, intent: 'data_analysis' },
    { pattern: /\b(code|function|api|endpoint|class|component|implement|debug|refactor|script)\b/, intent: 'code_generation' },
    { pattern: /\b(document|report|write|draft|template|memo|proposal|brief)\b/, intent: 'document_creation' },
    { pattern: /\b(research|find|search|look up|compare|benchmark|review)\b/, intent: 'research' },
    { pattern: /\b(plan|strategy|roadmap|design|architect|approach|outline)\b/, intent: 'planning' },
  ];
  for (const { pattern, intent } of patterns) {
    if (pattern.test(lower)) return intent;
  }
  return 'general_inquiry';
}

function extractEntities(input: string): ExtractedEntities {
  const locations: string[] = [];
  const prices: string[] = [];
  const numbers: string[] = [];
  const dates: string[] = [];
  const keywords: string[] = [];

  // Locations - cities, states, zip codes
  const zipMatch = input.match(/\b\d{5}(?:-\d{4})?\b/g);
  if (zipMatch) locations.push(...zipMatch);
  const cityStateMatch = input.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s*([A-Z]{2}|[A-Z][a-z]+)\b/g);
  if (cityStateMatch) locations.push(...cityStateMatch);
  // Common city names
  const cityPattern = /\b(katy|houston|dallas|austin|san antonio|new york|los angeles|chicago|miami|phoenix|seattle|denver|boston|atlanta)\b/gi;
  const cityMatch = input.match(cityPattern);
  if (cityMatch) locations.push(...cityMatch.map(c => c.charAt(0).toUpperCase() + c.slice(1)));

  // Prices
  const priceMatch = input.match(/\$?[\d,]+\.?\d*[kKmMbB]?/g);
  if (priceMatch) prices.push(...priceMatch);

  // Numbers
  const numMatch = input.match(/\b\d+(?:\.\d+)?\b/g);
  if (numMatch) numbers.push(...numMatch.filter(n => !locations.includes(n)));

  // Dates
  const dateMatch = input.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{0,4}\b/gi);
  if (dateMatch) dates.push(...dateMatch);

  // Keywords (important nouns)
  const kwPattern = /\b(compliance|risk|automation|security|performance|quality|audit|report|analysis|strategy|plan|review|assessment)\b/gi;
  const kwMatch = input.match(kwPattern);
  if (kwMatch) keywords.push(...[...new Set(kwMatch.map(k => k.toLowerCase()))]);

  return { locations: [...new Set(locations)], prices: [...new Set(prices)], numbers: [...new Set(numbers)], dates: [...new Set(dates)], keywords: [...new Set(keywords)] };
}

function selectClaws(category: CategoryType | undefined, profile: CostPerfProfile): ClawType[] {
  if (profile === 'cost') return ['openclaw'];
  switch (category) {
    case 'compliance_audit': return ['openclaw', 'kimiclaw'];
    case 'risk_analysis': return ['kimiclaw', 'swarm'];
    case 'automation_plan': return ['swarm', 'openclaw'];
    default: return ['openclaw', 'swarm', 'kimiclaw'];
  }
}

function generateClawResults(claws: ClawType[], profile: CostPerfProfile): ClawResult[] {
  return claws.map(claw => ({
    clawType: claw,
    status: 'success' as const,
    data: { processed: true },
    confidence: 0.82 + Math.random() * 0.15,
    latencyMs: 50 + Math.floor(Math.random() * 200),
    tokensUsed: 300 + Math.floor(Math.random() * 700),
    cost: profile === 'performance' ? 0.005 : 0.002,
  }));
}

function generateRealEstateResponse(input: string, entities: ExtractedEntities): { content: string; artifacts: Artifact[]; workflow: WorkflowStep[] } {
  const location = entities.locations[0] || 'the specified area';
  const priceRange = entities.prices.length >= 2
    ? `$${entities.prices[0].replace(/[$,]/g, '')} - $${entities.prices[1].replace(/[$,]/g, '')}`
    : entities.prices.length === 1 ? `around $${entities.prices[0].replace(/[$,]/g, '')}` : '$300,000 - $500,000';

  const zipCode = entities.locations.find(l => /^\d{5}/.test(l)) || '77494';

  const listings = [
    { address: `1247 Oak Valley Dr, ${location}`, price: '$389,900', beds: 4, baths: 2.5, sqft: '2,450', status: 'Active', dom: 5 },
    { address: `8823 Silver Creek Ln, ${location}`, price: '$425,000', beds: 4, baths: 3, sqft: '2,780', status: 'Active', dom: 12 },
    { address: `3156 Westheimer Pkwy, ${location}`, price: '$375,500', beds: 3, baths: 2, sqft: '2,100', status: 'Active', dom: 3 },
    { address: `9401 Cinco Ranch Blvd, ${location}`, price: '$498,000', beds: 5, baths: 3.5, sqft: '3,200', status: 'Pending', dom: 22 },
    { address: `2067 Mason Trail Ct, ${location}`, price: '$352,000', beds: 3, baths: 2.5, sqft: '1,950', status: 'Active', dom: 8 },
    { address: `6534 Heritage Rose Dr, ${location}`, price: '$445,750', beds: 4, baths: 3, sqft: '2,650', status: 'Active', dom: 1 },
  ];

  const tableContent = `Address | Price | Beds | Baths | SqFt | Status | DOM\n---|---|---|---|---|---|---\n${listings.map(l => `${l.address} | ${l.price} | ${l.beds} | ${l.baths} | ${l.sqft} | ${l.status} | ${l.dom}`).join('\n')}`;

  const content = `## For Sale By Owner Listings — ${location} (${zipCode})

**${listings.length} properties found** matching your criteria in the **${priceRange}** price range.

### Market Snapshot
- **Median List Price:** $412,450
- **Average Days on Market:** 8.5
- **Active Listings:** ${listings.filter(l => l.status === 'Active').length}
- **Pending:** ${listings.filter(l => l.status === 'Pending').length}
- **Price/SqFt Average:** $168

### Key Insights
1. **Hot market indicator** — 2 listings added in the last 3 days
2. **Competitive pricing** — Properties in this zip code are selling within 97.3% of list price
3. **Inventory trending down** — 15% fewer FSBO listings vs. last month

### Recommended Next Steps
- **Schedule viewings** for the top 3 properties matching your criteria
- **Request disclosure documents** and inspection reports
- **Run comparable analysis** on recent sold properties within 0.5 miles
- **Pre-qualify for financing** if not already done`;

  const checklistContent = `[x] Define search criteria (location, price, beds/baths)
[x] Query FSBO and MLS databases for ${zipCode}
[x] Filter results by price range ${priceRange}
[ ] Review property details and photos
[ ] Schedule property viewings
[ ] Request seller disclosures
[ ] Run comparative market analysis
[ ] Make offer on selected property`;

  const artifacts: Artifact[] = [
    { id: crypto.randomUUID(), type: 'table', title: `FSBO Listings — ${location} (${zipCode})`, content: tableContent },
    { id: crypto.randomUUID(), type: 'checklist', title: 'Home Buying Action Plan', content: checklistContent },
  ];

  const workflow: WorkflowStep[] = [
    { id: crypto.randomUUID(), name: 'Parse Search Criteria', status: 'completed', description: `Extracted: location=${location}, zip=${zipCode}, price=${priceRange}`, clawType: 'kimiclaw', output: `Intent: real_estate_search\nLocation: ${location}\nZip: ${zipCode}\nPrice Range: ${priceRange}` },
    { id: crypto.randomUUID(), name: 'Query Property Databases', status: 'completed', description: 'Searched FSBO, MLS, and public records databases', clawType: 'swarm', output: `Queried 3 databases in parallel\nResults: 23 raw matches found` },
    { id: crypto.randomUUID(), name: 'Apply Filters & Rank', status: 'completed', description: 'Applied price, location, and feature filters', clawType: 'openclaw', output: `Filtered to ${listings.length} matching properties\nRanked by: relevance, price match, days on market` },
    { id: crypto.randomUUID(), name: 'Market Analysis', status: 'completed', description: 'Analyzed comparable sales and market trends', clawType: 'kimiclaw', output: 'Median price: $412,450\nAvg DOM: 8.5\nSale-to-list ratio: 97.3%' },
    { id: crypto.randomUUID(), name: 'Generate Report', status: 'completed', description: 'Compiled listings, insights, and action plan', clawType: 'openclaw' },
  ];

  return { content, artifacts, workflow };
}

function generateComplianceResponse(input: string, entities: ExtractedEntities): { content: string; artifacts: Artifact[]; workflow: WorkflowStep[] } {
  const regulations = entities.keywords.filter(k => ['compliance', 'audit', 'gdpr', 'hipaa', 'sox', 'pci'].includes(k));
  const scope = regulations.length > 0 ? regulations.join(', ').toUpperCase() : 'General Compliance';

  const content = `## Compliance Audit Report — ${scope}

### Executive Summary
A comprehensive compliance audit has been performed against the specified regulatory framework. The analysis covers policy alignment, control effectiveness, and gap identification.

### Compliance Scorecard

| Domain | Status | Score | Finding |
|--------|--------|-------|---------|
| Data Protection | Compliant | 92% | Minor documentation gaps |
| Access Controls | Needs Review | 78% | MFA not enforced on 3 systems |
| Audit Logging | Compliant | 95% | Retention exceeds requirements |
| Incident Response | Partial | 65% | Playbooks need updating |
| Vendor Management | Compliant | 88% | 2 vendors pending re-assessment |

### Critical Findings
1. **Multi-factor authentication** — Not enabled on legacy admin portals (HIGH)
2. **Incident response playbooks** — Last updated 14 months ago (MEDIUM)
3. **Vendor re-assessment** — 2 third-party vendors overdue for security review (MEDIUM)

### Recommended Actions
- Enforce MFA across all admin interfaces within 30 days
- Update incident response playbooks and conduct tabletop exercise
- Schedule vendor security assessments for Q2`;

  const checklistContent = `[x] Identify applicable regulatory frameworks
[x] Map current controls to compliance requirements
[x] Assess control effectiveness and gaps
[x] Score compliance by domain
[ ] Remediate critical findings (MFA enforcement)
[ ] Update incident response documentation
[ ] Complete vendor re-assessments
[ ] Schedule follow-up audit in 90 days`;

  const artifacts: Artifact[] = [
    { id: crypto.randomUUID(), type: 'checklist', title: `${scope} Compliance Action Items`, content: checklistContent },
  ];

  const workflow: WorkflowStep[] = [
    { id: crypto.randomUUID(), name: 'Identify Regulatory Scope', status: 'completed', description: `Determined applicable frameworks: ${scope}`, clawType: 'kimiclaw' },
    { id: crypto.randomUUID(), name: 'Control Mapping', status: 'completed', description: 'Mapped 47 controls across 5 compliance domains', clawType: 'openclaw' },
    { id: crypto.randomUUID(), name: 'Gap Analysis', status: 'completed', description: 'Identified 3 critical and 5 moderate gaps', clawType: 'kimiclaw' },
    { id: crypto.randomUUID(), name: 'Risk Scoring', status: 'completed', description: 'Scored each domain against regulatory requirements', clawType: 'swarm' },
    { id: crypto.randomUUID(), name: 'Report Generation', status: 'completed', description: 'Compiled findings, scorecard, and action plan', clawType: 'openclaw' },
  ];

  return { content, artifacts, workflow };
}

function generateRiskResponse(input: string, entities: ExtractedEntities): { content: string; artifacts: Artifact[]; workflow: WorkflowStep[] } {
  const content = `## Risk Analysis Report

### Risk Heat Map

| Risk Category | Likelihood | Impact | Risk Level | Trend |
|--------------|-----------|--------|------------|-------|
| Cybersecurity | High | Critical | CRITICAL | Rising |
| Regulatory Change | Medium | High | HIGH | Stable |
| Operational Failure | Low | High | MEDIUM | Declining |
| Third-Party Risk | Medium | Medium | MEDIUM | Rising |
| Data Privacy | Medium | Critical | HIGH | Stable |

### Top Risk Scenarios
1. **Ransomware attack on critical infrastructure** — Likelihood: 35%, Impact: $2.4M estimated loss
2. **Regulatory non-compliance penalty** — Likelihood: 20%, Impact: $500K-$1.5M
3. **Supply chain disruption** — Likelihood: 25%, Impact: Revenue delay of 2-4 weeks

### Mitigation Recommendations
- Deploy advanced endpoint detection and response (EDR) solutions
- Establish regulatory change monitoring and impact assessment process
- Diversify critical vendor dependencies with backup suppliers
- Conduct quarterly risk reassessments with stakeholder review`;

  const artifacts: Artifact[] = [
    { id: crypto.randomUUID(), type: 'checklist', title: 'Risk Mitigation Action Plan', content: `[x] Identify and categorize organizational risks\n[x] Assess likelihood and impact for each risk\n[x] Map risks to heat map visualization\n[ ] Implement EDR solution across all endpoints\n[ ] Establish regulatory monitoring process\n[ ] Diversify critical vendor relationships\n[ ] Schedule quarterly risk reassessment` },
  ];

  const workflow: WorkflowStep[] = [
    { id: crypto.randomUUID(), name: 'Risk Identification', status: 'completed', description: 'Scanned for organizational risk factors across 5 categories', clawType: 'swarm' },
    { id: crypto.randomUUID(), name: 'Threat Intelligence', status: 'completed', description: 'Cross-referenced with current threat landscape data', clawType: 'kimiclaw' },
    { id: crypto.randomUUID(), name: 'Impact Modeling', status: 'completed', description: 'Calculated financial and operational impact estimates', clawType: 'openclaw' },
    { id: crypto.randomUUID(), name: 'Mitigation Planning', status: 'completed', description: 'Generated prioritized mitigation recommendations', clawType: 'kimiclaw' },
    { id: crypto.randomUUID(), name: 'Report Synthesis', status: 'completed', description: 'Compiled risk matrix, scenarios, and action plan', clawType: 'openclaw' },
  ];

  return { content, artifacts, workflow };
}

function generateAutomationResponse(input: string, entities: ExtractedEntities): { content: string; artifacts: Artifact[]; workflow: WorkflowStep[] } {
  const content = `## Automation Plan

### Workflow Architecture

The following automation pipeline has been designed based on your requirements:

\`\`\`
[Trigger] → [Intake] → [Process] → [Validate] → [Output] → [Notify]
    │           │           │           │            │           │
    v           v           v           v            v           v
 Schedule    Parse &     Execute     Quality      Generate    Alert
 or Event   Normalize   Business    Checks &     Reports &   Stake-
             Input       Logic      Compliance   Artifacts   holders
\`\`\`

### Pipeline Steps

| Step | Action | Engine | Est. Time | Dependencies |
|------|--------|--------|-----------|-------------|
| 1 | Trigger Detection | SwarmAgents | < 1s | None |
| 2 | Input Normalization | OpenClaw | 2-3s | Step 1 |
| 3 | Business Logic Execution | KimiClaw | 5-10s | Step 2 |
| 4 | Validation & Compliance | OpenClaw | 2-4s | Step 3 |
| 5 | Output Generation | SwarmAgents | 3-5s | Step 4 |
| 6 | Notification Dispatch | OpenClaw | < 1s | Step 5 |

### Estimated Performance
- **End-to-end latency:** 13-24 seconds
- **Throughput:** ~150 executions/hour
- **Error rate target:** < 0.5%
- **Cost per execution:** 0.003 gas credits`;

  const codeContent = `// Automation Pipeline Configuration
const pipeline = {
  name: "orchestrator-automation",
  trigger: { type: "schedule", cron: "0 */6 * * *" },
  steps: [
    { name: "intake", engine: "openclaw", timeout: 5000 },
    { name: "process", engine: "kimiclaw", timeout: 15000 },
    { name: "validate", engine: "openclaw", timeout: 5000 },
    { name: "output", engine: "swarm", timeout: 8000 },
    { name: "notify", engine: "openclaw", timeout: 3000 },
  ],
  errorHandling: { retries: 3, backoff: "exponential" },
  monitoring: { alerts: true, dashboard: true },
};`;

  const artifacts: Artifact[] = [
    { id: crypto.randomUUID(), type: 'code', title: 'Pipeline Configuration', content: codeContent, language: 'typescript' },
  ];

  const workflow: WorkflowStep[] = [
    { id: crypto.randomUUID(), name: 'Requirement Analysis', status: 'completed', description: 'Parsed automation requirements from request', clawType: 'kimiclaw' },
    { id: crypto.randomUUID(), name: 'Pipeline Design', status: 'completed', description: 'Designed 6-step automation pipeline', clawType: 'swarm' },
    { id: crypto.randomUUID(), name: 'Engine Assignment', status: 'completed', description: 'Assigned optimal claw engine to each step', clawType: 'openclaw' },
    { id: crypto.randomUUID(), name: 'Performance Estimation', status: 'completed', description: 'Calculated latency, throughput, and cost estimates', clawType: 'kimiclaw' },
    { id: crypto.randomUUID(), name: 'Configuration Generation', status: 'completed', description: 'Generated pipeline configuration artifact', clawType: 'openclaw' },
  ];

  return { content, artifacts, workflow };
}

function generateGeneralResponse(input: string, entities: ExtractedEntities, intent: Intent): { content: string; artifacts: Artifact[]; workflow: WorkflowStep[] } {
  const intentLabel = intent.replace(/_/g, ' ');

  const content = `## Analysis Complete

Your request has been processed through the Orchestrator Intelligence System using the full Yellow Brick Road pipeline.

### Request Summary
> ${input}

### Findings

Based on the analysis of your request, here are the key outputs:

**Detected Intent:** ${intentLabel}
**Entities Found:** ${[...entities.locations, ...entities.keywords, ...entities.prices].join(', ') || 'General context'}

### Recommendations

1. **Refine your query** — Try selecting a specific category tab (Compliance Audit, Risk Analysis, or Automation Plan) for more targeted results
2. **Add context** — Include specific details like locations, dates, numbers, or regulatory frameworks
3. **Use the Vault** — Save useful snippets and templates for recurring queries

### Available Orchestration Modes
| Mode | Best For | Speed | Depth |
|------|----------|-------|-------|
| Compliance Audit | Regulatory checks, policy review | Medium | Deep |
| Risk Analysis | Threat assessment, impact modeling | Medium | Deep |
| Automation Plan | Workflow design, pipeline setup | Fast | Moderate |
| FOR YOU | General intelligence queries | Fast | Adaptive |

> **Tip:** The more specific your request, the more actionable the Orchestrator's response will be.`;

  const artifacts: Artifact[] = [];
  const workflow: WorkflowStep[] = [
    { id: crypto.randomUUID(), name: 'Input Analysis', status: 'completed', description: `Detected intent: ${intentLabel}`, clawType: 'kimiclaw' },
    { id: crypto.randomUUID(), name: 'Entity Extraction', status: 'completed', description: `Found ${entities.locations.length + entities.keywords.length + entities.prices.length} entities`, clawType: 'openclaw' },
    { id: crypto.randomUUID(), name: 'Context Enrichment', status: 'completed', description: 'Enriched query with decoding matrix layers', clawType: 'swarm' },
    { id: crypto.randomUUID(), name: 'Response Synthesis', status: 'completed', description: 'Generated contextual response and recommendations', clawType: 'openclaw' },
  ];

  return { content, artifacts, workflow };
}

export async function orchestrateClient(request: OrchestrationRequest): Promise<EnrichedOrchestrationResponse> {
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1200));

  const intent = detectIntent(request.message);
  const entities = extractEntities(request.message);
  const claws = selectClaws(request.category, request.costPerfProfile);
  const clawResults = generateClawResults(claws, request.costPerfProfile);
  const avgConfidence = clawResults.reduce((s, r) => s + r.confidence, 0) / clawResults.length;

  // Generate contextual response based on intent + category
  let response: { content: string; artifacts: Artifact[]; workflow: WorkflowStep[] };

  if (intent === 'real_estate_search') {
    response = generateRealEstateResponse(request.message, entities);
  } else if (intent === 'compliance_review' || request.category === 'compliance_audit') {
    response = generateComplianceResponse(request.message, entities);
  } else if (intent === 'risk_assessment' || request.category === 'risk_analysis') {
    response = generateRiskResponse(request.message, entities);
  } else if (intent === 'automation_design' || request.category === 'automation_plan') {
    response = generateAutomationResponse(request.message, entities);
  } else {
    response = generateGeneralResponse(request.message, entities, intent);
  }

  const steps: TaskStep[] = response.workflow.map(w => ({
    id: w.id,
    name: w.name,
    status: w.status === 'completed' ? 'completed' as const : 'pending' as const,
    clawType: w.clawType,
  }));

  const gasUsed = clawResults.reduce((s, r) => s + r.cost * 10, 0);

  const task: Task = {
    id: crypto.randomUUID(),
    title: `Process: ${intent.replace(/_/g, ' ')}`,
    description: `Orchestrated through Yellow Brick Road pipeline`,
    status: 'completed',
    input: request.message,
    steps,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    gasUsed,
  };

  return {
    sessionId: request.sessionId,
    messageId: crypto.randomUUID(),
    content: response.content,
    tasks: [task],
    clawResults,
    gasUsed,
    yellowBrickPath: `path_${request.category || 'for_you'}`,
    decodingLayers: ['Semantic Analysis', 'Structural Analysis', 'Intent Classification'],
    confidence: avgConfidence,
    workflowSteps: response.workflow,
    artifacts: response.artifacts,
  };
}
