import React, { useState } from 'react';
import {
  Server,
  Radio,
  Users,
  Shield,
  Plus,
  Trash2,
  RefreshCw,
  Power,
  XCircle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Database,
  Lock,
  Search,
  CheckCircle2
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { NetworkEngine } from '../../services/networkEngine';
import { PppoeServerConfig, PppoeSession, Customer } from '../../types';
import { formatBitrate, formatBytes, formatUptime } from '../../utils/formatters';

export const PppoeView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const networkEngine = NetworkEngine.getInstance();

  const [pppoeConfig, setPppoeConfig] = useState<PppoeServerConfig>(state.pppoeConfig);
  const [sessions, setSessions] = useState<PppoeSession[]>(state.pppoeSessions);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'sessions' | 'users' | 'config' | 'raw'>('sessions');
  const [killSuccessMessage, setKillSuccessMessage] = useState<string | null>(null);

  const filteredSessions = sessions.filter(
    s =>
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ipAddress.includes(searchQuery) ||
      s.macAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKillSession = (session: PppoeSession) => {
    const updated = sessions.filter(s => s.id !== session.id);
    setSessions(updated);
    storage.setState({ pppoeSessions: updated });
    storage.logAudit(
      'PPPoE Session Terminated',
      'NETWORK',
      session.username,
      `Terminated active session for ${session.customerName} on ${session.interfaceName} (${session.ipAddress}).`
    );
    setKillSuccessMessage(`Terminated PPPoE session for ${session.username} on interface ${session.interfaceName}.`);
    setTimeout(() => setKillSuccessMessage(null), 4000);
  };

  const handleSaveConfig = () => {
    storage.setState({ pppoeConfig });
    storage.logAudit(
      'PPPoE Server Parameters Updated',
      'NETWORK',
      pppoeConfig.serverName,
      `Updated PPPoE pool: ${pppoeConfig.ipPoolStart}-${pppoeConfig.ipPoolEnd}, Auth: ${pppoeConfig.authMethod}`
    );
    alert('PPPoE server configuration saved and synchronized with Linux accel-ppp daemon.');
  };

  return (
    <div className="space-y-6">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            PPPoE Broadband Server Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Linux Kernel accel-ppp / pppd daemon, dynamic IP pools, subscriber CHAP credentials, and active session management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Server: <strong className="text-emerald-400">{pppoeConfig.serverName}</strong>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'sessions'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Active Online Sessions ({sessions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>PPPoE Secrets / Subscribers ({state.customers.filter(c => c.connectionType === 'PPPoE').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'config'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Server Parameters &amp; IP Pool</span>
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'raw'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>accel-ppp.conf</span>
        </button>
      </div>

      {killSuccessMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{killSuccessMessage}</span>
        </div>
      )}

      {/* Tab: Active Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search session by username, IP, MAC..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-xs font-mono text-slate-400">
              Total Active: <strong className="text-emerald-400">{filteredSessions.length}</strong> / {pppoeConfig.maxSessions} Max
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Subscriber</th>
                    <th className="py-3 px-4">PPPoE User</th>
                    <th className="py-3 px-4">Interface &amp; IP</th>
                    <th className="py-3 px-4">Calling MAC</th>
                    <th className="py-3 px-4">Package Plan</th>
                    <th className="py-3 px-4">Uptime</th>
                    <th className="py-3 px-4">Throughput (↓ / ↑)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No active PPPoE sessions found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map(session => (
                      <tr key={session.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-sans font-semibold text-white">
                          {session.customerName}
                        </td>
                        <td className="py-3 px-4 text-cyan-300 font-bold">
                          {session.username}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200 font-bold">{session.ipAddress}</div>
                          <div className="text-[10px] text-slate-400">{session.interfaceName}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {session.macAddress}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-sans">
                            {session.packageName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-[11px]">
                          {formatUptime(session.uptimeSeconds)}
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-[11px]">
                          <div className="text-cyan-400">↓ {formatBitrate(session.rxRateKbps)}</div>
                          <div className="text-indigo-400">↑ {formatBitrate(session.txRateKbps)}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleKillSession(session)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 rounded text-[10px] font-bold uppercase transition"
                            title="Send disconnect signal to terminate subscriber session"
                          >
                            Disconnect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PPPoE User Secrets Database */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">PPPoE Login</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4">Assigned IP</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {state.customers
                    .filter(c => c.connectionType === 'PPPoE')
                    .map(cust => (
                      <tr key={cust.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-sans font-semibold text-white">
                          {cust.fullName} ({cust.customerId})
                        </td>
                        <td className="py-3 px-4 text-cyan-300 font-bold">{cust.pppoeUsername}</td>
                        <td className="py-3 px-4 text-slate-400">•••••••• ({cust.pppoePassword})</td>
                        <td className="py-3 px-4 text-slate-300">{cust.ipAddress}</td>
                        <td className="py-3 px-4 text-slate-300 font-sans">{cust.packageName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cust.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {cust.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Server Configuration */}
      {activeTab === 'config' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">PPPoE Server Parameters</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Access Concentrator (AC-Name)</label>
              <input
                type="text"
                value={pppoeConfig.serverName}
                onChange={e => setPppoeConfig({ ...pppoeConfig, serverName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Listening Interface</label>
              <select
                value={pppoeConfig.interfaceName}
                onChange={e => setPppoeConfig({ ...pppoeConfig, interfaceName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              >
                {state.interfaces.map(i => (
                  <option key={i.id} value={i.name}>
                    {i.name} ({i.description})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subscriber IP Pool Start</label>
              <input
                type="text"
                value={pppoeConfig.ipPoolStart}
                onChange={e => setPppoeConfig({ ...pppoeConfig, ipPoolStart: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subscriber IP Pool End</label>
              <input
                type="text"
                value={pppoeConfig.ipPoolEnd}
                onChange={e => setPppoeConfig({ ...pppoeConfig, ipPoolEnd: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gateway Local IP</label>
              <input
                type="text"
                value={pppoeConfig.localIp}
                onChange={e => setPppoeConfig({ ...pppoeConfig, localIp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Authentication Method</label>
              <select
                value={pppoeConfig.authMethod}
                onChange={e => setPppoeConfig({ ...pppoeConfig, authMethod: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
              >
                <option value="MS-CHAPv2">MS-CHAPv2 (Recommended / Secure)</option>
                <option value="CHAP">CHAP (MD5)</option>
                <option value="PAP">PAP (Plaintext - Legacy)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20"
          >
            Save &amp; Reload PPPoE Daemon
          </button>
        </div>
      )}

      {/* Tab: Raw accel-ppp Config */}
      {activeTab === 'raw' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-mono text-cyan-400 font-bold">/etc/accel-ppp.conf</span>
            <span className="text-slate-500 font-mono">Linux Kernel Generated Output</span>
          </div>
          <pre className="mt-3 p-4 bg-black/70 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed custom-scrollbar">
            {networkEngine.generatePppoeConfig(pppoeConfig)}
          </pre>
        </div>
      )}
    </div>
  );
};
