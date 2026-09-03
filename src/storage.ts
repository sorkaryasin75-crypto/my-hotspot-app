import {
  NetworkInterface,
  WanConfig,
  LanConfig,
  VlanItem,
  PppoeServerConfig,
  PppoeSession,
  DhcpScope,
  DhcpLease,
  DhcpServerConfig,
  HotspotConfig,
  HotspotVoucher,
  HotspotSession,
  NatRule,
  FirewallRule,
  StaticRoute,
  QosClass,
  Customer,
  PackageItem,
  Invoice,
  PaymentRecord,
  AuditLog,
  AdminUser,
  SystemHealth,
  ConfigSnapshot,
  NotificationItem,
  TelegramConfig,
  IspProfileSettings,
  SmsLogRecord
} from '../types';

import {
  INITIAL_INTERFACES,
  INITIAL_WAN_CONFIG,
  INITIAL_LAN_CONFIG,
  INITIAL_VLANS,
  INITIAL_PPPOE_CONFIG,
  INITIAL_PACKAGES,
  INITIAL_CUSTOMERS,
  INITIAL_PPPOE_SESSIONS,
  INITIAL_DHCP_SCOPES,
  INITIAL_DHCP_LEASES,
  INITIAL_HOTSPOT_CONFIG,
  INITIAL_HOTSPOT_VOUCHERS,
  INITIAL_HOTSPOT_SESSIONS,
  INITIAL_NAT_RULES,
  INITIAL_FIREWALL_RULES,
  INITIAL_STATIC_ROUTES,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ADMINS,
  INITIAL_CONFIG_SNAPSHOTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TELEGRAM_CONFIG,
  INITIAL_SYSTEM_HEALTH
} from './initialData';

export const INITIAL_DHCP_CONFIG: DhcpServerConfig = {
  enabled: true,
  interfaceName: 'eth1',
  subnet: '192.168.10.0/24',
  rangeStart: '192.168.10.100',
  rangeEnd: '192.168.10.250',
  gateway: '192.168.10.1',
  dnsServer: '192.168.10.1',
  leaseTimeSeconds: 86400
};

export const INITIAL_QOS_CLASSES: QosClass[] = [
  {
    id: 'cls-1',
    classId: '1:10',
    parentClassId: '1:1',
    className: 'Voice & DNS High-Priority',
    rateKbps: 10000,
    ceilKbps: 20000,
    burstKb: 32,
    priority: 1,
    currentRateKbps: 4200,
    packetCount: 142050,
    byteCount: 12592000
  },
  {
    id: 'cls-2',
    classId: '1:20',
    parentClassId: '1:1',
    className: 'Corporate Tier-1 (50 Mbps CIR)',
    rateKbps: 50000,
    ceilKbps: 100000,
    burstKb: 64,
    priority: 2,
    currentRateKbps: 34500,
    packetCount: 984020,
    byteCount: 894210000
  },
  {
    id: 'cls-3',
    classId: '1:30',
    parentClassId: '1:1',
    className: 'Residential Turbo FTTH (25 Mbps)',
    rateKbps: 25000,
    ceilKbps: 40000,
    burstKb: 48,
    priority: 3,
    currentRateKbps: 21800,
    packetCount: 2450120,
    byteCount: 1982000000
  },
  {
    id: 'cls-4',
    classId: '1:40',
    parentClassId: '1:1',
    className: 'Standard Residential (15 Mbps)',
    rateKbps: 15000,
    ceilKbps: 25000,
    burstKb: 32,
    priority: 4,
    currentRateKbps: 13200,
    packetCount: 1890400,
    byteCount: 1420000000
  }
];

