import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, Server, CheckCircle2, AlertCircle, Eye, EyeOff, Save } from 'lucide-react';
import { getAIConfig, saveAIConfig } from '../utils/aiCopilot';

export default function AiSettingsModal({ isOpen, onClose, onSaved }) {
  const [provider, setProvider] = useState('gemini'); // 'gemini' | 'openai'
  const [modelName, setModelName] = useState('gemini-2.0-flash');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const config = getAIConfig();
      setProvider(config.provider || 'gemini');
      setModelName(config.modelName || 'gemini-2.0-flash');
      setApiKey(config.apiKey || '');
      setBaseUrl(config.baseUrl || '');
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    if (newProvider === 'gemini') {
      setModelName('gemini-2.0-flash');
      setBaseUrl('');
    } else {
      setModelName('gpt-4o-mini');
      setBaseUrl('https://api.openai.com/v1');
    }
  };

  const handleSave = () => {
    const config = {
      provider,
      modelName: modelName.trim() || (provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim()
    };

    saveAIConfig(config);
    setStatusMsg({
      type: 'success',
      text: config.apiKey ? 'AI API Key and Model configuration saved successfully!' : 'Saved. Using default local AI engine (No API Key).'
    });

    if (onSaved) onSaved(config);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="cyber-card w-full max-w-lg bg-white border-slate-300 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Model &amp; API Key Settings</h3>
              <p className="text-xs text-slate-500">Configure LLM details for live post-detection explanations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Provider Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              AI Provider / LLM API Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                  provider === 'gemini'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Google Gemini API
                <span className="block text-[10px] text-slate-500 font-normal">Gemini 1.5 / 2.0 Flash</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                  provider === 'openai'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                OpenAI / Custom REST API
                <span className="block text-[10px] text-slate-500 font-normal">GPT-4o, Groq, Ollama</span>
              </button>
            </div>
          </div>

          {/* Model Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Model Identifier Name
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>API Key</span>
              <span className="text-[10px] text-slate-400 font-normal">Stored locally in browser</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional Base URL for OpenAI compatible providers */}
          {provider === 'openai' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Custom API Base Endpoint URL (Optional)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {statusMsg && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <strong>Note:</strong> If no API key is entered, TraceX will use its built-in local Tier-3 SOC reasoning engine so the website remains 100% functional without an API key.
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary !text-xs !py-1.5 !px-4"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary !text-xs !py-1.5 !px-5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
}
