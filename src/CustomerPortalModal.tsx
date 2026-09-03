import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Wifi,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Download,
  Send,
  X,
  Zap,
  ArrowRight,
  Shield,
  Activity,
  Copy,
  Smartphone
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { Customer, Invoice, PaymentRecord } from '../../types';
import { formatBytes, formatCurrency, formatUptime } from '../../utils/formatters';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({ isOpen, onClose }) => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const [searchQuery, setSearchQuery] = useState('CUST-1001');
  const [activeCustomer, setActiveCustomer] = useState<Customer>(
    state.customers[0] || {
      id: 'cust-1',
      customerId: 'CUST-1001',
      fullName: 'Rashedul Karim',
      mobile: '+880 1711-234567',
      email: 'rashed@apexisp.net',
      address: 'House 14, Road 5, Dhanmondi, Dhaka',
      username: 'rashed_dhaka',
      pppoeUsername: 'pppoe_rashed',
      pppoePassword: '••••••••',
      macAddress: 'CC:2D:E0:44:99:A1',
      ipAddress: '10.100.10.105',
      packageId: 'pkg-2',
      packageName: 'Residential Ultra (25 Mbps)',
      installationDate: '2025-01-10',
      activationDate: '2025-01-10',
      expiryDate: '2026-09-10',
      status: 'ACTIVE',
      billingCycle: 'monthly',
      monthlyFee: 1200,
      dueAmount: 0,
      paidAmount: 1200,
      connectionType: 'PPPoE',
      notes: 'VIP Customer',
      createdAt: '2025-01-10',
      updatedAt: '2026-08-01'
    }
  );

  const [paymentAmount, setPaymentAmount] = useState<number>(activeCustomer.dueAmount || 1200);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Card'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    const found = state.customers.find(
      c =>
        c.customerId.toLowerCase() === query ||
        c.username.toLowerCase() === query ||
        c.mobile.includes(query) ||
        c.pppoeUsername.toLowerCase() === query
    );
    if (found) {
      setActiveCustomer(found);
      setPaymentAmount(found.dueAmount || found.monthlyFee);
    } else {
      alert(`Customer matching "${searchQuery}" not found. Try "CUST-1001" or "CUST-1002".`);
    }
  };

  const customerInvoices = state.invoices.filter(i => i.customerId === activeCustomer.customerId);

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId) {
      alert('Please enter a valid Transaction ID (e.g. 9J82KX10).');
      return;
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      transactionId: trxId.toUpperCase(),
      invoiceId: customerInvoices[0]?.id || `inv-${Date.now()}`,
      invoiceNumber: customerInvoices[0]?.invoiceNumber || 'INV-PORTAL-01',
      customerId: activeCustomer.customerId,
      customerName: activeCustomer.fullName,
      amount: paymentAmount,
      paymentMethod,
      senderNumberOrAcc: activeCustomer.mobile,
      referenceNote: 'Self-service customer portal payment',
      date: new Date().toISOString().slice(0, 10),
      status: 'APPROVED',
      approvedBy: 'Auto-Gateway'
    };

    const updatedCustomers = state.customers.map(c => {
      if (c.id === activeCustomer.id) {
        const newDue = Math.max(0, c.dueAmount - paymentAmount);
        return {
          ...c,
          dueAmount: newDue,
          paidAmount: c.paidAmount + paymentAmount,
          status: newDue === 0 && c.status === 'SUSPENDED' ? ('ACTIVE' as const) : c.status
        };
      }
      return c;
    });

    const updatedInvoices = state.invoices.map(inv => {
      if (inv.customerId === activeCustomer.customerId && inv.dueAmount > 0) {
        return {
          ...inv,
          status: 'PAID' as const,
          paidAmount: inv.totalAmount,
          dueAmount: 0,
          paidDate: new Date().toISOString().slice(0, 10)
        };
      }
      return inv;
    });

    storage.setState(prev => ({
      payments: [newPayment, ...prev.payments],
      customers: updatedCustomers,
      invoices: updatedInvoices
    }));

    storage.logAudit(
      'Online Payment Received',
      'BILLING',
      activeCustomer.customerId,
      `Received ${paymentAmount} via ${paymentMethod} (TrxID: ${trxId.toUpperCase()})`
    );

    setPaymentSuccessMsg(`Payment of ${formatCurrency(paymentAmount)} received! Account status updated.`);
    setTrxId('');
    setTimeout(() => setPaymentSuccessMsg(null), 5000);
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) return;

    storage.addNotification(
      'INFO',
      `Customer Support Ticket: ${activeCustomer.customerId}`,
      `${activeCustomer.fullName} submitted ticket: "${ticketSubject}" - ${ticketMsg}`
    );

    setTicketSuccessMsg('Your support request was dispatched to the NOC engineering team.');
    setTicketSubject('');
    setTicketMsg('');
    setTimeout(() => setTicketSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Subscriber Self-Service Portal</h2>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  Live Client View
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Check broadband status, billing history, pay invoices, and test line latency.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs custom-scrollbar">
          {/* Lookup Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Enter Customer ID (e.g. CUST-1001, CUST-1002) or Mobile..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
            >
              Search Account
            </button>
          </form>

          {/* Account Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeCustomer.fullName}</h3>
                  <p className="text-slate-400 font-mono text-[11px]">{activeCustomer.customerId} • {activeCustomer.mobile}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                    activeCustomer.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {activeCustomer.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Assigned Plan</span>
                  <strong className="text-indigo-300 font-sans">{activeCustomer.packageName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Assigned IPv4</span>
                  <strong className="text-cyan-400">{activeCustomer.ipAddress}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PPPoE Username</span>
                  <strong className="text-slate-200">{activeCustomer.pppoeUsername}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Monthly Fee</span>
                  <strong className="text-slate-200">{formatCurrency(activeCustomer.monthlyFee)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Expiry Date</span>
                  <strong className="text-amber-400">{activeCustomer.expiryDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Due Balance</span>
                  <strong className={activeCustomer.dueAmount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {formatCurrency(activeCustomer.dueAmount)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Speed/Latency Gauge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Connection Telemetry
                </span>
                <div className="mt-3 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latency to Gateway:</span>
                    <strong className="text-emerald-400">4.2 ms</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Packet Loss:</span>
                    <strong className="text-emerald-400">0.0%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Session Uptime:</span>
                    <strong className="text-slate-200">5d 14h 22m</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-center">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Optical Link Signal Optimal (-18 dBm)
                </span>
              </div>
            </div>
          </div>

          {/* Pay Invoice & bKash Simulation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase font-mono">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Pay Due Bill via Mobile Banking
              </h4>

              {paymentSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSimulatePayment} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Amount (BDT)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100"
                    >
                      <option value="bKash">bKash (বিকাশ)</option>
                      <option value="Nagad">Nagad (নগদ)</option>
                      <option value="Rocket">Rocket (রকেট)</option>
                      <option value="Card">Visa / Mastercard / Bank</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Payment Account Display */}
                {(() => {
                  const gateways = state.ispSettings?.paymentGateways;
                  const isBkash = paymentMethod === 'bKash';
                  const isNagad = paymentMethod === 'Nagad';
                  const isRocket = paymentMethod === 'Rocket';
                  const isBank = paymentMethod === 'Card';

                  const accountNumber = isBkash
                    ? (gateways?.bkashNumber || '01700-000000')
                    : isNagad
                    ? (gateways?.nagadNumber || '01800-000000')
                    : isRocket
                    ? (gateways?.rocketNumber || '01900-000000-8')
                    : (gateways?.bankDetails || 'Bank Transfer');

                  const accountType = isBkash
                    ? (gateways?.bkashType || 'Merchant')
                    : isNagad
                    ? (gateways?.nagadType || 'Merchant')
                    : isRocket
                    ? 'Personal'
                    : 'Bank';

                  const instruction = isBkash
                    ? (gateways?.bkashInstructions || 'বিকাশ অ্যাপ থেকে পেমেন্ট অপশনে গিয়ে এই নাম্বারে টাকা পাঠান এবং রেফারেন্সে আপনার Customer ID দিন।')
                    : isNagad
                    ? (gateways?.nagadInstructions || 'নগদ থেকে পেমেন্ট করে TrxID দিন।')
                    : (gateways?.paymentInstructions || 'টাকা পাঠানোর পর প্রাপ্ত TrxID দিন।');

                  return (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">
                          {paymentMethod} {accountType} Number:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(accountNumber);
                            setCopiedAccount(true);
                            setTimeout(() => setCopiedAccount(false), 2000);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 font-mono active:scale-95"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedAccount ? 'Copied!' : 'Copy Number'}
                        </button>
                      </div>
                      <div className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                        {accountNumber}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {instruction}
                      </p>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-slate-400 mb-1">Transaction ID (TrxID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9B72LK99"
                    value={trxId}
                    onChange={e => setTrxId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono uppercase font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-md shadow-emerald-600/20"
                >
                  Submit Payment &amp; Instant Reconnect
                </button>
              </form>
            </div>

            {/* Support Ticket */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase font-mono">
                <Send className="w-4 h-4 text-cyan-400" />
                Submit Support Ticket to NOC
              </h4>

              {ticketSuccessMsg && (
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{ticketSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSendTicket} className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1">Problem Category / Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Slow speed during evening or LOS red light on ONU"
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Issue Description</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe what you are experiencing..."
                    value={ticketMsg}
                    onChange={e => setTicketMsg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg border border-slate-700 transition"
                >
                  Dispatch Ticket to NOC
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
};
