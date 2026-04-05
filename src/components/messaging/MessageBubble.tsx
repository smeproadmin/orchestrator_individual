'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/lib/orchestrator/types';
import WorkflowSteps from '@/components/orchestrate/WorkflowSteps';
import ArtifactRenderer from '@/components/orchestrate/ArtifactRenderer';
import type { WorkflowStep } from '@/components/orchestrate/WorkflowSteps';
import type { Artifact } from '@/components/orchestrate/ArtifactRenderer';

interface MessageBubbleProps {
  message: Message;
  workflowSteps?: WorkflowStep[];
  artifacts?: Artifact[];
}

export default function MessageBubble({ message, workflowSteps, artifacts }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-lg ${isUser ? 'max-w-lg' : 'max-w-2xl w-full'}`}>
        {/* Message content */}
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
          }`}
        >
          {isUser ? (
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-p:text-gray-700 prose-strong:text-gray-900 prose-table:text-sm prose-th:bg-gray-50 prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-li:text-gray-700 prose-a:text-blue-600">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Workflow Steps (orchestrator messages only) */}
        {!isUser && !isSystem && workflowSteps && workflowSteps.length > 0 && (
          <WorkflowSteps steps={workflowSteps} />
        )}

        {/* Artifacts (orchestrator messages only) */}
        {!isUser && !isSystem && artifacts && artifacts.length > 0 && (
          <ArtifactRenderer artifacts={artifacts} />
        )}

        {/* Metadata footer */}
        {message.metadata && !isUser && (
          <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px] text-gray-400 px-1">
            {message.metadata.clawsUsed && message.metadata.clawsUsed.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Claws:</span>
                {message.metadata.clawsUsed.map(c => (
                  <span key={c} className={`px-1.5 py-0.5 rounded-full font-medium ${
                    c === 'openclaw' ? 'bg-emerald-50 text-emerald-600' :
                    c === 'swarm' ? 'bg-purple-50 text-purple-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {c}
                  </span>
                ))}
              </span>
            )}
            {message.metadata.confidence !== undefined && (
              <span>
                <span className="font-medium">Confidence:</span> {(message.metadata.confidence * 100).toFixed(1)}%
              </span>
            )}
            {message.metadata.gasUsed !== undefined && message.metadata.gasUsed > 0 && (
              <span>
                <span className="font-medium">Gas:</span> {message.metadata.gasUsed.toFixed(2)}
              </span>
            )}
            {message.metadata.decodingPath && (
              <span>
                <span className="font-medium">Path:</span> {message.metadata.decodingPath.replace('path_', '').replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
