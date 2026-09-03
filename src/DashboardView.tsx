import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Radio,
  Wifi,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Globe,
  Server,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  HardDrive,
  RefreshCw,
  Zap,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { StorageService } from '../../services/storage';
import { BillingEngine } from '../../services/billingEngine';
import { formatBitrate, formatBytes, formatCurrency, formatUptime } from '../../utils/formatters';

interface DashboardViewProps {
  onSelectView?: (view: string) => void;
  onNavigate?: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectView, onNavigate }) => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const handleSelectView = (view: string) => {
    if (onSelectView) onSelectView(view);
    if (onNavigate) onNavigate(view);
  };

  // Generate 12-point real-time traffic history for chart
  const [trafficHistory, setTrafficHistory] = useState<Array<{ time: string; download: number; upload: number }>>([
    { time: '22:45', download: 42, upload: 68 },
    { time: '22:46', download: 48, upload: 72 },
    { time: '22:47', download: 39, upload: 65 },
    { time: '22:48', download: 55, upload: 80 },
    { time: '22:49', download: 62, upload: 84 },
    { time: '22:50', download: 58, upload: 79 },
    { time: '22:51', download: 45, upload: 82 },
    { time: '22:52', download: 49, upload: 76 },
    { time: '22:53', download: 52, upload: 85 },
    { time: '22:54', download: 47, upload: 81 },
    { time: '22:55', download: 53, upload: 88 },
    { time: '22:56', download: 45, upload: 82 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const dl = +(state.systemHealth.wanThroughputInKbps / 1000).toFixed(1);
      const ul = +(state.systemHealth.wanThroughputOutKbps / 1000).toFixed(1);

      setTrafficHistory(prev => [...prev.slice(1), { time: timeStr, download: dl, upload: ul }]);
    }, 3000);

    return () => clearInterval(interval);
  }, [state.systemHealth.wanThroughputInKbps, state.systemHealth.wanThroughputOutKbps]);

  // Aggregate metrics
  const totalCustomers = state.customers.length;
  const activeCustomers = state.customers.filter(c => c.status === 'ACTIVE').length;
  const suspendedCustomers = state.customers.filter(c => c.status === 'SUSPENDED').length;
  const expiredCustomers = state.customers.filter(c => c.status === 'EXPIRED').length;
  const onlinePppoe = state.pppoeSessions.filter(s => s.status === 'online').length;
  const onlineHotspot = state.hotspotSessions.length;

  const totalMonthlyRevenue = state.payments
    .filter(p => p.status === 'APPROVED')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalDue = state.customers.reduce((acc, c) => acc + c.dueAmount, 0);

  // Revenue by package breakdown data for bar chart
  const revenueByPackage = state.packages.map(pkg => {
    const custs = state.customers.filter(c => c.packageId === pkg.id);
    const rev = custs.reduce((sum, c) => sum + c.paidAmount, 0);
    return {
      name: pkg.name.split(' ')[0] + ' ' + pkg.name.split(' ')[1],
      subscribers: custs.length,
      revenue: rev
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / System State Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Virtual ISP Router Core Node #01</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                ROUTER ENGINE ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Uptime: <strong className="text-slate-200">{formatUptime(state.systemHealth.uptimeSeconds)}</strong> | Kernel Forwarding: <strong className="text-emerald-400">nftables + tc HTB</strong> | WAN Uplink: <strong className="text-cyan-400">203.0.113.45</strong> (1 Gbps)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="dash-btn-add-customer"
              onClick={() => handleSelectView('customers')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Customer</span>
            </button>
            <button
              id="dash-btn-wan-config"
              onClick={() => handleSelectView('interfaces')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>WAN Config</span>
            </button>
            <button
              id="dash-btn-diagnostics"
              onClick={() => handleSelectView('interfaces')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Ping / Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div
          onClick={() => handleSelectView('customers')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 hover:border-cyan-500/50 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subscribers</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">{totalCustomers}</span>
            <span className="text-xs font-medium text-emerald-400 font-mono">{activeCustomers} Active</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>{suspendedCustomers} Suspended</span>
            <span className="text-amber-400">{expiredCustomers} Expired</span>
          </div>
        </div>

        {/* Live Online Sessions */}
        <div
          onClick={() => handleSelectView('pppoe')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 hover:border-emerald-500/50 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Online Sessions</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">{onlinePppoe + onlineHotspot}</span>
            <span className="text-xs font-medium text-emerald-400 font-mono">Sessions Live</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>PPPoE: <strong>{onlinePppoe}</strong></span>
            <span>Hotspot: <strong>{onlineHotspot}</strong></span>
          </div>
        </div>

        {/* Real-time Bandwidth Throughput */}
        <div
          onClick={() => handleSelectView('interfaces')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 hover:border-indigo-500/50 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live WAN Bandwidth</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {formatBitrate(state.systemHealth.wanThroughputInKbps + state.systemHealth.wanThroughputOutKbps)}
            </span>
            <span className="text-xs text-indigo-400 font-mono">Total</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="text-cyan-400">↓ {formatBitrate(state.systemHealth.wanThroughputInKbps)}</span>
            <span className="text-indigo-300">↑ {formatBitrate(state.systemHealth.wanThroughputOutKbps)}</span>
          </div>
        </div>

        {/* Revenue & Outstanding Due */}
        <div
          onClick={() => handleSelectView('billing')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 hover:border-amber-500/50 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billing & Revenue</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400 tracking-tight font-mono">
              {formatCurrency(totalMonthlyRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Collected</span>
            <span className="text-rose-400 font-medium">Due: {formatCurrency(totalDue)}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row: Live Traffic Graph + Revenue / Subscribers Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Bandwidth Graph (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Real-Time WAN Traffic Rate</h3>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              </div>
              <p className="text-xs text-slate-400">Live 3-second sampling from Linux kernel interface counters</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-slate-300">Download (RX)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-slate-300">Upload (TX)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="M" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="download" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#downloadGrad)" />
                <Area type="monotone" dataKey="upload" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#uploadGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Peak RX Rate</span>
              <span className="font-bold text-cyan-400">92.4 Mbps</span>
            </div>
            <div>
              <span className="text-slate-500 block">Peak TX Rate</span>
              <span className="font-bold text-indigo-400">114.8 Mbps</span>
            </div>
            <div>
              <span className="text-slate-500 block">Packet Loss</span>
              <span className="font-bold text-emerald-400">0.00%</span>
            </div>
          </div>
        </div>

        {/* Package Revenue Distribution (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Package Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Subscribers & Monthly Collections</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByPackage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="subscribers" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Subscribers" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            {state.packages.slice(0, 3).map(pkg => (
              <div key={pkg.id} className="flex items-center justify-between text-slate-300">
                <span className="truncate max-w-[140px]">{pkg.name}</span>
                <span className="font-mono text-cyan-400 font-semibold">{formatCurrency(pkg.monthlyPrice)}/mo</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Interface Status & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical NICs Table Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Network Interfaces</h3>
            </div>
            <button
              onClick={() => handleSelectView('interfaces')}
              className="text-xs text-cyan-400 hover:underline font-medium"
            >
              Configure All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px] border-y border-slate-800">
                <tr>
                  <th className="py-2 px-3">Interface</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">IP Address</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Throughput</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {state.interfaces.map(iface => (
                  <tr key={iface.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${iface.status === 'up' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {iface.name}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[11px] text-slate-400">{iface.type}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{iface.ipAddress}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        iface.status === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {iface.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 text-[11px]">
                      {formatBitrate(iface.rxRateKbps + iface.txRateKbps)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit & System Event Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Immutable Security & Audit Stream</h3>
            </div>
            <button
              onClick={() => handleSelectView('logs')}
              className="text-xs text-cyan-400 hover:underline font-medium"
            >
              Full Log →
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
            {state.auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-slate-200">{log.action}</span>
                  <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{log.details}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Actor: <strong className="text-slate-300">{log.userName}</strong></span>
                  <span className="text-emerald-400 font-bold">[{log.result}]</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
