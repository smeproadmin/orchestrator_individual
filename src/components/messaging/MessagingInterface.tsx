'use client';

import { useState, useRef } from 'react';
import { useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import { Paperclip, Link2, Send, Settings2, ChevronDown, Loader2 } from 'lucide-react';
import type { CostPerfProfile, Message } from '@/lib/orchestrator/types';

const profileLabels: Record<CostPerfProfile, string> = {
  cost: 'OPTIMIZE (COST)',
  performance: 'OPTIMIZE (PERF)',
  balanced: 'AUTO-ORCHESTRATE (COST/PERF)',
};

export default function MessagingInterface() {
  const { state } = useOrchestrator();
  const actions = useOrchestratorActions();
  const [input, setInput] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);

  const handleSend = async () => {
    if (!input.trim() || state.isOrchestrating) return;

    let sessionId = state.activeSessionId;

    if (!sessionId) {
      const newSession = {
        id: crypto.randomUUID(),
        name: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
        status: 'active' as const,
        messages: [],
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gasUsed: 0,
      };
      actions.addSession(newSession);
      sessionId = newSession.id;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    actions.addMessage(sessionId, userMessage);
    setInput('');
    actions.setOrchestrating(true);

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input,
          mode: state.orchestrationMode,
          costPerfProfile: state.costPerfProfile,
          category: state.activeCategory,
        }),
      });

      const data = await response.json();

      const orchestratorMessage: Message = {
        id: data.messageId || crypto.randomUUID(),
        role: 'orchestrator',
        content: data.content || 'Orchestration complete.',
        timestamp: new Date().toISOString(),
        metadata: {
          clawsUsed: data.clawResults?.map((r: { clawType: string }) => r.clawType) || [],
          gasUsed: data.gasUsed || 0,
          decodingPath: data.yellowBrickPath,
          confidence: data.confidence,
        },
      };

      actions.addMessage(sessionId, orchestratorMessage);
      actions.updateGas({
        used: state.gas.used + (data.gasUsed || 0),
        remaining: Math.max(0, state.gas.remaining - (data.gasUsed || 0)),
      });
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Orchestration failed. Please try again.',
        timestamp: new Date().toISOString(),
      };
      actions.addMessage(sessionId, errorMessage);
    } finally {
      actions.setOrchestrating(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Message History */}
      {activeSession && activeSession.messages.length > 0 && (
        <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
          {activeSession.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg rounded-lg px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.role === 'system'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 space-y-0.5">
                    {msg.metadata.clawsUsed && msg.metadata.clawsUsed.length > 0 && (
                      <div>Claws: {msg.metadata.clawsUsed.join(', ')}</div>
                    )}
                    {msg.metadata.confidence !== undefined && (
                      <div>Confidence: {(msg.metadata.confidence * 100).toFixed(1)}%</div>
                    )}
                    {msg.metadata.gasUsed !== undefined && (
                      <div>Gas used: {msg.metadata.gasUsed.toFixed(2)}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messaging Interface Section Label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          MESSAGING INTERFACE
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>

      {/* Input Area */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="flex items-start p-3 gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Subject Matter Expert Compliance Engine. Your Single Source of Truth."
            className="flex-1 resize-none outline-none text-sm text-gray-700 placeholder-gray-400 min-h-[40px] max-h-32 py-1"
            rows={1}
            disabled={state.isOrchestrating}
          />
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <Link2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={state.isOrchestrating || !input.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isOrchestrating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Orchestration Controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="w-0.5 h-4 bg-gray-300 ml-4" />

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {profileLabels[state.costPerfProfile]}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showProfileMenu && (
              <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-48">
                {(Object.entries(profileLabels) as Array<[CostPerfProfile, string]>).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        actions.setCostPerf(key);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                        state.costPerfProfile === key ? 'text-blue-600 font-medium' : 'text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={state.isOrchestrating || !input.trim()}
            className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isOrchestrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Orchestrating...
              </>
            ) : (
              <>
                Orchestrate
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
