import React, { useState } from 'react';
import {
  Server,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Search,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { DhcpServerConfig, DhcpLease } from '../../types';
import { formatUptime } from '../../utils/formatters';

export const DhcpView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const [dhcpConfig, setDhcpConfig] = useState<DhcpServerConfig>(state.dhcpConfig);
  const [leases, setLeases] = useState<DhcpLease[]>(state.dhcpLeases);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStaticModalOpen, setIsAddStaticModalOpen] = useState(false);

  // Form for static lease
  const [staticIp, setStaticIp] = useState('');
  const [staticMac, setStaticMac] = useState('');
  const [staticHostname, setStaticHostname] = useState('');

  const filteredLeases = leases.filter(
    l =>
      l.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.ipAddress.includes(searchQuery) ||
      l.macAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveDhcpConfig = () => {
    storage.setState({ dhcpConfig });
    storage.logAudit(
      'DHCP Server Scope Updated',
      'NETWORK',
      dhcpConfig.interfaceName,
      `Range: ${dhcpConfig.rangeStart} - ${dhcpConfig.rangeEnd}, Gateway: ${dhcpConfig.gateway}`
    );
    alert('DHCP server settings saved and dnsmasq/kea daemon reloaded.');
  };

  const handleAddStaticLease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staticIp || !staticMac) return;

    const newLease: DhcpLease = {
      id: `lease-${Date.now()}`,
      ipAddress: staticIp,
      macAddress: staticMac,
      hostname: staticHostname || 'Static-Host',
      expiresInSeconds: 0,
      isStatic: true,
      lastSeen: new Date().toISOString()
    };

    const updated = [newLease, ...leases];
    setLeases(updated);
    storage.setState({ dhcpLeases: updated });
    storage.logAudit('Static DHCP Lease Bound', 'NETWORK', staticIp, `Bound MAC ${staticMac} to ${staticIp}.`);
    setIsAddStaticModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            DHCP Server &amp; Static IP Reservations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic IPv4 address assignment, lease lifetime timers, DNS server options, and MAC address reservations.
          </p>
        </div>

        <button
          onClick={() => setIsAddStaticModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Static Reservation</span>
        </button>
      </div>

      {/* DHCP Server Scope Parameters Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">DHCP Server Scope (LAN Subnet)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 font-sans font-semibold mb-1">LAN Subnet Network</label>
            <input
              type="text"
              value={dhcpConfig.subnet}
              onChange={e => setDhcpConfig({ ...dhcpConfig, subnet: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-sans font-semibold mb-1">Pool Range Start</label>
            <input
              type="text"
              value={dhcpConfig.rangeStart}
              onChange={e => setDhcpConfig({ ...dhcpConfig, rangeStart: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-sans font-semibold mb-1">Pool Range End</label>
            <input
              type="text"
              value={dhcpConfig.rangeEnd}
              onChange={e => setDhcpConfig({ ...dhcpConfig, rangeEnd: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-sans font-semibold mb-1">Default Gateway (Option 3)</label>
            <input
              type="text"
              value={dhcpConfig.gateway}
              onChange={e => setDhcpConfig({ ...dhcpConfig, gateway: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-sans font-semibold mb-1">DNS Server (Option 6)</label>
            <input
              type="text"
              value={dhcpConfig.dnsServer}
              onChange={e => setDhcpConfig({ ...dhcpConfig, dnsServer: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-sans font-semibold mb-1">Lease Time (Seconds)</label>
            <input
              type="number"
              value={dhcpConfig.leaseTimeSeconds}
              onChange={e => setDhcpConfig({ ...dhcpConfig, leaseTimeSeconds: parseInt(e.target.value) || 86400 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>
        </div>

        <button
          onClick={handleSaveDhcpConfig}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          Save &amp; Reload DHCP Daemon
        </button>
      </div>

      {/* Leases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search leases by hostname, IP, MAC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">Total Leases: <strong>{leases.length}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Hostname</th>
                <th className="py-3 px-4">Assigned IPv4</th>
                <th className="py-3 px-4">Client MAC Address</th>
                <th className="py-3 px-4">Lease Type</th>
                <th className="py-3 px-4">Remaining Lease Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLeases.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white font-sans">{l.hostname}</td>
                  <td className="py-3 px-4 text-cyan-300 font-bold">{l.ipAddress}</td>
                  <td className="py-3 px-4 text-slate-400">{l.macAddress}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.isStatic
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {l.isStatic ? 'STATIC (Fixed)' : 'DYNAMIC'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {l.isStatic ? 'Permanent' : formatUptime(l.expiresInSeconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Static Reservation Modal */}
      {isAddStaticModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add Static DHCP Lease Binding</h3>
              <button onClick={() => setIsAddStaticModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddStaticLease} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hostname / Device Label</label>
                <input
                  type="text"
                  value={staticHostname}
                  onChange={e => setStaticHostname(e.target.value)}
                  placeholder="e.g. Core-Switch-OLT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">MAC Address *</label>
                <input
                  type="text"
                  required
                  value={staticMac}
                  onChange={e => setStaticMac(e.target.value)}
                  placeholder="00:11:22:33:44:55"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reserved IPv4 *</label>
                <input
                  type="text"
                  required
                  value={staticIp}
                  onChange={e => setStaticIp(e.target.value)}
                  placeholder="192.168.10.25"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddStaticModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                >
                  Bind Static IP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
