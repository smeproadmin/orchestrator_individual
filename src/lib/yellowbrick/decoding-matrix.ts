// ============================================================================
// Compliance OS Universal Decoding Matrix
// Multi-layer semantic + structural + compliance decoder
// ============================================================================

import type { DecodingMatrix, DecodingLayer, Decoder, CategoryType } from '../orchestrator/types';

interface DecodedResult {
  intent: string;
  entities: string[];
  layersUsed: string[];
  complexity: number;
  complianceFlags: string[];
  riskScore: number;
}

export class DecodingMatrixEngine {
  private matrix: DecodingMatrix;

  constructor() {
    this.matrix = this.initializeMatrix();
  }

  async decode(input: string, category?: CategoryType): Promise<DecodedResult> {
    const activeLayers = this.selectLayers(category);
    const results: Array<{ layer: string; decoded: Partial<DecodedResult> }> = [];

    for (const layer of activeLayers) {
      const layerResult = this.processLayer(input, layer);
      results.push({ layer: layer.name, decoded: layerResult });
    }

    return this.mergeLayerResults(results, input);
  }

  private selectLayers(category?: CategoryType): DecodingLayer[] {
    const layers = [...this.matrix.layers].sort((a, b) => a.priority - b.priority);

    if (!category || category === 'for_you') {
      return layers;
    }

    const categoryLayerMap: Record<string, string[]> = {
      compliance_audit: ['semantic', 'compliance', 'structural'],
      risk_analysis: ['semantic', 'risk', 'compliance'],
      automation_plan: ['semantic', 'intent', 'structural'],
    };

    const targetTypes = categoryLayerMap[category] || ['semantic'];
    return layers.filter(l => targetTypes.includes(l.type));
  }

  private processLayer(
    input: string,
    layer: DecodingLayer
  ): Partial<DecodedResult> {
    const matches: string[] = [];
    let totalConfidence = 0;

    for (const decoder of layer.decoders) {
      const regex = new RegExp(decoder.pattern, 'gi');
      const found = input.match(regex);
      if (found) {
        matches.push(...found);
        totalConfidence += decoder.confidence;
      }
    }

    const avgConfidence = layer.decoders.length > 0
      ? totalConfidence / layer.decoders.length
      : 0.5;

    return {
      entities: matches,
      complexity: Math.min(input.split(/\s+/).length / 50, 1),
      complianceFlags: layer.type === 'compliance' ? this.checkCompliance(input) : [],
      riskScore: layer.type === 'risk' ? this.assessRisk(input) : 0,
    };
  }

  private mergeLayerResults(
    results: Array<{ layer: string; decoded: Partial<DecodedResult> }>,
    originalInput: string
  ): DecodedResult {
    const allEntities = new Set<string>();
    const allFlags = new Set<string>();
    let maxComplexity = 0;
    let maxRisk = 0;

    for (const { decoded } of results) {
      decoded.entities?.forEach(e => allEntities.add(e));
      decoded.complianceFlags?.forEach(f => allFlags.add(f));
      maxComplexity = Math.max(maxComplexity, decoded.complexity || 0);
      maxRisk = Math.max(maxRisk, decoded.riskScore || 0);
    }

    return {
      intent: this.extractIntent(originalInput),
      entities: Array.from(allEntities),
      layersUsed: results.map(r => r.layer),
      complexity: maxComplexity,
      complianceFlags: Array.from(allFlags),
      riskScore: maxRisk,
    };
  }

  private extractIntent(input: string): string {
    const lower = input.toLowerCase();
    const intentPatterns: Array<{ pattern: RegExp; intent: string }> = [
      { pattern: /\b(audit|review|check|inspect|assess)\b/, intent: 'compliance_review' },
      { pattern: /\b(risk|threat|vulnerability|exposure)\b/, intent: 'risk_assessment' },
      { pattern: /\b(automate|workflow|process|pipeline)\b/, intent: 'automation_design' },
      { pattern: /\b(analyze|report|summary|insight)\b/, intent: 'analysis' },
      { pattern: /\b(build|create|generate|develop)\b/, intent: 'generation' },
      { pattern: /\b(fix|resolve|debug|troubleshoot)\b/, intent: 'resolution' },
      { pattern: /\b(plan|strategy|roadmap|design)\b/, intent: 'planning' },
    ];

    for (const { pattern, intent } of intentPatterns) {
      if (pattern.test(lower)) return intent;
    }
    return 'general_inquiry';
  }

