'use client';

import { useState } from 'react';
import { OrchestratorProvider, useOrchestrator, useOrchestratorActions } from '@/store/orchestrator-context';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import CategoryTabs from '@/components/orchestrate/CategoryTabs';
import MessagingInterface from '@/components/messaging/MessagingInterface';
import VaultPanel from '@/components/layout/VaultPanel';
import { BarChart3, X, Zap } from 'lucide-react';

function GasUsageModal({ onClose }: { onClose: () => void }) {
  const { state } = useOrchestrator();
  const { gas } = state;
  const pct = ((gas.used / gas.total) * 100).toFixed(1);

  return (
    <div className="absolute inset-0 z-30 bg-black/20 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Gas Credits Usage</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Used</span>
              <span className="font-semibold text-gray-900">{gas.used.toFixed(1)} / {gas.total} GC</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${gas.remaining <= gas.lowThreshold ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-700">{gas.remaining.toFixed(1)}</div>
              <div className="text-[10px] text-blue-500 font-medium">REMAINING</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-700">{gas.used.toFixed(1)}</div>
              <div className="text-[10px] text-gray-500 font-medium">USED</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-700">{state.sessions.length}</div>
              <div className="text-[10px] text-gray-500 font-medium">SESSIONS</div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Plan</span>
              <span className="font-medium text-gray-700">{gas.plan.toUpperCase()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Low threshold</span>
              <span className="font-medium text-gray-700">{gas.lowThreshold} GC</span>
            </div>
          </div>

          <button
            onClick={() => window.open('https://openclawguardrails.com', '_self')}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade for More Gas Credits
          </button>
        </div>
      </div>
    </div>
  );
}

function OrchestratorApp() {
  const { state } = useOrchestrator();
  const actions = useOrchestratorActions();
  const [showVault, setShowVault] = useState(false);
  const [showGasUsage, setShowGasUsage] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const handleLoadPrompt = (title: string, desc: string) => {
    setPendingPrompt(`${title}: ${desc}`);
    actions.setTab('builder');
  };

  const handleOpenSession = (sessionId: string) => {
    actions.setSession(sessionId);
    actions.setTab('builder');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {state.sidebarOpen && (
          <Sidebar onOpenVault={() => setShowVault(true)} onShowGasUsage={() => setShowGasUsage(true)} />
        )}
        <main className="flex-1 overflow-y-auto relative">
          {/* Modal Overlays */}
          {showVault && (
            <div className="absolute inset-0 z-20 bg-black/20 flex items-start justify-center pt-16">
              <VaultPanel onClose={() => setShowVault(false)} />
            </div>
          )}

          {showGasUsage && (
            <GasUsageModal onClose={() => setShowGasUsage(false)} />
          )}

          {state.activeTab === 'builder' && (
            <div className="max-w-5xl mx-auto px-8 py-8">
              {/* Hero / Branding */}
              <div className="text-center mb-8">
                <h1
                  className="text-7xl font-serif text-gray-900 mb-4 tracking-tight"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 bg-clip-text text-transparent">
                    Orchestrator
                  </span>
                </h1>
                <p className="text-xs tracking-[0.35em] text-gray-500 font-medium uppercase">
                  Empowering with AI, not replacing.
                </p>
              </div>

              {/* Category Tabs */}
              <div className="flex justify-center mb-6">
                <CategoryTabs />
              </div>

              {/* Messaging Interface */}
              <MessagingInterface pendingPrompt={pendingPrompt} onPromptConsumed={() => setPendingPrompt(null)} />
            </div>
          )}

          {state.activeTab === 'prompts' && (
            <div className="max-w-4xl mx-auto px-8 py-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Prompt Library</h2>
              <p className="text-sm text-gray-500 mb-6">
                Pre-built orchestration prompts optimized for different use cases. Click to load into the messaging interface.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Compliance Gap Analysis', desc: 'Identify compliance gaps against regulatory frameworks (GDPR, HIPAA, SOX, PCI)', category: 'Compliance' },
                  { title: 'Risk Heat Map Generator', desc: 'Generate a comprehensive risk assessment heat map with likelihood and impact scoring', category: 'Risk' },
                  { title: 'Process Automation Blueprint', desc: 'Design an automation pipeline for business processes with cost/ROI estimates', category: 'Automation' },
                  { title: 'Vendor Risk Assessment', desc: 'Evaluate third-party vendor security posture and compliance status', category: 'Risk' },
                  { title: 'Data Privacy Audit', desc: 'Audit data handling practices against GDPR/CCPA requirements', category: 'Compliance' },
                  { title: 'Incident Response Plan', desc: 'Generate an incident response playbook with escalation procedures', category: 'Security' },
                  { title: 'Market Research Brief', desc: 'Research and summarize market intelligence with competitive analysis', category: 'Research' },
                  { title: 'Financial Analysis Report', desc: 'Analyze financial data, generate insights, and forecast trends', category: 'Finance' },
                  { title: 'Real Estate Market Analysis', desc: 'Analyze property listings, market trends, and comparable sales by area', category: 'Real Estate' },
                  { title: 'Code Architecture Review', desc: 'Review system architecture and recommend improvements', category: 'Engineering' },
                ].map((prompt, i) => (
                  <div
                    key={i}
                    onClick={() => handleLoadPrompt(prompt.title, prompt.desc)}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{prompt.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium shrink-0">
                        {prompt.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{prompt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.activeTab === 'gallery' && (
            <div className="max-w-4xl mx-auto px-8 py-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Gallery</h2>
              <p className="text-sm text-gray-500 mb-6">
                Saved orchestration outputs, reports, and artifacts from your sessions.
              </p>
              {state.sessions.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-gray-400">No saved outputs yet. Start orchestrating to see your results here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {state.sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleOpenSession(session.id)}
                      className="border border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 cursor-pointer transition-all"
                    >
                      <h3 className="text-sm font-semibold text-gray-800 truncate mb-1">{session.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">
                        {session.messages.length} messages &middot; {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                          {session.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <OrchestratorProvider>
      <OrchestratorApp />
    </OrchestratorProvider>
  );
}
