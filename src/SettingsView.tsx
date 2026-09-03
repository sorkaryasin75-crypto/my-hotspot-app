import React, { useState } from 'react';
import {
  Settings,
  Server,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Building,
  DollarSign,
  Clock,
  HardDrive,
  CreditCard,
  Smartphone,
  Save,
  Info,
  QrCode,
  ShieldCheck,
  Eye,
  Copy,
  MessageSquare,
  Send,
  Radio,
  Check,
  Zap,
  List
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { IspProfileSettings, IspPaymentSettings, IspSmsSettings, SmsGatewayType, SmsLogRecord } from '../../types';
import { SmsService } from '../../services/smsService';

export const SettingsView: React.FC = () => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const initialIsp: IspProfileSettings = state.ispSettings || {
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
      androidDeviceIp: '192.168.1.150:8080',
      androidAuthKey: 'apex_secret_key_88',
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

  const [companyName, setCompanyName] = useState(initialIsp.companyName);
  const [helpline, setHelpline] = useState(initialIsp.helpline);
  const [supportEmail, setSupportEmail] = useState(initialIsp.supportEmail);
  const [currencySymbol, setCurrencySymbol] = useState(initialIsp.currencySymbol);
  const [autoSuspendOverdue, setAutoSuspendOverdue] = useState(initialIsp.autoSuspendOverdue);
  const [gracePeriodDays, setGracePeriodDays] = useState(initialIsp.gracePeriodDays);

  // MFS Payment Gateways State
  const [bkashEnabled, setBkashEnabled] = useState(initialIsp.paymentGateways.bkashEnabled ?? true);
  const [bkashNumber, setBkashNumber] = useState(initialIsp.paymentGateways.bkashNumber || '01700-000000');
  const [bkashType, setBkashType] = useState<IspPaymentSettings['bkashType']>(initialIsp.paymentGateways.bkashType || 'Merchant');
  const [bkashInstructions, setBkashInstructions] = useState(
    initialIsp.paymentGateways.bkashInstructions ||
      'বিকাশ অ্যাপ থেকে Make Payment অপশনে গিয়ে এই নাম্বারে টাকা পাঠান এবং রেফারেন্সে আপনার Customer ID লিখুন।'
  );

  const [nagadEnabled, setNagadEnabled] = useState(initialIsp.paymentGateways.nagadEnabled ?? true);
  const [nagadNumber, setNagadNumber] = useState(initialIsp.paymentGateways.nagadNumber || '01800-000000');
  const [nagadType, setNagadType] = useState<IspPaymentSettings['nagadType']>(initialIsp.paymentGateways.nagadType || 'Merchant');
  const [nagadInstructions, setNagadInstructions] = useState(
    initialIsp.paymentGateways.nagadInstructions ||
      'নগদ অ্যাপ বা *167# ডায়াল করে মার্চেন্ট পে করুন এবং রেফারেন্সে Customer ID লিখুন।'
  );

  const [rocketEnabled, setRocketEnabled] = useState(initialIsp.paymentGateways.rocketEnabled ?? true);
  const [rocketNumber, setRocketNumber] = useState(initialIsp.paymentGateways.rocketNumber || '01900-000000-8');
  const [bankDetails, setBankDetails] = useState(
    initialIsp.paymentGateways.bankDetails || 'Islami Bank Bangladesh / City Bank A/C: 2050392019482 (Branch: Corporate)'
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialIsp.paymentGateways.paymentInstructions ||
      'পেমেন্ট সম্পন্ন হওয়ার পর প্রাপ্ত Transaction ID (TrxID) সাবমিট করুন। লাইন তাৎক্ষণিক চালু হবে।'
  );

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // SMS Gateway Settings State
  const initialSms: IspSmsSettings = initialIsp.smsSettings || {
    enabled: true,
    gatewayType: 'FREE_BULK_SIMULATOR',
    senderIdOrApiKey: 'APEX-ISP',
    apiSecretOrUrl: 'https://api.sms-gateway.local/v1/send',
    androidDeviceIp: '192.168.1.150:8080',
    androidAuthKey: 'apex_secret_key_88',
    autoSendOnRecharge: true,
    autoSendOnExpiryWarning: true,
    autoSendOnAccountCreated: true,
    rechargeSmsTemplate:
      'প্রিয় {CUSTOMER_NAME}, আপনার {PACKAGE_NAME} ইন্টারনেট প্যাকেজ সফলভাবে রিচার্জ করা হয়েছে ({AMOUNT} ৳)। মেয়াদ: {EXPIRY_DATE} পর্যন্ত। এখন ওয়াইফাই কানেক্ট করে ব্যবহার করুন। ধন্যবাদ, {COMPANY_NAME}। হেল্পলাইন: {HELPLINE}',
    expiryWarningSmsTemplate:
      'প্রিয় {CUSTOMER_NAME}, আপনার ইন্টারনেট প্যাকেজের মেয়াদ {EXPIRY_DATE} তারিখে শেষ হবে। নিরবচ্ছিন্ন সেবার জন্য বিল পরিশোধ করুন। হেল্পলাইন: {HELPLINE}',
    welcomeSmsTemplate:
      'প্রিয় {CUSTOMER_NAME}, {COMPANY_NAME} এ স্বাগতম! আপনার ইন্টারনেট সক্রিয় হয়েছে। ইউজার: {USERNAME}। হেল্পলাইন: {HELPLINE}'
  };

  const [smsEnabled, setSmsEnabled] = useState(initialSms.enabled);
  const [smsGatewayType, setSmsGatewayType] = useState<SmsGatewayType>(initialSms.gatewayType);
  const [smsSenderIdOrApiKey, setSmsSenderIdOrApiKey] = useState(initialSms.senderIdOrApiKey || 'APEX-ISP');
  const [smsApiSecretOrUrl, setSmsApiSecretOrUrl] = useState(initialSms.apiSecretOrUrl || '');
  const [androidDeviceIp, setAndroidDeviceIp] = useState(initialSms.androidDeviceIp || '192.168.1.150:8080');
  const [androidAuthKey, setAndroidAuthKey] = useState(initialSms.androidAuthKey || 'apex_secret_key_88');
  const [autoSendOnRecharge, setAutoSendOnRecharge] = useState(initialSms.autoSendOnRecharge);
  const [autoSendOnExpiryWarning, setAutoSendOnExpiryWarning] = useState(initialSms.autoSendOnExpiryWarning);
  const [autoSendOnAccountCreated, setAutoSendOnAccountCreated] = useState(initialSms.autoSendOnAccountCreated);
  const [rechargeSmsTemplate, setRechargeSmsTemplate] = useState(initialSms.rechargeSmsTemplate);
  const [expiryWarningSmsTemplate, setExpiryWarningSmsTemplate] = useState(initialSms.expiryWarningSmsTemplate);
  const [welcomeSmsTemplate, setWelcomeSmsTemplate] = useState(initialSms.welcomeSmsTemplate);

  // SMS Test Sender State
  const [testMobile, setTestMobile] = useState('+8801700000000');
  const [testSending, setTestSending] = useState(false);
  const [smsLogs, setSmsLogs] = useState<SmsLogRecord[]>(state.smsLogs || []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestSmsSend = async (method: 'GATEWAY' | 'NATIVE_SMS' | 'WHATSAPP' = 'GATEWAY') => {
    if (!testMobile) {
      alert('অনুগ্রহ করে মোবাইল নাম্বার লিখুন।');
      return;
    }
    setTestSending(true);
    const smsService = SmsService.getInstance();
    const formatted = smsService.formatTemplate(rechargeSmsTemplate, {
      customerName: 'সম্মানিত টেস্ট গ্রাহক',
      packageName: '20 Mbps Unlimited Fiber',
      amount: 800,
      expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      companyName,
      helpline,
      username: 'test_client'
    });

    if (method === 'NATIVE_SMS') {
      smsService.openNativeSmsApp(testMobile, formatted);
      await smsService.sendSms({
        recipientMobile: testMobile,
        customerName: 'Test Client',
        messageText: formatted,
        gatewayOverride: 'NATIVE_DEVICE_SMS'
      });
      setStatusMessage(`ফোনের মেসেজ অ্যাপ খোলা হয়েছে! আপনার সিম সিলেক্ট করে সেন্ড বাটন চাপুন।`);
    } else if (method === 'WHATSAPP') {
      smsService.openWhatsApp(testMobile, formatted);
      await smsService.sendSms({
        recipientMobile: testMobile,
        customerName: 'Test Client',
        messageText: formatted,
        gatewayOverride: 'WHATSAPP_DIRECT'
      });
      setStatusMessage(`হোয়াটসঅ্যাপে মেসেজ পাঠানো শুরু হয়েছে!`);
    } else {
      const res = await smsService.sendSms({
        recipientMobile: testMobile,
        customerName: 'Test Client',
        messageText: formatted
      });
      setStatusMessage(`টেস্ট মেসেজ সফলভাবে প্রসেস করা হয়েছে (${testMobile})!`);
    }

    setTestSending(false);
    setSmsLogs(storage.getState().smsLogs || []);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: IspProfileSettings = {
      companyName,
      helpline,
      supportEmail,
      currencySymbol,
      autoSuspendOverdue,
      gracePeriodDays: Number(gracePeriodDays) || 3,
      paymentGateways: {
        bkashEnabled,
        bkashNumber,
        bkashType,
        bkashInstructions,
        nagadEnabled,
        nagadNumber,
        nagadType,
        nagadInstructions,
        rocketEnabled,
        rocketNumber,
        bankDetails,
        paymentInstructions
      },
      smsSettings: {
        enabled: smsEnabled,
        gatewayType: smsGatewayType,
        senderIdOrApiKey: smsSenderIdOrApiKey,
        apiSecretOrUrl: smsApiSecretOrUrl,
        androidDeviceIp,
        androidAuthKey,
        autoSendOnRecharge,
        autoSendOnExpiryWarning,
        autoSendOnAccountCreated,
        rechargeSmsTemplate,
        expiryWarningSmsTemplate,
        welcomeSmsTemplate
      }
    };

    storage.setState({
      ispSettings: updatedSettings
    });

    storage.logAudit(
      'Updated ISP Company, Payment & SMS Gateway Settings',
      'SYSTEM',
      'Settings',
      `Gateway: ${smsGatewayType}, Recharge SMS Auto: ${autoSendOnRecharge ? 'ON' : 'OFF'}`
    );

    setStatusMessage('বিকাশ, নগদ, বিলিং ও SMS গেটওয়ে সেটিংস সফলভাবে সেভ করা হয়েছে!');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleExportBackup = () => {
    const backupJson = storage.exportBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(backupJson);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `apex_isp_full_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setStatusMessage('System snapshot backup downloaded successfully.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const success = storage.importBackup(content);
      if (success) {
        setStatusMessage('System state successfully restored from backup snapshot!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert('Invalid backup JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all data to default factory seed state?')) {
      storage.resetToDefaults();
      setStatusMessage('Router reset to factory default state.');
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Settings, ISP Profile &amp; Payment Gateway Setup
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          বিকাশ/নগদ মার্চেন্ট নাম্বার পরিবর্তন, বিলিং নিয়মাবলি, গ্রাহক পোর্টাল পেমেন্ট ও ব্যাকআপ কনফিগারেশন।
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Mobile Banking / Payment Gateways Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Mobile Banking &amp; Payment Receiving Accounts (bKash / Nagad / Rocket)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                গ্রাহক যখন বিল পরিশোধ করবে বা প্যাকেজ কিনবে, তখন এই বিকাশ ও নগদ নাম্বারে টাকা পাঠাবে।
              </p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/20 text-xs transition active:scale-95 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Save Payment Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* bKash Configuration */}
            <div className="bg-slate-950/80 border border-pink-500/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-600/20 border border-pink-500/40 flex items-center justify-center font-bold text-pink-400 text-xs">
                    bK
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-pink-400">bKash (বিকাশ) Settings</h3>
                    <p className="text-[11px] text-slate-400">Personal, Agent or Merchant Number</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bkashEnabled}
                    onChange={e => setBkashEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    বিকাশ মোবাইল নাম্বার <span className="text-pink-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bkashNumber}
                      onChange={e => setBkashNumber(e.target.value)}
                      placeholder="01700-000000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:border-pink-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(bkashNumber, 'bkash')}
                      className="absolute right-2 top-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedField === 'bkash' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">একাউন্ট ধরণ (Account Type)</label>
                  <select
                    value={bkashType}
                    onChange={e => setBkashType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-pink-500 focus:outline-none"
                  >
                    <option value="Merchant">Merchant (Make Payment / মার্চেন্ট পে)</option>
                    <option value="Personal">Personal (Send Money / সেন্ড মানি)</option>
                    <option value="Agent">Agent (Cash Out / ক্যাশ আউট)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">গ্রাহকদের জন্য নির্দেশিকা (Instructions)</label>
                  <textarea
                    rows={2}
                    value={bkashInstructions}
                    onChange={e => setBkashInstructions(e.target.value)}
                    placeholder="পেমেন্ট করার নিয়মাবলী..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Nagad Configuration */}
            <div className="bg-slate-950/80 border border-orange-500/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center font-bold text-orange-400 text-xs">
                    নগদ
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-orange-400">Nagad (নগদ) Settings</h3>
                    <p className="text-[11px] text-slate-400">Personal or Merchant Number</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nagadEnabled}
                    onChange={e => setNagadEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    নগদ মোবাইল নাম্বার <span className="text-orange-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nagadNumber}
                      onChange={e => setNagadNumber(e.target.value)}
                      placeholder="01800-000000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(nagadNumber, 'nagad')}
                      className="absolute right-2 top-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedField === 'nagad' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">একাউন্ট ধরণ (Account Type)</label>
                  <select
                    value={nagadType}
                    onChange={e => setNagadType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Merchant">Merchant (মার্চেন্ট পে)</option>
                    <option value="Personal">Personal (সেন্ড মানি)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">গ্রাহকদের জন্য নির্দেশিকা (Instructions)</label>
                  <textarea
                    rows={2}
                    value={nagadInstructions}
                    onChange={e => setNagadInstructions(e.target.value)}
                    placeholder="নগদে পেমেন্ট করার নিয়ম..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rocket and Bank Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="bg-slate-950/80 border border-purple-500/20 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-purple-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  DBBL Rocket / Upay Number
                </h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rocketEnabled}
                    onChange={e => setRocketEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <input
                type="text"
                value={rocketNumber}
                onChange={e => setRocketNumber(e.target.value)}
                placeholder="01900-000000-8"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-4 space-y-3 text-xs">
              <h4 className="font-bold text-cyan-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Bank Account Details (ফর বড় বিল / কর্পোরেট)
              </h4>
              <input
                type="text"
                value={bankDetails}
                onChange={e => setBankDetails(e.target.value)}
                placeholder="Bank Name, A/C No, Branch"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Customer Notice & Instant Verification Info */}
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs space-y-1">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 shrink-0" />
              গ্রাহক পেমেন্ট ও অটো রিকানেক্ট প্রক্রিয়া:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              গ্রাহক যখন এই নাম্বারে বিকাশ বা নগদ দিয়ে পেমেন্ট করবে, তখন তার মোবাইল অ্যাপ থেকে প্রাপ্ত <strong>Transaction ID (TrxID)</strong> গ্রাহক পোর্টালে সাবমিট করলেই সিস্টেম যাচাই করে স্বয়ংক্রিয়ভাবে তার ইন্টারনেট লাইন পুনরায় চালু করে দেবে।
            </p>
          </div>
        </div>

        {/* Company Branding & Currency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" />
            ISP Company Profile &amp; Billing Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company / Brand Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Helpline Phone Number</label>
              <input
                type="text"
                value={helpline}
                onChange={e => setHelpline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">System Currency</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={e => setCurrencySymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Grace Period (Days Before Line Cut)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={gracePeriodDays}
                  onChange={e => setGracePeriodDays(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={autoSuspendOverdue}
                onChange={e => setAutoSuspendOverdue(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <span className="text-slate-200 font-medium block">
                  Automatic Service Suspension for Overdue Accounts
                </span>
                <span className="text-slate-400 text-[11px]">
                  বিল পরিশোধ না করলে গ্রেস পিরিয়ড শেষ হওয়ার পর স্বয়ংক্রিয়ভাবে লিনাক্স ফায়ারওয়াল ব্লক রুল প্রয়োগ করবে।
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-600/20 text-xs transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Company &amp; Billing Settings</span>
            </button>
          </div>
        </div>

        {/* SMS Notification & Free Gateway Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                ক্লায়েন্ট SMS নোটিফিকেশন ও গেটওয়ে কনফিগারেশন (SMS Gateway &amp; Auto-Alerts)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                রিচার্জ বা পেমেন্ট অনুমোদনের পর ক্লায়েন্টের মোবাইল নাম্বারে ফ্রি অথবা নিজস্ব গেটওয়ে দিয়ে স্বয়ংক্রিয় SMS প্রেরণ।
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={e => setSmsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-600/20 text-xs transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save SMS Settings</span>
              </button>
            </div>
          </div>

          {/* Gateway Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              onClick={() => setSmsGatewayType('FREE_BULK_SIMULATOR')}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                smsGatewayType === 'FREE_BULK_SIMULATOR'
                  ? 'bg-cyan-950/40 border-cyan-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-cyan-400">
                  <Zap className="w-4 h-4" />
                  Free In-App Gateway (ডিফল্ট)
                </span>
                {smsGatewayType === 'FREE_BULK_SIMULATOR' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                কোনো চার্জ ছাড়া সফটওয়্যারের নিজস্ব ভার্চুয়াল গেটওয়ে দিয়ে তাৎক্ষণিক মেসেজ প্রেরণ ও লগ ট্র্যাকিং।
              </p>
            </div>

            <div
              onClick={() => setSmsGatewayType('ANDROID_SMS_GATEWAY')}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                smsGatewayType === 'ANDROID_SMS_GATEWAY'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  Free Android Phone SIM (ফ্রি)
                </span>
                {smsGatewayType === 'ANDROID_SMS_GATEWAY' && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                আপনার স্মার্টফোনের আনলিমিটেড SMS বান্ডেল ব্যবহার করে সম্পূর্ণ বিনামূল্যে ক্লায়েন্টের সিমে SMS যাবে।
              </p>
            </div>

            <div
              onClick={() => setSmsGatewayType('BULKSMSBD')}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                smsGatewayType === 'BULKSMSBD' || smsGatewayType === 'ONNOKROK_SMS'
                  ? 'bg-indigo-950/40 border-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-400">
                  <Radio className="w-4 h-4" />
                  Bangladeshi Bulk API
                </span>
                {(smsGatewayType === 'BULKSMSBD' || smsGatewayType === 'ONNOKROK_SMS') && (
                  <Check className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                BulkSMSBD / Onnorokom / Greenweb মাস্কিং বা নন-মাস্কিং API কি দিয়ে সরাসরি মেসেজ।
              </p>
            </div>
          </div>

          {/* Android Free SIM Gateway Setup Guide */}
          {smsGatewayType === 'ANDROID_SMS_GATEWAY' && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Smartphone className="w-4 h-4" />
                স্মার্টফোন দিয়ে ফ্রি SMS পাঠানোর নিয়ম (Android SIM Gateway)
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                <li>আপনার যেকোনো অ্যান্ড্রয়েড ফোনে <strong>"SMS Gateway"</strong> বা <strong>"SMS Forwarder"</strong> অ্যাপ ইনস্টল করুন।</li>
                <li>ফোনে যেকোনো বাংলালিংক/গ্রামীন/রবি সিমে SMS প্যাক রিচার্জ করুন (যেমন ৩০ টাকায় ১০০০ SMS বা আনলিমিটেড বান্ডেল)।</li>
                <li>অ্যাপটি ওপেন করে নিচে ফোনের লোকাল IP ও Port লিখুন (যেমন: <code>192.168.1.150:8080</code>)।</li>
                <li>এখন থেকে সফটওয়্যার থেকে যেকোনো ক্লায়েন্ট রিচার্জ হলে স্বয়ংক্রিয়ভাবে আপনার ফোনের সিম থেকে ক্লায়েন্টের নাম্বারে মেসেজ চলে যাবে।</li>
              </ol>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Android Phone Local IP &amp; Port</label>
                  <input
                    type="text"
                    value={androidDeviceIp}
                    onChange={e => setAndroidDeviceIp(e.target.value)}
                    placeholder="192.168.1.150:8080"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Security / Gateway Token</label>
                  <input
                    type="text"
                    value={androidAuthKey}
                    onChange={e => setAndroidAuthKey(e.target.value)}
                    placeholder="apex_secret_key_88"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bulk API Details */}
          {(smsGatewayType === 'BULKSMSBD' || smsGatewayType === 'ONNOKROK_SMS' || smsGatewayType === 'CUSTOM_API') && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sender ID / Mask Name / API Key</label>
                  <input
                    type="text"
                    value={smsSenderIdOrApiKey}
                    onChange={e => setSmsSenderIdOrApiKey(e.target.value)}
                    placeholder="e.g. APEX-ISP or api_key_xyz"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">API Secret / Endpoint URL</label>
                  <input
                    type="text"
                    value={smsApiSecretOrUrl}
                    onChange={e => setSmsApiSecretOrUrl(e.target.value)}
                    placeholder="https://api.bulksmsbd.com/send or secret"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Auto Trigger Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={autoSendOnRecharge}
                onChange={e => setAutoSendOnRecharge(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <span className="text-slate-200 font-semibold block">রিচার্জ হলে সাথে সাথে SMS</span>
                <span className="text-slate-400 text-[10px]">পেমেন্ট অ্যাপ্রুভ বা রিচার্জে কনফার্মেশন পাঠাবে</span>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={autoSendOnExpiryWarning}
                onChange={e => setAutoSendOnExpiryWarning(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <span className="text-slate-200 font-semibold block">বিল এক্সপায়ারি সতর্কতা SMS</span>
                <span className="text-slate-400 text-[10px]">লাইন কাটার ২ দিন পূর্বে অটো রিমাইন্ডার</span>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={autoSendOnAccountCreated}
                onChange={e => setAutoSendOnAccountCreated(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <span className="text-slate-200 font-semibold block">নতুন সংযোগে ওয়েলকাম SMS</span>
                <span className="text-slate-400 text-[10px]">ইউজার আইডি ও পাসওয়ার্ডসহ মেসেজ</span>
              </div>
            </label>
          </div>

          {/* SMS Templates Editor */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>মেসেজ টেমপ্লেট কাস্টমাইজেশন (বাংলা ও ভ্যারিয়েবল সাপোর্ট)</span>
              <span className="text-[10px] text-cyan-400 normal-case font-mono">
                Variables: {'{CUSTOMER_NAME}'}, {'{PACKAGE_NAME}'}, {'{AMOUNT}'}, {'{EXPIRY_DATE}'}, {'{COMPANY_NAME}'}, {'{HELPLINE}'}
              </span>
            </h3>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                রিচার্জ কনফার্মেশন SMS মেসেজ টেমপ্লেট:
              </label>
              <textarea
                rows={3}
                value={rechargeSmsTemplate}
                onChange={e => setRechargeSmsTemplate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Live SMS Testing Console & History */}
          <div className="bg-slate-950/90 border border-cyan-500/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  টেস্ট SMS পাঠান ও ডেলিভারি মোড (Live Test Dispatcher)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Active Gateway: <strong className="text-cyan-400">{smsGatewayType}</strong>
              </span>
            </div>

            {/* Direct Delivery Guide Callout */}
            <div className="p-3 bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 rounded-lg text-xs space-y-2">
              <span className="font-bold text-blue-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                সরাসরি গ্রাহকের বাস্তব সিম/মোবাইলে মেসেজ পাঠানোর উপায়:
              </span>
              <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside font-sans">
                <li><strong className="text-white">১. মোবাইলের মেসেজ অ্যাপ দিয়ে (১০০% ফ্রি):</strong> নিচের <strong>"📱 ফোনের মেসেজ অ্যাপে টেস্ট"</strong> বাটনে চাপ দিলে আপনার ডিভাইসের ডিফল্ট SMS অ্যাপ খুলে যাবে এবং সরাসরি আপনার সিম দিয়ে মেসেজ চলে যাবে।</li>
                <li><strong className="text-white">২. ফ্রি অ্যান্ডয়েড সিম গেটওয়ে:</strong> আপনার দোকানে রাখা কোনো অ্যান্ড্রয়েড ফোনে <em>SMS Gateway</em> অ্যাপ চালু করে লোকাল আইপি বসালে সফটওয়্যার একা একাই ওই সিম দিয়ে অটো মেসেজ ছাড়বে।</li>
                <li><strong className="text-white">৩. BulkSMSBD / Greenweb API:</strong> তাদের ওয়েবসাইট থেকে API Key এনে বসালে সম্পূর্ণ স্বয়ংক্রিয়ভাবে সরাসরি গ্রাহকের ফোনে এসএমএস পৌঁছে যাবে।</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={testMobile}
                onChange={e => setTestMobile(e.target.value)}
                placeholder="+8801700000000"
                className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleTestSmsSend('NATIVE_SMS')}
                  disabled={testSending}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow-md shadow-blue-600/20 transition active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
                  <span>📱 ফোনের মেসেজ অ্যাপে টেস্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTestSmsSend('WHATSAPP')}
                  disabled={testSending}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-600/20 transition active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-200" />
                  <span>💬 WhatsApp টেস্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTestSmsSend('GATEWAY')}
                  disabled={testSending}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-md shadow-cyan-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{testSending ? 'Sending...' : '⚡ গেটওয়ে টেস্ট'}</span>
                </button>
              </div>
            </div>

            {/* Outbox Logs Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <List className="w-3.5 h-3.5 text-cyan-400" />
                সাম্প্রতিক পাঠানো SMS লগ (Recent Sent Outbox Logs):
              </h4>
              <div className="max-h-44 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {smsLogs.length === 0 ? (
                  <p className="text-slate-500 text-xs py-2">কোনো মেসেজ লগ এখনো নেই।</p>
                ) : (
                  smsLogs.slice(0, 5).map(log => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{log.customerName}</span>
                          <span className="text-cyan-400 font-mono text-[11px]">{log.recipientMobile}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold">
                            {log.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-1">{log.messageText}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-slate-500 font-mono text-[10px] block">{log.sentAt}</span>
                        <span className="text-emerald-400 text-[10px] font-mono">{log.cost}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Linux Engine Daemon Health Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Linux Virtual Router Engine Daemons (systemd)
          </h2>
          <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            All 6 Daemons Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          {[
            { name: 'Kernel IPv4 Forwarding', desc: 'sysctl net.ipv4.ip_forward=1', status: 'ACTIVE' },
            { name: 'accel-ppp.service', desc: 'High-speed PPPoE Server Daemon', status: 'ACTIVE' },
            { name: 'nftables.service', desc: 'Kernel Packet Filter & NAT engine', status: 'ACTIVE' },
            { name: 'tc-htb-qos.service', desc: 'Traffic Shaping & FQ_Codel QoS', status: 'ACTIVE' },
            { name: 'kea-dhcp4.service', desc: 'DHCP IP Address Allocation', status: 'ACTIVE' },
            { name: 'freeradius.service', desc: 'RADIUS AAA & Subscriber Accounting', status: 'ACTIVE' }
          ].map((d, i) => (
            <div key={i} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-slate-200 text-[11px] font-sans">{d.name}</strong>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {d.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Backup, Restore & Reset */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          State Persistence, JSON Backup &amp; Disaster Recovery
        </h2>
        <p className="text-slate-400">
          Export full router configuration, subscriber credentials, billing invoices, and payment histories to a portable JSON file.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-md shadow-cyan-600/20 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download System Snapshot</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 cursor-pointer transition">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Restore Backup JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-bold rounded-lg transition active:scale-95 ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Factory Seeds</span>
          </button>
        </div>
      </div>
    </div>
  );
};
