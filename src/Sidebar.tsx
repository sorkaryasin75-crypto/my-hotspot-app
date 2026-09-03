import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Network,
  GitBranch,
  Layers,
  Server,
  Radio,
  Wifi,
  Shuffle,
  ShieldAlert,
  Compass,
  Gauge,
  Database,
  Users,
  Box,
  FileText,
  CreditCard,
  BarChart3,
  RotateCcw,
  Terminal,
  Settings,
  Code2,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { StorageService } from '../../services/storage';

interface SidebarProps {
  currentView?: string;
  onSelectView?: (view: string) => void;
  onNavigate?: (view: any) => void;
  isOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavCategory {
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView = 'dashboard',
  onSelectView,
  onNavigate,
  isOpen = false,
  onCloseMobile
}) => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const activePppoeCount = state.pppoeSessions.filter(s => s.status === 'online').length;
  const pendingPaymentsCount = state.payments.filter(p => p.status === 'PENDING').length;
  const unpaidInvoicesCount = state.invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').length;
  const suspendedCustomersCount = state.customers.filter(c => c.status === 'SUSPENDED').length;

  const categories: NavCategory[] = [
    {
      title: 'TELEMETRY & OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'pppoe', label: 'Live PPPoE Sessions', icon: Radio, badge: activePppoeCount, badgeColor: 'bg-emerald-500/20 text-emerald-400' },
        { id: 'billing', label: 'Traffic & Revenue Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'NETWORK ENGINE (LINUX KERNEL)',
      items: [
        { id: 'interfaces', label: 'WAN & Network Interfaces', icon: Network },
        { id: 'pppoe', label: 'PPPoE Server & Secrets', icon: Server },
        { id: 'dhcp', label: 'DHCP Server & Leases', icon: Database },
        { id: 'hotspot', label: 'Hotspot / Captive Portal', icon: Wifi },
        { id: 'firewall', label: 'Firewall & NAT (nftables)', icon: ShieldAlert },
        { id: 'qos', label: 'Bandwidth QoS (HTB)', icon: Gauge }
      ]
    },
    {
      title: 'ISP BILLING & CUSTOMERS',
      items: [
        {
          id: 'customers',
          label: 'Customer Directory',
          icon: Users,
          badge: suspendedCustomersCount > 0 ? `${suspendedCustomersCount} Susp.` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-400'
        },
        { id: 'packages', label: 'Internet Packages', icon: Box },
        {
          id: 'billing',
          label: 'Invoices & Billing',
          icon: FileText,
          badge: unpaidInvoicesCount > 0 ? unpaidInvoicesCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400'
        },
        {
          id: 'payments',
          label: 'Payment Ledger',
          icon: CreditCard,
          badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Review` : undefined,
          badgeColor: 'bg-cyan-500/20 text-cyan-400'
        }
      ]
    },
    {
      title: 'SYSTEM & SAFETY',
      items: [
        { id: 'logs', label: 'System Logs & Audit Trail', icon: Terminal },
        { id: 'settings', label: 'System, Backup & Admins', icon: Settings }
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    if (onSelectView) onSelectView(id);
    if (onNavigate) onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => onCloseMobile?.()}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header on Mobile */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white">ApexISP Router</span>
          </div>
          <button
            onClick={() => onCloseMobile?.()}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                {cat.title}
              </h3>
              <div className="space-y-0.5 mt-1">
                {cat.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border border-current/20 ${
                            item.badgeColor || 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="font-mono text-[11px]">Linux Kernel 6.8 LTS</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              nftables OK
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${state.systemHealth.cpuUsagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>CPU Load: {state.systemHealth.cpuUsagePercent}%</span>
            <span>RAM: {(state.systemHealth.ramUsedMb / 1024).toFixed(1)} / 16 GB</span>
          </div>
        </div>
      </aside>
    </>
  );
};
