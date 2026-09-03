// System, Network, Customer & Billing Types for Virtual ISP Router Platform

export type InterfaceType = 'wan' | 'lan' | 'management' | 'vlan' | 'bridge' | 'pppoe-client';

export interface NetworkInterface {
  id: string;
  name: string;
  type: InterfaceType;
  macAddress: string;
  ipAddress: string;
  subnetMask: string;
  gateway?: string;
  mtu: number;
  duplex: 'auto' | 'full' | 'half';
  speed: string;
  status: 'up' | 'down';
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxErrors: number;
  txErrors: number;
  rxRateKbps: number;
  txRateKbps: number;
  isWan?: boolean;
  isLan?: boolean;
  vlanId?: number;
  parentInterface?: string;
  enabled: boolean;
  description: string;
}

export type WanConnectionType = 'dhcp' | 'static' | 'pppoe';

export interface WanConfig {
  interfaceName: string;
  connectionType: WanConnectionType;
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  primaryDns: string;
  secondaryDns?: string;
  pppoeUsername?: string;
  pppoePassword?: string;
  pppoeService?: string;
  mtu: number;
  vlanId?: number;
  cloneMac?: string;
  natEnabled: boolean;
  autoDns: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'failed';
  uptimeSeconds: number;
}

export interface LanConfig {
  interfaceName: string;
  ipAddress: string;
  subnetMask: string;
  dhcpEnabled: boolean;
  dhcpStart: string;
  dhcpEnd: string;
  leaseTimeHours: number;
  dnsServers: string[];
  domainName: string;
}

export interface VlanItem {
  id: string;
  vlanId: number;
  name: string;
  parentInterface: string;
  ipAddress: string;
  subnetMask: string;
  description: string;
  dhcpEnabled: boolean;
  qosEnabled: boolean;
  status: 'active' | 'inactive';
  customerCount: number;
  createdAt: string;
}

export interface PppoeServerConfig {
  enabled: boolean;
  serverName: string;
  interfaceName: string;
  ipPoolStart: string;
  ipPoolEnd: string;
  localIp: string;
  primaryDns: string;
  secondaryDns: string;
  maxSessions: number;
  authMethod: 'PAP' | 'CHAP' | 'MS-CHAPv2';
  mru: number;
  mtu: number;
  keepaliveSeconds: number;
  radiusEnabled: boolean;
  radiusServer?: string;
  radiusSecret?: string;
}

export interface PppoeSession {
  id: string;
  customerId: string;
  customerName: string;
  username: string;
  ipAddress: string;
  macAddress: string;
  interfaceName: string;
  connectedAt: string;
  uptimeSeconds: number;
  rxBytes: number;
  txBytes: number;
  rxRateKbps: number;
  txRateKbps: number;
  packageName: string;
  status: 'online' | 'terminating';
}

export interface DhcpScope {
  id: string;
  name: string;
  interfaceName: string;
  network: string;
  subnetMask: string;
  rangeStart: string;
  rangeEnd: string;
  gateway: string;
  dnsServers: string[];
  leaseTimeMinutes: number;
  enabled: boolean;
}

export interface DhcpServerConfig {
  enabled: boolean;
  interfaceName: string;
  subnet: string;
  rangeStart: string;
  rangeEnd: string;
  gateway: string;
  dnsServer: string;
  leaseTimeSeconds: number;
}

export interface DhcpLease {
  id: string;
  ipAddress: string;
  macAddress: string;
  hostname: string;
  interfaceName?: string;
  leaseExpires?: string;
  expiresInSeconds?: number;
  status?: 'active' | 'expired' | 'static';
  isStatic: boolean;
  lastSeen?: string;
}

export type MobileHotspotMode = 'ANDROID_HOTSPOT' | 'IOS_HOTSPOT' | 'CONNECTED_WIFI' | 'CUSTOM_GATEWAY';

export interface HotspotConfig {
  enabled: boolean;
  serverName: string;
  interfaceName: string;
  ipAddress: string;
  subnetMask: string;
  ipPoolStart: string;
  ipPoolEnd: string;
  portalTitle: string;
  welcomeMessage?: string;
  supportContact?: string;
  portalWelcomeText?: string;
  sessionTimeoutMinutes: number;
  idleTimeoutMinutes: number;
  bannerColor: string;
  logoText: string;
  // Mobile Hotspot & Wi-Fi Captive Portal Integration
  mobileModeEnabled?: boolean;
  mobileModeType?: MobileHotspotMode;
  hotspotSsid?: string;
  hotspotPassword?: string;
  gatewayIp?: string;
  captivePort?: number;
  allowFreeTrial?: boolean;
  freeTrialMinutes?: number;
  allowOnlinePurchase?: boolean;
  allowSubscriberLogin?: boolean;
  portalTheme?: 'cyan' | 'emerald' | 'indigo' | 'amber';
  qrAutoConnectEnabled?: boolean;
}

