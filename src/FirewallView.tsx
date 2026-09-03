import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRightLeft,
  Lock,
  RefreshCw,
  Layers,
  FileCode
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { NetworkEngine } from '../../services/networkEngine';
import { FirewallRule, NatRule } from '../../types';
import { formatBytes } from '../../utils/formatters';

export const FirewallView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const networkEngine = NetworkEngine.getInstance();

  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>(state.firewallRules);
  const [natRules, setNatRules] = useState<NatRule[]>(state.natRules);
  const [activeTab, setActiveTab] = useState<'filter' | 'nat' | 'nftables'>('filter');
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isAddNatModalOpen, setIsAddNatModalOpen] = useState(false);

  // Filter Rule Form State
  const [chain, setChain] = useState<'INPUT' | 'FORWARD' | 'OUTPUT'>('FORWARD');
  const [protocol, setProtocol] = useState<'all' | 'tcp' | 'udp' | 'icmp'>('all');
  const [srcIp, setSrcIp] = useState('');
  const [dstIp, setDstIp] = useState('');
  const [dstPort, setDstPort] = useState('');
  const [action, setAction] = useState<'ACCEPT' | 'DROP' | 'REJECT'>('DROP');
  const [comment, setComment] = useState('');

  // NAT Form State
  const [natType, setNatType] = useState<'MASQUERADE' | 'DNAT' | 'SNAT'>('DNAT');
  const [natProtocol, setNatProtocol] = useState<'tcp' | 'udp' | 'both'>('tcp');
  const [natWanPort, setNatWanPort] = useState(8080);
  const [natLanIp, setLanIp] = useState('192.168.10.50');
  const [natLanPort, setLanPort] = useState(80);
  const [natDescription, setNatDescription] = useState('Web Server Port Forward');

  const handleToggleRule = (rule: FirewallRule) => {
    const updated = firewallRules.map(r => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
    setFirewallRules(updated);
    storage.setState({ firewallRules: updated });
    storage.logAudit(
      `Firewall Rule ${!rule.enabled ? 'Enabled' : 'Disabled'}`,
      'SECURITY',
      rule.comment,
      `Rule #${rule.priority} state changed.`
    );
  };

  const handleDeleteRule = (id: string) => {
    const updated = firewallRules.filter(r => r.id !== id);
    setFirewallRules(updated);
    storage.setState({ firewallRules: updated });
    storage.logAudit('Firewall Rule Deleted', 'SECURITY', id, 'Removed rule from active filter chain.');
  };

  const handleAddFilterRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: FirewallRule = {
      id: `fw-${Date.now()}`,
      chain,
      protocol,
      srcIp: srcIp || '0.0.0.0/0',
      dstIp: dstIp || '0.0.0.0/0',
      dstPort: dstPort || undefined,
      action,
      comment: comment || 'Custom user rule',
      enabled: true,
      packetCount: 0,
      byteCount: 0,
      priority: firewallRules.length + 1
    };

    const updated = [...firewallRules, newRule];
    setFirewallRules(updated);
    storage.setState({ firewallRules: updated });
    storage.logAudit('Firewall Rule Added', 'SECURITY', newRule.comment, `Added ${action} rule to ${chain} chain.`);
    setIsAddRuleModalOpen(false);
  };

  const handleAddNatRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newNat: NatRule = {
      id: `nat-${Date.now()}`,
      type: natType,
      protocol: natProtocol,
      wanInterface: state.wanConfig.interfaceName,
      wanPort: natWanPort,
      lanIp: natLanIp,
      lanPort: natLanPort,
      description: natDescription,
      enabled: true,
      packetCount: 0
    };

    const updated = [...natRules, newNat];
    setNatRules(updated);
    storage.setState({ natRules: updated });
    storage.logAudit('NAT Rule Added', 'NETWORK', newNat.description, `Port forward WAN:${natWanPort} -> ${natLanIp}:${natLanPort}`);
    setIsAddNatModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Linux Kernel Firewall &amp; NAT Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time nftables packet filtering, stateful connection tracking, port forwarding, and SYN flood protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'filter' && (
            <button
              onClick={() => setIsAddRuleModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Filter Rule</span>
            </button>
          )}
          {activeTab === 'nat' && (
            <button
              onClick={() => setIsAddNatModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Port Forward (DNAT)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('filter')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'filter'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Firewall Packet Filter Rules ({firewallRules.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('nat')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'nat'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>NAT &amp; Port Forwarding ({natRules.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('nftables')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'nftables'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Live /etc/nftables.conf</span>
        </button>
      </div>

      {/* Filter Rules Tab */}
      {activeTab === 'filter' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Chain</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Destination IP &amp; Port</th>
                  <th className="py-3 px-4">Description / Rule Label</th>
                  <th className="py-3 px-4">Packet Hits</th>
                  <th className="py-3 px-4 text-right">Toggle / Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {firewallRules.map(rule => (
                  <tr key={rule.id} className={`hover:bg-slate-800/40 transition ${!rule.enabled ? 'opacity-40' : ''}`}>
                    <td className="py-3 px-4 font-bold text-slate-300">
                      {rule.chain}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rule.action === 'ACCEPT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-300 uppercase">
                      {rule.protocol}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {rule.srcIp}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {rule.dstIp} {rule.dstPort && `:${rule.dstPort}`}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200">
                      {rule.comment}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div>{(rule.packetCount ?? 0).toLocaleString()} pkts</div>
                      <div className="text-[10px] text-cyan-400">{formatBytes(rule.byteCount)}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                            rule.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NAT Rules Tab */}
      {activeTab === 'nat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">WAN Interface &amp; Port</th>
                  <th className="py-3 px-4">LAN Target IP &amp; Port</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Hits</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {natRules.map(nat => (
                  <tr key={nat.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-cyan-400">{nat.type}</td>
                    <td className="py-3 px-4 uppercase text-slate-300">{nat.protocol}</td>
                    <td className="py-3 px-4 text-slate-200">
                      {nat.wanInterface}:{nat.wanPort}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {nat.lanIp}:{nat.lanPort}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{nat.description}</td>
                    <td className="py-3 px-4 text-slate-400">{(nat.packetCount ?? 0).toLocaleString()} pkts</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live /etc/nftables.conf Tab */}
      {activeTab === 'nftables' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-mono text-cyan-400 font-bold">/etc/nftables.conf</span>
            <span className="text-slate-500 font-mono">Generated Linux Kernel nftables configuration</span>
          </div>
          <pre className="p-4 bg-black/70 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed custom-scrollbar">
            {networkEngine.generateNftablesConfig(firewallRules, natRules, state.wanConfig.interfaceName)}
          </pre>
        </div>
      )}

      {/* Add Filter Rule Modal */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add Firewall Filter Rule</h3>
              <button onClick={() => setIsAddRuleModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddFilterRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chain</label>
                  <select
                    value={chain}
                    onChange={e => setChain(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  >
                    <option value="FORWARD">FORWARD (Client traffic)</option>
                    <option value="INPUT">INPUT (Traffic to router)</option>
                    <option value="OUTPUT">OUTPUT (Traffic from router)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Action</label>
                  <select
                    value={action}
                    onChange={e => setAction(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                  >
                    <option value="DROP">DROP (Silent Discard)</option>
                    <option value="REJECT">REJECT (Send ICMP Unreachable)</option>
                    <option value="ACCEPT">ACCEPT (Allow Traffic)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Protocol</label>
                  <select
                    value={protocol}
                    onChange={e => setProtocol(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono uppercase"
                  >
                    <option value="all">ALL</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Source IP/CIDR</label>
                  <input
                    type="text"
                    value={srcIp}
                    onChange={e => setSrcIp(e.target.value)}
                    placeholder="0.0.0.0/0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination Port</label>
                  <input
                    type="text"
                    value={dstPort}
                    onChange={e => setDstPort(e.target.value)}
                    placeholder="e.g. 22, 80"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Comment</label>
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="e.g. Block Port 23 Telnet attacks"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                >
                  Apply Filter Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add NAT Modal */}
      {isAddNatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add Port Forwarding (DNAT)</h3>
              <button onClick={() => setIsAddNatModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddNatRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Protocol</label>
                  <select
                    value={natProtocol}
                    onChange={e => setNatProtocol(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono uppercase"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="both">TCP &amp; UDP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WAN Port</label>
                  <input
                    type="number"
                    value={natWanPort}
                    onChange={e => setNatWanPort(parseInt(e.target.value) || 80)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">LAN Target IP</label>
                  <input
                    type="text"
                    value={natLanIp}
                    onChange={e => setLanIp(e.target.value)}
                    placeholder="192.168.10.50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">LAN Target Port</label>
                  <input
                    type="number"
                    value={natLanPort}
                    onChange={e => setLanPort(parseInt(e.target.value) || 80)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={natDescription}
                  onChange={e => setNatDescription(e.target.value)}
                  placeholder="e.g. CCTV DVR or Local Server"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddNatModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                >
                  Apply Port Forward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
