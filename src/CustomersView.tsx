import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Power,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Lock,
  ChevronRight,
  Eye,
  RefreshCw,
  Zap,
  MessageSquare,
  Send,
  Check
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { Customer, CustomerStatus, PackageItem, PaymentRecord } from '../../types';
import { formatBitrate, formatCurrency, getStatusBadgeClass } from '../../utils/formatters';
import { SmsService } from '../../services/smsService';
import { BillingEngine } from '../../services/billingEngine';

export const CustomersView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const [customers, setCustomers] = useState<Customer[]>(state.customers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeCustomer, setRechargeCustomer] = useState<Customer | null>(null);
  const [rechargePkgId, setRechargePkgId] = useState(state.packages[0]?.id || '');
  const [rechargeMfsMethod, setRechargeMfsMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [rechargeTrxId, setRechargeTrxId] = useState('');
  const [rechargeSendSms, setRechargeSendSms] = useState(true);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPppoeUser, setFormPppoeUser] = useState('');
  const [formPppoePass, setFormPppoePass] = useState('');
  const [formMac, setFormMac] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formPackageId, setFormPackageId] = useState(state.packages[0]?.id || '');
  const [formConnectionType, setFormConnectionType] = useState<'PPPoE' | 'Static' | 'DHCP' | 'Hotspot'>('PPPoE');
  const [formVlanId, setFormVlanId] = useState<number>(10);
  const [formNotes, setFormNotes] = useState('');

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      c.pppoeUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ipAddress.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (customer: Customer) => {
    const newStatus: CustomerStatus = customer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updated = customers.map(c => {
      if (c.id === customer.id) {
        return {
          ...c,
          status: newStatus,
          currentSession: newStatus === 'SUSPENDED' && c.currentSession ? { ...c.currentSession, isOnline: false } : c.currentSession,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setCustomers(updated);
    storage.setState({ customers: updated });
    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer({ ...selectedCustomer, status: newStatus });
    }

    storage.logAudit(
      `Customer ${newStatus === 'ACTIVE' ? 'Activated' : 'Suspended'}`,
      'CUSTOMER',
      `${customer.fullName} (${customer.customerId})`,
      `Subscriber state changed to ${newStatus}. Router policy ${newStatus === 'ACTIVE' ? 'restored' : 'firewall drop applied'}.`
    );

    setFlashMessage(`Customer ${customer.fullName} is now ${newStatus}. Kernel policy updated.`);
    setTimeout(() => setFlashMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setFormName('');
    setFormMobile('+8801');
    setFormEmail('');
    setFormAddress('');
    setFormUsername('');
    setFormPppoeUser('');
    setFormPppoePass('pass2026');
    setFormMac('');
    setFormIp('100.64.0.' + Math.floor(50 + Math.random() * 200));
    setFormPackageId(state.packages[0]?.id || '');
    setFormConnectionType('PPPoE');
    setFormVlanId(10);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formMobile) {
      alert('Please fill in required fields (Name & Mobile).');
      return;
    }

    const selectedPkg = state.packages.find(p => p.id === formPackageId) || state.packages[0];
    const newCustId = `CUST-${1000 + customers.length + 1}`;
    const today = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + (selectedPkg?.validityDays || 30) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      customerId: newCustId,
      fullName: formName,
      mobile: formMobile,
      email: formEmail || `${formUsername || 'user'}@example.com`,
      address: formAddress || 'Default Area',
      username: formUsername || formPppoeUser || `user_${Date.now().toString().slice(-4)}`,
      pppoeUsername: formPppoeUser || `ftth_${formMobile.slice(-6)}`,
      pppoePassword: formPppoePass || 'pass2026',
      macAddress: formMac || '00:00:00:00:00:00',
      ipAddress: formIp,
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      installationDate: today,
      activationDate: today,
      expiryDate: expiryDate,
      status: 'ACTIVE',
      billingCycle: 'monthly',
      monthlyFee: selectedPkg.monthlyPrice,
      dueAmount: 0,
      paidAmount: selectedPkg.monthlyPrice,
      connectionType: formConnectionType,
      vlanId: formVlanId,
      currentSession: {
        isOnline: true,
        uptimeSeconds: 120,
        rxBytes: 1048576,
        txBytes: 524288,
        rxRateKbps: 4200,
        txRateKbps: 1800,
        lastOnlineTime: new Date().toISOString()
      },
      notes: formNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    storage.setState({ customers: updated });

    // Send Welcome SMS if enabled
    const ispSettings = storage.getState().ispSettings;
    if (ispSettings?.smsSettings?.enabled && ispSettings?.smsSettings?.autoSendOnAccountCreated) {
      const sms = SmsService.getInstance();
      const text = sms.formatTemplate(ispSettings.smsSettings.welcomeSmsTemplate, {
        customerName: newCustomer.fullName,
        packageName: selectedPkg.name,
        companyName: ispSettings.companyName,
        helpline: ispSettings.helpline,
        username: newCustomer.pppoeUsername
      });
      sms.sendSms({
        recipientMobile: newCustomer.mobile,
        customerName: newCustomer.fullName,
        messageText: text
      });
    }

    storage.logAudit(
      'New Customer Provisioned',
      'CUSTOMER',
      newCustomer.fullName,
      `Registered subscriber ${newCustId} with package ${selectedPkg.name}. PPPoE user: ${newCustomer.pppoeUsername}.`
    );

    setIsAddModalOpen(false);
    setFlashMessage(`Successfully provisioned customer ${newCustomer.fullName} (${newCustId}). Welcome SMS dispatched.`);
    setTimeout(() => setFlashMessage(null), 4000);
  };

  const handleOpenRecharge = (customer: Customer) => {
    setRechargeCustomer(customer);
    setRechargePkgId(customer.packageId || state.packages[0]?.id || '');
    setRechargeMfsMethod('BKASH');
    setRechargeTrxId(`TRX${Math.floor(100000 + Math.random() * 900000)}`);
    setRechargeSendSms(true);
    setIsRechargeModalOpen(true);
  };

  const handleExecuteQuickRecharge = async (
    e: React.FormEvent,
    dispatchMethod: 'GATEWAY' | 'NATIVE_SMS' | 'WHATSAPP' = 'GATEWAY'
  ) => {
    e.preventDefault();
    if (!rechargeCustomer) return;

    const currentState = storage.getState();
    const pkg = currentState.packages.find(p => p.id === rechargePkgId) || currentState.packages[0];
    const amount = pkg.monthlyPrice;
    const trx = rechargeTrxId || `TRX-${Date.now().toString().slice(-6)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      transactionId: trx,
      invoiceId: 'DIRECT-RECHARGE',
      invoiceNumber: 'QUICK-RECHARGE',
      customerId: rechargeCustomer.id,
      customerName: rechargeCustomer.fullName,
      amount,
      paymentMethod: rechargeMfsMethod === 'BKASH' ? 'bKash' : rechargeMfsMethod === 'NAGAD' ? 'Nagad' : 'Cash',
      senderNumberOrAcc: rechargeCustomer.mobile,
      referenceNote: `Quick recharge via Admin Dashboard (${pkg.name})`,
      date: nowStr,
      status: 'APPROVED',
      approvedBy: 'Administrator',
      approvedAt: nowStr
    };

    const billingEngine = BillingEngine.getInstance();
    const result = billingEngine.approvePayment(
      newPayment,
      currentState.customers,
      currentState.invoices,
      currentState.packages,
      'Administrator'
    );

    const updatedPayments = [result.updatedPayment, ...currentState.payments];
    const updatedCustomers = currentState.customers.map(c =>
      c.id === rechargeCustomer.id && result.updatedCustomer ? result.updatedCustomer : c
    );
    const updatedInvoices = result.updatedInvoice
      ? currentState.invoices.map(i => (i.id === result.updatedInvoice?.id ? result.updatedInvoice : i))
      : currentState.invoices;

    storage.setState({
      payments: updatedPayments,
      customers: updatedCustomers,
      invoices: updatedInvoices,
      notifications: [result.notification, ...currentState.notifications]
    });

    storage.logAudit(
      'Subscriber Quick Recharged',
      'BILLING',
      rechargeCustomer.fullName,
      `Recharged package ${pkg.name} (${amount} BDT). TrxID: ${trx}`
    );

    const smsService = SmsService.getInstance();
    const targetCustomer = result.updatedCustomer || rechargeCustomer;
    const targetExpiry = targetCustomer.expiryDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const messageText = smsService.formatTemplate(
      currentState.ispSettings?.smsSettings?.rechargeSmsTemplate ||
        'প্রিয় {CUSTOMER_NAME}, আপনার {PACKAGE_NAME} ইন্টারনেট প্যাকেজ সফলভাবে রিচার্জ করা হয়েছে ({AMOUNT} ৳)। মেয়াদ: {EXPIRY_DATE} পর্যন্ত। এখন ওয়াইফাই কানেক্ট করে ব্যবহার করুন। ধন্যবাদ, {COMPANY_NAME}। হেল্পলাইন: {HELPLINE}',
      {
        customerName: targetCustomer.fullName,
        packageName: pkg.name,
        amount,
        expiryDate: targetExpiry,
        companyName: currentState.ispSettings?.companyName || 'ApexISP',
        helpline: currentState.ispSettings?.helpline || '09610-000000',
        username: targetCustomer.pppoeUsername,
        trxId: trx
      }
    );

    // Dispatch SMS based on selected method
    if (dispatchMethod === 'NATIVE_SMS') {
      smsService.openNativeSmsApp(targetCustomer.mobile, messageText);
      await smsService.sendSms({
        recipientMobile: targetCustomer.mobile,
        customerName: targetCustomer.fullName,
        messageText,
        gatewayOverride: 'NATIVE_DEVICE_SMS'
      });
    } else if (dispatchMethod === 'WHATSAPP') {
      smsService.openWhatsApp(targetCustomer.mobile, messageText);
      await smsService.sendSms({
        recipientMobile: targetCustomer.mobile,
        customerName: targetCustomer.fullName,
        messageText,
        gatewayOverride: 'WHATSAPP_DIRECT'
      });
    } else if (rechargeSendSms) {
      await smsService.sendSms({
        recipientMobile: targetCustomer.mobile,
        customerName: targetCustomer.fullName,
        messageText
      });
    }

    setCustomers(updatedCustomers);
    setIsRechargeModalOpen(false);
    setFlashMessage(`গ্রাহক ${rechargeCustomer.fullName}-এর লাইন সফলভাবে রিচার্জ করা হয়েছে ও মেসেজ পাঠানো হয়েছে!`);
    setTimeout(() => setFlashMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Subscriber Management Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full customer lifecycle: PPPoE authentication, IP mapping, MAC binding, package assignment, and suspension.
          </p>
        </div>

        <button
          id="customers-btn-add-customer"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {flashMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{flashMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name, ID, phone, PPPoE user, or IP address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'PENDING'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Full Name &amp; Contact</th>
                <th className="py-3 px-4">PPPoE / IP</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Due Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No customers found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      {cust.customerId}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-white">{cust.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{cust.mobile}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-bold">{cust.pppoeUsername}</div>
                      <div className="text-[10px] text-cyan-300">{cust.ipAddress}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="text-slate-200">{cust.packageName}</span>
                      <div className="text-[10px] text-slate-400 font-mono">{formatCurrency(cust.monthlyFee)}/mo</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {cust.expiryDate || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {cust.dueAmount > 0 ? (
                        <span className="font-bold text-rose-400">{formatCurrency(cust.dueAmount)}</span>
                      ) : (
                        <span className="text-emerald-400">Paid (0)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusBadgeClass(
                          cust.status
                        )}`}
                      >
                        {cust.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => handleOpenRecharge(cust)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded text-[10px] shadow-sm shadow-emerald-600/20 transition active:scale-95"
                          title="Quick Recharge & Send Instant SMS"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>রিচার্জ + SMS</span>
                        </button>
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cust)}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                            cust.status === 'ACTIVE'
                              ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30'
                          }`}
                          title={cust.status === 'ACTIVE' ? 'Suspend Subscriber' : 'Activate Subscriber'}
                        >
                          {cust.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{selectedCustomer.fullName}</h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusBadgeClass(
                      selectedCustomer.status
                    )}`}
                  >
                    {selectedCustomer.status}
                  </span>
                </div>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">{selectedCustomer.customerId}</p>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Credentials & Network Details Card */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 font-mono">
                <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] font-sans">
                  Network &amp; PPPoE Credentials
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">PPPoE Username</span>
                    <strong className="text-cyan-300">{selectedCustomer.pppoeUsername}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">PPPoE Password</span>
                    <strong className="text-slate-200">{selectedCustomer.pppoePassword}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Assigned IPv4</span>
                    <strong className="text-slate-200">{selectedCustomer.ipAddress}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">MAC Lock</span>
                    <strong className="text-slate-200">{selectedCustomer.macAddress}</strong>
                  </div>
                </div>
              </div>

              {/* Package & Billing Info */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Package &amp; Subscription Cycle
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Current Package</span>
                    <strong className="text-white">{selectedCustomer.packageName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Monthly Fee</span>
                    <strong className="text-cyan-400 font-mono">{formatCurrency(selectedCustomer.monthlyFee)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Due Amount</span>
                    <strong className={selectedCustomer.dueAmount > 0 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                      {formatCurrency(selectedCustomer.dueAmount)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Activation Date</span>
                    <span className="text-slate-300 font-mono">{selectedCustomer.activationDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Expiry Date</span>
                    <span className="text-slate-300 font-mono">{selectedCustomer.expiryDate || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info & Direct Phone Dispatch */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Contact &amp; Direct Messaging (সরাসরি যোগাযোগ)
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Direct SIM &amp; WhatsApp Ready
                  </span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span className="font-mono font-bold text-slate-100">{selectedCustomer.mobile}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-sans">
                      <a
                        href={`tel:${selectedCustomer.mobile}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded flex items-center gap-1 transition"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>কল দিন</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          const sms = SmsService.getInstance();
                          const msg = `প্রিয় ${selectedCustomer.fullName}, আপনার ${selectedCustomer.packageName} ইন্টারনেট লাইনের বিষয়ে ApexISP থেকে যোগাযোগ করা হচ্ছে। হেল্পলাইন: ${state.ispSettings?.helpline || '09610-000000'}`;
                          sms.openNativeSmsApp(selectedCustomer.mobile, msg);
                        }}
                        className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-sm transition active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3 text-cyan-300" />
                        <span>📱 সিমে SMS পাঠান</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sms = SmsService.getInstance();
                          const msg = `প্রিয় ${selectedCustomer.fullName}, ApexISP থেকে স্বাগতম। আপনার ইন্টারনেট সংক্রান্ত যেকোনো প্রয়োজনে আমাদের জানান।`;
                          sms.openWhatsApp(selectedCustomer.mobile, msg);
                        }}
                        className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-sm transition active:scale-95"
                      >
                        <Send className="w-3 h-3 text-emerald-200" />
                        <span>💬 WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedCustomer.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => handleToggleStatus(selectedCustomer)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${
                  selectedCustomer.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {selectedCustomer.status === 'ACTIVE' ? 'Suspend Service' : 'Activate Service'}
              </button>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Provision New Broadband Customer</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Mohammad Rahim"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formMobile}
                    onChange={e => setFormMobile(e.target.value)}
                    placeholder="+8801711..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="customer@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Package Subscription *</label>
                  <select
                    value={formPackageId}
                    onChange={e => setFormPackageId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                  >
                    {state.packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.downloadMbps}M DL / {pkg.uploadMbps}M UL - {formatCurrency(pkg.monthlyPrice)}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Installation Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="House #, Road #, Area, City"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Broadband Connection &amp; Authentication
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Connection Type</label>
                    <select
                      value={formConnectionType}
                      onChange={e => setFormConnectionType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    >
                      <option value="PPPoE">PPPoE (Recommended)</option>
                      <option value="Static">Static IP</option>
                      <option value="DHCP">DHCP Lease</option>
                      <option value="Hotspot">Hotspot User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">PPPoE Login ID</label>
                    <input
                      type="text"
                      value={formPppoeUser}
                      onChange={e => setFormPppoeUser(e.target.value)}
                      placeholder="e.g. rahim_ftth"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">PPPoE Password</label>
                    <input
                      type="text"
                      value={formPppoePass}
                      onChange={e => setFormPppoePass(e.target.value)}
                      placeholder="pass2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Framed IP Address</label>
                    <input
                      type="text"
                      value={formIp}
                      onChange={e => setFormIp(e.target.value)}
                      placeholder="100.64.0.55"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">MAC Lock (Optional)</label>
                    <input
                      type="text"
                      value={formMac}
                      onChange={e => setFormMac(e.target.value)}
                      placeholder="AA:BB:CC:DD:EE:FF"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                </div>
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
                  Provision &amp; Activate Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Recharge & Instant SMS Dispatch Modal */}
      {isRechargeModalOpen && rechargeCustomer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  গ্রাহক লাইন রিচার্জ ও SMS নোটিফিকেশন
                </h3>
              </div>
              <button
                onClick={() => setIsRechargeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteQuickRecharge} className="space-y-4 text-xs">
              {/* Customer summary box */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-white text-sm">{rechargeCustomer.fullName}</strong>
                  <span className="text-cyan-400 font-mono text-xs">{rechargeCustomer.customerId}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                  <span>Mobile: <strong className="text-slate-200 font-mono">{rechargeCustomer.mobile}</strong></span>
                  <span>PPPoE: <strong className="text-slate-200 font-mono">{rechargeCustomer.pppoeUsername}</strong></span>
                </div>
              </div>

              {/* Package Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ইন্টারনেট প্যাকেজ সিলেক্ট করুন:</label>
                <select
                  value={rechargePkgId}
                  onChange={e => setRechargePkgId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {state.packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.downloadMbps} Mbps) — {formatCurrency(p.monthlyPrice)} / {p.validityDays} Days
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">পেমেন্ট মাধ্যম:</label>
                  <select
                    value={rechargeMfsMethod}
                    onChange={e => setRechargeMfsMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="BKASH">bKash (বিকাশ)</option>
                    <option value="NAGAD">Nagad (নগদ)</option>
                    <option value="ROCKET">Rocket (রকেট)</option>
                    <option value="CASH">Cash in Hand (ক্যাশ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">TrxID / ভাউচার নাম্বার:</label>
                  <input
                    type="text"
                    value={rechargeTrxId}
                    onChange={e => setRechargeTrxId(e.target.value)}
                    placeholder="TRX982741"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Auto SMS Preview & Toggle */}
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rechargeSendSms}
                    onChange={e => setRechargeSendSms(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    রিচার্জ শেষে ক্লায়েন্টের মোবাইলে ফ্রি কনফার্মেশন SMS পাঠান
                  </span>
                </label>
                {rechargeSendSms && (
                  <p className="text-[11px] text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
                    "প্রিয় {rechargeCustomer.fullName}, আপনার {state.packages.find(p => p.id === rechargePkgId)?.name || 'ইন্টারনেট'} প্যাকেজ সফলভাবে রিচার্জ করা হয়েছে ({formatCurrency(state.packages.find(p => p.id === rechargePkgId)?.monthlyPrice || 0)})। এখন ওয়াইফাই কানেক্ট করে ব্যবহার করুন..."
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRechargeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg order-last sm:order-first"
                >
                  বাতিল
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={e => handleExecuteQuickRecharge(e, 'WHATSAPP')}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition active:scale-95"
                    title="Recharge and send instant WhatsApp confirmation"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-300" />
                    <span>💬 WhatsApp পাঠান</span>
                  </button>

                  <button
                    type="button"
                    onClick={e => handleExecuteQuickRecharge(e, 'NATIVE_SMS')}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/20 transition active:scale-95"
                    title="Recharge and open native phone SMS app with pre-filled text"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
                    <span>📱 সিমে সরাসরি SMS পাঠান</span>
                  </button>

                  <button
                    type="submit"
                    onClick={e => handleExecuteQuickRecharge(e, 'GATEWAY')}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>অটো রিচার্জ</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