export interface HotspotVoucher {
  id: string;
  code: string;
  pin?: string;
  batchId?: string;
  durationHours?: number;
  durationMinutes?: number;
  dataLimitMb: number;
  downloadMbps?: number;
  uploadMbps?: number;
  speedLimitMbps?: number;
  price: number;
  status: 'UNCLAIMED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'active' | 'unused' | 'expired' | 'revoked';
  createdAt?: string;
  claimedByMac?: string;
  activatedAt?: string;
  expiresAt?: string;
  macAddress?: string;
  usedBytes?: number;
}

export interface HotspotSession {
  id: string;
  voucherCode: string;
  username: string;
  ipAddress: string;
  macAddress: string;
  connectedAt: string;
  expiresAt: string;
  rxBytes: number;
  txBytes: number;
  rxRateKbps: number;
  txRateKbps: number;
  timeRemainingMinutes: number;
  // Enhanced Mobile Session Fields
  sessionType?: 'VOUCHER' | 'ONLINE_PURCHASE' | 'FREE_TRIAL' | 'SUBSCRIBER';
  mobileNumber?: string;
  speedDownloadMbps?: number;
  speedUploadMbps?: number;
  dataRemainingMb?: number;
  deviceHostname?: string;
}

export interface NatRule {
  id: string;
  type: 'MASQUERADE' | 'SNAT' | 'DNAT' | 'ONE_TO_ONE' | 'masquerade' | 'snat' | 'dnat' | 'one_to_one';
  comment?: string;
  description?: string;
  outInterface?: string;
  inInterface?: string;
  wanInterface?: string;
  wanPort?: number;
  lanIp?: string;
  lanPort?: number;
  srcAddress?: string;
  dstAddress?: string;
  protocol: 'all' | 'tcp' | 'udp' | 'icmp' | 'both';
  dstPort?: string;
  toAddress?: string;
  toPort?: string;
  enabled: boolean;
  order?: number;
  packetCount?: number;
  packetsMatched?: number;
  bytesMatched?: number;
}

export interface FirewallRule {
  id: string;
  chain: 'INPUT' | 'FORWARD' | 'OUTPUT';
  action: 'ACCEPT' | 'DROP' | 'REJECT' | 'LOG';
  protocol: 'all' | 'tcp' | 'udp' | 'icmp';
  srcIp?: string;
  dstIp?: string;
  srcAddress?: string;
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;
  state?: string;
  comment: string;
  enabled: boolean;
  priority?: number;
  order?: number;
  packetCount?: number;
  byteCount?: number;
  packetsMatched?: number;
  bytesMatched?: number;
}

export interface StaticRoute {
  id: string;
  destination: string;
  gateway: string;
  interfaceName: string;
  metric: number;
  table: string;
  enabled: boolean;
  status: 'active' | 'unreachable';
}

export interface DnsSetting {
  upstreamDns: string[];
  enableCache: boolean;
  cacheSize: number;
  localRecords: Array<{
    id: string;
    hostname: string;
    ipAddress: string;
    ttl: number;
  }>;
}

export interface IpPool {
  id: string;
  name: string;
  rangeStart: string;
  rangeEnd: string;
  gateway: string;
  subnetMask: string;
  purpose: 'pppoe' | 'dhcp' | 'hotspot' | 'static' | 'infrastructure';
  totalIps: number;
  usedIps: number;
  reservedIps: number;
  status: 'active' | 'full' | 'inactive';
}

export interface QosClass {
  id: string;
  classId: string;
  parentClassId?: string;
  className: string;
  rateKbps: number;
  ceilKbps: number;
  burstKb: number;
  priority: number;
  currentRateKbps: number;
  packetCount: number;
  byteCount: number;
}

export interface QosQueue {
  id: string;
  name: string;
  targetIpOrSubnet: string;
  downloadMaxKbps: number;
  uploadMaxKbps: number;
  downloadBurstKbps?: number;
  uploadBurstKbps?: number;
  burstThresholdKbps?: number;
  burstTimeSeconds?: number;
  priority: number;
  currentDownloadKbps: number;
  currentUploadKbps: number;
  droppedPackets: number;
  enabled: boolean;
}

export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'DISCONNECTED' | 'PENDING' | 'BLOCKED';

