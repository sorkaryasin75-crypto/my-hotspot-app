import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { BillingEngine } from '../../services/billingEngine';
import { PaymentRecord, PaymentStatus, PaymentMethodType } from '../../types';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters';
import { SmsService } from '../../services/smsService';

export const PaymentsView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const billingEngine = BillingEngine.getInstance();

  const [payments, setPayments] = useState<PaymentRecord[]>(state.payments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Manual payment entry form
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(state.invoices[0]?.id || '');
  const [amount, setAmount] = useState<number>(800);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [referenceNote, setReferenceNote] = useState('');

  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.senderNumberOrAcc && p.senderNumberOrAcc.includes(searchQuery));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprovePayment = (payment: PaymentRecord) => {
    const result = billingEngine.approvePayment(
      payment,
      state.customers,
      state.invoices,
      state.packages,
      'Super Administrator'
    );

    const updatedPayments = payments.map(p => (p.id === payment.id ? result.updatedPayment : p));
    setPayments(updatedPayments);

    const updatedCustomers = result.updatedCustomer
      ? state.customers.map(c => (c.id === result.updatedCustomer?.id ? result.updatedCustomer! : c))
      : state.customers;

    const updatedInvoices = result.updatedInvoice
      ? state.invoices.map(i => (i.id === result.updatedInvoice?.id ? result.updatedInvoice! : i))
      : state.invoices;

    storage.setState(prev => ({
      payments: updatedPayments,
      customers: updatedCustomers,
      invoices: updatedInvoices,
      notifications: [result.notification, ...prev.notifications]
    }));

    storage.logAudit(
      'Payment Approved & Service Restored',
      'BILLING',
      payment.transactionId,
      `Approved payment of ${payment.amount} BDT for ${payment.customerName}. Expiry extended.`
    );

    // Trigger automated recharge confirmation SMS to customer
    if (result.updatedCustomer) {
      SmsService.getInstance().sendRechargeConfirmationSms(
        result.updatedCustomer,
        payment.amount,
        result.updatedCustomer.expiryDate || 'N/A',
        payment.transactionId
      );
    }

    setSuccessToast(
      `Payment ${payment.transactionId} approved! Customer ${payment.customerName} is now ACTIVE and recharge SMS dispatched.`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleRejectPayment = (payment: PaymentRecord) => {
    const reason = prompt('Please enter rejection reason:', 'Invalid transaction ID or payment not received.');
    if (reason === null) return;

    const updatedPayments = payments.map(p =>
      p.id === payment.id
        ? {
            ...p,
            status: 'REJECTED' as PaymentStatus,
            rejectionReason: reason,
            approvedBy: 'Super Administrator'
          }
        : p
    );
    setPayments(updatedPayments);
    storage.setState({ payments: updatedPayments });
    storage.logAudit(
      'Payment Rejected',
      'BILLING',
      payment.transactionId,
      `Rejected payment for ${payment.customerName}. Reason: ${reason}`
    );
  };

  const handleRecordManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = state.customers.find(c => c.id === selectedCustomerId);
    const inv = state.invoices.find(i => i.id === selectedInvoiceId);
    if (!cust) return;

    const trx = transactionId || `MANUAL-${Date.now().toString().slice(-6)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      transactionId: trx,
      invoiceId: inv ? inv.id : 'N/A',
      invoiceNumber: inv ? inv.invoiceNumber : 'DIRECT-PAY',
      customerId: cust.id,
      customerName: cust.fullName,
      amount,
      paymentMethod,
      senderNumberOrAcc: senderAccount || cust.mobile,
      referenceNote: referenceNote || 'Over-the-counter manual collection',
      date: nowStr,
      status: 'APPROVED',
      approvedBy: 'Super Administrator',
      approvedAt: nowStr
    };

    // Auto-approve manual entry
    const result = billingEngine.approvePayment(
      newPayment,
      state.customers,
      state.invoices,
      state.packages,
      'Super Administrator'
    );

    const updatedPayments = [result.updatedPayment, ...payments];
    setPayments(updatedPayments);

    const updatedCustomers = result.updatedCustomer
      ? state.customers.map(c => (c.id === result.updatedCustomer?.id ? result.updatedCustomer! : c))
      : state.customers;

    const updatedInvoices = result.updatedInvoice
      ? state.invoices.map(i => (i.id === result.updatedInvoice?.id ? result.updatedInvoice! : i))
      : state.invoices;

    storage.setState(prev => ({
      payments: updatedPayments,
      customers: updatedCustomers,
      invoices: updatedInvoices,
      notifications: [result.notification, ...prev.notifications]
    }));

    setIsRecordModalOpen(false);
    if (result.updatedCustomer) {
      SmsService.getInstance().sendRechargeConfirmationSms(
        result.updatedCustomer,
        amount,
        result.updatedCustomer.expiryDate || 'N/A',
        trx
      );
    }
    setSuccessToast(`Recorded payment ${trx} for ${cust.fullName}. Service updated & recharge SMS dispatched to ${cust.mobile}.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            Payment Verification &amp; Collections Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            bKash, Nagad, Bank, Cash reconciliation queue, automated activation, and transaction audit trails.
          </p>
        </div>

        <button
          id="payments-btn-record"
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Collection</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by transaction ID, customer name, invoice #, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
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

      {/* Payment Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Subscriber</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Method &amp; Account</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      {p.transactionId}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {p.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-bold">{p.paymentMethod}</div>
                      <div className="text-[10px] text-slate-400">{p.senderNumberOrAcc || 'Counter'}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {p.date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusBadgeClass(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {p.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprovePayment(p)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPayment(p)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'APPROVED' && (
                            <>
                              <button
                                onClick={() => {
                                  const sms = SmsService.getInstance();
                                  const msg = `প্রিয় ${p.customerName}, আপনার ${formatCurrency(p.amount)} পেমেন্ট (${p.paymentMethod}) সফলভাবে অনুমোদিত হয়েছে। TrxID: ${p.transactionId}। ধন্যবাদ, ${state.ispSettings?.companyName || 'ApexISP'}। হেল্পলাইন: ${state.ispSettings?.helpline || '09610-000000'}`;
                                  sms.openNativeSmsApp(p.senderNumberOrAcc || '', msg);
                                }}
                                className="p-1 bg-blue-900/60 hover:bg-blue-800 text-cyan-300 rounded text-[10px] font-bold border border-blue-500/30 flex items-center gap-1 px-1.5"
                                title="Send SMS directly to phone SIM"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>📱 SMS</span>
                              </button>
                              <button
                                onClick={() => {
                                  const sms = SmsService.getInstance();
                                  const msg = `প্রিয় ${p.customerName}, আপনার ${formatCurrency(p.amount)} পেমেন্ট (${p.paymentMethod}) সফলভাবে অনুমোদিত হয়েছে। TrxID: ${p.transactionId}। ধন্যবাদ, ${state.ispSettings?.companyName || 'ApexISP'}।`;
                                  sms.openWhatsApp(p.senderNumberOrAcc || '', msg);
                                }}
                                className="p-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 px-1.5"
                                title="Send confirmation on WhatsApp"
                              >
                                <span>💬</span>
                              </button>
                            </>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {p.status === 'APPROVED' ? `✓` : '✗'}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Manual Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Record Payment / Collection</h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordManualPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subscriber *</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    setSelectedCustomerId(e.target.value);
                    const cust = state.customers.find(c => c.id === e.target.value);
                    if (cust) setAmount(cust.dueAmount > 0 ? cust.dueAmount : cust.monthlyFee);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                >
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.customerId}) - Due: {formatCurrency(c.dueAmount)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethodType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-medium"
                  >
                    <option value="Cash">Cash (Counter)</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank">Bank Wire</option>
                    <option value="Card">Credit/Debit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Transaction ID / Slip</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="e.g. TRX99210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sender Mobile / Acc</label>
                  <input
                    type="text"
                    value={senderAccount}
                    onChange={e => setSenderAccount(e.target.value)}
                    placeholder="+8801..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                >
                  Record &amp; Activate Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
