import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, 
  Sparkles, Download, Clock, Terminal 
} from 'lucide-react';

export default function LogExplorer({ 
  logs, 
  onSelectLog, 
  onOpenUpload 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [httpCategoryFilter, setHttpCategoryFilter] = useState('ALL');

  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match = 
          (log.ip && log.ip.toLowerCase().includes(query)) ||
          (log.path && log.path.toLowerCase().includes(query)) ||
          (log.message && log.message.toLowerCase().includes(query)) ||
          (log.method && log.method.toLowerCase().includes(query)) ||
          (log.source && log.source.toLowerCase().includes(query)) ||
          (log.userAgent && log.userAgent.toLowerCase().includes(query)) ||
          (log.statusCode && String(log.statusCode).includes(query));
        if (!match) return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'NORMAL' && log.anomalyStatus !== 'Normal') return false;
        if (statusFilter === 'SUSPICIOUS' && log.anomalyStatus !== 'Suspicious') return false;
        if (statusFilter === 'ANOMALOUS' && log.anomalyStatus !== 'Anomalous') return false;
      }

      if (severityFilter !== 'ALL') {
        if (log.severity?.toLowerCase() !== severityFilter.toLowerCase()) return false;
      }

      if (httpCategoryFilter !== 'ALL') {
        const code = parseInt(log.statusCode, 10);
        if (httpCategoryFilter === '2XX' && (code < 200 || code >= 300)) return false;
        if (httpCategoryFilter === '4XX' && (code < 400 || code >= 500)) return false;
        if (httpCategoryFilter === '5XX' && (code < 500 || code >= 600)) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'anomalyScore') {
        comparison = (a.anomalyPoints || a.anomalyScore * 100) - (b.anomalyPoints || b.anomalyScore * 100);
      } else if (sortField === 'statusCode') {
        comparison = a.statusCode - b.statusCode;
      } else if (sortField === 'severity') {
        const rank = { low: 1, medium: 2, high: 3, critical: 4 };
        comparison = (rank[a.severity] || 0) - (rank[b.severity] || 0);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [logs, searchTerm, statusFilter, severityFilter, httpCategoryFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportLogs = (format = 'json') => {
    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `tracex_logs_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ["Timestamp", "IP", "Method", "Path", "Status", "Severity", "AnomalyScore", "AnomalyStatus", "Message"];
      const rows = filteredLogs.map(l => [
        `"${l.timestamp}"`,
        `"${l.ip}"`,
        `"${l.method}"`,
        `"${l.path}"`,
        l.statusCode,
        `"${l.severity}"`,
        l.anomalyScore,
        `"${l.anomalyStatus}"`,
        `"${(l.message || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `tracex_logs_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              Log Explorer &amp; SIEM Data Grid
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Search, filter, and inspect server logs evaluated by our simple point-based anomaly algorithm.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportLogs('csv')}
            className="btn-secondary !text-xs !py-2 !px-3"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Export CSV
          </button>
          <button
            onClick={() => exportLogs('json')}
            className="btn-secondary !text-xs !py-2 !px-3"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-violet-400" />
            Export JSON
          </button>
          <button
            onClick={onOpenUpload}
            className="btn-primary !text-xs !py-2 !px-4"
          >
            + Ingest Logs
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="cyber-card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by IP, endpoint, error message, HTTP status code..."
            className="w-full bg-slate-50 dark:bg-[#080e1e] border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Anomaly Status:
            </span>
            {['ALL', 'ANOMALOUS', 'SUSPICIOUS', 'NORMAL'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
              >
                {st === 'ALL' ? 'All Statuses' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setSeverityFilter(sev);
                  setCurrentPage(1);
                }}
                className={`filter-chip ${severityFilter === sev ? 'active' : ''}`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">HTTP Code:</span>
            {['ALL', '2XX', '4XX', '5XX'].map((hc) => (
              <button
                key={hc}
                onClick={() => {
                  setHttpCategoryFilter(hc);
                  setCurrentPage(1);
                }}
                className={`filter-chip ${httpCategoryFilter === hc ? 'active' : ''}`}
              >
                {hc}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Log Data Table */}
      <div className="cyber-card overflow-hidden">
        
        {/* Status bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-[#0c1427] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong> matching logs (Total dataset: {logs.length})
          </div>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300 text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="soc-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('timestamp')} className="cursor-pointer select-none">
                  <div className="flex items-center gap-1.5">
                    Timestamp
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th>Source / IP</th>
                <th>Event Type / Path</th>
                <th onClick={() => handleSort('statusCode')} className="cursor-pointer select-none">
                  <div className="flex items-center gap-1.5">
                    Status
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('severity')} className="cursor-pointer select-none">
                  <div className="flex items-center gap-1.5">
                    Severity
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('anomalyScore')} className="cursor-pointer select-none">
                  <div className="flex items-center gap-1.5">
                    Anomaly Score
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th>Anomaly Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No logs match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isAnomalous = log.anomalyStatus === 'Anomalous';
                  const isSuspicious = log.anomalyStatus === 'Suspicious';
                  const points = log.anomalyPoints || Math.round(log.anomalyScore * 100);

                  return (
                    <tr
                      key={log.id}
                      onClick={() => onSelectLog(log)}
                      className={isAnomalous ? 'row-anomalous' : ''}
                    >
                      {/* Timestamp */}
                      <td className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </td>

                      {/* Source IP */}
                      <td className="font-mono text-xs whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{log.ip}</span>
                          <span className="block text-[10px] text-slate-400">{log.source}</span>
                        </div>
                      </td>

                      {/* Path & Message */}
                      <td className="max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                              {log.method}
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {log.path}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                            {log.message}
                          </p>
                        </div>
                      </td>

                      {/* Status Code */}
                      <td>
                        <span className={`status-code-pill ${
                          log.statusCode >= 500 ? 'status-5xx' : log.statusCode >= 400 ? 'status-4xx' : 'status-2xx'
                        }`}>
                          {log.statusCode} {log.statusText}
                        </span>
                      </td>

                      {/* Severity */}
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          log.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300'
                            : log.severity === 'high'
                            ? 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-500/20 dark:text-orange-300'
                            : log.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300'
                        }`}>
                          {log.severity}
                        </span>
                      </td>

                      {/* Anomaly Score Bar */}
                      <td>
                        <div className="space-y-1 min-w-[90px]">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className={isAnomalous ? 'text-rose-600 dark:text-rose-400 font-bold' : isSuspicious ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}>
                              {points} Pts
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {points >= 65 ? 'HIGH' : points >= 35 ? 'MED' : 'SAFE'}
                            </span>
                          </div>
                          <div className="score-bar-container">
                            <div
                              className="score-bar-fill"
                              style={{
                                width: `${Math.max(5, points)}%`,
                                backgroundColor: isAnomalous ? '#e11d48' : isSuspicious ? '#d97706' : '#10b981'
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span className={`badge ${
                          isAnomalous ? 'badge-anomalous' : isSuspicious ? 'badge-suspicious' : 'badge-normal'
                        }`}>
                          {log.anomalyStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLog(log);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 border border-slate-300 dark:border-slate-700"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-[#0c1427] border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="text-slate-600 dark:text-slate-400 font-mono">
            Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
