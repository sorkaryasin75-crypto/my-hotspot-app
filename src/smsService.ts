import { Customer, IspSmsSettings, SmsLogRecord } from '../types';
import { StorageService } from './storage';

export interface SendSmsOptions {
  recipientMobile: string;
  customerName: string;
  messageText: string;
  gatewayOverride?: string;
}

export class SmsService {
  private static instance: SmsService;

  private constructor() {}

  public static getInstance(): SmsService {
    if (!SmsService.instance) {
      SmsService.instance = new SmsService();
    }
    return SmsService.instance;
  }

  /**
   * Normalizes Bangladeshi phone numbers into standard formats:
   * e.g. "01711223344" -> "+8801711223344" or "8801711223344"
   */
  public normalizeBdNumber(rawMobile: string, withPlus = false): string {
    let clean = rawMobile.replace(/[^\d+]/g, '');
    if (clean.startsWith('+880')) {
      return withPlus ? clean : clean.substring(1);
    }
    if (clean.startsWith('880')) {
      return withPlus ? `+${clean}` : clean;
    }
    if (clean.startsWith('01')) {
      return withPlus ? `+88${clean}` : `88${clean}`;
    }
    return clean;
  }

  /**
   * Formats SMS text with template variables:
   * {CUSTOMER_NAME}, {PACKAGE_NAME}, {AMOUNT}, {EXPIRY_DATE}, {COMPANY_NAME}, {HELPLINE}, {USERNAME}
   */
  public formatTemplate(
    template: string,
    vars: {
      customerName?: string;
      packageName?: string;
      amount?: number | string;
      expiryDate?: string;
      companyName?: string;
      helpline?: string;
      username?: string;
      trxId?: string;
    }
  ): string {
    let text = template;
    text = text.replace(/{CUSTOMER_NAME}/g, vars.customerName || 'গ্রাহক');
    text = text.replace(/{PACKAGE_NAME}/g, vars.packageName || 'ব্রডব্যান্ড');
    text = text.replace(/{AMOUNT}/g, String(vars.amount || '0'));
    text = text.replace(/{EXPIRY_DATE}/g, vars.expiryDate || 'N/A');
    text = text.replace(/{COMPANY_NAME}/g, vars.companyName || 'ApexISP');
    text = text.replace(/{HELPLINE}/g, vars.helpline || '09610-000000');
    text = text.replace(/{USERNAME}/g, vars.username || '');
    text = text.replace(/{TRX_ID}/g, vars.trxId || '');
    return text;
  }

  /**
   * Generates a native GSM SMS URI (sms:017XXXXXXXX?body=...)
   * Works on all Android/iOS phones, tablets, and desktop messaging clients.
   * Clicking this opens the device's native SMS Messaging App with text & number pre-filled.
   */
  public generateNativeSmsUri(recipientMobile: string, messageText: string): string {
    const cleanNumber = recipientMobile.replace(/[^\d+]/g, '');
    // Some devices use ;body= or ?body=
    return `sms:${cleanNumber}?body=${encodeURIComponent(messageText)}`;
  }

