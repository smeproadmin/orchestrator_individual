import { NextRequest, NextResponse } from 'next/server';
import { getEngine } from '@/lib/yellowbrick/engine';
import type { OrchestrationRequest } from '@/lib/orchestrator/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as OrchestrationRequest;

    const engine = getEngine();
    const result = await engine.orchestrate({
      sessionId: body.sessionId,
      message: body.message,
      mode: body.mode || 'auto',
      costPerfProfile: body.costPerfProfile || 'balanced',
      category: body.category,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      { error: 'Orchestration failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const engine = getEngine();
  return NextResponse.json({
    status: 'operational',
    paths: engine.getRegisteredPaths().map(p => ({ id: p.id, name: p.name })),
    matrix: {
      id: engine.getDecodingMatrix().id,
      version: engine.getDecodingMatrix().version,
      layers: engine.getDecodingMatrix().layers.length,
    },
  });
}
