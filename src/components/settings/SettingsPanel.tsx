'use client';

import { useState, useEffect } from 'react';
import { X, Key, Shield, Check, AlertCircle, Zap, Globe } from 'lucide-react';

interface SettingsState {
  anthropicKey: string;
  model: string;
  webSearchEnabled: boolean;
}

const STORAGE_KEY = 'orchestrator_settings';

export function getStoredSettings(): SettingsState {
  if (typeof window === 'undefined') return { anthropicKey: '', model: 'claude-sonnet-4-20250514', webSearchEnabled: true };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { anthropicKey: '', model: 'claude-sonnet-4-20250514', webSearchEnabled: true };
}

export function hasApiKey(): boolean {
  return getStoredSettings().anthropicKey.length > 0;
}

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<SettingsState>(getStoredSettings);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!settings.anthropicKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
        }),
      });
      setTestResult(response.ok ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-lg w-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">AI Provider Settings</h2>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* API Key Notice */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-700">
            <strong>Real-time AI responses require an API key.</strong> Your key is stored only in your browser&apos;s local storage and is never sent to our servers. Connect your Anthropic API key to enable live, current intelligence responses.
          </div>
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            <Key className="w-3 h-3 inline mr-1" />
            Anthropic API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={settings.anthropicKey}
              onChange={e => setSettings(s => ({ ...s, anthropicKey: e.target.value }))}
              placeholder="sk-ant-..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 font-mono"
            />
            <button
              onClick={handleTest}
              disabled={!settings.anthropicKey || testing}
              className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {testing ? 'Testing...' : 'Test'}
            </button>
          </div>
          {testResult === 'success' && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Connected successfully
            </p>
          )}
          {testResult === 'error' && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Connection failed — check your API key
            </p>
          )}
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            <Zap className="w-3 h-3 inline mr-1" />
            Model
          </label>
          <select
            value={settings.model}
            onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          >
            <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Balanced)</option>
            <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</option>
            <option value="claude-opus-4-20250514">Claude Opus 4 (Most Capable)</option>
          </select>
        </div>

        {/* Web Search Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Enable web search for real-time data</span>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, webSearchEnabled: !s.webSearchEnabled }))}
            className={`w-9 h-5 rounded-full transition-colors ${
              settings.webSearchEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
              settings.webSearchEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Saved
            </>
          ) : (
            'Save Settings'
          )}
        </button>

        <p className="text-[10px] text-gray-400 text-center">
          Without an API key, the Orchestrator uses a local demonstration engine with sample data.
        </p>
      </div>
    </div>
  );
}
