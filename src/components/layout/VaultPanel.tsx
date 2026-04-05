'use client';

import { useState } from 'react';
import { useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import { Plus, FileText, X, Save } from 'lucide-react';
import type { VaultItemType } from '@/lib/orchestrator/types';

export default function VaultPanel({ onClose }: { onClose: () => void }) {
  const { state } = useOrchestrator();
  const actions = useOrchestratorActions();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<VaultItemType>('snippet');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim() || !newContent.trim()) return;
    actions.addVaultItem({
      id: crypto.randomUUID(),
      name: newName,
      type: newType,
      content: newContent,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewName('');
    setNewContent('');
    setShowAdd(false);
  };

  const selected = state.vaultItems.find(v => v.id === selectedItem);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl w-full max-h-[500px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Vault</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-2">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Item name"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400"
            />
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as VaultItemType)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
            >
              <option value="snippet">Snippet</option>
              <option value="template">Template</option>
              <option value="document">Document</option>
              <option value="config">Config</option>
            </select>
          </div>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Content..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 min-h-[60px]"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || !newContent.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {state.vaultItems.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No vault items yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {state.vaultItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selectedItem === item.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.type} &middot; {new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {selectedItem === item.id && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono whitespace-pre-wrap">
                    {item.content}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
