import React, { useState } from 'react';
import {
  Network,
  Globe,
  Server,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  Power,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Zap,
  Info
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { NetworkEngine } from '../../services/networkEngine';
import { NetworkInterface, WanConfig, WanConnectionType } from '../../types';
import { formatBitrate, formatBytes } from '../../utils/formatters';

export const InterfacesView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const networkEngine = NetworkEngine.getInstance();

  const [interfaces, setInterfaces] = useState<NetworkInterface[]>(state.interfaces);
  const [wanConfig, setWanConfig] = useState<WanConfig>(state.wanConfig);
  const [isWanWizardOpen, setIsWanWizardOpen] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState<NetworkInterface | null>(null);

  // WAN Wizard Form State
  const [wizardConnectionType, setWizardConnectionType] = useState<WanConnectionType>(wanConfig.connectionType);
  const [wizardWanIface, setWizardWanIface] = useState(wanConfig.interfaceName);
  const [wizardIp, setWizardIp] = useState(wanConfig.ipAddress || '');
  const [wizardSubnet, setWizardSubnet] = useState(wanConfig.subnetMask || '');
  const [wizardGateway, setWizardGateway] = useState(wanConfig.gateway || '');
  const [wizardDns1, setWizardDns1] = useState(wanConfig.primaryDns);
  const [wizardDns2, setWizardDns2] = useState(wanConfig.secondaryDns || '');
  const [wizardPppoeUser, setWizardPppoeUser] = useState(wanConfig.pppoeUsername || '');
  const [wizardPppoePass, setWizardPppoePass] = useState(wanConfig.pppoePassword || '');
  const [wizardMtu, setWizardMtu] = useState(wanConfig.mtu);
  const [wizardNat, setWizardNat] = useState(wanConfig.natEnabled);

  // Safe Rollback Testing State
  const [isTestingWan, setIsTestingWan] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleToggleInterface = (iface: NetworkInterface) => {
    const newStatus = iface.status === 'up' ? 'down' : 'up';
    const updated = interfaces.map(i => (i.id === iface.id ? { ...i, status: newStatus as 'up' | 'down' } : i));
    setInterfaces(updated);
    storage.setState({ interfaces: updated });
    storage.logAudit(
      `Interface ${iface.name} ${newStatus.toUpperCase()}`,
      'NETWORK',
      iface.name,
      `Interface state changed to ${newStatus}. Link carrier toggled.`
    );
  };

  const handleApplyWanConfig = async () => {
    setIsTestingWan(true);
    setTestLogs([]);
    setTestResult(null);

    // Run Safe Execution with Network Engine
    const result = await networkEngine.executeSafeChange('WAN Configuration Update', async () => {
      // Simulate real kernel apply + ping test
      await new Promise(r => setTimeout(r, 1200));
      return true; // Verification passed
    });

    setTestLogs(result.logs);
    setTestResult({ success: result.success, message: result.message });
    setIsTestingWan(false);

    if (result.success) {
      const newWan: WanConfig = {
        interfaceName: wizardWanIface,
        connectionType: wizardConnectionType,
        ipAddress: wizardIp,
        subnetMask: wizardSubnet,
        gateway: wizardGateway,
        primaryDns: wizardDns1,
        secondaryDns: wizardDns2,
        pppoeUsername: wizardPppoeUser,
        pppoePassword: wizardPppoePass,
        mtu: wizardMtu,
        natEnabled: wizardNat,
        autoDns: false,
        status: 'connected',
        uptimeSeconds: 0
      };
      setWanConfig(newWan);
      storage.setState({ wanConfig: newWan });
      storage.logAudit(
        'WAN Uplink Configuration Updated',
        'NETWORK',
        wizardWanIface,
        `WAN set to ${wizardConnectionType.toUpperCase()} IP: ${wizardIp || 'DHCP/PPPoE'}`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Network Interfaces &amp; WAN Uplink
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical x86 NIC assignment, link carrier state, MTU, duplex, and WAN connection wizard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="interfaces-btn-wan-wizard"
            onClick={() => setIsWanWizardOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95"
          >
            <Globe className="w-4 h-4" />
            <span>WAN Configuration Wizard</span>
          </button>
        </div>
      </div>

      {/* WAN Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base">Primary WAN Uplink</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {wanConfig.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">({wanConfig.interfaceName})</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Type: <strong className="text-slate-200 uppercase">{wanConfig.connectionType}</strong> | Gateway: <strong className="text-cyan-300 font-mono">{wanConfig.gateway || 'None'}</strong> | MTU: <strong className="text-slate-300 font-mono">{wanConfig.mtu}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-2 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300">
              <span className="text-slate-500 block text-[10px]">Public IPv4</span>
              <strong className="text-cyan-400 text-sm">{wanConfig.ipAddress || 'Dynamic'}</strong>
            </div>
            <div className="px-3 py-2 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300">
              <span className="text-slate-500 block text-[10px]">Primary DNS</span>
              <strong className="text-indigo-300 text-sm">{wanConfig.primaryDns}</strong>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Download (RX Rate)</span>
            <span className="font-bold text-cyan-400 text-sm flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {formatBitrate(state.systemHealth.wanThroughputInKbps)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Upload (TX Rate)</span>
            <span className="font-bold text-indigo-400 text-sm flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {formatBitrate(state.systemHealth.wanThroughputOutKbps)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">NAT Masquerade</span>
            <span className="font-bold text-emerald-400 text-sm">
              {wanConfig.natEnabled ? 'Enabled (Active)' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Connection Health</span>
            <span className="font-bold text-emerald-400 text-sm">Loss: 0.0% (4ms)</span>
          </div>
        </div>
      </div>

      {/* Physical Interfaces Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Detected Hardware NICs (Linux sysfs)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interfaces.map(iface => (
            <div
              key={iface.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg space-y-4 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border ${
                    iface.status === 'up'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base font-mono">{iface.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {iface.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{iface.macAddress}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleInterface(iface)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                    iface.status === 'up'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-300'
                  }`}
                  title={iface.status === 'up' ? 'Click to Bring Down' : 'Click to Bring Up'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span className="uppercase text-[10px]">{iface.status}</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                {iface.description}
              </p>

              {/* Interface Properties Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-950/40 rounded border border-slate-800/40">
                  <span className="text-slate-500 text-[10px] block">IP / Subnet</span>
                  <span className="text-cyan-300 font-bold">{iface.ipAddress}</span>
                </div>
                <div className="p-2 bg-slate-950/40 rounded border border-slate-800/40">
                  <span className="text-slate-500 text-[10px] block">Link Speed / Duplex</span>
                  <span className="text-slate-300">{iface.speed} ({iface.duplex})</span>
                </div>
                <div className="p-2 bg-slate-950/40 rounded border border-slate-800/40">
                  <span className="text-slate-500 text-[10px] block">RX (Inbound)</span>
                  <span className="text-cyan-400">{formatBytes(iface.rxBytes)}</span>
                </div>
                <div className="p-2 bg-slate-950/40 rounded border border-slate-800/40">
                  <span className="text-slate-500 text-[10px] block">TX (Outbound)</span>
                  <span className="text-indigo-400">{formatBytes(iface.txBytes)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WAN Configuration Wizard Modal */}
      {isWanWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">WAN Configuration Wizard (Safe Rollback)</h3>
              </div>
              <button
                onClick={() => setIsWanWizardOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* WAN Interface & Connection Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Physical WAN NIC</label>
                  <select
                    value={wizardWanIface}
                    onChange={e => setWizardWanIface(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    {interfaces.map(i => (
                      <option key={i.id} value={i.name}>
                        {i.name} ({i.description})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Connection Protocol</label>
                  <select
                    value={wizardConnectionType}
                    onChange={e => setWizardConnectionType(e.target.value as WanConnectionType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 uppercase font-semibold"
                  >
                    <option value="static">Static IP Address</option>
                    <option value="dhcp">DHCP Client (Auto IP)</option>
                    <option value="pppoe">PPPoE Client (Fiber / Dialup)</option>
                  </select>
                </div>
              </div>

              {/* Conditional Fields based on connection type */}
              {wizardConnectionType === 'static' && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Static IPv4 Address</label>
                      <input
                        type="text"
                        value={wizardIp}
                        onChange={e => setWizardIp(e.target.value)}
                        placeholder="203.0.113.45"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Subnet Mask</label>
                      <input
                        type="text"
                        value={wizardSubnet}
                        onChange={e => setWizardSubnet(e.target.value)}
                        placeholder="255.255.255.0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Default Gateway</label>
                      <input
                        type="text"
                        value={wizardGateway}
                        onChange={e => setWizardGateway(e.target.value)}
                        placeholder="203.0.113.1"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardConnectionType === 'pppoe' && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">PPPoE Username</label>
                      <input
                        type="text"
                        value={wizardPppoeUser}
                        onChange={e => setWizardPppoeUser(e.target.value)}
                        placeholder="isp_wan_user"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">PPPoE Password</label>
                      <input
                        type="password"
                        value={wizardPppoePass}
                        onChange={e => setWizardPppoePass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DNS & MTU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary DNS Server</label>
                  <input
                    type="text"
                    value={wizardDns1}
                    onChange={e => setWizardDns1(e.target.value)}
                    placeholder="1.1.1.1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Secondary DNS Server</label>
                  <input
                    type="text"
                    value={wizardDns2}
                    onChange={e => setWizardDns2(e.target.value)}
                    placeholder="8.8.8.8"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">MTU Size</label>
                  <input
                    type="number"
                    value={wizardMtu}
                    onChange={e => setWizardMtu(parseInt(e.target.value) || 1500)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* NAT Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={wizardNat}
                  onChange={e => setWizardNat(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-slate-200 font-medium">Enable Automatic Outbound NAT Masquerade</span>
              </label>

              {/* Rollback Safety Notice */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p>
                  <strong>Failsafe Guard:</strong> The system will validate syntax, apply temporary kernel rules, test upstream gateway ping &amp; DNS, and automatically rollback if connectivity is lost.
                </p>
              </div>

              {/* Test Output Logs if testing */}
              {testLogs.length > 0 && (
                <div className="bg-black/80 rounded-lg p-3 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300 max-h-40 overflow-y-auto">
                  {testLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}

              {testResult && (
                <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsWanWizardOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyWanConfig}
                disabled={isTestingWan}
                className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95 disabled:opacity-50"
              >
                {isTestingWan ? <Zap className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                <span>{isTestingWan ? 'Testing & Applying...' : 'Apply & Verify with Rollback'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
