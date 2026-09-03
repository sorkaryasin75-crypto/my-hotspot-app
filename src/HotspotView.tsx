import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Printer,
  Wifi,
  Users,
  Search,
  CheckCircle2,
  Trash2,
  Sliders,
  DollarSign,
  Clock,
  Sparkles,
  QrCode,
  Smartphone,
  Send,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Shield,
  Zap,
  Terminal,
  Activity,
  AlertTriangle,
  MessageSquare,
  Power,
  Download,
  Info,
  Signal,
  Cast,
  Layers,
  ArrowRight,
  Share2
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { SmsService } from '../../services/smsService';
import { HotspotConfig, HotspotVoucher, HotspotSession, MobileHotspotMode } from '../../types';
import { formatBytes, formatCurrency, formatUptime } from '../../utils/formatters';
import { HotspotCaptivePortalModal } from '../modals/HotspotCaptivePortalModal';
import { WifiScannerSimulator } from './hotspot/WifiScannerSimulator';
import { ApkBuilderTab } from './hotspot/ApkBuilderTab';

export const HotspotView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const [hotspotConfig, setHotspotConfig] = useState<HotspotConfig>(() => {
    const cfg = state.hotspotConfig;
    // ensure unique SSID if default generic
    if (!cfg.hotspotSsid || cfg.hotspotSsid === 'ApexISP_HighSpeed_Hotspot') {
      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      return {
        ...cfg,
        hotspotSsid: `ApexISP_SmartZone_${randHex}`,
        gatewayIp: cfg.gatewayIp || '192.168.43.1'
      };
    }
    return cfg;
  });

  const [vouchers, setVouchers] = useState<HotspotVoucher[]>(state.hotspotVouchers);
  const [sessions, setSessions] = useState<HotspotSession[]>(state.hotspotSessions || []);
  const [activeTab, setActiveTab] = useState<'signal_broadcaster' | 'apk_builder' | 'mobile_hotspot' | 'vouchers' | 'sessions' | 'portal' | 'setup_guide'>('signal_broadcaster');
  
  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLivePortalModalOpen, setIsLivePortalModalOpen] = useState(false);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<{ ip: string; mac: string } | null>(null);

  // Voucher Generator Form
  const [batchCount, setBatchCount] = useState<number>(10);
  const [voucherDurationHours, setVoucherDurationHours] = useState<number>(24);
  const [voucherDataLimitMb, setVoucherDataLimitMb] = useState<number>(2048);
  const [voucherPrice, setVoucherPrice] = useState<number>(30);
  const [voucherDownloadMbps, setVoucherDownloadMbps] = useState<number>(10);
  const [voucherUploadMbps, setVoucherUploadMbps] = useState<number>(5);

  // Search & Filter
  const [voucherSearch, setVoucherSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNCLAIMED' | 'ACTIVE' | 'EXPIRED'>('ALL');

  // Copy helper
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSsid, setCopiedSsid] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(true);

  // Generate Unique Random SSID
  const handleGenerateUniqueSsid = () => {
    const prefixes = ['ApexISP_Zone', 'ApexSmart_WiFi', 'ApexZone_Fast', 'Apex_Broadband', 'Apex_PublicWiFi'];
    const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newSsid = `${randPrefix}_${randHex}`;

    const updated: HotspotConfig = {
      ...hotspotConfig,
      hotspotSsid: newSsid
    };
    setHotspotConfig(updated);
    storage.setState({ hotspotConfig: updated });
    storage.logAudit(
      'Hotspot SSID Updated',
      'HOTSPOT',
      newSsid,
      `Generated new unique broadcast SSID: ${newSsid}`
    );
    setStatusMessage(`নতুন ইউনিক হটস্পট নাম তৈরি হয়েছে: "${newSsid}"`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Launch Phone Hotspot Settings Intent
  const handleOpenPhoneHotspotSettings = () => {
    // Attempt standard Android Settings Intent or fallback guidance
    const androidIntentUrl = 'intent:#Intent;action=android.settings.TETHER_SETTINGS;end';
    
    // Copy SSID to clipboard first so user can paste it immediately if needed
    if (hotspotConfig.hotspotSsid) {
      navigator.clipboard.writeText(hotspotConfig.hotspotSsid);
      setCopiedSsid(true);
      setTimeout(() => setCopiedSsid(false), 3000);
    }

    // Try triggering deep link
    try {
      window.location.href = androidIntentUrl;
    } catch {
      // ignore
    }

    setStatusMessage(`মোবাইলের হটস্পট সেটিংস খুলুন এবং হটস্পটের নাম "${hotspotConfig.hotspotSsid}" দিন (নাম কপি করা হয়েছে)।`);
    setTimeout(() => setStatusMessage(null), 6000);
  };

  // Dynamic Gateway IP based on Mobile Hotspot Mode
  const getGatewayIpForMode = (mode?: MobileHotspotMode): string => {
    switch (mode) {
      case 'ANDROID_HOTSPOT':
        return '192.168.43.1';
      case 'IOS_HOTSPOT':
        return '172.20.10.1';
      case 'CONNECTED_WIFI':
        return '192.168.1.1';
      default:
        return hotspotConfig.gatewayIp || '192.168.43.1';
    }
  };

  const handleModeChange = (mode: MobileHotspotMode) => {
    const updatedGateway = getGatewayIpForMode(mode);
    const updated: HotspotConfig = {
      ...hotspotConfig,
      mobileModeType: mode,
      gatewayIp: updatedGateway,
      ipAddress: updatedGateway,
      ipPoolStart: mode === 'ANDROID_HOTSPOT' ? '192.168.43.10' : mode === 'IOS_HOTSPOT' ? '172.20.10.2' : '192.168.1.50',
      ipPoolEnd: mode === 'ANDROID_HOTSPOT' ? '192.168.43.250' : mode === 'IOS_HOTSPOT' ? '172.20.10.14' : '192.168.1.200'
    };
    setHotspotConfig(updated);
    storage.setState({ hotspotConfig: updated });
    storage.logAudit(
      'Mobile Hotspot Mode Changed',
      'HOTSPOT',
      mode,
      `Switched to ${mode} mode (Gateway IP: ${updatedGateway}).`
    );
    setStatusMessage(`হটস্পট মোড সফলভাবে ${mode} এ পরিবর্তিত হয়েছে (Gateway: ${updatedGateway})।`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleToggleHotspot = () => {
    const updated = { ...hotspotConfig, enabled: !hotspotConfig.enabled };
    setHotspotConfig(updated);
    setIsBroadcasting(updated.enabled);
    storage.setState({ hotspotConfig: updated });
    storage.logAudit(
      updated.enabled ? 'Mobile Hotspot Enabled' : 'Mobile Hotspot Disabled',
      'HOTSPOT',
      hotspotConfig.serverName,
      `Mobile captive portal state: ${updated.enabled ? 'RUNNING' : 'STOPPED'}.`
    );
  };

  const handleGenerateVouchers = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch: HotspotVoucher[] = [];

    for (let i = 0; i < batchCount; i++) {
      const code = `VOUCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      newBatch.push({
        id: `v-${Date.now()}-${i}`,
        code,
        pin,
        durationHours: voucherDurationHours,
        dataLimitMb: voucherDataLimitMb,
        price: voucherPrice,
        status: 'UNCLAIMED',
        createdAt: new Date().toISOString(),
        downloadMbps: voucherDownloadMbps,
        uploadMbps: voucherUploadMbps
      });
    }

    const updated = [...newBatch, ...vouchers];
    setVouchers(updated);
    storage.setState({ hotspotVouchers: updated });
    storage.logAudit(
      'Hotspot Vouchers Generated',
      'HOTSPOT',
      `Batch of ${batchCount}`,
      `Created ${batchCount} vouchers (${voucherDurationHours}h / ${voucherPrice} BDT).`
    );

    setIsGenerateModalOpen(false);
    setStatusMessage(`${batchCount} টি নতুন ভাউচার সফলভাবে তৈরি হয়েছে!`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSavePortalConfig = () => {
    storage.setState({ hotspotConfig });
    storage.logAudit('Hotspot Portal Config Updated', 'HOTSPOT', hotspotConfig.portalTitle, 'Updated captive portal landing page.');
    setStatusMessage('ক্যাপটিভ পোর্টাল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Session controls: Extend time
  const handleExtendTime = (sessionId: string, additionalMinutes: number) => {
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          timeRemainingMinutes: (s.timeRemainingMinutes || 30) + additionalMinutes
        };
      }
      return s;
    });
    setSessions(updated);
    storage.setState({ hotspotSessions: updated });
    setStatusMessage(`সেশনে অতিরিক্ত ${additionalMinutes} মিনিট যোগ করা হয়েছে।`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Session controls: Change Speed
  const handleChangeSpeed = (sessionId: string, downloadMbps: number) => {
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          speedDownloadMbps: downloadMbps,
          rxRateKbps: downloadMbps * 1000
        };
      }
      return s;
    });
    setSessions(updated);
    storage.setState({ hotspotSessions: updated });
    setStatusMessage(`স্পিড পরিবর্তন করে ${downloadMbps} Mbps করা হয়েছে।`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Session controls: Kick / Disconnect
  const handleKickGuest = (session: HotspotSession) => {
    const updated = sessions.filter(s => s.id !== session.id);
    setSessions(updated);
    storage.setState({ hotspotSessions: updated });
    storage.logAudit(
      'Guest Device Kicked',
      'HOTSPOT',
      session.macAddress,
      `Admin disconnected ${session.username} (${session.ipAddress} - ${session.macAddress}).`
    );
    setStatusMessage(`ডিভাইস ${session.ipAddress} (${session.macAddress}) সফলভাবে ডিসকানেক্ট করা হয়েছে।`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Copy portal link
  const portalUrl = `http://${hotspotConfig.gatewayIp || '192.168.43.1'}:3000/`;
  const handleCopyPortalLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Wi-Fi QR Code string
  const wifiSsid = hotspotConfig.hotspotSsid || 'ApexISP_HighSpeed_Hotspot';
  const wifiPass = hotspotConfig.hotspotPassword || '';
  const wifiQrString = `WIFI:S:${wifiSsid};T:${wifiPass ? 'WPA' : 'nopass'};P:${wifiPass};;`;

  // Filtered vouchers
  const filteredVouchers = vouchers.filter(v => {
    const matchesQuery = v.code.toLowerCase().includes(voucherSearch.toLowerCase()) || (v.claimedByMac && v.claimedByMac.toLowerCase().includes(voucherSearch.toLowerCase()));
    const vStatus = (v.status || '').toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'UNCLAIMED' && (vStatus === 'UNCLAIMED' || vStatus === 'UNUSED')) || (statusFilter === 'ACTIVE' && vStatus === 'ACTIVE') || (statusFilter === 'EXPIRED' && vStatus === 'EXPIRED');
    return matchesQuery && matchesStatus;
  });

  // Download Shell Automation Script
  const handleDownloadScript = () => {
    const scriptContent = `#!/bin/bash
# ==============================================================================
# ApexISP Mobile Hotspot & Captive Portal Redirection Script
# Gateway: ${hotspotConfig.gatewayIp || '192.168.43.1'} | SSID: ${wifiSsid}
# ==============================================================================

echo "🚀 Starting ApexISP Mobile Hotspot Engine..."
echo "SSID: ${wifiSsid}"
echo "Gateway: ${hotspotConfig.gatewayIp || '192.168.43.1'}"

# Enable IP Forwarding
sysctl -w net.ipv4.ip_forward=1 > /dev/null 2>&1

# Setup Iptables Port Redirection for HTTP Captive Portal
iptables -t nat -F PREROUTING 2>/dev/null
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination ${hotspotConfig.gatewayIp || '192.168.43.1'}:3000
iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to-destination ${hotspotConfig.gatewayIp || '192.168.43.1'}:3000
iptables -t nat -A POSTROUTING -j MASQUERADE

echo "✅ Captive Portal Routing Active! Customers connecting to ${wifiSsid} will see login portal."
`;
    const blob = new Blob([scriptContent], { type: 'text/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex_hotspot_${wifiSsid}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage('হটস্পট অটোমেশন স্ক্রিপ্ট ডাউনলোড হয়েছে!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Signal className="w-5 h-5 text-cyan-400" />
              Mobile Hotspot &amp; Wi-Fi Captive Portal
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              ইউনিক সিগন্যাল ব্রডকাস্টার
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            মোবাইল ফোনের মাধ্যমে একটি ইউনিক Hotspot Signal শেয়ার করুন যা আশেপাশের সব মোবাইলের ওয়াইফাই তালিকায় দেখা যাবে এবং কানেক্ট করতে পারবে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedSessionForModal(null);
              setIsLivePortalModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition active:scale-95"
            title="Open interactive guest captive portal preview"
          >
            <Radio className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>📱 লাইভ ক্যাপটিভ পোর্টাল চালু / টেস্ট</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>ভাউচার প্রিন্ট</span>
          </button>

          <button
            id="hotspot-btn-generate"
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ভাউচার তৈরি</span>
          </button>
        </div>
      </div>

      {/* Status feedback message */}
      {statusMessage && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ================= HERO BROADCASTER RADAR & QUICK LAUNCH CARD ================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border-2 border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Background glow & radar circles */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Live Signal Radar Graphic */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-cyan-500/20 relative">
            <div className="relative w-36 h-36 flex items-center justify-center my-2">
              {/* Radar pulse rings */}
              {isBroadcasting && (
                <>
                  <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping duration-1000"></div>
                  <div className="absolute -inset-4 rounded-full border border-cyan-400/10 animate-pulse"></div>
                  <div className="absolute -inset-8 rounded-full border border-cyan-400/5"></div>
                </>
              )}
              
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30 relative z-10">
                <Wifi className="w-10 h-10 animate-bounce duration-1000" />
              </div>
            </div>

            <div className="text-center space-y-1 mt-1">
              <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-0.5 rounded-full border border-cyan-500/30 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isBroadcasting ? 'SIGNAL BROADCASTING' : 'SIGNAL PAUSED'}
              </span>
              <div className="text-white font-extrabold text-sm tracking-tight truncate max-w-[220px]">
                {wifiSsid}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                2.4GHz / 5.0GHz Dual-Band • Channel 6 • Range ~45m
              </div>
            </div>
          </div>

          {/* Middle: Broadcast Info & One-Click Actions */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                  ইউনিক ওয়াইফাই সিগন্যাল নাম (SSID Identifier):
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg sm:text-xl font-extrabold text-white font-mono bg-slate-950 px-3 py-1 rounded-xl border border-cyan-500/40 text-cyan-300">
                    {wifiSsid}
                  </span>
                  <button
                    onClick={handleGenerateUniqueSsid}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl border border-slate-700 transition"
                    title="Generate another unique Hotspot name"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(wifiSsid);
                      setCopiedSsid(true);
                      setTimeout(() => setCopiedSsid(false), 2000);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                    title="Copy SSID"
                  >
                    {copiedSsid ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleHotspot}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow-lg ${
                    hotspotConfig.enabled
                      ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{hotspotConfig.enabled ? 'সিগন্যাল বন্ধ করুন' : 'সিগন্যাল চালু করুন'}</span>
                </button>
              </div>
            </div>

            {/* Step-by-Step Direct Trigger Guide Banner */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <strong className="text-slate-100 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  অন্যান্য মোবাইলের জন্য সিগন্যাল অ্যাক্টিভ করার পদ্ধতি:
                </strong>
                <p className="text-[11px] text-slate-400">
                  ১. নিচের বাটনে চাপ দিয়ে ফোনের Hotspot সেটিংস খুলুন ➜ ২. Hotspot চালু করে নাম দিন <strong className="text-cyan-300">{wifiSsid}</strong> ➜ ৩. অন্যান্য ইউজার তাদের Wi-Fi অন করলেই এই নামটি দেখতে পাবে।
                </p>
              </div>

              <button
                onClick={handleOpenPhoneHotspotSettings}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs whitespace-nowrap shadow-md shadow-cyan-600/30 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>⚡ ফোনে হটস্পট সেটিংস খুলুন</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Gateway IP</span>
                <strong className="text-cyan-400">{hotspotConfig.gatewayIp || '192.168.43.1'}</strong>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Security</span>
                <strong className="text-emerald-400">{wifiPass ? 'WPA2 Personal' : 'Open / Captive'}</strong>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Active Users</span>
                <strong className="text-indigo-400">{sessions.length} Online</strong>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Vouchers</span>
                <strong className="text-amber-400">{vouchers.length} Ready</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('signal_broadcaster')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'signal_broadcaster'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cast className="w-3.5 h-3.5" />
          <span>📡 লাইভ সিগন্যাল ও ওয়াইফাই স্ক্যানার প্রিভিউ</span>
        </button>

        <button
          onClick={() => setActiveTab('apk_builder')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'apk_builder'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>📱 মোবাইল APK তৈরি ও নেটিভ গাইড</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono font-bold">APK BUILD</span>
        </button>

        <button
          onClick={() => setActiveTab('mobile_hotspot')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'mobile_hotspot'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>মোবাইল হটস্পট কনফিগ ও QR কোড</span>
        </button>

        <button
          onClick={() => setActiveTab('vouchers')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'vouchers'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>ভাউচার ডাটাবেজ ({vouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'sessions'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>কানেক্টেড ইউজার সেশন ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('portal')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'portal'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>পোর্টাল কাস্টমাইজেশন ও বিকাশ অটো পাস</span>
        </button>

        <button
          onClick={() => setActiveTab('setup_guide')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'setup_guide'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>🛠️ অটোমেশন স্ক্রিপ্ট ও টার্মিনাল গাইড</span>
        </button>
      </div>

      {/* ================= TAB 0: LIVE SIGNAL RADAR & NEARBY PHONES SCANNER PREVIEW ================= */}
      {activeTab === 'signal_broadcaster' && (
        <div className="space-y-6">
          {/* Interactive Wi-Fi Scanner & Real Phone Link */}
          <WifiScannerSimulator
            ssid={wifiSsid}
            gatewayIp={hotspotConfig.gatewayIp || '192.168.43.1'}
            isBroadcasting={isBroadcasting}
            onOpenPortal={() => {
              setSelectedSessionForModal(null);
              setIsLivePortalModalOpen(true);
            }}
          />

          {/* Direct Connect QR Card & Quick 3-Step Operation Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    ইনস্ট্যান্ট ওয়াইফাই কানেক্ট QR কোড
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    অন্যান্য ইউজাররা পাসওয়ার্ড না টাইপ করে কেবল ক্যামেরা দিয়ে স্ক্যান করলেই স্বয়ংক্রিয়ভাবে ওয়াইফাইতে যুক্ত হবে।
                  </p>
                </div>
                <button
                  onClick={() => {
                    const sms = SmsService.getInstance();
                    const msg = `ফ্রি/পেইড ইন্টারনেটের জন্য ${wifiSsid} ওয়াইফাইতে কানেক্ট করুন। পোর্টাল লিংক: ${portalUrl}`;
                    sms.openWhatsApp('', msg);
                  }}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>হোয়াটসঅ্যাপে শেয়ার</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="sm:col-span-4 flex justify-center">
                  <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-cyan-500/30 text-center">
                    <div className="w-32 h-32 bg-slate-900 rounded-lg p-2 flex flex-col items-center justify-center text-white relative overflow-hidden">
                      <QrCode className="w-20 h-20 text-cyan-400" />
                      <span className="text-[8px] font-mono text-cyan-300 truncate max-w-[100px] mt-1">{wifiSsid}</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-8 space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Wi-Fi Network Name:</span>
                    <strong className="text-cyan-300 font-bold">{wifiSsid}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Security Mode:</span>
                    <span className="text-slate-200">{wifiPass ? 'WPA2-PSK' : 'Open (Captive Protected)'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Hotspot Gateway IP:</span>
                    <span className="text-emerald-400 font-bold">{hotspotConfig.gatewayIp || '192.168.43.1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Direct Captive URL:</span>
                    <span className="text-cyan-400 truncate max-w-[180px]">{portalUrl}</span>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleCopyPortalLink}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans font-semibold border border-slate-700 flex items-center gap-1 transition"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'লিংক কপি হয়েছে' : 'পোর্টাল URL কপি'}</span>
                    </button>

                    <button
                      onClick={handleDownloadScript}
                      className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg text-[11px] font-sans font-semibold border border-cyan-500/30 flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>অটোমেশন স্ক্রিপ্ট</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick 3-Step Operation Card */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  আপনার ফোন দিয়ে যেভাবে সম্পূর্ণ সিস্টেমটি কার্যকর করবেন:
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  ফোনের সেটিংসে গিয়ে হটস্পটটি একবার অন করলেই অন্যান্য যেকোনো ফোনে সিগন্যাল দৃশ্যমান হবে:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs my-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">1</span>
                  <strong className="text-slate-200 block">ফোনের হটস্পট অন করুন</strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    সেটিংসে গিয়ে হটস্পটের নাম দিন <em className="text-cyan-300 font-mono">{wifiSsid}</em>।
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">2</span>
                  <strong className="text-slate-200 block">কাস্টমার কানেক্ট করবে</strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    কাস্টমার তার ওয়াইফাইতে এই নাম সিলেক্ট করলেই ক্যাপটিভ পেজ চালু হবে।
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">3</span>
                  <strong className="text-slate-200 block">স্বয়ংক্রিয় বিলিং ও কন্ট্রোল</strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ভাউচার কোড বা বিকাশ পেমেন্টে সঙ্গে সঙ্গে নেট চালু হবে ও স্পিড নিয়ন্ত্রণ হবে।
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('apk_builder')}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>সরাসরি মোবাইল APK তৈরি করার সম্পূর্ণ গাইড দেখুন ➜</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 0.5: ANDROID APK BUILDER & GUIDE ================= */}
      {activeTab === 'apk_builder' && (
        <ApkBuilderTab />
      )}

      {/* ================= TAB 1: MOBILE HOTSPOT QUICK CONTROLLER & CONFIG ================= */}
      {activeTab === 'mobile_hotspot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Quick Wi-Fi Auto Connect QR Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-center flex flex-col items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest font-mono bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                📷 SCAN TO CONNECT WI-FI
              </span>
              <h3 className="font-extrabold text-white text-base mt-2">গ্রাহকের জন্য Wi-Fi QR কোড</h3>
              <p className="text-xs text-slate-400 mt-1">
                গ্রাহক তার ফোনের ক্যামেরা দিয়ে এই QR কোড স্ক্যান করলেই স্বয়ংক্রিয়ভাবে ওয়াইফাইতে যুক্ত হবে এবং ক্যাপটিভ পোর্টাল চালু হবে।
              </p>
            </div>

            {/* Simulated Clean QR Code Graphic */}
            <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/40 my-2">
              <div className="w-44 h-44 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center text-white font-mono text-[10px] space-y-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/20"></div>
                <QrCode className="w-24 h-24 text-cyan-400" />
                <div className="font-bold text-slate-200 text-center tracking-tight truncate max-w-[150px]">
                  {wifiSsid}
                </div>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                  WPA2 / Open Hotspot
                </span>
              </div>
            </div>

            <div className="w-full space-y-2 font-mono text-xs text-left bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Wi-Fi SSID:</span>
                <strong className="text-cyan-300">{wifiSsid}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security:</span>
                <span className="text-slate-300">{wifiPass ? 'Password Protected' : 'Open / Captive'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Portal Link:</span>
                <span className="text-emerald-400">{portalUrl}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedSessionForModal(null);
                setIsLivePortalModalOpen(true);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>📱 টেস্ট গেস্ট হিসেবে লগইন করুন</span>
            </button>
          </div>

          {/* Middle & Right: Configuration & Fast Setup */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  মোবাইল হটস্পট প্যারামিটার কনফিগারেশন
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateUniqueSsid}
                  className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-500/30 flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ইউনিক SSID জেনারেট</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">হটস্পট ওয়াইফাই নাম (SSID Name)</label>
                  <input
                    type="text"
                    value={hotspotConfig.hotspotSsid || ''}
                    onChange={e => setHotspotConfig({ ...hotspotConfig, hotspotSsid: e.target.value })}
                    placeholder="e.g. ApexISP_SmartZone_8849"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">হটস্পট পাসওয়ার্ড (যদি ওপেন না রাখতে চান)</label>
                  <input
                    type="text"
                    value={hotspotConfig.hotspotPassword || ''}
                    onChange={e => setHotspotConfig({ ...hotspotConfig, hotspotPassword: e.target.value })}
                    placeholder="খালি রাখলে পাসওয়ার্ডহীন ওপেন হটস্পট"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">গেটওয়ে আইপি অ্যাড্রেস (Gateway IP)</label>
                  <input
                    type="text"
                    value={hotspotConfig.gatewayIp || '192.168.43.1'}
                    onChange={e => setHotspotConfig({ ...hotspotConfig, gatewayIp: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ক্যাপটিভ পোর্টাল পোর্ট (HTTP Port)</label>
                  <input
                    type="number"
                    value={hotspotConfig.captivePort || 3000}
                    onChange={e => setHotspotConfig({ ...hotspotConfig, captivePort: parseInt(e.target.value) || 3000 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hotspotConfig.allowFreeTrial ?? true}
                    onChange={e => setHotspotConfig({ ...hotspotConfig, allowFreeTrial: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">১৫ মিনিট ফ্রি ট্রায়াল</span>
                    <span className="text-[10px] text-slate-400">নতুন গ্রাহকদের জন্য</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hotspotConfig.allowOnlinePurchase ?? true}
                    onChange={e => setHotspotConfig({ ...hotspotConfig, allowOnlinePurchase: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">বিকাশ/নগদ অটো পাস</span>
                    <span className="text-[10px] text-slate-400">১০৳ / ৩০৳ / ১২০৳ প্যাকেজ</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hotspotConfig.allowSubscriberLogin ?? true}
                    onChange={e => setHotspotConfig({ ...hotspotConfig, allowSubscriberLogin: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">হোম ব্রডব্যান্ড লগইন</span>
                    <span className="text-[10px] text-slate-400">PPPoE ইউজার ফ্রি ব্যবহার</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSavePortalConfig}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/20 transition active:scale-95"
                >
                  কনফিগারেশন সেভ করুন
                </button>
              </div>
            </div>

            {/* Quick Overview of Connected Devices */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  বর্তমানে কানেক্ট থাকা ইউজার ({sessions.length} জন)
                </h4>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="text-xs text-cyan-400 hover:underline font-bold"
                >
                  সম্পূর্ণ তালিকা দেখুন →
                </button>
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">বর্তমানে কোনো গেস্ট কানেক্টেড নেই।</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 3).map(s => (
                    <div key={s.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <strong className="text-cyan-400">{s.username}</strong>
                        <span className="text-slate-400">({s.ipAddress})</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-sans">
                          {s.sessionType || 'VOUCHER'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <span>বাকি: <strong className="text-emerald-400 font-bold">{s.timeRemainingMinutes}m</strong></span>
                        <span>স্পিড: <strong className="text-slate-200">{s.speedDownloadMbps || 10} Mbps</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: VOUCHERS DATABASE ================= */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={voucherSearch}
                onChange={e => setVoucherSearch(e.target.value)}
                placeholder="ভাউচার কোড বা MAC খুঁজুন..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['ALL', 'UNCLAIMED', 'ACTIVE', 'EXPIRED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                    statusFilter === tab
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'ALL' ? 'সব ভাউচার' : tab === 'UNCLAIMED' ? 'অব্যবহৃত' : tab === 'ACTIVE' ? 'সক্রিয়' : 'মেয়াদ শেষ'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Voucher Code</th>
                    <th className="py-3 px-4">PIN</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4">Speed Limit</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Claimed MAC</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredVouchers.map(v => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-cyan-400 text-sm tracking-wider">
                        {v.code}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {v.pin || '1234'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        {v.durationHours ? `${v.durationHours} Hours` : `${v.durationMinutes || 60} Mins`}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {v.downloadMbps || v.speedLimitMbps || 10}M / {v.uploadMbps || 5}M
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {formatCurrency(v.price)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            (v.status || '').toUpperCase() === 'UNCLAIMED' || (v.status || '').toUpperCase() === 'UNUSED'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : (v.status || '').toUpperCase() === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {v.claimedByMac || v.macAddress || 'Unclaimed'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            const updated = vouchers.filter(item => item.id !== v.id);
                            setVouchers(updated);
                            storage.setState({ hotspotVouchers: updated });
                          }}
                          className="p-1 hover:text-rose-400 text-slate-500 transition"
                          title="Delete Voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: ACTIVE GUEST SESSIONS & CONTROLS ================= */}
      {activeTab === 'sessions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Mobile &amp; Wi-Fi Guest Sessions</h2>
              <p className="text-xs text-slate-400">বর্তমানে মোবাইল হটস্পটে সংযুক্ত থাকা সকল গেস্ট ডিভাইস ও রিয়েল-টাইম ব্যান্ডউইথ কন্ট্রোল।</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Total Online: {sessions.length}
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400">কোনো গেস্ট ডিভাইস বর্তমানে সক্রিয় নেই।</p>
              <button
                onClick={() => {
                  setSelectedSessionForModal(null);
                  setIsLivePortalModalOpen(true);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition"
              >
                টেস্ট ডিভাইস কানেক্ট করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map(s => (
                <div key={s.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <strong className="text-cyan-400 text-sm">{s.username}</strong>
                    </div>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30">
                      ONLINE ({s.sessionType || 'VOUCHER'})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">আইপি (IP)</span>
                      <strong>{s.ipAddress}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">ম্যাক (MAC)</span>
                      <strong>{s.macAddress}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">স্পিড লিমিট</span>
                      <strong className="text-indigo-300">{s.speedDownloadMbps || 10} Mbps ↓ / {s.speedUploadMbps || 5} Mbps ↑</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">বাকি সময়</span>
                      <strong className="text-emerald-400 font-bold">{s.timeRemainingMinutes} মিনিট</strong>
                    </div>
                  </div>

                  {/* Real-time session action buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 font-sans">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleExtendTime(s.id, 60)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold rounded border border-cyan-500/30 transition"
                        title="Extend 1 hour"
                      >
                        +১ ঘণ্টা বাড়ান
                      </button>

                      <button
                        onClick={() => handleChangeSpeed(s.id, (s.speedDownloadMbps || 10) === 10 ? 20 : 10)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-bold rounded border border-indigo-500/30 transition"
                        title="Toggle Speed Limit"
                      >
                        ⚡ স্পিড {(s.speedDownloadMbps || 10) === 10 ? '20M' : '10M'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleKickGuest(s)}
                      className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[11px] font-bold rounded border border-rose-500/30 transition flex items-center gap-1"
                      title="Kick user off hotspot"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>কিক / ডিসকানেক্ট</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: PORTAL CUSTOMIZER & BRANDING ================= */}
      {activeTab === 'portal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Captive Portal Branding &amp; Content</h2>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Portal Title / হটস্পটের নাম</label>
              <input
                type="text"
                value={hotspotConfig.portalTitle}
                onChange={e => setHotspotConfig({ ...hotspotConfig, portalTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">স্বাগতম বার্তা (Welcome Greeting Message)</label>
              <textarea
                rows={2}
                value={hotspotConfig.welcomeMessage || ''}
                onChange={e => setHotspotConfig({ ...hotspotConfig, welcomeMessage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">সাপোর্ট / হেল্পলাইন নম্বর</label>
              <input
                type="text"
                value={hotspotConfig.supportContact || ''}
                onChange={e => setHotspotConfig({ ...hotspotConfig, supportContact: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSavePortalConfig}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-md shadow-cyan-600/20"
              >
                ব্র্যান্ডিং সংরক্ষণ করুন
              </button>
            </div>
          </div>

          {/* Live Interactive Mobile Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Live Mobile Captive Portal Preview</span>
            <div className="w-72 bg-slate-950 border-4 border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 text-center text-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-white text-sm">{hotspotConfig.portalTitle}</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{hotspotConfig.welcomeMessage}</p>

              <div className="space-y-2 pt-1 font-mono">
                <input
                  type="text"
                  placeholder="Enter Voucher Code"
                  readOnly
                  value="APEX-8849-21"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 text-center uppercase tracking-widest font-bold text-xs"
                />
                <button
                  onClick={() => {
                    setSelectedSessionForModal(null);
                    setIsLivePortalModalOpen(true);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg text-xs transition active:scale-95"
                >
                  কানেক্ট করুন (Live Test)
                </button>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>Helpline: {hotspotConfig.supportContact}</span>
                <span className="text-emerald-400 font-bold">bKash Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: MOBILE TETHERING & REDIRECT SETUP GUIDE ================= */}
      {activeTab === 'setup_guide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              মোবাইলের ওয়াইফাই ও হটস্পট ক্যাপটিভ পোর্টাল চালু করার সহজ পদ্ধতি
            </h2>
            <p className="text-slate-400 mt-1">
              আপনার ফোন থেকে অন্য ফোনে বা কাস্টমারকে কীভাবে ইন্টারনেট শেয়ার করে এই সফটওয়্যারটি ক্যাপটিভ পোর্টাল হিসেবে কাজ করাবেন তার সম্পূর্ণ গাইড:
            </p>
          </div>

          {/* 3 Step Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                ১
              </div>
              <h4 className="font-bold text-slate-100 text-sm">ফোনের হটস্পট অন করুন</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                আপনার মোবাইলের <strong>Settings &gt; Portable Hotspot / Personal Hotspot</strong> চালু করুন। হটস্পটের নাম দিন <em>{wifiSsid}</em>।
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                ২
              </div>
              <h4 className="font-bold text-slate-100 text-sm">গ্রাহক কানেক্ট করবে</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                কাস্টমার আপনার QR কোড স্ক্যান করে বা ওয়াইফাই লিস্ট থেকে সিলেক্ট করে কানেক্ট করলেই সাথে সাথে ব্রাউজারে <strong>লগইন পেজ (Captive Portal)</strong> খুলে যাবে।
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                ৩
              </div>
              <h4 className="font-bold text-slate-100 text-sm">ভাউচার বা বিকাশ পেমেন্ট</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                কাস্টমার ভাউচার কোড দেবে অথবা সরাসরি বিকাশ/নগদে টাকা পাঠিয়ে ইন্টারনেট চালু করবে। সফটওয়্যার স্বয়ংক্রিয়ভাবে স্পিড ও সময় নিয়ন্ত্রণ করবে।
              </p>
            </div>
          </div>

          {/* Technical Port Redirect Script (Termux / Linux / Mikrotik) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                অ্যান্ড্রয়েড Termux / Mikrotik অটো রিডাইরেক্ট স্ক্রিপ্ট (Terminal Script):
              </h4>
              <button
                onClick={handleDownloadScript}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>স্ক্রিপ্ট ফাইল ডাউনলোড (.sh)</span>
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-2 overflow-x-auto">
              <div className="text-slate-500"># Android Termux / Root Iptables Captive Redirection Command</div>
              <div>iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination {hotspotConfig.gatewayIp || '192.168.43.1'}:3000</div>
              <div>iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to-destination {hotspotConfig.gatewayIp || '192.168.43.1'}:3000</div>
              <div className="text-slate-500 pt-2"># Mikrotik RouterOS Bridge Hotspot Setup</div>
              <div>/ip hotspot profile add name=MobileHotspot login-by=http-chap,http-pap hotspot-address={hotspotConfig.gatewayIp || '192.168.43.1'}</div>
              <div>/ip hotspot add name=ApexMobileHotspot interface=wlan1 profile=MobileHotspot address-pool=Hotspot_Zone_Pool disabled=no</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= BATCH VOUCHER GENERATOR MODAL ================= */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Generate Wi-Fi Hotspot Vouchers</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleGenerateVouchers} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Batch Count (Cards)</label>
                  <input
                    type="number"
                    value={batchCount}
                    onChange={e => setBatchCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Validity (Hours)</label>
                  <input
                    type="number"
                    value={voucherDurationHours}
                    onChange={e => setVoucherDurationHours(parseInt(e.target.value) || 24)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Download (Mbps)</label>
                  <input
                    type="number"
                    value={voucherDownloadMbps}
                    onChange={e => setVoucherDownloadMbps(parseInt(e.target.value) || 5)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price per Voucher (BDT)</label>
                  <input
                    type="number"
                    value={voucherPrice}
                    onChange={e => setVoucherPrice(parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                >
                  {batchCount} টি ভাউচার তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PRINTABLE VOUCHERS MODAL ================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
              <h3 className="font-bold text-white text-base">Printable Voucher Cards Sheet</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন</span>
                </button>
                <button onClick={() => setIsPrintModalOpen(false)} className="p-1 rounded bg-slate-800 text-slate-400">
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl text-slate-900">
              {vouchers.slice(0, 12).map(v => (
                <div key={v.id} className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center space-y-2 bg-slate-50">
                  <div className="font-extrabold text-cyan-700 text-xs uppercase tracking-wider">{hotspotConfig.portalTitle}</div>
                  <div className="text-[10px] text-slate-500">Wi-Fi Internet Access Card</div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm font-mono">
                    <span className="text-[9px] text-slate-400 block uppercase">Voucher Code</span>
                    <strong className="text-base tracking-widest text-slate-900">{v.code}</strong>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 font-semibold px-2">
                    <span>{v.durationHours || 24}h Validity</span>
                    <span>{v.downloadMbps || 10} Mbps</span>
                    <span className="text-cyan-700 font-bold">{formatCurrency(v.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE CAPTIVE PORTAL MODAL ================= */}
      <HotspotCaptivePortalModal
        isOpen={isLivePortalModalOpen}
        onClose={() => setIsLivePortalModalOpen(false)}
        defaultClientIp={selectedSessionForModal?.ip || '192.168.43.72'}
        defaultClientMac={selectedSessionForModal?.mac || 'B4:F1:DA:88:21:40'}
      />
    </div>
  );
};
