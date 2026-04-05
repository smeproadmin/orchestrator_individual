'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Table2, Code2, FileText, CheckSquare, Workflow, BarChart3 } from 'lucide-react';

export interface Artifact {
  id: string;
  type: 'table' | 'code' | 'chart' | 'document' | 'checklist' | 'workflow';
  title: string;
  content: string;
  language?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  table: <Table2 className="w-3.5 h-3.5" />,
  code: <Code2 className="w-3.5 h-3.5" />,
  chart: <BarChart3 className="w-3.5 h-3.5" />,
  document: <FileText className="w-3.5 h-3.5" />,
  checklist: <CheckSquare className="w-3.5 h-3.5" />,
  workflow: <Workflow className="w-3.5 h-3.5" />,
};

const typeColors: Record<string, string> = {
  table: 'bg-blue-50 border-blue-200 text-blue-700',
  code: 'bg-gray-50 border-gray-200 text-gray-700',
  chart: 'bg-purple-50 border-purple-200 text-purple-700',
  document: 'bg-green-50 border-green-200 text-green-700',
  checklist: 'bg-amber-50 border-amber-200 text-amber-700',
  workflow: 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

export default function ArtifactRenderer({ artifacts }: { artifacts: Artifact[] }) {
  if (!artifacts || artifacts.length === 0) return null;

  return (
    <div className="space-y-2 my-3">
      {artifacts.map(artifact => (
        <ArtifactCard key={artifact.id} artifact={artifact} />
      ))}
    </div>
  );
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const colorClass = typeColors[artifact.type] || typeColors.document;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${colorClass.split(' ')[1]}`}>
      <div
        className={`flex items-center justify-between px-3 py-2 cursor-pointer ${colorClass.split(' ')[0]}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span className={`${colorClass.split(' ')[2]}`}>
            {typeIcons[artifact.type]}
          </span>
          <span className="text-xs font-semibold">{artifact.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 font-medium uppercase">
            {artifact.type}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); handleCopy(); }}
          className="p-1 rounded hover:bg-white/50 transition-colors"
          title="Copy content"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="bg-white">
          {artifact.type === 'table' ? (
            <div className="overflow-x-auto">
              <TableRenderer content={artifact.content} />
            </div>
          ) : artifact.type === 'code' ? (
            <pre className="p-3 text-xs font-mono text-gray-800 overflow-x-auto bg-gray-50">
              <code>{artifact.content}</code>
            </pre>
          ) : artifact.type === 'checklist' ? (
            <ChecklistRenderer content={artifact.content} />
          ) : (
            <div className="p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {artifact.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TableRenderer({ content }: { content: string }) {
  const lines = content.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return <div className="p-3 text-sm">{content}</div>;

  const parseRow = (line: string) =>
    line.split('|').map(c => c.trim()).filter(Boolean);

  const headers = parseRow(lines[0]);
  const isSeparator = (line: string) => /^[\s|:-]+$/.test(line);
  const dataStartIndex = isSeparator(lines[1]) ? 2 : 1;
  const rows = lines.slice(dataStartIndex).map(parseRow);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          {headers.map((h, i) => (
            <th key={i} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
            {row.map((cell, ci) => (
              <td key={ci} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChecklistRenderer({ content }: { content: string }) {
  const items = content.trim().split('\n').filter(l => l.trim());

  return (
    <div className="p-3 space-y-1.5">
      {items.map((item, i) => {
        const checked = item.startsWith('[x]') || item.startsWith('[X]');
        const text = item.replace(/^\[[ xX]\]\s*/, '').replace(/^[-*]\s*/, '');
        return (
          <label key={i} className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              defaultChecked={checked}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`text-sm ${checked ? 'text-gray-400 line-through' : 'text-gray-700'} group-hover:text-gray-900`}>
              {text}
            </span>
          </label>
        );
      })}
    </div>
  );
}