export interface Customer {
  id: string;
  customerId: string;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  username: string;
  pppoeUsername: string;
  pppoePassword: string;
  macAddress: string;
  ipAddress: string;
  packageId: string;
  packageName: string;
  installationDate: string;
  activationDate: string;
  expiryDate: string;
  status: CustomerStatus;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  monthlyFee: number;
  dueAmount: number;
  paidAmount: number;
  connectionType: 'PPPoE' | 'Static' | 'DHCP' | 'Hotspot';
  vlanId?: number;
  currentSession?: {
    isOnline: boolean;
    uptimeSeconds: number;
    rxBytes: number;
    txBytes: number;
    rxRateKbps: number;
    txRateKbps: number;
    lastOnlineTime: string;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageItem {
  id: string;
  name: string;
  downloadMbps: number;
  uploadMbps: number;
  burstDownloadMbps?: number;
  burstUploadMbps?: number;
  burstThresholdMbps?: number;
  burstTimeSeconds?: number;
  dataLimitGb: number;
  validityDays: number;
  monthlyPrice: number;
  installationFee: number;
  activationFee: number;
  gracePeriodDays: number;
  concurrentSessions: number;
  activeSubscribers: number;
  description: string;
  enabled: boolean;
  priority: number;
}

export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  packageId: string;
  packageName: string;
  billingPeriod: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
}

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
export type PaymentMethodType = 'bKash' | 'Nagad' | 'Bank' | 'Cash' | 'Card' | 'Online';

export interface PaymentRecord {
  id: string;
  transactionId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  senderNumberOrAcc?: string;
  referenceNote?: string;
  date: string;
  status: PaymentStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  user?: string;
  ipAddress?: string;
  action: string;
  category: 'NETWORK' | 'BILLING' | 'CUSTOMER' | 'SECURITY' | 'SYSTEM' | 'FIREWALL' | 'QOS' | 'HOTSPOT' | 'SMS_GATEWAY';
  target: string;
  details: string;
  result?: 'SUCCESS' | 'FAILED' | 'WARNING';
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Manager' | 'Billing Staff' | 'Support Staff' | 'Network Operator' | 'Viewer';
  status: 'active' | 'inactive';
  lastLogin: string;
  twoFactorEnabled: boolean;
  avatarUrl?: string;
}

export interface ConfigSnapshot {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdByName: string;
  description: string;
  rawConfig: string;
  canRollback: boolean;
  isCurrent: boolean;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifyOnInvoice: boolean;
  notifyOnPayment: boolean;
  notifyOnExpiry: boolean;
  notifyOnWanDown: boolean;
  notifyOnHighCpu: boolean;
}

export interface SystemHealth {
  cpuUsagePercent: number;
  cpuCores: number;
  cpuTempCelsius: number;
  ramUsedMb: number;
  ramTotalMb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  uptimeSeconds: number;
  loadAverage: [number, number, number];
  wanThroughputInKbps: number;
  wanThroughputOutKbps: number;
  totalOnlineUsers: number;
  totalPppoeSessions: number;
  totalDhcpLeases: number;
  totalHotspotSessions: number;
  dataPlaneStatus: 'running' | 'degraded' | 'error';
  controlPlaneStatus: 'running' | 'degraded' | 'error';
  lastRollbackCheck: string;
  systemdServices: {
    routerApi: boolean;
    routerWorker: boolean;
    trafficMonitor: boolean;
    billingWorker: boolean;
    networkController: boolean;
    nftables: boolean;
    accelPpp: boolean;
    dnsmasq: boolean;
  };
}

export interface IspPaymentSettings {
  bkashEnabled: boolean;
  bkashNumber: string;
  bkashType: 'Merchant' | 'Personal' | 'Agent';
  bkashInstructions: string;
  nagadEnabled: boolean;
  nagadNumber: string;
  nagadType: 'Merchant' | 'Personal';
  nagadInstructions: string;
  rocketEnabled: boolean;
  rocketNumber: string;
  bankDetails: string;
  paymentInstructions: string;
}

export type SmsGatewayType =
  | 'FREE_BULK_SIMULATOR'
  | 'ANDROID_SMS_GATEWAY'
  | 'ONNOKROK_SMS'
  | 'BULKSMSBD'
  | 'GREENWEB'
  | 'CUSTOM_API'
  | 'CUSTOM_HTTP';

export interface IspSmsSettings {
  enabled: boolean;
  gatewayType: SmsGatewayType;
  senderIdOrApiKey: string;
  apiSecretOrUrl: string;
  androidDeviceIp?: string;
  androidAuthKey?: string;
  autoSendOnRecharge: boolean;
  autoSendOnExpiryWarning: boolean;
  autoSendOnAccountCreated: boolean;
  rechargeSmsTemplate: string;
  expiryWarningSmsTemplate: string;
  welcomeSmsTemplate: string;
}

export interface SmsLogRecord {
  id: string;
  recipientMobile: string;
  customerName: string;
  messageText: string;
  gateway: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt: string;
  cost: string; // e.g. '0.00 BDT (Free / In-Plan)'
}

export interface IspProfileSettings {
  companyName: string;
  helpline: string;
  supportEmail: string;
  currencySymbol: string;
  autoSuspendOverdue: boolean;
  gracePeriodDays: number;
  paymentGateways: IspPaymentSettings;
  smsSettings: IspSmsSettings;
}

export interface NotificationItem {
  id: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export type NavigationItem =
  | 'dashboard'
  | 'interfaces'
  | 'pppoe'
  | 'customers'
  | 'packages'
  | 'billing'
  | 'payments'
  | 'firewall'
  | 'qos'
  | 'hotspot'
  | 'dhcp'
  | 'logs'
  | 'settings';
