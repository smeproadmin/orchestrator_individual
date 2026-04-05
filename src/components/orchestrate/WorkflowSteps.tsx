'use client';

import { CheckCircle, Circle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'pending';
  description: string;
  clawType?: string;
  output?: string;
}

export default function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-3 border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
          Orchestration Workflow
        </span>
      </div>
      <div className="p-3">
        {steps.map((step, i) => {
          const isExpanded = expanded.has(step.id);
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-3">
              {/* Vertical line + icon */}
              <div className="flex flex-col items-center">
                <div className="shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : step.status === 'active' ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-4 ${
                    step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 ${!isLast ? 'pb-3' : ''}`}>
                <button
                  onClick={() => toggle(step.id)}
                  className="flex items-center gap-1.5 w-full text-left"
                >
                  {step.output || step.description ? (
                    isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                    )
                  ) : (
                    <span className="w-3" />
                  )}
                  <span className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-gray-700' :
                    step.status === 'active' ? 'text-blue-700' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                  {step.clawType && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      step.clawType === 'openclaw' ? 'bg-emerald-100 text-emerald-700' :
                      step.clawType === 'swarm' ? 'bg-purple-100 text-purple-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {step.clawType}
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1.5 ml-4.5 space-y-1.5">
                    {step.description && (
                      <p className="text-xs text-gray-500">{step.description}</p>
                    )}
                    {step.output && (
                      <div className="text-xs bg-gray-50 border border-gray-100 rounded p-2 text-gray-600 font-mono whitespace-pre-wrap">
                        {step.output}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
