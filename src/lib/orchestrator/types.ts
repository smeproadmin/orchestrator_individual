// ============================================================================
// Orchestrator Intelligence System - Core Types
// Yellow Brick Road Architecture
// ============================================================================

export type OrchestrationMode = 'auto' | 'manual' | 'hybrid';
export type CostPerfProfile = 'cost' | 'performance' | 'balanced';
export type SessionStatus = 'active' | 'paused' | 'completed' | 'archived';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ClawType = 'openclaw' | 'swarm' | 'kimiclaw';
export type VaultItemType = 'snippet' | 'template' | 'credential' | 'config' | 'document';
export type TabType = 'builder' | 'prompts' | 'gallery';
export type CategoryType = 'for_you' | 'compliance_audit' | 'risk_analysis' | 'automation_plan' | 'custom';

// Yellow Brick Road Node - the foundational routing unit
export interface YellowBrickNode {
  id: string;
  type: 'ingress' | 'transform' | 'decode' | 'route' | 'egress';
  label: string;
  clawBinding?: ClawType;
  decodingLayer?: string;
  next: string[];
  metadata: Record<string, unknown>;
}

// Yellow Brick Road Path - a complete orchestration pipeline
export interface YellowBrickPath {
  id: string;
  name: string;
  nodes: YellowBrickNode[];
  entryNodeId: string;
  createdAt: string;
  version: number;
}

// Compliance OS Universal Decoding Matrix
export interface DecodingMatrix {
  id: string;
  name: string;
  version: string;
  layers: DecodingLayer[];
  universalCodec: string;
}

export interface DecodingLayer {
  id: string;
  name: string;
  type: 'semantic' | 'structural' | 'compliance' | 'risk' | 'intent';
  decoders: Decoder[];
  priority: number;
}

export interface Decoder {
  id: string;
  pattern: string;
  transform: string;
  confidence: number;
  outputSchema: Record<string, unknown>;
}

// Claw Technology Interfaces
export interface ClawConfig {
  type: ClawType;
  enabled: boolean;
  endpoint?: string;
  capabilities: string[];
  maxConcurrency: number;
  costWeight: number;
  perfWeight: number;
}

export interface ClawResult {
  clawType: ClawType;
  status: 'success' | 'error' | 'partial';
  data: unknown;
  confidence: number;
  latencyMs: number;
  tokensUsed: number;
  cost: number;
}

// Task Engine (Copilot-style)
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedClaw?: ClawType;
  input: unknown;
  output?: unknown;
  steps: TaskStep[];
  createdAt: string;
  completedAt?: string;
  gasUsed: number;
}

export interface TaskStep {
  id: string;
  name: string;
  status: TaskStatus;
  clawType?: ClawType;
  input?: unknown;
  output?: unknown;
  startedAt?: string;
  completedAt?: string;
}

// Skill System (Skill.md-inspired)
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: CategoryType;
  trigger: string;
  steps: SkillStep[];
  requiredClaws: ClawType[];
  gasEstimate: number;
}

export interface SkillStep {
  id: string;
  action: string;
  clawType: ClawType;
  decodingLayerId?: string;
  retryPolicy?: { maxRetries: number; backoffMs: number };
}

// Session Management
export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  messages: Message[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
  gasUsed: number;
  projectId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'orchestrator' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    clawsUsed?: ClawType[];
    gasUsed?: number;
    decodingPath?: string;
    confidence?: number;
  };
}

// Project Management
export interface Project {
  id: string;
  name: string;
  description: string;
  sessions: string[];
  vaultItems: string[];
  createdAt: string;
  updatedAt: string;
}

// Vault System
export interface VaultItem {
  id: string;
  name: string;
  type: VaultItemType;
  content: string;
  tags: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

// Gas System (resource tracking)
export interface GasState {
  total: number;
  used: number;
  remaining: number;
  plan: 'free' | 'pro' | 'enterprise';
  lowThreshold: number;
}

// Orchestration Request/Response
export interface OrchestrationRequest {
  sessionId: string;
  message: string;
  mode: OrchestrationMode;
  costPerfProfile: CostPerfProfile;
  category?: CategoryType;
  attachments?: string[];
  vaultContext?: string[];
}

export interface OrchestrationResponse {
  sessionId: string;
  messageId: string;
  content: string;
  tasks: Task[];
  clawResults: ClawResult[];
  gasUsed: number;
  yellowBrickPath: string;
  decodingLayers: string[];
  confidence: number;
}
