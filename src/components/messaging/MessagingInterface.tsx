'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import { Paperclip, Link2, Send, Settings2, ChevronDown, Loader2 } from 'lucide-react';
import type { CostPerfProfile, Message } from '@/lib/orchestrator/types';
import { orchestrateClient } from '@/lib/orchestrator/client-engine';
import type { EnrichedOrchestrationResponse } from '@/lib/orchestrator/client-engine';
import { orchestrateLive } from '@/lib/orchestrator/live-engine';
import { hasApiKey } from '@/components/settings/SettingsPanel';
import MessageBubble from './MessageBubble';
import type { WorkflowStep } from '@/components/orchestrate/WorkflowSteps';
import type { Artifact } from '@/components/orchestrate/ArtifactRenderer';

const profileLabels: Record<CostPerfProfile, string> = {
  cost: 'OPTIMIZE (COST)',
  performance: 'OPTIMIZE (PERF)',
  balanced: 'AUTO-ORCHESTRATE (COST/PERF)',
};

// Store enriched data per message
interface MessageEnrichment {
  workflowSteps?: WorkflowStep[];
  artifacts?: Artifact[];
}

export default function MessagingInterface() {
  const { state } = useOrchestrator();
  const actions = useOrchestratorActions();
  const [input, setInput] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [enrichments, setEnrichments] = useState<Record<string, MessageEnrichment>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length]);

  const handleSend = async () => {
    if (!input.trim() || state.isOrchestrating) return;

    const messageText = input;
    let sessionId = state.activeSessionId;

    if (!sessionId) {
      const newSession = {
        id: crypto.randomUUID(),
        name: messageText.substring(0, 40) + (messageText.length > 40 ? '...' : ''),
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
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    actions.addMessage(sessionId, userMessage);
    setInput('');
    actions.setOrchestrating(true);

    try {
      const orchestrationRequest = {
        sessionId,
        message: messageText,
        mode: state.orchestrationMode,
        costPerfProfile: state.costPerfProfile,
        category: state.activeCategory,
      };

      // Try live AI engine first, fall back to local demo engine
      let data: EnrichedOrchestrationResponse;
      if (hasApiKey()) {
        try {
          data = await orchestrateLive(orchestrationRequest);
        } catch (liveError) {
          console.warn('Live engine failed, falling back to local:', liveError);
          data = await orchestrateClient(orchestrationRequest);
        }
      } else {
        data = await orchestrateClient(orchestrationRequest);
      }

      const messageId = data.messageId || crypto.randomUUID();

      const orchestratorMessage: Message = {
        id: messageId,
        role: 'orchestrator',
        content: data.content || 'Orchestration complete.',
        timestamp: new Date().toISOString(),
        metadata: {
          clawsUsed: data.clawResults?.map(r => r.clawType) || [],
          gasUsed: data.gasUsed || 0,
          decodingPath: data.yellowBrickPath,
          confidence: data.confidence,
        },
      };

      // Store enrichment data
      setEnrichments(prev => ({
        ...prev,
        [messageId]: {
          workflowSteps: data.workflowSteps,
          artifacts: data.artifacts,
        },
      }));

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
    <div className="w-full max-w-4xl mx-auto">
      {/* Message History */}
      {activeSession && activeSession.messages.length > 0 && (
        <div className="mb-6 space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {activeSession.messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              workflowSteps={enrichments[msg.id]?.workflowSteps}
              artifacts={enrichments[msg.id]?.artifacts}
            />
          ))}

          {state.isOrchestrating && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Orchestrating through Yellow Brick Road pipeline...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
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
