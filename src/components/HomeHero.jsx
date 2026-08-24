import React from 'react';
import { Shield, Activity, ArrowRight, Cpu, Sparkles, Upload, Terminal, ShieldAlert } from 'lucide-react';
import { PRESET_SCENARIOS } from '../utils/sampleData';

export default function HomeHero({ 
  onNavigate, 
  onSelectScenario, 
  currentScenario,
  stats 
}) {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="text-center pt-8 pb-8 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-cyan-600" />
          Smart Log Analyzer
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight font-['Space_Grotesk']">
          TraceX Log Analyzer
        </h1>

        <p className="max-w-2xl mx-auto text-base text-slate-600 leading-relaxed">
          Detect unusual server errors and attack attempts using our simple rule algorithm, then get plain-English AI root cause explanations.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('explorer')}
            className="btn-primary !py-3 !px-7 text-sm font-semibold"
          >
            <Terminal className="w-4 h-4" />
            Analyze Logs
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="btn-secondary !py-3 !px-7 text-sm font-semibold"
          >
            <Activity className="w-4 h-4 text-cyan-600" />
            View Dashboard
          </button>
        </div>

        {/* Simple KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4">
          <div className="cyber-card p-4 text-center">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Logs</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{stats.total}</p>
          </div>
          <div className="cyber-card p-4 text-center">
            <span className="text-xs text-emerald-600 font-semibold uppercase">Normal</span>
            <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">{stats.normal}</p>
          </div>
          <div className="cyber-card p-4 text-center">
            <span className="text-xs text-rose-600 font-semibold uppercase">Anomalous</span>
            <p className="text-2xl font-extrabold text-rose-600 font-mono mt-1">{stats.anomalous}</p>
          </div>
          <div className="cyber-card p-4 text-center">
            <span className="text-xs text-cyan-700 font-semibold uppercase">Anomaly Rate</span>
            <p className="text-2xl font-extrabold text-cyan-700 font-mono mt-1">
              {stats.total > 0 ? ((stats.anomalous / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Pipeline */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-6">
          System Workflow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="cyber-card p-5 text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-cyan-700 block uppercase">Step 1</span>
            <h3 className="font-bold text-slate-900 text-sm">Upload Logs</h3>
            <p className="text-xs text-slate-500">Ingest server or web log files</p>
          </div>

          <div className="cyber-card p-5 text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-teal-700 block uppercase">Step 2</span>
            <h3 className="font-bold text-slate-900 text-sm">Detect Anomalies</h3>
            <p className="text-xs text-slate-500">Scored by simple rule algorithm</p>
          </div>

          <div className="cyber-card p-5 text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-indigo-700 block uppercase">Step 3</span>
            <h3 className="font-bold text-slate-900 text-sm">AI Explanation</h3>
            <p className="text-xs text-slate-500">Plain-English root cause analysis</p>
          </div>

          <div className="cyber-card p-5 text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-rose-700 block uppercase">Step 4</span>
            <h3 className="font-bold text-slate-900 text-sm">Take Action</h3>
            <p className="text-xs text-slate-500">Block IPs and apply playbooks</p>
          </div>

        </div>
      </section>

      {/* Preset Scenarios */}
      <section className="max-w-5xl mx-auto">
        <div className="cyber-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Sample Attack Scenarios
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.values(PRESET_SCENARIOS).slice(0, 3).map((sc) => (
              <div
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  currentScenario === sc.id
                    ? 'bg-cyan-50 border-cyan-500 font-semibold'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{sc.name}</div>
                <p className="text-[11px] text-slate-500 mt-1">{sc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
