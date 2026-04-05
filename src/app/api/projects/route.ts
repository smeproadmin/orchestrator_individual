import { NextRequest, NextResponse } from 'next/server';
import type { Project } from '@/lib/orchestrator/types';

const projectStore: Project[] = [];

export async function GET() {
  return NextResponse.json({ projects: projectStore });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const project: Project = {
    id: crypto.randomUUID(),
    name: body.name || `Project ${projectStore.length + 1}`,
    description: body.description || '',
    sessions: [],
    vaultItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projectStore.push(project);
  return NextResponse.json(project, { status: 201 });
}
