import React, { useState } from 'react';
import {
  Box,
  Plus,
  Zap,
  Gauge,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  Layers
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { PackageItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const PackagesView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const [packages, setPackages] = useState<PackageItem[]>(state.packages);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [downloadMbps, setDownloadMbps] = useState(25);
  const [uploadMbps, setUploadMbps] = useState(15);
  const [burstDownloadMbps, setBurstDownloadMbps] = useState(35);
  const [burstUploadMbps, setBurstUploadMbps] = useState(20);
  const [burstTimeSeconds, setBurstTimeSeconds] = useState(20);
  const [monthlyPrice, setMonthlyPrice] = useState(800);
  const [validityDays, setValidityDays] = useState(30);
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [priority, setPriority] = useState(4);
  const [description, setDescription] = useState('');

  const handleOpenAdd = () => {
    setName('');
    setDownloadMbps(25);
    setUploadMbps(15);
    setBurstDownloadMbps(35);
    setBurstUploadMbps(20);
    setBurstTimeSeconds(20);
    setMonthlyPrice(800);
    setValidityDays(30);
    setGracePeriodDays(3);
    setPriority(4);
    setDescription('High-speed fiber internet package with burst acceleration.');
    setEditingPackage(null);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingPackage) {
      const updated = packages.map(p =>
        p.id === editingPackage.id
          ? {
              ...p,
              name,
              downloadMbps,
              uploadMbps,
              burstDownloadMbps,
              burstUploadMbps,
              burstTimeSeconds,
              monthlyPrice,
              validityDays,
              gracePeriodDays,
              priority,
              description
            }
          : p
      );
      setPackages(updated);
      storage.setState({ packages: updated });
      storage.logAudit('Package Updated', 'BILLING', name, `Updated bandwidth profile to ${downloadMbps}M/${uploadMbps}M.`);
    } else {
      const newPkg: PackageItem = {
        id: `pkg-${Date.now()}`,
        name,
        downloadMbps,
        uploadMbps,
        burstDownloadMbps,
        burstUploadMbps,
        burstThresholdMbps: Math.floor(downloadMbps * 0.8),
        burstTimeSeconds,
        dataLimitGb: 0,
        validityDays,
        monthlyPrice,
        installationFee: 0,
        activationFee: 0,
        gracePeriodDays,
        concurrentSessions: 1,
        activeSubscribers: 0,
        description,
        enabled: true,
        priority
      };
      const updated = [...packages, newPkg];
      setPackages(updated);
      storage.setState({ packages: updated });
      storage.logAudit('New Package Created', 'BILLING', name, `Created package ${name} (${monthlyPrice} BDT/mo).`);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Box className="w-5 h-5 text-cyan-400" />
            Bandwidth Packages &amp; QoS Tariff Plans
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define CIR/MIR speeds, burst limiters, monthly fees, grace periods, and auto-generate Linux tc HTB queues.
          </p>
        </div>

        <button
          id="packages-btn-add"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Package</span>
        </button>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {packages.map(pkg => {
          const subscriberCount = state.customers.filter(c => c.packageId === pkg.id).length;
          return (
            <div
              key={pkg.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                      Priority Level: P{pkg.priority}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-white font-mono">{formatCurrency(pkg.monthlyPrice)}</span>
                  <span className="text-xs text-slate-400">/ {pkg.validityDays} Days</span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {pkg.description}
                </p>
              </div>

              {/* Bandwidth Speeds Box */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Download (DL):</span>
                  <strong className="text-cyan-400 font-bold">{pkg.downloadMbps} Mbps</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Upload (UL):</span>
                  <strong className="text-indigo-400 font-bold">{pkg.uploadMbps} Mbps</strong>
                </div>
                {pkg.burstDownloadMbps && (
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                    <span>Burst Speed:</span>
                    <span className="text-amber-300 font-semibold">{pkg.burstDownloadMbps}M ({pkg.burstTimeSeconds}s)</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Grace Period:</span>
                  <span className="text-emerald-400">{pkg.gracePeriodDays} Days</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span><strong>{subscriberCount}</strong> Subscribers</span>
                </div>
                <button
                  onClick={() => {
                    setName(pkg.name);
                    setDownloadMbps(pkg.downloadMbps);
                    setUploadMbps(pkg.uploadMbps);
                    setBurstDownloadMbps(pkg.burstDownloadMbps || pkg.downloadMbps);
                    setBurstUploadMbps(pkg.burstUploadMbps || pkg.uploadMbps);
                    setBurstTimeSeconds(pkg.burstTimeSeconds || 20);
                    setMonthlyPrice(pkg.monthlyPrice);
                    setValidityDays(pkg.validityDays);
                    setGracePeriodDays(pkg.gracePeriodDays);
                    setPriority(pkg.priority);
                    setDescription(pkg.description);
                    setEditingPackage(pkg);
                    setIsAddModalOpen(true);
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
                  title="Edit Package"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Package Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  {editingPackage ? 'Edit Package & QoS Profile' : 'Create Bandwidth Package'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Turbo Fiber 25 Mbps"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Download Speed (Mbps) *</label>
                  <input
                    type="number"
                    required
                    value={downloadMbps}
                    onChange={e => setDownloadMbps(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Upload Speed (Mbps) *</label>
                  <input
                    type="number"
                    required
                    value={uploadMbps}
                    onChange={e => setUploadMbps(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Burst Acceleration &amp; QoS Hierarchy
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Burst DL (Mbps)</label>
                    <input
                      type="number"
                      value={burstDownloadMbps}
                      onChange={e => setBurstDownloadMbps(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Burst UL (Mbps)</label>
                    <input
                      type="number"
                      value={burstUploadMbps}
                      onChange={e => setBurstUploadMbps(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Burst Time (s)</label>
                    <input
                      type="number"
                      value={burstTimeSeconds}
                      onChange={e => setBurstTimeSeconds(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={monthlyPrice}
                    onChange={e => setMonthlyPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={e => setValidityDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    value={gracePeriodDays}
                    onChange={e => setGracePeriodDays(parseInt(e.target.value) || 3)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Target subscriber description..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95"
                >
                  {editingPackage ? 'Update Package & QoS' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
