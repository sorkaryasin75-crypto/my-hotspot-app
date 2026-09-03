import { Customer, PackageItem, Invoice, PaymentRecord, NotificationItem } from '../types';

export interface BillingScanResult {
  suspendedCount: number;
  warnedCount: number;
  invoicesGenerated: number;
  logs: string[];
}

export class BillingEngine {
  private static instance: BillingEngine;

  private constructor() {}

  public static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine();
    }
    return BillingEngine.instance;
  }

  /**
   * Generates a unique invoice number e.g. INV-2026-0901
   */
  public generateInvoiceNumber(existingCount: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(existingCount + 1).padStart(4, '0');
    return `INV-${year}-${month}${seq}`;
  }

  /**
   * Calculates new expiration date based on validity days
   */
  public calculateNewExpiryDate(currentExpiry: string, validityDays: number): string {
    let baseDate = new Date();
    if (currentExpiry) {
      const parsed = new Date(currentExpiry);
      if (!isNaN(parsed.getTime()) && parsed > baseDate) {
        baseDate = parsed;
      }
    }
    const newDate = new Date(baseDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    return newDate.toISOString().split('T')[0];
  }

  /**
   * Scans all customers for automatic expiry, grace period calculation, and suspension
   */
  public runAutomatedBillingCycle(
    customers: Customer[],
    packages: PackageItem[],
    invoices: Invoice[]
  ): {
    updatedCustomers: Customer[];
    newInvoices: Invoice[];
    newNotifications: NotificationItem[];
    scanResult: BillingScanResult;
  } {
    const today = new Date();
    const logs: string[] = [];
    let suspendedCount = 0;
    let warnedCount = 0;
    let invoicesGenerated = 0;

    const updatedCustomers: Customer[] = [...customers];
    const newInvoices: Invoice[] = [];
    const newNotifications: NotificationItem[] = [];

    for (let i = 0; i < updatedCustomers.length; i++) {
      const cust = { ...updatedCustomers[i] };
      const pkg = packages.find(p => p.id === cust.packageId);
      const graceDays = pkg?.gracePeriodDays || 3;

      if (!cust.expiryDate || cust.status === 'PENDING' || cust.status === 'BLOCKED') {
        continue;
      }

      const expiryDate = new Date(cust.expiryDate);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check if already past expiry + grace period
      if (diffDays < -graceDays) {
        if (cust.status === 'ACTIVE' && cust.dueAmount > 0) {
          cust.status = 'SUSPENDED';
          if (cust.currentSession) {
            cust.currentSession.isOnline = false;
            cust.currentSession.rxRateKbps = 0;
            cust.currentSession.txRateKbps = 0;
          }
          suspendedCount++;
          logs.push(`[SUSPEND] Customer ${cust.fullName} (${cust.customerId}) automatically SUSPENDED (expired on ${cust.expiryDate}, grace ended).`);

          newNotifications.push({
            id: `notif-susp-${Date.now()}-${cust.id}`,
            type: 'ALERT',
            title: 'Customer Auto-Suspended',
            message: `Customer ${cust.fullName} (${cust.customerId}) suspended due to overdue invoice.`,
            timestamp: new Date().toISOString(),
            isRead: false,
            link: 'customers'
          });
        }
      } else if (diffDays <= 0) {
        // In grace period
        if (cust.status === 'ACTIVE') {
          logs.push(`[GRACE] Customer ${cust.fullName} (${cust.customerId}) is in grace period (${Math.abs(diffDays)}/${graceDays} days).`);
        }
      } else if (diffDays <= 3 && diffDays > 0) {
        // Expiring in 1-3 days: warning
        warnedCount++;
        logs.push(`[WARN] Customer ${cust.fullName} (${cust.customerId}) will expire in ${diffDays} day(s).`);

        // Check if invoice already exists for current cycle
        const existingInv = invoices.find(
          inv => inv.customerId === cust.id && (inv.status === 'UNPAID' || inv.status === 'OVERDUE')
        );

        if (!existingInv && pkg) {
          const invNumber = this.generateInvoiceNumber(invoices.length + newInvoices.length);
          const newInv: Invoice = {
            id: `inv-${Date.now()}-${cust.id}`,
            invoiceNumber: invNumber,
            customerId: cust.id,
            customerName: cust.fullName,
            customerMobile: cust.mobile,
            customerAddress: cust.address,
            packageId: pkg.id,
            packageName: pkg.name,
            billingPeriod: `${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`,
            subTotal: pkg.monthlyPrice,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: pkg.monthlyPrice,
            paidAmount: 0,
            dueAmount: pkg.monthlyPrice,
            status: 'UNPAID',
            dueDate: cust.expiryDate,
            issueDate: today.toISOString().split('T')[0]
          };
          newInvoices.push(newInv);
          invoicesGenerated++;
          cust.dueAmount += pkg.monthlyPrice;

          newNotifications.push({
            id: `notif-inv-${Date.now()}-${cust.id}`,
            type: 'INFO',
            title: 'Renewal Invoice Generated',
            message: `Invoice ${invNumber} for ${cust.fullName} generated (Amount: ${pkg.monthlyPrice} BDT).`,
            timestamp: new Date().toISOString(),
            isRead: false,
            link: 'billing'
          });
        }
      }

      updatedCustomers[i] = cust;
    }

    logs.push(`[Summary] Billing cycle scan completed. Processed ${customers.length} subscribers.`);

    return {
      updatedCustomers,
      newInvoices,
      newNotifications,
      scanResult: {
        suspendedCount,
        warnedCount,
        invoicesGenerated,
        logs
      }
    };
  }

  /**
   * Processes payment approval and automatically reactivates suspended or renewing customers
   */
  public approvePayment(
    payment: PaymentRecord,
    customers: Customer[],
    invoices: Invoice[],
    packages: PackageItem[],
    adminName: string
  ): {
    updatedPayment: PaymentRecord;
    updatedCustomer?: Customer;
    updatedInvoice?: Invoice;
    notification: NotificationItem;
  } {
    const updatedPayment: PaymentRecord = {
      ...payment,
      status: 'APPROVED',
      approvedBy: adminName,
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    let updatedCustomer: Customer | undefined;
    let updatedInvoice: Invoice | undefined;

    const targetInvoice = invoices.find(inv => inv.id === payment.invoiceId);
    if (targetInvoice) {
      const newPaid = targetInvoice.paidAmount + payment.amount;
      const newDue = Math.max(0, targetInvoice.totalAmount - newPaid);
      updatedInvoice = {
        ...targetInvoice,
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newDue === 0 ? 'PAID' : 'PARTIAL',
        paidDate: newDue === 0 ? new Date().toISOString().split('T')[0] : targetInvoice.paidDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId
      };
    }

    const targetCustomer = customers.find(c => c.id === payment.customerId);
    if (targetCustomer) {
      const pkg = packages.find(p => p.id === targetCustomer.packageId);
      const validityDays = pkg?.validityDays || 30;
      const newExpiry = this.calculateNewExpiryDate(targetCustomer.expiryDate, validityDays);

      updatedCustomer = {
        ...targetCustomer,
        dueAmount: Math.max(0, targetCustomer.dueAmount - payment.amount),
        paidAmount: targetCustomer.paidAmount + payment.amount,
        status: 'ACTIVE',
        activationDate: targetCustomer.activationDate || new Date().toISOString().split('T')[0],
        expiryDate: newExpiry,
        updatedAt: new Date().toISOString()
      };
    }

    const notification: NotificationItem = {
      id: `notif-pay-${Date.now()}`,
      type: 'SUCCESS',
      title: 'Payment Approved & Service Restored',
      message: `Payment ${payment.transactionId} (${payment.amount} BDT) approved for ${payment.customerName}. Customer is now ACTIVE until ${updatedCustomer?.expiryDate || 'next cycle'}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      link: 'payments'
    };

    return {
      updatedPayment,
      updatedCustomer,
      updatedInvoice,
      notification
    };
  }
}
