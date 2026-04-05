import { NextRequest, NextResponse } from 'next/server';
import type { Session } from '@/lib/orchestrator/types';

const sessionStore: Session[] = [];

export async function GET() {
  return NextResponse.json({ sessions: sessionStore });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const session: Session = {
    id: crypto.randomUUID(),
    name: body.name || `Session ${sessionStore.length + 1}`,
    status: 'active',
    messages: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gasUsed: 0,
    projectId: body.projectId,
  };
  sessionStore.push(session);
  return NextResponse.json(session, { status: 201 });
}
