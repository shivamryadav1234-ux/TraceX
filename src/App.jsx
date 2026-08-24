import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import HomeHero from './components/HomeHero';
import Dashboard from './components/Dashboard';
import LogExplorer from './components/LogExplorer';
import LogDetailModal from './components/LogDetailModal';
import LogUploadModal from './components/LogUploadModal';
import FirewallDrawer from './components/FirewallDrawer';
import AiSettingsModal from './components/AiSettingsModal';
import { generateScenarioLogs } from './utils/sampleData';
import { analyzeLogCollection } from './utils/anomalyDetector';
import { getAIConfig } from './utils/aiCopilot';
import { Shield, Sparkles, Cpu, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Navigation tab state ('home' | 'dashboard' | 'explorer')
  const [currentTab, setCurrentTab] = useState('home');

  // Scenario state ('BALANCED', 'BRUTE_FORCE', 'SQL_INJECTION', 'INTERNAL_OUTAGE', 'DIR_TRAVERSAL')
  const [currentScenario, setCurrentScenario] = useState('BALANCED');

  // Theme state (Default to false for Light Theme)
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('tracex_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Apply theme class to <html> element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('tracex_theme', 'dark'); } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('tracex_theme', 'light'); } catch (e) {}
    }
  }, [isDark]);

  // Logs state
  const [rawLogs, setRawLogs] = useState(() => {
    return generateScenarioLogs('BALANCED');
  });

  // Modal states
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedLogTab, setSelectedLogTab] = useState('detection');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFirewallOpen, setIsFirewallOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(() => Boolean(getAIConfig().apiKey));

  // Blocked IPs state
  const [blockedIps, setBlockedIps] = useState(() => {
    try {
      const saved = localStorage.getItem('tracex_blocked_ips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Run algorithmic anomaly analysis
  const analyzedLogs = useMemo(() => {
    return analyzeLogCollection(rawLogs);
  }, [rawLogs]);

  // Telemetry KPIs
  const stats = useMemo(() => {
    const total = analyzedLogs.length;
    const normal = analyzedLogs.filter(l => l.anomalyStatus === 'Normal').length;
    const suspicious = analyzedLogs.filter(l => l.anomalyStatus === 'Suspicious').length;
    const anomalous = analyzedLogs.filter(l => l.anomalyStatus === 'Anomalous').length;
    const highSev = analyzedLogs.filter(l => l.severity === 'high' || l.severity === 'critical').length;
    return { total, normal, suspicious, anomalous, highSev };
  }, [analyzedLogs]);

  // Handle log selection with tab choice
  const handleSelectLog = (log, tab = 'detection') => {
    setSelectedLog(log);
    setSelectedLogTab(tab);
  };

  // Handle scenario switch
  const handleSelectScenario = (scenarioId) => {
    setCurrentScenario(scenarioId);
    const newLogs = generateScenarioLogs(scenarioId);
    setRawLogs(newLogs);
    showToast(`Loaded scenario: ${scenarioId.replace('_', ' ')} with ${newLogs.length} logs`, 'success');
  };

  // Ingest custom logs
  const handleIngestLogs = (uploadedLogs) => {
    setRawLogs(prev => [...uploadedLogs, ...prev]);
    showToast(`Successfully ingested ${uploadedLogs.length} custom log entries!`, 'success');
    setCurrentTab('explorer');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  // Block IP action
  const handleBlockIp = (ip) => {
    if (!blockedIps.some(b => b.ip === ip)) {
      const updated = [...blockedIps, { ip, blockedAt: new Date().toISOString(), reason: 'Flagged by TraceX Algorithmic Scoring' }];
      setBlockedIps(updated);
      try {
        localStorage.setItem('tracex_blocked_ips', JSON.stringify(updated));
      } catch (e) {}
      showToast(`IP ${ip} blocked in Firewall ACL perimeter rules!`, 'warning');
    }
  };

  // Unblock IP action
  const handleUnblockIp = (ip) => {
    const updated = blockedIps.filter(b => b.ip !== ip);
    setBlockedIps(updated);
    try {
      localStorage.setItem('tracex_blocked_ips', JSON.stringify(updated));
    } catch (e) {}
    showToast(`IP ${ip} removed from blocklist.`, 'info');
  };

  // Clear all blocked IPs
  const handleClearAllBlocks = () => {
    setBlockedIps([]);
    try {
      localStorage.removeItem('tracex_blocked_ips');
    } catch (e) {}
    showToast('All firewall IP drop rules cleared.', 'info');
  };

  // Mark as False Positive
  const handleMarkFalsePositive = (logId) => {
    setRawLogs(prev => prev.map(l => {
      if (l.id === logId) {
        return {
          ...l,
          anomalyScore: 0.1,
          anomalyPoints: 10,
          anomalyStatus: 'Normal',
          severity: 'low',
          detectionDetails: {
            ...l.detectionDetails,
            flagReasons: ['Manually Overridden by Analyst (False Positive)']
          }
        };
      }
      return l;
    }));
    if (selectedLog && selectedLog.id === logId) {
      setSelectedLog(prev => ({
        ...prev,
        anomalyScore: 0.1,
        anomalyPoints: 10,
        anomalyStatus: 'Normal',
        severity: 'low'
      }));
    }
    showToast(`Log ${logId} marked as False Positive. Score recalibrated.`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070913] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        onOpenUpload={() => setIsUploadOpen(true)}
        blockedIpsCount={blockedIps.length}
        onOpenFirewall={() => setIsFirewallOpen(true)}
        stats={stats}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        hasAiKey={hasAiKey}
      />

      {/* Main Page Views */}
      <main className="flex-1 px-4 lg:px-8 pt-6 max-w-7xl mx-auto w-full">
        {currentTab === 'home' && (
          <HomeHero
            onNavigate={(tab) => setCurrentTab(tab)}
            onSelectScenario={handleSelectScenario}
            currentScenario={currentScenario}
            stats={stats}
          />
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            logs={analyzedLogs}
            onSelectLog={handleSelectLog}
            onNavigate={(tab) => setCurrentTab(tab)}
            isDark={isDark}
          />
        )}

        {currentTab === 'explorer' && (
          <LogExplorer
            logs={analyzedLogs}
            onSelectLog={handleSelectLog}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#060914] px-4 lg:px-8 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] text-sm">TraceX Smart Log Analyzer</span>
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <span>Technical Assessment SIEM</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Simple Point Algorithm
            </span>
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-violet-400" />
              Tier-3 AI Incident Copilot
            </span>
          </div>

          <div className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
            &copy; 2026 TraceX Enterprise SIEM
          </div>
        </div>
      </footer>

      {/* Log Details Modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          initialTab={selectedLogTab}
          onClose={() => setSelectedLog(null)}
          onBlockIp={handleBlockIp}
          onMarkFalsePositive={handleMarkFalsePositive}
          isBlocked={blockedIps.some(b => b.ip === selectedLog.ip)}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        />
      )}

      {/* Log Ingest Modal */}
      {isUploadOpen && (
        <LogUploadModal
          onClose={() => setIsUploadOpen(false)}
          onIngestLogs={handleIngestLogs}
        />
      )}

      {/* Firewall Drawer */}
      <FirewallDrawer
        isOpen={isFirewallOpen}
        onClose={() => setIsFirewallOpen(false)}
        blockedIps={blockedIps}
        onUnblockIp={handleUnblockIp}
        onClearAllBlocks={handleClearAllBlocks}
      />

      {/* AI Key & Model Settings Modal */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        onSaved={(cfg) => setHasAiKey(Boolean(cfg.apiKey))}
      />

      {/* Global Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
          <CheckCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
