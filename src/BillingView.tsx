import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Printer,
  DollarSign,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  QrCode,
  Calendar,
  CreditCard,
  RefreshCw,
  Eye
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { BillingEngine } from '../../services/billingEngine';
import { Invoice, InvoiceStatus } from '../../types';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters';

export const BillingView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const billingEngine = BillingEngine.getInstance();

  const [invoices, setInvoices] = useState<Invoice[]>(state.invoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Form State for Manual Invoice Generation
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id || '');
  const [billingPeriod, setBillingPeriod] = useState('September 2026');
  const [subTotal, setSubTotal] = useState<number>(800);
  const [discount, setDiscount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('2026-09-10');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerMobile.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRunBillingScan = () => {
    setIsScanning(true);
    setScanMessage('Scanning subscribers for automatic invoice generation and expiry...');

    setTimeout(() => {
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

      setInvoices([...result.newInvoices, ...state.invoices]);
      setIsScanning(false);
      setScanMessage(
        `Automated cycle finished: ${result.scanResult.invoicesGenerated} invoices generated, ${result.scanResult.suspendedCount} customers suspended.`
      );
      setTimeout(() => setScanMessage(null), 5000);
    }, 800);
  };

  const handleCreateManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = state.customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    const total = Math.max(0, subTotal - discount);
    const invNumber = billingEngine.generateInvoiceNumber(invoices.length);
    const today = new Date().toISOString().split('T')[0];

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      customerId: cust.id,
      customerName: cust.fullName,
      customerMobile: cust.mobile,
      customerAddress: cust.address,
      packageId: cust.packageId,
      packageName: cust.packageName,
      billingPeriod,
      subTotal,
      taxAmount: 0,
      discountAmount: discount,
      totalAmount: total,
      paidAmount: 0,
      dueAmount: total,
      status: 'UNPAID',
      dueDate,
      issueDate: today
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    storage.setState({ invoices: updated });
    storage.logAudit(
      'Manual Invoice Generated',
      'BILLING',
      invNumber,
      `Generated invoice for ${cust.fullName} (Amount: ${total} BDT).`
    );

    setIsGenerateModalOpen(false);
    setSelectedInvoice(newInv);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            ISP Billing &amp; Invoices Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated subscription billing, tax/discount calculation, printable invoices, and payment tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunBillingScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Run Billing Cycle</span>
          </button>
          <button
            id="billing-btn-generate"
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{scanMessage}</span>
          </div>
          <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name, mobile..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'UNPAID', 'PAID', 'OVERDUE'].map(st => (
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

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Subscriber</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Invoice Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-white">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inv.customerMobile}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      {inv.packageName}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {inv.billingPeriod}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {inv.dueDate}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusBadgeClass(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded transition"
                        title="View / Print Printable Invoice"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable PDF-Style Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Broadband Service Invoice
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Actual Printable Invoice Body */}
            <div className="bg-white text-slate-900 p-8 rounded-xl shadow-lg space-y-6 font-sans">
              {/* Header: Company & Invoice Info */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-6 h-6 text-cyan-600" />
                    <span className="text-xl font-black tracking-tight text-slate-900">
                      {state.ispSettings?.companyName || 'ApexISP Broadband'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">High-Speed FTTH Fiber Network &amp; Enterprise Solutions</p>
                  <p className="text-xs text-slate-500">
                    Helpline: {state.ispSettings?.helpline || '+880 9610-000000'} | {state.ispSettings?.supportEmail || 'support@apexisp.net'}
                  </p>
                </div>

                <div className="text-right">
                  <h2 className="text-2xl font-black text-cyan-700 tracking-tight">INVOICE</h2>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">{selectedInvoice.invoiceNumber}</p>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                      selectedInvoice.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Bill To & Invoice Meta */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Billed To:</span>
                  <p className="font-bold text-sm text-slate-900">{selectedInvoice.customerName}</p>
                  <p className="text-slate-600">{selectedInvoice.customerMobile}</p>
                  <p className="text-slate-600 leading-relaxed mt-0.5">{selectedInvoice.customerAddress}</p>
                </div>

                <div className="space-y-1 text-right">
                  <div>
                    <span className="text-slate-500">Issue Date:</span>{' '}
                    <strong className="text-slate-800 font-mono">{selectedInvoice.issueDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Due Date:</span>{' '}
                    <strong className="text-rose-600 font-mono">{selectedInvoice.dueDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Billing Period:</span>{' '}
                    <strong className="text-slate-800">{selectedInvoice.billingPeriod}</strong>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-center">Period</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{selectedInvoice.packageName}</div>
                        <div className="text-[11px] text-slate-500">Unlimited FTTH Fiber Internet Subscription</div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-mono">{selectedInvoice.billingPeriod}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(selectedInvoice.subTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-between items-start pt-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-w-xs space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px]">Payment Methods:</span>
                  <p className="text-slate-700 text-[11px]">
                    bKash ({state.ispSettings?.paymentGateways?.bkashType || 'Merchant'}):{' '}
                    <strong className="font-mono">{state.ispSettings?.paymentGateways?.bkashNumber || '01700-000000'}</strong>
                  </p>
                  <p className="text-slate-700 text-[11px]">
                    Nagad ({state.ispSettings?.paymentGateways?.nagadType || 'Merchant'}):{' '}
                    <strong className="font-mono">{state.ispSettings?.paymentGateways?.nagadNumber || '01800-000000'}</strong>
                  </p>
                  <p className="text-slate-500 text-[10px] leading-tight">
                    {state.ispSettings?.paymentGateways?.paymentInstructions || 'Use Customer ID or Invoice # as payment reference.'}
                  </p>
                </div>

                <div className="w-60 space-y-1.5 text-right font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subTotal)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>Total Due:</span>
                    <span className="text-cyan-700">{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                This is an electronically generated broadband invoice. Thank you for choosing ApexISP.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Invoice Creation Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Generate Subscriber Invoice</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    setSelectedCustomerId(e.target.value);
                    const cust = state.customers.find(c => c.id === e.target.value);
                    if (cust) setSubTotal(cust.monthlyFee);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                >
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.customerId} - {c.packageName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Billing Period</label>
                  <input
                    type="text"
                    value={billingPeriod}
                    onChange={e => setBillingPeriod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subtotal (BDT)</label>
                  <input
                    type="number"
                    value={subTotal}
                    onChange={e => setSubTotal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discount (BDT)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                >
                  Create &amp; Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
