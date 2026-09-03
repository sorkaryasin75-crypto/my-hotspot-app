import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Trash2,
  Filter,
  Shield,
  Clock,
  User,
  CheckCircle2
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { AuditLog } from '../../types';

export const LogsView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const [logs, setLogs] = useState<AuditLog[]>(state.auditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `apex_isp_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear the audit logs?')) {
      storage.setState({ auditLogs: [] });
      setLogs([]);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'BILLING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'NETWORK':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'CUSTOMER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'HOTSPOT':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            System Audit Trail &amp; Kernel Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log trail of administrative actions, billing runs, PPPoE authentications, and firewall events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-semibold rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail by action, user, target, or details..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          {['ALL', 'SECURITY', 'BILLING', 'NETWORK', 'CUSTOMER', 'HOTSPOT', 'SYSTEM'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                categoryFilter === cat
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Target / Entity</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Details &amp; Audit Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No log events found matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getCategoryBadgeClass(log.category)}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white font-sans">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-cyan-300">
                      {log.target}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.user}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
