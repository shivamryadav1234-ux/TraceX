import React from 'react';
import { X, ShieldAlert, Ban, Trash2, CheckCircle2, Shield, Globe, Lock } from 'lucide-react';

export default function FirewallDrawer({ 
  isOpen, 
  onClose, 
  blockedIps, 
  onUnblockIp, 
  onClearAllBlocks 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="cyber-card w-full max-w-xl bg-[#0b1021] border-amber-500/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0e162e] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Active Defense: Firewall ACL Rules</h3>
              <p className="text-xs text-slate-400">Simulated Edge Proxy &amp; WAF IP Drop Filter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <Lock className="w-4 h-4" />
              <span><strong>{blockedIps.length}</strong> Malicious IPs currently blocked</span>
            </div>
            {blockedIps.length > 0 && (
              <button
                onClick={onClearAllBlocks}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-semibold"
              >
                Clear All Blocks
              </button>
            )}
          </div>

          {blockedIps.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">No Blocked IPs</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When you encounter malicious IPs in the Log Explorer or Incident Details modal, click "Block IP" to enforce immediate perimeter drop rules.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {blockedIps.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                      <span className="font-bold text-white text-sm">{item.ip}</span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                        DROP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Blocked at {new Date(item.blockedAt).toLocaleTimeString()} &bull; Reason: {item.reason || 'Anomalous Threat Vector'}
                    </p>
                  </div>

                  <button
                    onClick={() => onUnblockIp(item.ip)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Unblock IP"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0e162e] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Rules enforced via Cloudflare / iptables</span>
          <button
            onClick={onClose}
            className="btn-secondary !text-xs !py-1.5 !px-4"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
