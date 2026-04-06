'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import { Paperclip, Link2, Send, Settings2, ChevronDown, Loader2 } from 'lucide-react';
import type { CostPerfProfile, Message } from '@/lib/orchestrator/types';
import { orchestrateClient } from '@/lib/orchestrator/client-engine';
import type { EnrichedOrchestrationResponse } from '@/lib/orchestrator/client-engine';
import MessageBubble from './MessageBubble';
import type { WorkflowStep } from '@/components/orchestrate/WorkflowSteps';
import type { Artifact } from '@/components/orchestrate/ArtifactRenderer';

const profileLabels: Record<CostPerfProfile, string> = {
  cost: 'OPTIMIZE (COST)',
  performance: 'OPTIMIZE (PERF)',
  balanced: 'AUTO-ORCHESTRATE (COST/PERF)',
};

interface MessageEnrichment {
  workflowSteps?: WorkflowStep[];
  artifacts?: Artifact[];
  routing?: {
    primaryAgent: { id: string; name: string; role: string };
    supportingAgents: Array<{ id: string; name: string; role: string }>;
    confidence: number;
    reasoning: string;
  };
}

function extractArtifactsFromContent(content: string): Artifact[] {
  const artifacts: Artifact[] = [];
  const tableRegex = /(?:^|\n)((?:\|[^\n]+\|\n)+)/g;
  let tableMatch;
  let tableIndex = 0;
  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const tableContent = tableMatch[1].trim();
    const lines = tableContent.split('\n').filter(l => l.trim());
    if (lines.length >= 3) {
      tableIndex++;
      const beforeTable = content.substring(0, tableMatch.index);
      const headerMatch = beforeTable.match(/#{1,3}\s+([^\n]+)\s*$/);
      artifacts.push({
        id: crypto.randomUUID(),
        type: 'table',
        title: headerMatch ? headerMatch[1].trim() : `Data Table ${tableIndex}`,
        content: tableContent,
      });
    }
  }
  const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
  let codeMatch;
  let codeIndex = 0;
  while ((codeMatch = codeRegex.exec(content)) !== null) {
    codeIndex++;
    const lang = codeMatch[1] || 'text';
    // Detect HTML artifacts for live rendering
    const isHtml = lang === 'html' && codeMatch[2].includes('<') && codeMatch[2].length > 100;
    artifacts.push({
      id: crypto.randomUUID(),
      type: isHtml ? 'interactive' as Artifact['type'] : 'code',
      title: isHtml ? `Interactive App ${codeIndex}` : `Code Block ${codeIndex}`,
      content: codeMatch[2].trim(),
      language: lang,
    });
  }
  return artifacts;
}

interface MessagingInterfaceProps {
  pendingPrompt?: string | null;
  onPromptConsumed?: () => void;
}

export default function MessagingInterface({ pendingPrompt, onPromptConsumed }: MessagingInterfaceProps) {
  const { state } = useOrchestrator();
  const actions = useOrchestratorActions();
  const [input, setInput] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [enrichments, setEnrichments] = useState<Record<string, MessageEnrichment>>({});
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);

  // Handle pending prompt from prompt library
  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt);
      onPromptConsumed?.();
      textareaRef.current?.focus();
    }
  }, [pendingPrompt, onPromptConsumed]);

  // Check if server API is available on mount
  useEffect(() => {
    fetch('/api/orchestrate')
      .then(r => r.json())
      .then(data => setServerAvailable(data.status === 'operational'))
      .catch(() => setServerAvailable(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length]);

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const prefix = input ? input + '\n\n' : '';
      setInput(prefix + `[Attached: ${file.name}]\n${content.substring(0, 2000)}${content.length > 2000 ? '\n... (truncated)' : ''}`);
      textareaRef.current?.focus();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleInsertLink = () => {
    const url = prompt('Enter a URL to reference:');
    if (url?.trim()) {
      const prefix = input ? input + ' ' : '';
      setInput(prefix + url.trim());
      textareaRef.current?.focus();
    }
  };

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
      let data: EnrichedOrchestrationResponse & { routing?: MessageEnrichment['routing'] };

      if (serverAvailable) {
        // Use server-side API (managed API keys, multi-agent orchestration)
        const response = await fetch('/api/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message: messageText,
            category: state.activeCategory,
            costPerfProfile: state.costPerfProfile,
            conversationHistory: (activeSession?.messages || [])
              .slice(-10)
              .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Server error' }));
          throw new Error(err.error || `Server error: ${response.status}`);
        }

        const serverData = await response.json();
        const artifacts = extractArtifactsFromContent(serverData.content || '');

        data = {
          ...serverData,
          artifacts,
          clawResults: [],
          tasks: [],
          decodingLayers: ['Agent Router', 'Intent Analysis', 'Live AI Engine'],
          yellowBrickPath: `path_${state.activeCategory || 'for_you'}`,
        };
      } else {
        // Fall back to client-side demo engine
        data = await orchestrateClient({
          sessionId,
          message: messageText,
          mode: state.orchestrationMode,
          costPerfProfile: state.costPerfProfile,
          category: state.activeCategory,
        });
      }

      const messageId = data.messageId || crypto.randomUUID();

      const agentClaws = data.routing
        ? [data.routing.primaryAgent.id, ...data.routing.supportingAgents.map(a => a.id)] as string[]
        : data.clawResults?.map(r => r.clawType) || [];

      const orchestratorMessage: Message = {
        id: messageId,
        role: 'orchestrator',
        content: data.content || 'Orchestration complete.',
        timestamp: new Date().toISOString(),
        metadata: {
          clawsUsed: agentClaws as Message['metadata'] extends { clawsUsed?: infer T } ? T : never,
          gasUsed: data.gasUsed || 0,
          decodingPath: data.yellowBrickPath,
          confidence: data.confidence,
        },
      };

      setEnrichments(prev => ({
        ...prev,
        [messageId]: {
          workflowSteps: data.workflowSteps,
          artifacts: data.artifacts,
          routing: data.routing,
        },
      }));

      actions.addMessage(sessionId, orchestratorMessage);
      actions.updateGas({
        used: state.gas.used + (data.gasUsed || 0),
        remaining: Math.max(0, state.gas.remaining - (data.gasUsed || 0)),
      });
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Orchestration error: ${error instanceof Error ? error.message : 'Unknown error'}. ${!serverAvailable ? 'Running in demo mode — deploy with ANTHROPIC_API_KEY for live responses.' : ''}`,
        timestamp: new Date().toISOString(),
      };
      actions.addMessage(sessionId, errorMessage);
    } finally {
      actions.setOrchestrating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hidden file input for attachments */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.py,.pdf,.doc,.docx"
        onChange={handleFileSelected}
      />

      {/* Message History */}
      {activeSession && activeSession.messages.length > 0 && (
        <div className="mb-6 space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {activeSession.messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              workflowSteps={enrichments[msg.id]?.workflowSteps}
              artifacts={enrichments[msg.id]?.artifacts}
              routing={enrichments[msg.id]?.routing}
            />
          ))}

          {state.isOrchestrating && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>
                    {serverAvailable
                      ? 'Routing to expert agents via Yellow Brick Road pipeline...'
                      : 'Processing through demo orchestration engine...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Messaging Interface Section Label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            MESSAGING INTERFACE
          </span>
          {serverAvailable !== null && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              serverAvailable
                ? 'bg-green-50 text-green-600'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {serverAvailable ? 'LIVE' : 'DEMO'}
            </span>
          )}
        </div>
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
            <button
              onClick={handleAttachment}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Attach a file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={handleInsertLink}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Insert a link"
            >
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
