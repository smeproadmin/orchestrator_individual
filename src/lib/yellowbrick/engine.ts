// ============================================================================
// Yellow Brick Road Engine
// Core orchestration pipeline that routes intelligence through decoding
// layers and claw technologies
// ============================================================================

import type {
  YellowBrickPath,
  YellowBrickNode,
  OrchestrationRequest,
  OrchestrationResponse,
  ClawResult,
  Task,
  TaskStep,
  DecodingMatrix,
  CostPerfProfile,
} from '../orchestrator/types';
import { DecodingMatrixEngine } from './decoding-matrix';
import { ClawOrchestrator } from './claw';

export class YellowBrickEngine {
  private decodingEngine: DecodingMatrixEngine;
  private clawOrchestrator: ClawOrchestrator;
  private paths: Map<string, YellowBrickPath> = new Map();

  constructor() {
    this.decodingEngine = new DecodingMatrixEngine();
    this.clawOrchestrator = new ClawOrchestrator();
    this.initializeDefaultPaths();
  }

  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const path = this.selectPath(request);
    const decodedInput = await this.decodingEngine.decode(request.message, request.category);
    const tasks = this.buildTaskPipeline(decodedInput, path, request.costPerfProfile);
    const clawResults = await this.executeClawPipeline(tasks, request.costPerfProfile);
    const synthesized = this.synthesizeResults(clawResults, decodedInput);

    const gasUsed = this.calculateGas(clawResults);

    return {
      sessionId: request.sessionId,
      messageId: crypto.randomUUID(),
      content: synthesized.content,
      tasks,
      clawResults,
      gasUsed,
      yellowBrickPath: path.id,
      decodingLayers: decodedInput.layersUsed,
      confidence: synthesized.confidence,
    };
  }

  private selectPath(request: OrchestrationRequest): YellowBrickPath {
    const category = request.category || 'for_you';
    const pathKey = `path_${category}`;
    return this.paths.get(pathKey) || this.paths.get('path_for_you')!;
  }

  private buildTaskPipeline(
    decodedInput: { intent: string; entities: string[]; layersUsed: string[]; complexity: number },
    path: YellowBrickPath,
    profile: CostPerfProfile
  ): Task[] {
    const nodes = this.topologicalSort(path);
    const clawAssignments = this.clawOrchestrator.assignClaws(nodes, profile);

    return [{
      id: crypto.randomUUID(),
      title: `Process: ${decodedInput.intent}`,
      description: `Orchestrating through ${nodes.length} nodes via Yellow Brick Road`,
      status: 'running',
      input: decodedInput,
      steps: nodes.map((node, i): TaskStep => ({
        id: crypto.randomUUID(),
        name: node.label,
        status: i === 0 ? 'running' : 'pending',
        clawType: clawAssignments[node.id],
      })),
      createdAt: new Date().toISOString(),
      gasUsed: 0,
    }];
  }

  private async executeClawPipeline(
    tasks: Task[],
    profile: CostPerfProfile
  ): Promise<ClawResult[]> {
    const results: ClawResult[] = [];
    for (const task of tasks) {
      for (const step of task.steps) {
        if (step.clawType) {
          const result = await this.clawOrchestrator.execute(step.clawType, step, profile);
          results.push(result);
          step.status = result.status === 'success' ? 'completed' : 'failed';
        }
      }
      task.status = task.steps.every(s => s.status === 'completed') ? 'completed' : 'failed';
    }
    return results;
  }

  private synthesizeResults(
    results: ClawResult[],
    decodedInput: { intent: string; entities: string[]; layersUsed: string[]; complexity: number }
  ): { content: string; confidence: number } {
    if (results.length === 0) {
      return { content: 'No results generated.', confidence: 0 };
    }

    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const successResults = results.filter(r => r.status === 'success');

    const content = [
      `**Orchestration Complete** — Intent: ${decodedInput.intent}`,
      ``,
      `Processed through ${decodedInput.layersUsed.length} decoding layers with ${successResults.length}/${results.length} successful claw executions.`,
      ``,
      `**Entities detected:** ${decodedInput.entities.join(', ') || 'None'}`,
      `**Confidence:** ${(avgConfidence * 100).toFixed(1)}%`,
      `**Claws utilized:** ${[...new Set(results.map(r => r.clawType))].join(', ')}`,
    ].join('\n');

    return { content, confidence: avgConfidence };
  }

  private calculateGas(results: ClawResult[]): number {
    return results.reduce((total, r) => total + r.cost * 10, 0);
  }

  private topologicalSort(path: YellowBrickPath): YellowBrickNode[] {
    const visited = new Set<string>();
    const sorted: YellowBrickNode[] = [];
    const nodeMap = new Map(path.nodes.map(n => [n.id, n]));

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (!node) return;
      for (const next of node.next) {
        visit(next);
      }
      sorted.unshift(node);
    };

    visit(path.entryNodeId);
    return sorted;
  }

  private initializeDefaultPaths() {
    const defaultCategories = ['for_you', 'compliance_audit', 'risk_analysis', 'automation_plan'];

    for (const category of defaultCategories) {
      const path = this.createDefaultPath(category);
      this.paths.set(`path_${category}`, path);
    }
  }

  private createDefaultPath(category: string): YellowBrickPath {
    const nodes: YellowBrickNode[] = [
      {
        id: `${category}_ingress`,
        type: 'ingress',
        label: 'Input Reception',
        next: [`${category}_decode`],
        metadata: { category },
      },
      {
        id: `${category}_decode`,
        type: 'decode',
        label: 'Universal Decoding',
        decodingLayer: category === 'compliance_audit' ? 'compliance' : 'semantic',
        next: [`${category}_route`],
        metadata: {},
      },
      {
        id: `${category}_route`,
        type: 'route',
        label: 'Claw Router',
        clawBinding: category === 'automation_plan' ? 'swarm' : 'openclaw',
        next: [`${category}_transform`],
        metadata: {},
      },
      {
        id: `${category}_transform`,
        type: 'transform',
        label: 'Result Transform',
        next: [`${category}_egress`],
        metadata: {},
      },
      {
        id: `${category}_egress`,
        type: 'egress',
        label: 'Output Synthesis',
        next: [],
        metadata: {},
      },
    ];

    return {
      id: `path_${category}`,
      name: `${category.replace(/_/g, ' ')} Pipeline`,
      nodes,
      entryNodeId: `${category}_ingress`,
      createdAt: new Date().toISOString(),
      version: 1,
    };
  }

  getRegisteredPaths(): YellowBrickPath[] {
    return Array.from(this.paths.values());
  }

  getDecodingMatrix(): DecodingMatrix {
    return this.decodingEngine.getMatrix();
  }
}

// Singleton
let engineInstance: YellowBrickEngine | null = null;
export function getEngine(): YellowBrickEngine {
  if (!engineInstance) {
    engineInstance = new YellowBrickEngine();
  }
  return engineInstance;
}
