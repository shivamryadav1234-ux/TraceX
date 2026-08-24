import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Terminal, Loader2 } from 'lucide-react';
import { parseRawLogs } from '../utils/logParser';

export default function LogUploadModal({ 
  onClose, 
  onIngestLogs 
}) {
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewLogs, setPreviewLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounced parsing when raw text changes
  useEffect(() => {
    if (!rawText.trim()) {
      setPreviewLogs([]);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    const timer = setTimeout(() => {
      try {
        const parsed = parseRawLogs(rawText);
        setPreviewLogs(parsed);
        setErrorMsg('');
      } catch (err) {
        console.error('Parse error:', err);
        setErrorMsg('Error parsing logs. Please check format.');
      } finally {
        setIsProcessing(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [rawText]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setRawText(content);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const loadSampleCSV = () => {
    const sample = `Timestamp,IP_Address,Request_Type,Status_Code,User_Agent,Session_ID,Location
2026-08-24 10:00:00,202.118.116.11,GET,403,Edge,4835,Brazil
2026-08-24 10:01:00,38.30.40.178,DELETE,301,Bot,3176,China
2026-08-24 10:02:00,209.5.148.15,POST,500,Opera,4312,China
2026-08-24 10:03:00,211.116.60.71,GET,301,Bot,1003,France
2026-08-24 10:04:00,170.166.36.145,POST,404,Firefox,1428,Germany
2026-08-24 10:05:00,147.178.175.124,DELETE,404,Firefox,2954,Brazil
2026-08-24 10:06:00,45.143.221.19,POST,500,sqlmap,9921,Russia
2026-08-24 10:07:00,192.168.1.105,GET,200,Chrome,1002,United States`;
    setRawText(sample);
  };

  const handleIngest = () => {
    if (previewLogs.length === 0) {
      setErrorMsg('No valid log entries found to ingest.');
      return;
    }
    onIngestLogs(previewLogs);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="cyber-card w-full max-w-2xl bg-white border-slate-300 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ingest Custom Server Logs</h3>
              <p className="text-xs text-slate-500">Supports CSV, JSON, Apache/Nginx, or raw syslog text</p>
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
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* File Drag and Drop Zone */}
          <div className="relative border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-xl p-5 text-center bg-slate-50 transition-colors">
            <input
              type="file"
              accept=".log,.txt,.json,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="space-y-1 pointer-events-none">
              <Upload className="w-7 h-7 text-cyan-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-800">
                {fileName ? `Selected: ${fileName}` : 'Drop log file here, or click to browse'}
              </p>
              <p className="text-[11px] text-slate-400">
                Supports large datasets (10,000+ CSV or JSON rows)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold uppercase">Or Paste Raw Log Stream / CSV:</span>
            <button
              onClick={loadSampleCSV}
              className="text-cyan-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <Terminal className="w-3.5 h-3.5" />
              Load Sample CSV Format
            </button>
          </div>

          {/* Text Area */}
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            placeholder="Timestamp,IP_Address,Request_Type,Status_Code,User_Agent,Session_ID,Location..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
          />

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview summary */}
          {isProcessing ? (
            <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center gap-2 text-xs text-cyan-800">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
              <span>Parsing and calculating anomaly scores for log stream...</span>
            </div>
          ) : previewLogs.length > 0 ? (
            <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-900 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  Successfully Parsed {previewLogs.length} Log Entries
                </span>
                <span className="text-slate-600 font-mono text-[11px]">
                  Anomalies Detected: <strong className="text-rose-600 font-bold">{previewLogs.filter(p => p.anomalyStatus === 'Anomalous').length}</strong>
                </span>
              </div>
            </div>
          ) : null}

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
            onClick={handleIngest}
            disabled={previewLogs.length === 0 || isProcessing}
            className="btn-primary !text-xs !py-1.5 !px-5 disabled:opacity-50"
          >
            Ingest &amp; Analyze ({previewLogs.length} logs)
          </button>
        </div>

      </div>
    </div>
  );
}
