'use client';

import { useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import { Settings, Zap, AlertCircle } from 'lucide-react';
import type { TabType } from '@/lib/orchestrator/types';

const tabs: Array<{ key: TabType; label: string; icon?: boolean }> = [
  { key: 'builder', label: 'BUILDER' },
  { key: 'prompts', label: 'PROMPTS', icon: true },
  { key: 'gallery', label: 'GALLERY' },
];

export default function Header() {
  const { state } = useOrchestrator();
  const { setTab, toggleSidebar } = useOrchestratorActions();
  const { gas } = state;
  const isLowGas = gas.remaining <= gas.lowThreshold;

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-6">
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <nav className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`px-4 py-1.5 text-xs font-semibold tracking-wider rounded-md transition-colors ${
                state.activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.icon && (
                <Settings className="inline-block w-3 h-3 ml-1 -mt-0.5" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-xs font-medium text-gray-600 tracking-wide">
            {gas.plan.toUpperCase()} PLAN
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-800">
            {gas.remaining.toFixed(1)} GAS CREDITS
          </span>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isLowGas ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(gas.remaining / gas.total) * 100}%` }}
            />
          </div>
        </div>

        {isLowGas && (
          <div className="flex items-center gap-1 text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">LOW GAS</span>
          </div>
        )}

        <button
          onClick={() => window.open('https://openclawguardrails.com', '_self')}
          className="bg-gray-900 text-white px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          Upgrade
        </button>
      </div>
    </header>
  );
}