  private checkCompliance(input: string): string[] {
    const flags: string[] = [];
    const checks: Array<{ pattern: RegExp; flag: string }> = [
      { pattern: /\b(pii|personal data|gdpr|privacy)\b/i, flag: 'PRIVACY_SENSITIVE' },
      { pattern: /\b(financial|sox|sec|accounting)\b/i, flag: 'FINANCIAL_COMPLIANCE' },
      { pattern: /\b(hipaa|health|medical|patient)\b/i, flag: 'HEALTHCARE_COMPLIANCE' },
      { pattern: /\b(secret|classified|confidential)\b/i, flag: 'CLASSIFICATION_REQUIRED' },
      { pattern: /\b(pci|credit card|payment)\b/i, flag: 'PCI_DSS' },
    ];

    for (const { pattern, flag } of checks) {
      if (pattern.test(input)) flags.push(flag);
    }
    return flags;
  }

  private assessRisk(input: string): number {
    let score = 0.1;
    const riskIndicators: Array<{ pattern: RegExp; weight: number }> = [
      { pattern: /\b(critical|urgent|emergency)\b/i, weight: 0.3 },
      { pattern: /\b(breach|leak|compromise)\b/i, weight: 0.4 },
      { pattern: /\b(production|live|customer-facing)\b/i, weight: 0.2 },
      { pattern: /\b(delete|remove|destroy|drop)\b/i, weight: 0.25 },
      { pattern: /\b(all|entire|complete|full)\b/i, weight: 0.1 },
    ];

    for (const { pattern, weight } of riskIndicators) {
      if (pattern.test(input)) score += weight;
    }
    return Math.min(score, 1.0);
  }

  private initializeMatrix(): DecodingMatrix {
    return {
      id: 'universal-matrix-v1',
      name: 'Compliance OS Universal Decoding Matrix',
      version: '1.0.0',
      universalCodec: 'UTF-8/SEMANTIC-v1',
      layers: [
        {
          id: 'semantic-layer',
          name: 'Semantic Analysis',
          type: 'semantic',
          priority: 1,
          decoders: [
            { id: 'entity-decoder', pattern: '\\b[A-Z][a-z]+(?:\\s[A-Z][a-z]+)*\\b', transform: 'extract_entity', confidence: 0.8, outputSchema: {} },
            { id: 'action-decoder', pattern: '\\b(?:create|update|delete|analyze|review|build|deploy)\\b', transform: 'extract_action', confidence: 0.9, outputSchema: {} },
            { id: 'numeric-decoder', pattern: '\\b\\d+(?:\\.\\d+)?%?\\b', transform: 'extract_numeric', confidence: 0.95, outputSchema: {} },
          ],
        },
        {
          id: 'structural-layer',
          name: 'Structural Analysis',
          type: 'structural',
          priority: 2,
          decoders: [
            { id: 'list-decoder', pattern: '(?:^|\\n)\\s*[-*•]\\s+.+', transform: 'extract_list', confidence: 0.85, outputSchema: {} },
            { id: 'code-decoder', pattern: '```[\\s\\S]*?```', transform: 'extract_code', confidence: 0.95, outputSchema: {} },
          ],
        },
        {
          id: 'compliance-layer',
          name: 'Compliance Check',
          type: 'compliance',
          priority: 3,
          decoders: [
            { id: 'pii-decoder', pattern: '\\b(?:SSN|social security|\\d{3}-\\d{2}-\\d{4})\\b', transform: 'flag_pii', confidence: 0.99, outputSchema: {} },
            { id: 'regulation-decoder', pattern: '\\b(?:GDPR|HIPAA|SOX|PCI|CCPA|FERPA)\\b', transform: 'flag_regulation', confidence: 0.95, outputSchema: {} },
          ],
        },
        {
          id: 'risk-layer',
          name: 'Risk Assessment',
          type: 'risk',
          priority: 4,
          decoders: [
            { id: 'severity-decoder', pattern: '\\b(?:critical|high|medium|low|info)\\b', transform: 'assess_severity', confidence: 0.85, outputSchema: {} },
            { id: 'impact-decoder', pattern: '\\b(?:breach|outage|loss|damage|exposure)\\b', transform: 'assess_impact', confidence: 0.9, outputSchema: {} },
          ],
        },
        {
          id: 'intent-layer',
          name: 'Intent Classification',
          type: 'intent',
          priority: 5,
          decoders: [
            { id: 'query-decoder', pattern: '\\b(?:what|how|why|when|where|who)\\b', transform: 'classify_query', confidence: 0.7, outputSchema: {} },
            { id: 'command-decoder', pattern: '\\b(?:do|run|execute|start|stop|deploy)\\b', transform: 'classify_command', confidence: 0.85, outputSchema: {} },
          ],
        },
      ],
    };
  }

  getMatrix(): DecodingMatrix {
    return this.matrix;
  }
}
