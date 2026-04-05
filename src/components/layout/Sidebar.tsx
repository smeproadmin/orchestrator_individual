'use client';

import { useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import {
  LayoutGrid,
  Plus,
  FolderPlus,
  Lock,
  FileText,
  Clock,
  Folder,
  BarChart3,
  Zap,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export default function Sidebar() {
  const { state } = useOrchestrator();
  const actions = useOrchestratorActions();

  const handleNewSession = () => {
    const session = {
      id: crypto.randomUUID(),
      name: `Session ${state.sessions.length + 1}`,
      status: 'active' as const,
      messages: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gasUsed: 0,
    };
    actions.addSession(session);
  };

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Orchestrator</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <SidebarItem
          icon={<LayoutGrid className="w-4 h-4" />}
          label="Orchestrate"
          active
          onClick={() => actions.setSession(null)}
        />
        <SidebarItem
          icon={<Plus className="w-4 h-4" />}
          label="New Session"
          onClick={handleNewSession}
        />
        <SidebarItem
          icon={<FolderPlus className="w-4 h-4" />}
          label="Create Project"
          onClick={() => {
            const project = {
              id: crypto.randomUUID(),
              name: `Project ${state.projects.length + 1}`,
              description: '',
              sessions: [],
              vaultItems: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            actions.addProject(project);
          }}
        />

        <div className="px-4 mt-1 mb-1">
          <SidebarItem
            icon={<Lock className="w-4 h-4" />}
            label="Vault"
            indent
          />
        </div>

        {/* Vault Items */}
        <SectionHeader label="VAULT ITEMS" />
        {state.vaultItems.map(item => (
          <SidebarItem
            key={item.id}
            icon={<FileText className="w-4 h-4" />}
            label={`${item.type.charAt(0).toUpperCase() + item.type.slice(1)}: ${item.name.substring(0, 15)}...`}
            small
          />
        ))}

        {/* Session History */}
        <SectionHeader label="SESSION HISTORY" />
        {state.sessions.length === 0 ? (
          <div className="px-4 py-1">
            <span className="text-xs text-gray-400 italic">No sessions yet</span>
          </div>
        ) : (
          state.sessions.slice(-5).reverse().map(session => (
            <SidebarItem
              key={session.id}
              icon={<Clock className="w-4 h-4" />}
              label={session.name}
              small
              onClick={() => actions.setSession(session.id)}
              active={state.activeSessionId === session.id}
            />
          ))
        )}

        {/* Projects */}
        <SectionHeader label="PROJECTS" />
        {state.projects.length === 0 ? (
          <div className="px-4 py-1">
            <span className="text-xs text-gray-400 italic">No projects yet</span>
          </div>
        ) : (
          state.projects.map(project => (
            <SidebarItem
              key={project.id}
              icon={<Folder className="w-4 h-4" />}
              label={project.name}
              small
            />
          ))
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 py-2">
        <SidebarItem
          icon={<BarChart3 className="w-4 h-4" />}
          label="GC Usage"
        />
        <SidebarItem
          icon={<Zap className="w-4 h-4" />}
          label="Upgrade"
        />
        <SidebarItem
          icon={<LogOut className="w-4 h-4" />}
          label="Logout"
        />
        <div className="px-4 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500">chrismiguez78@gmail.com</span>
        </div>
      </div>
    </aside>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-4 pb-1">
      <span className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  small,
  indent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  small?: boolean;
  indent?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-left transition-colors ${
        active
          ? 'text-blue-600 bg-blue-50 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      } ${small ? 'text-xs' : 'text-sm'} ${indent ? 'pl-6' : ''}`}
    >
      <span className={active ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
