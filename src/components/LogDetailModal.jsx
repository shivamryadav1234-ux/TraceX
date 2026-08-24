import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Shield, Cpu, Terminal, FileCode, Send, Download, Ban, CheckSquare, Loader2, MessageSquare } from 'lucide-react';
import { generateAIExplanation, askCopilotQuestion, getAIConfig } from '../utils/aiCopilot';

export default function LogDetailModal({ 
  log, 
  onClose, 
  onBlockIp, 
  onMarkFalsePositive,
  isBlocked,
  initialTab = 'detection',
  onOpenAiSettings
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'detection');
  const [aiReport, setAiReport] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const aiConfig = getAIConfig();
  const hasCustomKey = Boolean(aiConfig.apiKey);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (log && (log.anomalyStatus === 'Anomalous' || log.anomalyStatus === 'Suspicious')) {
      handleTriggerAI();
    } else {
      setAiReport(null);
    }
    setChatMessages([]);
  }, [log?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  if (!log) return null;

  const isAnomalous = log.anomalyStatus === 'Anomalous';
  const points = log.anomalyPoints || Math.round(log.anomalyScore * 100);

  const handleTriggerAI = async () => {
    setIsGeneratingAi(true);
    try {
      const report = await generateAIExplanation(log, log.detectionDetails || {});
      setAiReport(report);
    } catch (err) {
      console.error('AI Generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim() || isChatLoading) return;

    const q = chatQuestion.trim();
    setChatQuestion('');
    setChatMessages(prev => [...prev, { sender: 'user', text: q, time: new Date().toLocaleTimeString() }]);
    setIsChatLoading(true);

    try {
      const answer = await askCopilotQuestion(log, q, aiReport || {});
      setChatMessages(prev => [...prev, { sender: 'ai', text: answer || 'Copilot synthesized analysis for this log.', time: new Date().toLocaleTimeString() }]);
    } catch (err) {
      console.error('Copilot Chat Error:', err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Error connecting to AI Copilot. Please check your API key or network.', time: new Date().toLocaleTimeString() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="cyber-card w-full max-w-3xl max-h-[90vh] flex flex-col bg-white border-slate-300 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 font-mono">{log.id}</h2>
              <span className={`status-code-pill ${log.statusCode >= 500 ? 'status-5xx' : 'status-4xx'}`}>
                {log.statusCode} {log.statusText}
              </span>
              <span className={`badge ${isAnomalous ? 'badge-anomalous' : 'badge-normal'}`}>
                {log.anomalyStatus}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              {log.method} {log.path} &bull; Source IP: <strong className="text-cyan-700">{log.ip}</strong>
            </p>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('detection')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'detection' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'text-slate-600'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Algorithm Score ({points} Pts)
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'ai' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'text-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Explain with AI
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isBlocked ? (
              <span className="text-xs text-amber-700 font-semibold font-mono">Blocked</span>
            ) : (
              <button
                onClick={() => onBlockIp(log.ip)}
                className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 text-xs font-semibold flex items-center gap-1"
              >
                <Ban className="w-3 h-3" />
                Block IP
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: ALGORITHM BREAKDOWN */}
          {activeTab === 'detection' && (
            <div className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 space-y-1">
                <strong>Anomalies are detected by our algorithm, NOT by AI.</strong>
                <p>Simple point rules evaluate status codes, keywords, frequency spikes, and latency.</p>
              </div>

              {/* Point Rule Items */}
              <div className="cyber-card p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Rules Triggered Breakdown:</h4>
                {(log.detectionDetails?.rulesTriggered || []).length === 0 ? (
                  <p className="text-xs text-emerald-700">0 Points: Normal baseline traffic.</p>
                ) : (
                  (log.detectionDetails?.rulesTriggered || []).map((ruleItem, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between">
                      <div>
                        <strong className="text-slate-900">{ruleItem.rule}</strong>
                        <p className="text-[11px] text-slate-600">{ruleItem.description}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-600">+{ruleItem.points} Pts</span>
                    </div>
                  ))
                )}
              </div>

              {/* Raw Details */}
              <div className="cyber-card p-4 space-y-2 text-xs font-mono">
                <h4 className="font-bold text-slate-900 font-sans">Log Details:</h4>
                <p>Timestamp: {log.timestamp}</p>
                <p>Source IP: {log.ip}</p>
                <p>Endpoint: {log.method} {log.path}</p>
                <p>Latency: {log.responseTime}ms</p>
                <p>User-Agent: {log.userAgent}</p>
              </div>

            </div>
          )}

          {/* TAB 2: EXPLAIN WITH AI */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              
              {/* AI Key Status Bar */}
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>
                    {hasCustomKey 
                      ? `Using Live LLM API (${aiConfig.provider?.toUpperCase()}: ${aiConfig.modelName || 'Custom Model'})` 
                      : 'Using Built-in Local AI Engine (No API Key set)'}
                  </span>
                </div>

                <button
                  onClick={onOpenAiSettings}
                  className="text-xs text-indigo-700 font-bold hover:underline"
                >
                  {hasCustomKey ? 'Configure Key' : '+ Set API Key'}
                </button>
              </div>

              {isGeneratingAi ? (
                <div className="py-8 text-center text-xs font-mono text-indigo-600 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI generating explanation...</span>
                </div>
              ) : aiReport ? (
                <div className="space-y-4">
                  
                  {/* 1. What happened? */}
                  <div className="cyber-card p-4 space-y-1">
                    <h4 className="text-xs font-bold text-cyan-700 uppercase">What happened?</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{aiReport.whatHappened}</p>
                  </div>

                  {/* 2. Why is it unusual? */}
                  <div className="cyber-card p-4 space-y-1">
                    <h4 className="text-xs font-bold text-amber-700 uppercase">Why is it unusual?</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{aiReport.whyUnusual}</p>
                  </div>

                  {/* 3. Possible root cause */}
                  <div className="cyber-card p-4 space-y-1">
                    <h4 className="text-xs font-bold text-rose-700 uppercase">Possible root cause</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{aiReport.rootCause}</p>
                  </div>

                  {/* 4. Recommended next step */}
                  <div className="cyber-card p-4 space-y-2 bg-emerald-50/50">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase">Recommended next step</h4>
                    <ol className="text-xs text-slate-700 list-decimal list-inside space-y-1">
                      {aiReport.recommendedNextSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Interactive Ask Copilot Chat */}
                  <div className="cyber-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        Ask AI Copilot:
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">Live Q&amp;A</span>
                    </div>

                    {/* Chat Messages List */}
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {chatMessages.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">
                          Ask Copilot anything about this log (e.g. <em>"How do I block this IP?"</em> or <em>"How do I fix this query?"</em>).
                        </p>
                      ) : (
                        chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl text-xs space-y-1 ${
                              msg.sender === 'user'
                                ? 'bg-cyan-50 border border-cyan-200 text-cyan-900 ml-6'
                                : 'bg-slate-100 border border-slate-200 text-slate-800 mr-6 font-mono'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                              <span>{msg.sender === 'user' ? 'Security Engineer' : 'AI Copilot'}</span>
                              <span>{msg.time}</span>
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</div>
                          </div>
                        ))
                      )}

                      {isChatLoading && (
                        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-indigo-600 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          <span>Copilot is analyzing your question...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Form */}
                    <form onSubmit={handleSendChat} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={chatQuestion}
                        onChange={(e) => setChatQuestion(e.target.value)}
                        placeholder="Ask how to block IP, fix code, or analyze request..."
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        type="submit" 
                        disabled={isChatLoading || !chatQuestion.trim()}
                        className="btn-primary !py-2 !px-4 !text-xs disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Ask
                      </button>
                    </form>
                  </div>

                </div>
              ) : null}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