export const INITIAL_ISP_SETTINGS: IspProfileSettings = {
  companyName: 'ApexISP Virtual Broadband Solutions',
  helpline: '+880 9610-000000',
  supportEmail: 'support@apexisp.net',
  currencySymbol: 'BDT (৳)',
  autoSuspendOverdue: true,
  gracePeriodDays: 3,
  paymentGateways: {
    bkashEnabled: true,
    bkashNumber: '01700-000000',
    bkashType: 'Merchant',
    bkashInstructions: 'বিকাশ অ্যাপ থেকে Make Payment অপশনে গিয়ে এই নাম্বারে টাকা পাঠান এবং রেফারেন্সে আপনার Customer ID লিখুন।',
    nagadEnabled: true,
    nagadNumber: '01800-000000',
    nagadType: 'Merchant',
    nagadInstructions: 'নগদ অ্যাপ বা *167# ডায়াল করে মার্চেন্ট পে করুন এবং রেফারেন্সে Customer ID লিখুন।',
    rocketEnabled: true,
    rocketNumber: '01900-000000-8',
    bankDetails: 'Islami Bank Bangladesh / City Bank A/C: 2050392019482 (Branch: Corporate)',
    paymentInstructions: 'পেমেন্ট সম্পন্ন হওয়ার পর প্রাপ্ত Transaction ID (TrxID) নিচে লিখে সাবমিট করুন। লাইন তাৎক্ষণিক চালু হবে।'
  },
  smsSettings: {
    enabled: true,
    gatewayType: 'FREE_BULK_SIMULATOR',
    senderIdOrApiKey: 'APEX-ISP',
    apiSecretOrUrl: 'https://api.sms-gateway.local/v1/send',
    autoSendOnRecharge: true,
    autoSendOnExpiryWarning: true,
    autoSendOnAccountCreated: true,
    rechargeSmsTemplate:
      'প্রিয় {CUSTOMER_NAME}, আপনার {PACKAGE_NAME} ইন্টারনেট প্যাকেজ সফলভাবে রিচার্জ করা হয়েছে ({AMOUNT} ৳)। মেয়াদ: {EXPIRY_DATE} পর্যন্ত। এখন ওয়াইফাই কানেক্ট করে ব্যবহার করুন। ধন্যবাদ, {COMPANY_NAME}। হেল্পলাইন: {HELPLINE}',
    expiryWarningSmsTemplate:
      'প্রিয় {CUSTOMER_NAME}, আপনার ইন্টারনেট প্যাকেজের মেয়াদ {EXPIRY_DATE} তারিখে শেষ হবে। নিরবচ্ছিন্ন সেবার জন্য বিল পরিশোধ করুন। হেল্পলাইন: {HELPLINE}',
    welcomeSmsTemplate:
      'প্রিয় {CUSTOMER_NAME}, {COMPANY_NAME} এ স্বাগতম! আপনার ইন্টারনেট সক্রিয় হয়েছে। ইউজার: {USERNAME}। হেল্পলাইন: {HELPLINE}'
  }
};

export interface AppState {
  interfaces: NetworkInterface[];
  wanConfig: WanConfig;
  lanConfig: LanConfig;
  vlans: VlanItem[];
  pppoeConfig: PppoeServerConfig;
  pppoeSessions: PppoeSession[];
  dhcpScopes: DhcpScope[];
  dhcpLeases: DhcpLease[];
  dhcpConfig: DhcpServerConfig;
  hotspotConfig: HotspotConfig;
  hotspotVouchers: HotspotVoucher[];
  hotspotSessions: HotspotSession[];
  natRules: NatRule[];
  firewallRules: FirewallRule[];
  staticRoutes: StaticRoute[];
  qosClasses: QosClass[];
  customers: Customer[];
  packages: PackageItem[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  auditLogs: AuditLog[];
  admins: AdminUser[];
  systemHealth: SystemHealth;
  configSnapshots: ConfigSnapshot[];
  notifications: NotificationItem[];
  telegramConfig: TelegramConfig;
  ispSettings: IspProfileSettings;
  smsLogs?: SmsLogRecord[];
  isFirstRunWizardCompleted: boolean;
}

const STORAGE_KEY = 'apex_isp_router_state_v1';

export class StorageService {
  private static instance: StorageService;
  private state: AppState;
  private listeners: Array<(state: AppState) => void> = [];

