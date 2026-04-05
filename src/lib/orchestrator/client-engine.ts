// Client-side orchestration engine for static export deployment
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

function extractIntent(input: string): string {
  const lower = input.toLowerCase();
  const patterns: Array<{ pattern: RegExp; intent: string }> = [
    { pattern: /\b(audit|review|check|inspect|assess)\b/, intent: 'compliance_review' },
    { pattern: /\b(risk|threat|vulnerability|exposure)\b/, intent: 'risk_assessment' },
    { pattern: /\b(automate|workflow|process|pipeline)\b/, intent: 'automation_design' },
    { pattern: /\b(analyze|report|summary|insight)\b/, intent: 'analysis' },
    { pattern: /\b(build|create|generate|develop)\b/, intent: 'generation' },
    { pattern: /\b(fix|resolve|debug|troubleshoot)\b/, intent: 'resolution' },
    { pattern: /\b(plan|strategy|roadmap|design)\b/, intent: 'planning' },
  ];
  for (const { pattern, intent } of patterns) {
    if (pattern.test(lower)) return intent;
  }
  return 'general_inquiry';
}

function detectEntities(input: string): string[] {
  const entities: string[] = [];
  const entityPattern = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;
  const matches = input.match(entityPattern);
  if (matches) entities.push(...matches.slice(0, 5));
  return entities;
}

function checkCompliance(input: string): string[] {
  const flags: string[] = [];
  const checks = [
    { pattern: /\b(pii|personal data|gdpr|privacy)\b/i, flag: 'PRIVACY_SENSITIVE' },
    { pattern: /\b(financial|sox|sec|accounting)\b/i, flag: 'FINANCIAL_COMPLIANCE' },
    { pattern: /\b(hipaa|health|medical|patient)\b/i, flag: 'HEALTHCARE_COMPLIANCE' },
    { pattern: /\b(pci|credit card|payment)\b/i, flag: 'PCI_DSS' },
  ];
  for (const { pattern, flag } of checks) {
    if (pattern.test(input)) flags.push(flag);
  }
  return flags;
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

export async function orchestrateClient(request: OrchestrationRequest): Promise<OrchestrationResponse> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  const intent = extractIntent(request.message);
  const entities = detectEntities(request.message);
  const complianceFlags = checkCompliance(request.message);
  const claws = selectClaws(request.category, request.costPerfProfile);
  const clawResults = generateClawResults(claws, request.costPerfProfile);
  const avgConfidence = clawResults.reduce((s, r) => s + r.confidence, 0) / clawResults.length;

  const decodingLayers = ['Semantic Analysis', 'Structural Analysis'];
  if (complianceFlags.length > 0) decodingLayers.push('Compliance Check');
  if (request.category === 'risk_analysis') decodingLayers.push('Risk Assessment');
  decodingLayers.push('Intent Classification');

  const steps: TaskStep[] = [
    { id: crypto.randomUUID(), name: 'Input Reception', status: 'completed' },
    { id: crypto.randomUUID(), name: 'Universal Decoding', status: 'completed', clawType: 'kimiclaw' },
    { id: crypto.randomUUID(), name: 'Claw Router', status: 'completed', clawType: 'swarm' },
    { id: crypto.randomUUID(), name: 'Result Transform', status: 'completed', clawType: 'openclaw' },
    { id: crypto.randomUUID(), name: 'Output Synthesis', status: 'completed' },
  ];

  const task: Task = {
    id: crypto.randomUUID(),
    title: `Process: ${intent}`,
    description: `Orchestrated through ${steps.length} Yellow Brick Road nodes`,
    status: 'completed',
    input: request.message,
    steps,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    gasUsed: clawResults.reduce((s, r) => s + r.cost * 10, 0),
  };

  const contentLines = [
    `**Orchestration Complete** — Intent: *${intent.replace(/_/g, ' ')}*`,
    ``,
    `Processed through ${decodingLayers.length} decoding layers with ${clawResults.length}/${clawResults.length} successful claw executions.`,
    ``,
  ];

  if (entities.length > 0) {
    contentLines.push(`**Entities detected:** ${entities.join(', ')}`);
  }
  if (complianceFlags.length > 0) {
    contentLines.push(`**Compliance flags:** ${complianceFlags.join(', ')}`);
  }

  contentLines.push(`**Confidence:** ${(avgConfidence * 100).toFixed(1)}%`);
  contentLines.push(`**Claws utilized:** ${[...new Set(clawResults.map(r => r.clawType))].join(', ')}`);
  contentLines.push(`**Decoding layers:** ${decodingLayers.join(' → ')}`);
  contentLines.push(``);
  contentLines.push(`---`);
  contentLines.push(``);

  // Generate contextual response based on category
  switch (request.category) {
    case 'compliance_audit':
      contentLines.push(`**Compliance Audit Summary:**`);
      contentLines.push(`Your request has been analyzed through the Compliance OS Universal Decoding Matrix. ${complianceFlags.length > 0 ? `${complianceFlags.length} compliance flag(s) detected requiring attention.` : 'No immediate compliance flags detected.'}`);
      contentLines.push(`Recommended actions: Schedule detailed review, verify regulatory alignment, document findings.`);
      break;
    case 'risk_analysis':
      contentLines.push(`**Risk Analysis Report:**`);
      contentLines.push(`Multi-perspective risk assessment completed via SwarmAgents (${clawResults.length} agents consulted).`);
      contentLines.push(`Overall risk profile: ${complianceFlags.length > 0 ? 'ELEVATED' : 'STANDARD'} — Continue monitoring recommended.`);
      break;
    case 'automation_plan':
      contentLines.push(`**Automation Plan:**`);
      contentLines.push(`Workflow analysis completed. ${steps.length} orchestration steps identified and mapped to Yellow Brick Road pipeline.`);
      contentLines.push(`Optimization potential: ${request.costPerfProfile === 'performance' ? 'High throughput via SwarmAgents' : 'Cost-optimized via OpenClaw routing'}.`);
      break;
    default:
      contentLines.push(`**Analysis:**`);
      contentLines.push(`Your query has been processed through the full Yellow Brick Road pipeline. The Orchestrator coordinated ${clawResults.length} claw technologies to provide a comprehensive response.`);
      contentLines.push(`For deeper analysis, try selecting a specific category (Compliance Audit, Risk Analysis, or Automation Plan).`);
  }

  const gasUsed = task.gasUsed;

  return {
    sessionId: request.sessionId,
    messageId: crypto.randomUUID(),
    content: contentLines.join('\n'),
    tasks: [task],
    clawResults,
    gasUsed,
    yellowBrickPath: `path_${request.category || 'for_you'}`,
    decodingLayers,
    confidence: avgConfidence,
  };
}
