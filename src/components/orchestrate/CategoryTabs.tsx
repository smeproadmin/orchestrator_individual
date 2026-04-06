'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import { Plus, User, X } from 'lucide-react';
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
  const [newCategoryName, setNewCategoryName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAdd) inputRef.current?.focus();
  }, [showAdd]);

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (name && !customCategories.includes(name)) {
      setCustomCategories(prev => [...prev, name]);
      setNewCategoryName('');
      setShowAdd(false);
      setCategory('custom');
    }
  };

  const handleRemoveCustom = (cat: string) => {
    setCustomCategories(prev => prev.filter(c => c !== cat));
  };

  return (
    <div className="flex items-center gap-2 py-4 flex-wrap">
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
        <div key={cat} className="flex items-center gap-0.5">
          <button
            onClick={() => setCategory('custom')}
            className="px-4 py-2 rounded-l-full text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
          >
            {cat}
          </button>
          <button
            onClick={() => handleRemoveCustom(cat)}
            className="px-1.5 py-2 rounded-r-full bg-purple-100 text-purple-400 hover:text-purple-700 hover:bg-purple-200 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {showAdd ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddCategory();
              if (e.key === 'Escape') { setShowAdd(false); setNewCategoryName(''); }
            }}
            placeholder="Category name..."
            className="px-3 py-1.5 rounded-full text-sm border border-blue-300 outline-none focus:ring-2 focus:ring-blue-200 w-36"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategoryName.trim()}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAdd(false); setNewCategoryName(''); }}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          More
        </button>
      )}
    </div>
  );
}
