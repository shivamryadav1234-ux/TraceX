import React from 'react';
import { Activity, ShieldAlert, CheckCircle, AlertTriangle, TrendingUp, ArrowUpRight, Server, Sparkles } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard({ 
  logs, 
  onSelectLog, 
  onNavigate 
}) {
  const total = logs.length;
  const normalCount = logs.filter(l => l.anomalyStatus === 'Normal').length;
  const anomalousCount = logs.filter(l => l.anomalyStatus === 'Anomalous').length;
  const highSeverityCount = logs.filter(l => l.severity === 'high' || l.severity === 'critical').length;
  const anomalyPercent = total > 0 ? ((anomalousCount / total) * 100).toFixed(1) : '0.0';

  // Line Chart Data
  const timeBuckets = ['T-50m', 'T-40m', 'T-30m', 'T-20m', 'T-10m', 'Now'];
  const normalBuckets = [0, 0, 0, 0, 0, 0];
  const anomalousBuckets = [0, 0, 0, 0, 0, 0];

  logs.forEach(log => {
    const minAgo = Math.floor((Date.now() - new Date(log.timestamp).getTime()) / 60000);
    let bucketIdx = 5;
    if (minAgo > 45) bucketIdx = 0;
    else if (minAgo > 35) bucketIdx = 1;
    else if (minAgo > 25) bucketIdx = 2;
    else if (minAgo > 15) bucketIdx = 3;
    else if (minAgo > 5) bucketIdx = 4;

    if (log.anomalyStatus === 'Anomalous') {
      anomalousBuckets[bucketIdx]++;
    } else {
      normalBuckets[bucketIdx]++;
    }
  });

  const lineChartData = {
    labels: timeBuckets,
    datasets: [
      {
        label: 'Normal Logs',
        data: normalBuckets,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Anomalous Logs',
        data: anomalousBuckets,
        borderColor: '#e11d48',
        backgroundColor: 'rgba(225, 29, 72, 0.15)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true }
    }
  };

  // Severity Chart
  const lowCount = logs.filter(l => l.severity === 'low').length;
  const medCount = logs.filter(l => l.severity === 'medium').length;
  const highCount = logs.filter(l => l.severity === 'high').length;
  const critCount = logs.filter(l => l.severity === 'critical').length;

  const severityChartData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [
      {
        data: [lowCount, medCount, highCount, critCount],
        backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#e11d48'],
        borderWidth: 0
      }
    ]
  };

  const recentAnomalies = logs
    .filter(l => l.anomalyStatus === 'Anomalous' || l.anomalyStatus === 'Suspicious')
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Space_Grotesk']">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500">Log activity analytics and detected anomalies</p>
        </div>

        <button
          onClick={() => onNavigate('explorer')}
          className="btn-secondary !text-xs"
        >
          View All Logs →
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="cyber-card p-4">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Logs</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{total}</p>
        </div>

        <div className="cyber-card p-4">
          <span className="text-xs text-emerald-600 font-semibold uppercase">Normal Logs</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">{normalCount}</p>
        </div>

        <div className="cyber-card p-4">
          <span className="text-xs text-rose-600 font-semibold uppercase">Anomalous Logs</span>
          <p className="text-2xl font-extrabold text-rose-600 font-mono mt-1">{anomalousCount}</p>
        </div>

        <div className="cyber-card p-4">
          <span className="text-xs text-amber-600 font-semibold uppercase">High Severity</span>
          <p className="text-2xl font-extrabold text-amber-600 font-mono mt-1">{highSeverityCount}</p>
        </div>

        <div className="cyber-card p-4 col-span-2 sm:col-span-1">
          <span className="text-xs text-cyan-700 font-semibold uppercase">Anomaly Rate</span>
          <p className="text-2xl font-extrabold text-cyan-700 font-mono mt-1">{anomalyPercent}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="cyber-card p-5 lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Log Activity Chart</h2>
          <div className="h-60 w-full">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="cyber-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Severity Distribution</h2>
          <div className="h-56 w-full flex items-center justify-center">
            <Doughnut data={severityChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

      </div>

      {/* Recent Anomalies */}
      <div className="cyber-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Recent Anomalies</h2>
        <div className="space-y-2">
          {recentAnomalies.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No anomalies detected.</p>
          ) : (
            recentAnomalies.map((anom) => (
              <div
                key={anom.id}
                onClick={() => onSelectLog(anom, 'ai')}
                className="p-3 rounded-lg border border-slate-200 hover:border-cyan-500 cursor-pointer flex items-center justify-between gap-3 text-xs bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <span className={`status-code-pill ${anom.statusCode >= 500 ? 'status-5xx' : 'status-4xx'}`}>
                    {anom.statusCode}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{anom.method} {anom.path}</span>
                  <span className="text-slate-500">({anom.ip})</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-rose-600">
                    {anom.anomalyPoints || Math.round(anom.anomalyScore * 100)} Pts
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLog(anom, 'ai');
                    }}
                    className="btn-primary !py-1 !px-2.5 !text-[11px] flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                    Explain with AI
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
