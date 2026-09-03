import React, { useState } from 'react';
import {
  Server,
  Activity,
  Shield,
  Bell,
  RefreshCw,
  Cpu,
  HardDrive,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Globe,
  Terminal,
  UserCheck,
  Menu,
  Smartphone,
  Download
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { BillingEngine } from '../../services/billingEngine';
import { formatBitrate } from '../../utils/formatters';

interface HeaderProps {
  currentView?: string;
  onSelectView?: (view: string) => void;
  onNavigate?: (view: any) => void;
  portalMode?: 'admin' | 'customer' | 'wizard' | 'hotspot';
  onTogglePortalMode?: (mode: 'admin' | 'customer' | 'wizard' | 'hotspot') => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView = 'dashboard',
  onSelectView,
  onNavigate,
  portalMode = 'admin',
  onTogglePortalMode,
  onToggleMobileSidebar
}) => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScanningBilling, setIsScanningBilling] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleSelectView = (view: string) => {
    if (onSelectView) onSelectView(view);
    if (onNavigate) onNavigate(view);
  };

  const handleTogglePortal = (mode: 'admin' | 'customer' | 'wizard' | 'hotspot') => {
    if (onTogglePortalMode) {
      onTogglePortalMode(mode);
    }
  };

  const unreadNotifications = state.notifications.filter(n => !n.isRead);

  const handleRunBillingScan = () => {
    setIsScanningBilling(true);
    setScanMessage('Executing automated subscriber billing cycle scan...');
    
    setTimeout(() => {
      const billingEngine = BillingEngine.getInstance();
      const result = billingEngine.runAutomatedBillingCycle(
        state.customers,
        state.packages,
        state.invoices
      );

      storage.setState(prev => ({
        customers: result.updatedCustomers,
        invoices: [...result.newInvoices, ...prev.invoices],
        notifications: [...result.newNotifications, ...prev.notifications]
      }));

      storage.logAudit(
        'Manual Billing Scan Triggered',
        'BILLING',
        'Subscriber Base',
        `Scan result: ${result.scanResult.suspendedCount} suspended, ${result.scanResult.invoicesGenerated} invoices generated.`
      );

      setIsScanningBilling(false);
      setScanMessage(
        `Scan Complete: ${result.scanResult.suspendedCount} suspended, ${result.scanResult.warnedCount} warned, ${result.scanResult.invoicesGenerated} invoices created.`
      );

      setTimeout(() => setScanMessage(null), 5000);
    }, 800);
  };

  const handleMarkAllNotificationsRead = () => {
    storage.setState(prev => ({
      notifications: prev.notifications.map(n => ({ ...n, isRead: true }))
    }));
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Branding & Node Info */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          {onToggleMobileSidebar && (
            <button
              id="header-mobile-sidebar-toggle-btn"
              onClick={onToggleMobileSidebar}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white lg:hidden"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleSelectView('dashboard')}>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 text-white font-black tracking-wider text-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">ApexISP</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Virtual Router OS v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Core-x86-64 | Node-01 [Primary]</p>
            </div>
          </div>

          {/* Quick Engine Telemetry Chips */}
          <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-md border border-slate-700/60 font-mono text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Data Plane: <strong className="text-emerald-400">Kernel Active</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-md border border-slate-700/60 font-mono text-slate-300">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>WAN: <strong className="text-cyan-300">203.0.113.45</strong></span>
              <span className="text-[10px] text-slate-400">({formatBitrate(state.systemHealth.wanThroughputInKbps)} ↓ / {formatBitrate(state.systemHealth.wanThroughputOutKbps)} ↑)</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-md border border-slate-700/60 font-mono text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>CPU: <strong className="text-amber-300">{state.systemHealth.cpuUsagePercent}%</strong></span>
              <span className="text-slate-500">|</span>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Online: <strong className="text-indigo-300">{state.systemHealth.totalOnlineUsers}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              id="header-admin-portal-btn"
              onClick={() => handleTogglePortal('admin')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                portalMode === 'admin'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin NOC
            </button>
            <button
              id="header-customer-portal-btn"
              onClick={() => handleTogglePortal('customer')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                portalMode === 'customer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Customer Portal
            </button>
            <button
              id="header-hotspot-portal-btn"
              onClick={() => handleTogglePortal('hotspot')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                portalMode === 'hotspot'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Open Mobile Hotspot Captive Portal"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>হটস্পট পোর্টাল</span>
            </button>
            <button
              id="header-wizard-btn"
              onClick={() => handleTogglePortal('wizard')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                portalMode === 'wizard'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="First-Run Setup Wizard"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Setup Wizard</span>
            </button>
          </div>

          {/* Billing Cron Trigger */}
          <button
            id="header-billing-cron-btn"
            onClick={handleRunBillingScan}
            disabled={isScanningBilling}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-medium transition active:scale-95 disabled:opacity-50"
            title="Trigger automatic subscriber expiry and grace period billing scan"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanningBilling ? 'animate-spin' : ''}`} />
            <span>{isScanningBilling ? 'Billing Scan...' : 'Billing Cron'}</span>
          </button>

          {/* Quick Rollback Jump */}
          <button
            id="header-quick-rollback-btn"
            onClick={() => handleSelectView('settings')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs font-mono transition"
            title="View Configuration Snapshots & Safe Rollback"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Config #{state.configSnapshots.find(s => s.isCurrent)?.versionNumber || 3}</span>
          </button>

          {/* Direct Project ZIP Download Button */}
          <a
            id="header-download-zip-btn"
            href="/ApexISP-Hotspot-Project.zip"
            download="ApexISP-Hotspot-Project.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-900/30 transition active:scale-95"
            title="Download Complete Project ZIP (Android APK & Source Files)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download ZIP</span>
            <span className="sm:hidden">ZIP</span>
          </a>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="header-notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 text-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">System & Billing Alerts</span>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      {state.notifications.length}
                    </span>
                  </div>
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 mt-2 divide-y divide-slate-800/60">
                  {state.notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No notifications recorded
                    </div>
                  ) : (
                    state.notifications.slice(0, 10).map(notif => (
                      <div
                        key={notif.id}
                        className={`pt-2 text-xs cursor-pointer hover:bg-slate-800/40 p-1.5 rounded transition ${
                          !notif.isRead ? 'bg-cyan-950/20 border-l-2 border-cyan-500' : ''
                        }`}
                        onClick={() => {
                          if (notif.link) {
                            handleSelectView(notif.link);
                            setShowNotifications(false);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-semibold ${
                            notif.type === 'ALERT' ? 'text-rose-400' :
                            notif.type === 'WARNING' ? 'text-amber-400' :
                            notif.type === 'SUCCESS' ? 'text-emerald-400' : 'text-cyan-400'
                          }`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Flash Alert for Billing Scan */}
      {scanMessage && (
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 px-4 py-1.5 text-xs text-cyan-300 border-t border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{scanMessage}</span>
          </div>
          <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </header>
  );
};
