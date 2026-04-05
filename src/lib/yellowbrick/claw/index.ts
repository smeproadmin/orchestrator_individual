// ============================================================================
// Claw Orchestrator - Unified interface for all claw technologies
// Routes tasks to OpenClaw, SwarmAgents, or KimiClaw based on profile
// ============================================================================

import type { ClawResult, ClawType, TaskStep, CostPerfProfile, YellowBrickNode } from '../../orchestrator/types';
import { OpenClawEngine } from './openclaw';
import { SwarmAgentsEngine } from './swarm-agents';
import { KimiClawEngine } from './kimiclaw';

export class ClawOrchestrator {
  private openclaw: OpenClawEngine;
  private swarm: SwarmAgentsEngine;
  private kimiclaw: KimiClawEngine;

  constructor() {
    this.openclaw = new OpenClawEngine();
    this.swarm = new SwarmAgentsEngine();
    this.kimiclaw = new KimiClawEngine();
  }

  async execute(
    clawType: ClawType,
    step: TaskStep,
    profile: CostPerfProfile
  ): Promise<ClawResult> {
    switch (clawType) {
      case 'openclaw':
        return this.openclaw.execute(step, profile);
      case 'swarm':
        return this.swarm.execute(step, profile);
      case 'kimiclaw':
        return this.kimiclaw.execute(step, profile);
      default:
        return this.openclaw.execute(step, profile);
    }
  }

  assignClaws(
    nodes: YellowBrickNode[],
    profile: CostPerfProfile
  ): Record<string, ClawType> {
    const assignments: Record<string, ClawType> = {};

    for (const node of nodes) {
      if (node.clawBinding) {
        assignments[node.id] = node.clawBinding;
      } else {
        assignments[node.id] = this.autoAssign(node, profile);
      }
    }

    return assignments;
  }

  private autoAssign(node: YellowBrickNode, profile: CostPerfProfile): ClawType {
    if (profile === 'cost') return 'openclaw';

    switch (node.type) {
      case 'decode':
        return 'kimiclaw';
      case 'transform':
        return profile === 'performance' ? 'swarm' : 'openclaw';
      case 'route':
        return 'swarm';
      default:
        return 'openclaw';
    }
  }

  getClawStatus(): Array<{ type: ClawType; enabled: boolean; capabilities: string[] }> {
    return [
      this.openclaw.getConfig(),
      this.swarm.getConfig(),
      this.kimiclaw.getConfig(),
    ];
  }
}
