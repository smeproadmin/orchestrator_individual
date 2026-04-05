import { NextRequest, NextResponse } from 'next/server';
import { routeToAgents } from '@/lib/agents/router';
import type { AgentDefinition } from '@/lib/agents/registry';
import type { CategoryType, CostPerfProfile } from '@/lib/orchestrator/types';

const MODEL_MAP: Record<string, string> = {
  fast: 'claude-haiku-4-5-20251001',
  balanced: 'claude-sonnet-4-20250514',
  powerful: 'claude-sonnet-4-20250514',
};

interface OrchestrationRequestBody {
  sessionId: string;
  message: string;
  category?: CategoryType;
  costPerfProfile?: CostPerfProfile;
  conversationHistory?: Array<{ role: string; content: string }>;
}

async function callAgent(
  agent: AgentDefinition,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  apiKey: string
): Promise<{ content: string; usage: { input_tokens: number; output_tokens: number } }> {
  const model = MODEL_MAP[agent.model] || MODEL_MAP.balanced;

  const messages = [
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: agent.maxTokens,
      temperature: agent.temperature,
      system: agent.systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Agent ${agent.name} failed: ${response.status} — ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || 'No response generated.',
    usage: data.usage || { input_tokens: 0, output_tokens: 0 },
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server not configured. ANTHROPIC_API_KEY environment variable is required.' },
      { status: 503 }
    );
  }

  try {
    const body: OrchestrationRequestBody = await request.json();
    const { message, category, conversationHistory = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Route to the best agent(s)
    const routing = routeToAgents(message, category);

    // Execute primary agent
    const startTime = Date.now();
    const primaryResult = await callAgent(
      routing.primaryAgent,
      message,
      conversationHistory,
      apiKey
    );
    const primaryLatency = Date.now() - startTime;

    // Execute supporting agents in parallel (for enrichment context)
    const supportingResults = await Promise.allSettled(
      routing.supportingAgents.map(agent =>
        callAgent(
          agent,
          `Based on this user request: "${message}"\n\nProvide a brief supplementary analysis from your domain expertise (2-3 key points only, in bullet format). This will enrich the primary response.`,
          [],
          apiKey
        )
      )
    );

    // Compile supporting insights
    const supportingInsights = supportingResults
      .filter((r): r is PromiseFulfilledResult<{ content: string; usage: { input_tokens: number; output_tokens: number } }> => r.status === 'fulfilled')
      .map((r, i) => ({
        agentId: routing.supportingAgents[i].id,
        agentName: routing.supportingAgents[i].name,
        content: r.value.content,
        usage: r.value.usage,
      }));

    // Calculate gas usage
    const totalInputTokens = primaryResult.usage.input_tokens +
      supportingInsights.reduce((sum, s) => sum + s.usage.input_tokens, 0);
    const totalOutputTokens = primaryResult.usage.output_tokens +
      supportingInsights.reduce((sum, s) => sum + s.usage.output_tokens, 0);
    const gasUsed = ((totalInputTokens + totalOutputTokens) / 1000) * 0.1 * routing.primaryAgent.costMultiplier;

    // Build enriched content
    let content = primaryResult.content;
    if (supportingInsights.length > 0) {
      content += '\n\n---\n\n### Additional Expert Insights\n';
      for (const insight of supportingInsights) {
        content += `\n**${insight.agentName}:**\n${insight.content}\n`;
      }
    }

    // Build workflow steps
    const workflowSteps = [
      {
        id: crypto.randomUUID(),
        name: 'Intent Analysis & Entity Extraction',
        status: 'completed' as const,
        description: routing.reasoning,
        clawType: 'kimiclaw',
        output: `Detected: ${routing.detectedIntents.join(', ') || 'general inquiry'}\nEntities: ${[...routing.entities.locations, ...routing.entities.prices, ...routing.entities.regulations].join(', ') || 'none'}`,
      },
      {
        id: crypto.randomUUID(),
        name: `Agent Selection: ${routing.primaryAgent.name}`,
        status: 'completed' as const,
        description: `Selected ${routing.primaryAgent.role} as primary with confidence ${(routing.confidence * 100).toFixed(0)}%`,
        clawType: 'swarm',
        output: `Primary: ${routing.primaryAgent.name}\nSupporting: ${routing.supportingAgents.map(a => a.name).join(', ') || 'none'}\nModel: ${MODEL_MAP[routing.primaryAgent.model]}`,
      },
      {
        id: crypto.randomUUID(),
        name: 'Primary Agent Execution',
        status: 'completed' as const,
        description: `${routing.primaryAgent.name} processed the request`,
        clawType: 'openclaw',
        output: `Latency: ${primaryLatency}ms\nTokens: ${primaryResult.usage.input_tokens} in / ${primaryResult.usage.output_tokens} out`,
      },
      ...(routing.supportingAgents.length > 0 ? [{
        id: crypto.randomUUID(),
        name: `Supporting Analysis (${routing.supportingAgents.length} agents)`,
        status: 'completed' as const,
        description: routing.supportingAgents.map(a => a.name).join(', '),
        clawType: 'swarm' as const,
      }] : []),
      {
        id: crypto.randomUUID(),
        name: 'Response Synthesis',
        status: 'completed' as const,
        description: 'Compiled primary and supporting agent outputs into unified response',
        clawType: 'openclaw',
      },
    ];

    return NextResponse.json({
      sessionId: body.sessionId,
      messageId: crypto.randomUUID(),
      content,
      routing: {
        primaryAgent: { id: routing.primaryAgent.id, name: routing.primaryAgent.name, role: routing.primaryAgent.role },
        supportingAgents: routing.supportingAgents.map(a => ({ id: a.id, name: a.name, role: a.role })),
        confidence: routing.confidence,
        reasoning: routing.reasoning,
        detectedIntents: routing.detectedIntents,
      },
      workflowSteps,
      gasUsed,
      tokens: { input: totalInputTokens, output: totalOutputTokens, total: totalInputTokens + totalOutputTokens },
      confidence: routing.confidence,
      latencyMs: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      { error: 'Orchestration failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    status: hasKey ? 'operational' : 'unconfigured',
    message: hasKey
      ? 'Orchestrator is ready to process requests'
      : 'ANTHROPIC_API_KEY environment variable not set',
  });
}
