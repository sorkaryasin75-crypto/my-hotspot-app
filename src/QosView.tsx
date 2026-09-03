import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Layers,
  FileCode,
  CheckCircle2,
  Gauge,
  Sliders,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { NetworkEngine } from '../../services/networkEngine';
import { QosClass } from '../../types';
import { formatBitrate, formatBytes } from '../../utils/formatters';

export const QosView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const networkEngine = NetworkEngine.getInstance();

  const [qosClasses, setQosClasses] = useState<QosClass[]>(state.qosClasses);
  const [activeTab, setActiveTab] = useState<'classes' | 'script'>('classes');
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  const handleApplyQos = () => {
    setIsApplying(true);
    setApplyResult('Synchronizing Linux kernel traffic control (tc) qdisc HTB hierarchy...');

    setTimeout(() => {
      setIsApplying(false);
      setApplyResult('HTB queue disciplines & FQ_Codel leaf qdiscs successfully applied on all LAN/PPPoE interfaces.');
      storage.logAudit(
        'QoS Traffic Shaping Synchronized',
        'NETWORK',
        'tc-htb',
        'Rebuilt hierarchical token bucket queue tree with Fair Queueing bufferbloat mitigation.'
      );
      setTimeout(() => setApplyResult(null), 5000);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Bandwidth QoS &amp; Traffic Shaping Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Linux Kernel <code className="text-cyan-400 font-mono">tc</code> Hierarchical Token Bucket (HTB) with FQ_Codel for anti-bufferbloat and per-subscriber CIR/MIR guarantee.
          </p>
        </div>

        <button
          onClick={handleApplyQos}
          disabled={isApplying}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isApplying ? 'animate-spin' : ''}`} />
          <span>{isApplying ? 'Rebuilding Queues...' : 'Sync Kernel QoS Tree'}</span>
        </button>
      </div>

      {applyResult && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{applyResult}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'classes'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>HTB Traffic Shaping Classes ({qosClasses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'script'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Generated Linux tc Shell Script</span>
        </button>
      </div>

      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {qosClasses.map(cls => (
            <div
              key={cls.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{cls.className}</h3>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
                      Class ID {cls.classId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Parent: <strong>{cls.parentClassId || 'Root 1:0'}</strong> | Priority: <strong>P{cls.priority}</strong>
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                  <Gauge className="w-4 h-4" />
                </div>
              </div>

              {/* Bandwidth Limits */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Guaranteed Rate (CIR)</span>
                  <strong className="text-emerald-400 font-bold">{cls.rateKbps / 1000} Mbps</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Ceiling / Burst Rate (MIR)</span>
                  <strong className="text-cyan-400 font-bold">{cls.ceilKbps / 1000} Mbps</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Burst Buffer Size</span>
                  <span className="text-slate-300">{cls.burstKb} KB</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Leaf Queue Discipline</span>
                  <span className="text-indigo-300">fq_codel (no drop)</span>
                </div>
              </div>

              {/* Real-time Class Telemetry */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Current Utilization:</span>
                  <span className="text-cyan-400 font-bold">
                    {formatBitrate(cls.currentRateKbps)} / {cls.ceilKbps / 1000}M
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, (cls.currentRateKbps / cls.ceilKbps) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Packets: {(cls.packetCount ?? 0).toLocaleString()}</span>
                  <span>Total Data: {formatBytes(cls.byteCount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'script' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-mono text-cyan-400 font-bold">/usr/local/bin/isp-tc-qos.sh</span>
            <span className="text-slate-500 font-mono">Executable Linux Traffic Control Script</span>
          </div>
          <pre className="p-4 bg-black/70 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed custom-scrollbar">
            {networkEngine.generateTcQosScript(state.packages, 'eth1')}
          </pre>
        </div>
      )}
    </div>
  );
};
