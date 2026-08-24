import React from 'react';
import { Shield, Activity, ListFilter, ShieldAlert, Upload, Sun, Moon, Sparkles } from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentScenario, 
  onSelectScenario, 
  onOpenUpload, 
  blockedIpsCount,
  onOpenFirewall,
  stats,
  isDark,
  onToggleTheme,
  onOpenAiSettings,
  hasAiKey
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-[#080d1a]/85 border-b border-slate-200 dark:border-cyan-500/20 px-4 lg:px-8 py-3 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-cyan-400 font-['Space_Grotesk']">
                TraceX
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30">
                Smart Log Analyzer
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Technical Assessment SIEM</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-[#0f172a]/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              currentTab === 'home'
                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Home
          </button>
          
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              currentTab === 'dashboard'
                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setCurrentTab('explorer')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              currentTab === 'explorer'
                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Log Explorer
            {stats?.anomalous > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/30 dark:text-rose-300">
                {stats.anomalous}
              </span>
            )}
          </button>

          <button
            onClick={onOpenFirewall}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              blockedIpsCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Firewall Rules
            {blockedIpsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 text-[10px] font-bold">
                {blockedIpsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          
          {/* AI Key & Model Settings Button */}
          <button
            onClick={onOpenAiSettings}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              hasAiKey 
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-500/40 dark:text-indigo-300'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Configure AI Model Details & API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-violet-400" />
            <span className="hidden sm:inline">{hasAiKey ? 'AI Key Set' : 'AI Key'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Scenario Selector */}
          <div className="relative hidden lg:block">
            <select
              value={currentScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-300 text-xs font-semibold px-3 py-2 pr-8 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-cyan-500 focus:outline-none cursor-pointer appearance-none shadow-sm"
            >
              <option value="BALANCED">Scenario: Enterprise Balanced</option>
              <option value="BRUTE_FORCE">Scenario: Brute Force Attack</option>
              <option value="SQL_INJECTION">Scenario: SQL Injection Exfiltration</option>
              <option value="INTERNAL_OUTAGE">Scenario: 500 Outage Cascade</option>
              <option value="DIR_TRAVERSAL">Scenario: Recon / Dir Traversal</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▼
            </div>
          </div>

          {/* Upload Action */}
          <button
            onClick={onOpenUpload}
            className="btn-secondary !py-2 !px-3 text-xs"
            title="Upload Custom Logs"
          >
            <Upload className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Upload Logs</span>
          </button>

        </div>

      </div>
    </header>
  );
}