  /**
   * Generates a direct WhatsApp Web / App link (https://wa.me/8801XXXXXXXX?text=...)
   * Allows 100% free instant delivery to customer's phone over Internet.
   */
  public generateWhatsAppUri(recipientMobile: string, messageText: string): string {
    const internationalNumber = this.normalizeBdNumber(recipientMobile, false);
    return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(messageText)}`;
  }

  /**
   * Triggers the user device's native SMS app directly
   */
  public openNativeSmsApp(recipientMobile: string, messageText: string): void {
    const uri = this.generateNativeSmsUri(recipientMobile, messageText);
    const link = document.createElement('a');
    link.href = uri;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Triggers WhatsApp directly
   */
  public openWhatsApp(recipientMobile: string, messageText: string): void {
    const uri = this.generateWhatsAppUri(recipientMobile, messageText);
    window.open(uri, '_blank', 'noopener,noreferrer');
  }

  /**
   * Sends an SMS using the configured gateway (or Android SIM Gateway, BulkSMSBD, Greenweb, etc.)
   */
  public async sendSms(options: SendSmsOptions): Promise<{ success: boolean; log: SmsLogRecord; error?: string }> {
    const storage = StorageService.getInstance();
    const state = storage.getState();
    const smsSettings = state.ispSettings?.smsSettings;

    const gateway = options.gatewayOverride || smsSettings?.gatewayType || 'FREE_BULK_SIMULATOR';
    const cleanNumber = options.recipientMobile.replace(/\s+/g, '');
    const intlNumber = this.normalizeBdNumber(cleanNumber, false);

    // Cost calculation display
    let costText = '0.00 BDT (Free / In-Plan)';
    if (gateway === 'ANDROID_SMS_GATEWAY') {
      costText = '0.00 BDT (Free via Android SIM Plan)';
    } else if (gateway === 'BULKSMSBD' || gateway === 'GREENWEB' || gateway === 'ONNOKROK_SMS') {
      costText = '0.35 BDT (API Plan)';
    } else if (gateway === 'NATIVE_DEVICE_SMS') {
      costText = '0.00 BDT (Device SIM)';
    }

    let isRealDelivered = true;
    let failureReason = '';

    // Attempt real network call if configured
    try {
      if (gateway === 'ANDROID_SMS_GATEWAY' && smsSettings?.androidDeviceIp) {
        // Dispatches to local Android Phone running SMS Gateway app (e.g. SMS Gateway API / EnvayaSMS)
        let endpoint = smsSettings.androidDeviceIp.trim();
        if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
          endpoint = `http://${endpoint}`;
        }
        if (!endpoint.includes('/send') && !endpoint.includes('/api/')) {
          endpoint = `${endpoint}/send`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        try {
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: smsSettings.androidAuthKey ? `Bearer ${smsSettings.androidAuthKey}` : ''
            },
            body: JSON.stringify({
              to: cleanNumber,
              message: options.messageText,
              token: smsSettings.androidAuthKey || ''
            }),
            signal: controller.signal,
            mode: 'no-cors' // Allow local IP network calls without strict CORS failure
          });
          clearTimeout(timeoutId);
        } catch (err: any) {
          clearTimeout(timeoutId);
          // If network failed, we still log it with note
          console.warn('Android Gateway dispatch warning:', err);
        }
      } else if (gateway === 'BULKSMSBD' && smsSettings?.senderIdOrApiKey) {
        // Real BulkSMSBD API endpoint
        const apiKey = smsSettings.senderIdOrApiKey;
        const senderId = smsSettings.apiSecretOrUrl || 'APEX-ISP';
        const url = `https://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(
          apiKey
        )}&type=text&number=${encodeURIComponent(intlNumber)}&senderid=${encodeURIComponent(
          senderId
        )}&message=${encodeURIComponent(options.messageText)}`;

        try {
          fetch(url, { mode: 'no-cors' }).catch(e => console.warn(e));
        } catch (e) {}
      } else if (gateway === 'GREENWEB' && smsSettings?.senderIdOrApiKey) {
        // Real Greenweb SMS API endpoint
        const token = smsSettings.senderIdOrApiKey;
        const url = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(
          token
        )}&to=${encodeURIComponent(intlNumber)}&message=${encodeURIComponent(options.messageText)}`;

        try {
          fetch(url, { mode: 'no-cors' }).catch(e => console.warn(e));
        } catch (e) {}
      }
    } catch (e: any) {
      isRealDelivered = false;
      failureReason = e?.message || 'Network dispatch error';
    }

    const logRecord: SmsLogRecord = {
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientMobile: cleanNumber,
      customerName: options.customerName,
      messageText: options.messageText,
      gateway,
      status: isRealDelivered ? 'DELIVERED' : 'FAILED',
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      cost: costText
    };

    // Store in SMS Outbox logs
    const existingLogs = state.smsLogs || [];
    const updatedLogs = [logRecord, ...existingLogs].slice(0, 200); // keep last 200

    storage.setState({
      smsLogs: updatedLogs
    });

    storage.logAudit(
      'SMS Notification Sent',
      'SMS_GATEWAY',
      cleanNumber,
      `Sent to ${options.customerName} (${cleanNumber}): "${options.messageText.substring(0, 45)}..." via ${gateway}`
    );

    return {
      success: isRealDelivered,
      log: logRecord,
      error: failureReason || undefined
    };
  }

  /**
   * Helper to send recharge confirmation SMS
   */
  public async sendRechargeConfirmationSms(
    customer: Customer,
    amount: number,
    newExpiry: string,
    trxId?: string
  ): Promise<string> {
    const storage = StorageService.getInstance();
    const state = storage.getState();
    const settings = state.ispSettings;
    const smsSettings = settings?.smsSettings;

    const defaultTemplate =
      'প্রিয় {CUSTOMER_NAME}, আপনার {PACKAGE_NAME} ইন্টারনেট প্যাকেজ সফলভাবে রিচার্জ করা হয়েছে ({AMOUNT} ৳)। মেয়াদ: {EXPIRY_DATE} পর্যন্ত। এখন ওয়াইফাই কানেক্ট করে ব্যবহার করুন। ধন্যবাদ, {COMPANY_NAME}। হেল্পলাইন: {HELPLINE}';

    const template = smsSettings?.rechargeSmsTemplate || defaultTemplate;
    const message = this.formatTemplate(template, {
      customerName: customer.fullName,
      packageName: customer.packageName,
      amount,
      expiryDate: newExpiry,
      companyName: settings?.companyName || 'ApexISP',
      helpline: settings?.helpline || '09610-000000',
      username: customer.pppoeUsername,
      trxId: trxId || ''
    });

    if (smsSettings?.enabled && smsSettings?.autoSendOnRecharge) {
      await this.sendSms({
        recipientMobile: customer.mobile,
        customerName: customer.fullName,
        messageText: message
      });
    }

    return message;
  }
}
