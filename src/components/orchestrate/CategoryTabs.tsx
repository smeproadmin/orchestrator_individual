'use client';

import { useState } from 'react';
import { useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import { Plus, User } from 'lucide-react';
import type { CategoryType } from '@/lib/orchestrator/types';

const defaultCategories: Array<{ key: CategoryType; label: string }> = [
  { key: 'compliance_audit', label: 'Compliance Audit' },
  { key: 'risk_analysis', label: 'Risk Analysis' },
  { key: 'automation_plan', label: 'Automation Plan' },
];

export default function CategoryTabs() {
  const { state } = useOrchestrator();
  const { setCategory } = useOrchestratorActions();
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex items-center gap-2 py-4">
      <button
        onClick={() => setCategory('for_you')}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          state.activeCategory === 'for_you'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        FOR YOU
      </button>

      {defaultCategories.map(cat => (
        <button
          key={cat.key}
          onClick={() => setCategory(cat.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            state.activeCategory === cat.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {cat.label}
        </button>
      ))}

      {customCategories.map(cat => (
        <button
          key={cat}
          onClick={() => setCategory('custom')}
          className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          {cat}
        </button>
      ))}

      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        More
      </button>
    </div>
  );
}