  private constructor() {
    this.state = this.loadInitialState();
    this.startBackgroundSimulation();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private loadInitialState(): AppState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const def = this.getDefaultState();
        return {
          ...def,
          ...parsed,
          ispSettings: {
            ...def.ispSettings,
            ...(parsed.ispSettings || {}),
            paymentGateways: {
              ...def.ispSettings.paymentGateways,
              ...(parsed.ispSettings?.paymentGateways || {})
            },
            smsSettings: {
              ...def.ispSettings.smsSettings,
              ...(parsed.ispSettings?.smsSettings || {})
            }
          },
          smsLogs: parsed.smsLogs || [
            {
              id: 'sms-init-01',
              recipientMobile: '+8801711002233',
              customerName: 'Rahim Chowdhury',
              messageText:
                'প্রিয় Rahim Chowdhury, আপনার 20 Mbps Home Fiber ইন্টারনেট প্যাকেজ সফলভাবে রিচার্জ করা হয়েছে (800 ৳)। মেয়াদ: 2026-09-30 পর্যন্ত। এখন ওয়াইফাই কানেক্ট করে ব্যবহার করুন। ধন্যবাদ, ApexISP।',
              gateway: 'FREE_BULK_SIMULATOR',
              status: 'DELIVERED',
              sentAt: '2026-09-01 21:30:00',
              cost: '0.00 BDT (Free / In-Plan)'
            }
          ]
        };
      }
    } catch (e) {
      console.warn('Failed to parse stored ISP router state, using defaults', e);
    }
    return this.getDefaultState();
  }

  public getDefaultState(): AppState {
    return {
      interfaces: INITIAL_INTERFACES,
      wanConfig: INITIAL_WAN_CONFIG,
      lanConfig: INITIAL_LAN_CONFIG,
      vlans: INITIAL_VLANS,
      pppoeConfig: INITIAL_PPPOE_CONFIG,
      pppoeSessions: INITIAL_PPPOE_SESSIONS,
      dhcpScopes: INITIAL_DHCP_SCOPES,
      dhcpLeases: INITIAL_DHCP_LEASES,
      dhcpConfig: INITIAL_DHCP_CONFIG,
      hotspotConfig: INITIAL_HOTSPOT_CONFIG,
      hotspotVouchers: INITIAL_HOTSPOT_VOUCHERS,
      hotspotSessions: INITIAL_HOTSPOT_SESSIONS,
      natRules: INITIAL_NAT_RULES,
      firewallRules: INITIAL_FIREWALL_RULES,
      staticRoutes: INITIAL_STATIC_ROUTES,
      qosClasses: INITIAL_QOS_CLASSES,
      customers: INITIAL_CUSTOMERS,
      packages: INITIAL_PACKAGES,
      invoices: INITIAL_INVOICES,
      payments: INITIAL_PAYMENTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      admins: INITIAL_ADMINS,
      systemHealth: INITIAL_SYSTEM_HEALTH,
      configSnapshots: INITIAL_CONFIG_SNAPSHOTS,
      notifications: INITIAL_NOTIFICATIONS,
      telegramConfig: INITIAL_TELEGRAM_CONFIG,
      ispSettings: INITIAL_ISP_SETTINGS,
      isFirstRunWizardCompleted: true
    };
  }

  public getState(): AppState {
    return this.state;
  }

  public setState(updater: Partial<AppState> | ((prev: AppState) => Partial<AppState>)): void {
    if (typeof updater === 'function') {
      const patch = updater(this.state);
      this.state = {
        ...this.state,
        ...patch
      };
    } else {
      this.state = {
        ...this.state,
        ...updater
      };
    }
    this.persist();
    this.notify();
  }

  public persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist ISP state', e);
    }
  }

  public exportBackup(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.state = {
          ...this.getDefaultState(),
          ...parsed
        };
        this.persist();
        this.notify();
        return true;
      }
    } catch (e) {
      console.error('Failed to import backup', e);
    }
    return false;
  }

  public resetToDefaults(): void {
    this.state = this.getDefaultState();
    this.persist();
    this.notify();
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public logAudit(
    action: string,
    category: AuditLog['category'],
    target: string,
    details: string,
    result: 'SUCCESS' | 'FAILED' | 'WARNING' = 'SUCCESS',
    userName: string = 'Super Admin (System)',
    userRole: string = 'Super Admin'
  ): void {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: 'admin-01',
      userName,
      userRole,
      user: userName,
      ipAddress: '172.16.100.45',
      action,
      category,
      target,
      details,
      result
    };
    this.setState(prev => ({
      auditLogs: [newLog, ...prev.auditLogs.slice(0, 499)]
    }));
  }

  public addNotification(type: NotificationItem['type'], title: string, message: string, link?: string): void {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      link
    };
    this.setState(prev => ({
      notifications: [newNotif, ...prev.notifications]
    }));
  }

  /**
   * Background tick to update real-time traffic counters, throughput sparklines, and uptime
   */
  private startBackgroundSimulation(): void {
    setInterval(() => {
      const randWanRx = Math.floor(40000 + Math.random() * 25000);
      const randWanTx = Math.floor(75000 + Math.random() * 30000);
      const cpuDelta = (Math.random() - 0.5) * 4;
      const newCpu = Math.max(12, Math.min(85, +(this.state.systemHealth.cpuUsagePercent + cpuDelta).toFixed(1)));

      const updatedInterfaces = this.state.interfaces.map(iface => {
        if (iface.status === 'up') {
          const deltaRx = Math.floor(Math.random() * 1500000);
          const deltaTx = Math.floor(Math.random() * 2500000);
          return {
            ...iface,
            rxBytes: iface.rxBytes + deltaRx,
            txBytes: iface.txBytes + deltaTx,
            rxRateKbps: iface.isWan ? randWanRx : Math.floor(randWanTx * 0.9),
            txRateKbps: iface.isWan ? randWanTx : Math.floor(randWanRx * 0.9)
          };
        }
        return iface;
      });

      this.setState(prev => ({
        interfaces: updatedInterfaces,
        systemHealth: {
          ...prev.systemHealth,
          cpuUsagePercent: newCpu,
          wanThroughputInKbps: randWanRx,
          wanThroughputOutKbps: randWanTx,
          uptimeSeconds: prev.systemHealth.uptimeSeconds + 3,
          totalOnlineUsers: prev.pppoeSessions.filter(s => s.status === 'online').length + prev.hotspotSessions.length
        }
      }));
    }, 3000);
  }
}
