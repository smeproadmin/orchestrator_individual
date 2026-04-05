import { NextRequest, NextResponse } from 'next/server';
import type { VaultItem } from '@/lib/orchestrator/types';

const vaultStore: VaultItem[] = [
  {
    id: 'snippet-1',
    name: 'As an Intelligent Orchestrator...',
    type: 'snippet',
    content: 'As an Intelligent Orchestrator, your role is to coordinate multiple AI capabilities to deliver comprehensive, compliance-aware solutions.',
    tags: ['system', 'prompt'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ items: vaultStore });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const item: VaultItem = {
    id: crypto.randomUUID(),
    name: body.name,
    type: body.type || 'snippet',
    content: body.content,
    tags: body.tags || [],
    projectId: body.projectId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  vaultStore.push(item);
  return NextResponse.json(item, { status: 201 });
}
