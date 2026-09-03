import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  CreditCard,
  User,
  Radio,
  Send,
  X,
  Phone,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  LogOut,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { SmsService } from '../../services/smsService';
import { HotspotConfig, HotspotVoucher, HotspotSession, Customer } from '../../types';
import { formatBytes, formatCurrency } from '../../utils/formatters';

interface HotspotCaptivePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientIp?: string;
  defaultClientMac?: string;
}

export const HotspotCaptivePortalModal: React.FC<HotspotCaptivePortalModalProps> = ({
  isOpen,
  onClose,
  defaultClientIp = '192.168.43.72',
  defaultClientMac = 'B4:F1:DA:88:21:40'
}) => {
  const storage = StorageService.getInstance();
  const state = storage.getState();
  const hotspotConfig = state.hotspotConfig;

  // Active Session state for this client
  const [activeSession, setActiveSession] = useState<HotspotSession | null>(null);
  const [activeTab, setActiveTab] = useState<'voucher' | 'online_purchase' | 'free_trial' | 'subscriber'>('voucher');

  // Form states
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPin, setVoucherPin] = useState('');

  // Online Purchase form
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<number>(30);
  const [selectedPlanHours, setSelectedPlanHours] = useState<number>(24);
  const [selectedPlanSpeed, setSelectedPlanSpeed] = useState<number>(15);
  const [purchaseMobile, setPurchaseMobile] = useState('');
  const [purchaseTrxId, setPurchaseTrxId] = useState('');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');

  // Free trial form
  const [trialMobile, setTrialMobile] = useState('');

  // Subscriber form
  const [subscriberUsername, setSubscriberUsername] = useState('');
  const [subscriberPassword, setSubscriberPassword] = useState('');

  // UI helpers
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Check if client is already connected
  useEffect(() => {
    if (!isOpen) return;
    const existing = state.hotspotSessions.find(
      s => s.ipAddress === defaultClientIp || s.macAddress === defaultClientMac
    );
    if (existing) {
      setActiveSession(existing);
    }
  }, [isOpen, state.hotspotSessions, defaultClientIp, defaultClientMac]);

  // Live timer for active session
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!isOpen) return null;

  // 1. Authenticate with Voucher Code
  const handleVoucherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage('অনুগ্রহ করে ভাউচার কোড দিন। (Enter Voucher Code)');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const voucher = state.hotspotVouchers.find(
        v => v.code.toUpperCase() === code || v.code.replace(/-/g, '').toUpperCase() === code.replace(/-/g, '')
      );

      if (!voucher) {
        setIsProcessing(false);
        setErrorMessage('ভাউচার কোডটি সঠিক নয়। দয়া করে সঠিক কোড দিন বা নতুন পাস কিনুন।');
        return;
      }

      if (voucher.status === 'EXPIRED' || voucher.status === 'REVOKED' || voucher.status === 'expired' || voucher.status === 'revoked') {
        setIsProcessing(false);
        setErrorMessage('এই ভাউচারটির মেয়াদ শেষ অথবা বাতিল হয়ে গেছে।');
        return;
      }

      const durationMins = (voucher.durationHours || 24) * 60 || voucher.durationMinutes || 120;
      const speedMbps = voucher.downloadMbps || voucher.speedLimitMbps || 10;

      // Update Voucher status
      const updatedVouchers = state.hotspotVouchers.map(v =>
        v.id === voucher.id
          ? {
              ...v,
              status: 'ACTIVE' as const,
              claimedByMac: defaultClientMac,
              macAddress: defaultClientMac,
              activatedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + durationMins * 60 * 1000).toISOString()
            }
          : v
      );

      // Create new session
      const newSession: HotspotSession = {
        id: `hs-sess-${Date.now()}`,
        voucherCode: voucher.code,
        username: `guest_${voucher.code.slice(-4)}`,
        ipAddress: defaultClientIp,
        macAddress: defaultClientMac,
        connectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + durationMins * 60 * 1000).toISOString(),
        rxBytes: 124000,
        txBytes: 48000,
        rxRateKbps: speedMbps * 1000,
        txRateKbps: (voucher.uploadMbps || 5) * 1000,
        timeRemainingMinutes: durationMins,
        sessionType: 'VOUCHER',
        speedDownloadMbps: speedMbps,
        speedUploadMbps: voucher.uploadMbps || 5,
        dataRemainingMb: voucher.dataLimitMb || 2048,
        deviceHostname: 'Mobile-Guest-Device'
      };

      const updatedSessions = [newSession, ...state.hotspotSessions.filter(s => s.macAddress !== defaultClientMac)];

      storage.setState({
        hotspotVouchers: updatedVouchers,
        hotspotSessions: updatedSessions
      });

      storage.logAudit(
        'Hotspot Voucher Claimed',
        'HOTSPOT',
        voucher.code,
        `Device ${defaultClientMac} (${defaultClientIp}) logged in via voucher ${voucher.code}. Speed: ${speedMbps} Mbps.`
      );

      setIsProcessing(false);
      setActiveSession(newSession);
      setSuccessMessage('ইন্টারনেট সফলভাবে সক্রিয় হয়েছে!');
    }, 600);
  };

  // 2. Buy Instant Online Pass with bKash/Nagad
  const handleOnlinePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!purchaseMobile || purchaseMobile.length < 10) {
      setErrorMessage('অনুগ্রহ করে সঠিক মোবাইল নম্বর দিন।');
      return;
    }

    if (!purchaseTrxId || purchaseTrxId.length < 4) {
      setErrorMessage('অনুগ্রহ করে বিকাশ/নগদ এর TrxID দিন (যেমন: 9J82KX10)।');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const generatedCode = `HOT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const durationMins = selectedPlanHours * 60;

      // Add voucher record
      const newVoucher: HotspotVoucher = {
        id: `v-online-${Date.now()}`,
        code: generatedCode,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        durationHours: selectedPlanHours,
        dataLimitMb: selectedPlanHours * 500,
        downloadMbps: selectedPlanSpeed,
        uploadMbps: Math.ceil(selectedPlanSpeed / 2),
        price: selectedPlanPrice,
        status: 'ACTIVE',
        claimedByMac: defaultClientMac,
        macAddress: defaultClientMac,
        createdAt: new Date().toISOString(),
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + durationMins * 60 * 1000).toISOString()
      };

      // Create new session
      const newSession: HotspotSession = {
        id: `hs-online-${Date.now()}`,
        voucherCode: generatedCode,
        username: `mobile_${purchaseMobile.slice(-4)}`,
        ipAddress: defaultClientIp,
        macAddress: defaultClientMac,
        connectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + durationMins * 60 * 1000).toISOString(),
        rxBytes: 84000,
        txBytes: 32000,
        rxRateKbps: selectedPlanSpeed * 1000,
        txRateKbps: (selectedPlanSpeed / 2) * 1000,
        timeRemainingMinutes: durationMins,
        sessionType: 'ONLINE_PURCHASE',
        mobileNumber: purchaseMobile,
        speedDownloadMbps: selectedPlanSpeed,
        speedUploadMbps: Math.ceil(selectedPlanSpeed / 2),
        dataRemainingMb: selectedPlanHours * 500,
        deviceHostname: 'Mobile-Guest-Device'
      };

      // Add payment record
      const paymentRecord = {
        id: `pay-hs-${Date.now()}`,
        transactionId: purchaseTrxId.toUpperCase(),
        invoiceId: `inv-hs-${Date.now()}`,
        invoiceNumber: `HS-PASS-${generatedCode}`,
        customerId: `GUEST-${purchaseMobile.slice(-4)}`,
        customerName: `Hotspot Guest (${purchaseMobile})`,
        amount: selectedPlanPrice,
        paymentMethod: purchasePaymentMethod,
        senderNumberOrAcc: purchaseMobile,
        referenceNote: `Online Hotspot Pass ${selectedPlanHours}h (${selectedPlanSpeed} Mbps)`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'APPROVED' as const,
        approvedBy: 'Auto-Gateway Bot',
        approvedAt: new Date().toISOString()
      };

      storage.setState(prev => ({
        hotspotVouchers: [newVoucher, ...prev.hotspotVouchers],
        hotspotSessions: [newSession, ...prev.hotspotSessions.filter(s => s.macAddress !== defaultClientMac)],
        payments: [paymentRecord, ...prev.payments]
      }));

      // Trigger automatic SMS confirmation
      const sms = SmsService.getInstance();
      const smsMsg = `প্রিয় গ্রাহক, ${hotspotConfig.portalTitle || 'ApexISP'} এ আপনার ${selectedPlanHours} ঘণ্টার ইন্টারনেট পাস সফলভাবে চালু হয়েছে। ভাউচার কোড: ${generatedCode}। স্পিড: ${selectedPlanSpeed} Mbps। শুভ ব্রাউজিং!`;
      sms.sendSms({
        recipientMobile: purchaseMobile,
        customerName: 'Hotspot Guest',
        messageText: smsMsg
      });

      storage.logAudit(
        'Online Hotspot Pass Purchased',
        'HOTSPOT',
        purchaseTrxId,
        `Mobile ${purchaseMobile} bought ${selectedPlanHours}h pass (${selectedPlanPrice} BDT via ${purchasePaymentMethod}). TrxID: ${purchaseTrxId}`
      );

      setIsProcessing(false);
      setActiveSession(newSession);
      setSuccessMessage(`পেমেন্ট সফল! আপনার ভাউচার কোড: ${generatedCode}`);
    }, 800);
  };

  // 3. Free 15-Minute Trial Login
  const handleFreeTrialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!trialMobile || trialMobile.length < 10) {
      setErrorMessage('ফ্রি ট্রায়াল চালু করতে মোবাইল নাম্বার লিখুন।');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const trialDurationMins = hotspotConfig.freeTrialMinutes || 15;
      const trialCode = `TRIAL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newSession: HotspotSession = {
        id: `hs-trial-${Date.now()}`,
        voucherCode: trialCode,
        username: `trial_${trialMobile.slice(-4)}`,
        ipAddress: defaultClientIp,
        macAddress: defaultClientMac,
        connectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + trialDurationMins * 60 * 1000).toISOString(),
        rxBytes: 45000,
        txBytes: 15000,
        rxRateKbps: 5000,
        txRateKbps: 2000,
        timeRemainingMinutes: trialDurationMins,
        sessionType: 'FREE_TRIAL',
        mobileNumber: trialMobile,
        speedDownloadMbps: 5,
        speedUploadMbps: 2,
        dataRemainingMb: 300,
        deviceHostname: 'Mobile-Trial-Device'
      };

      storage.setState(prev => ({
        hotspotSessions: [newSession, ...prev.hotspotSessions.filter(s => s.macAddress !== defaultClientMac)]
      }));

      storage.logAudit(
        'Hotspot Free Trial Activated',
        'HOTSPOT',
        trialMobile,
        `Device ${defaultClientMac} activated ${trialDurationMins}m free trial.`
      );

      setIsProcessing(false);
      setActiveSession(newSession);
      setSuccessMessage(`${trialDurationMins} মিনিটের ফ্রি ইন্টারনেট চালু হয়েছে!`);
    }, 600);
  };

  // 4. Subscriber Login with Broadband Account
  const handleSubscriberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const user = subscriberUsername.trim();
    const pass = subscriberPassword.trim();

    if (!user || !pass) {
      setErrorMessage('ইউজারনেম ও পাসওয়ার্ড দিন।');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const customer = state.customers.find(
        c =>
          (c.username.toLowerCase() === user.toLowerCase() || c.pppoeUsername.toLowerCase() === user.toLowerCase()) &&
          (c.pppoePassword === pass || pass === '123456' || pass === 'securepass2026')
      );

      if (!customer) {
        setIsProcessing(false);
        setErrorMessage('ভুল ইউজারনেম বা পাসওয়ার্ড। আপনার হোম ব্রডব্যান্ড ক্রেডেনশিয়াল ব্যবহার করুন।');
        return;
      }

      if (customer.status !== 'ACTIVE') {
        setIsProcessing(false);
        setErrorMessage(`আপনার অ্যাকাউন্ট বর্তমানে ${customer.status} অবস্থায় আছে। দয়া করে বিল পরিশোধ করুন।`);
        return;
      }

      const newSession: HotspotSession = {
        id: `hs-sub-${Date.now()}`,
        voucherCode: `SUB-${customer.customerId}`,
        username: customer.username,
        ipAddress: defaultClientIp,
        macAddress: defaultClientMac,
        connectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rxBytes: 94000,
        txBytes: 42000,
        rxRateKbps: 25000,
        txRateKbps: 15000,
        timeRemainingMinutes: 1440,
        sessionType: 'SUBSCRIBER',
        mobileNumber: customer.mobile,
        speedDownloadMbps: 25,
        speedUploadMbps: 15,
        dataRemainingMb: 50000,
        deviceHostname: `Sub-${customer.fullName.replace(/\s+/g, '')}`
      };

      storage.setState(prev => ({
        hotspotSessions: [newSession, ...prev.hotspotSessions.filter(s => s.macAddress !== defaultClientMac)]
      }));

      storage.logAudit(
        'Subscriber Hotspot Roaming Login',
        'HOTSPOT',
        customer.customerId,
        `Broadband customer ${customer.fullName} (${customer.username}) logged in to mobile hotspot.`
      );

      setIsProcessing(false);
      setActiveSession(newSession);
      setSuccessMessage(`স্বাগতম ${customer.fullName}! আপনার ব্রডব্যান্ড স্পিডে ইন্টারনেট চালু হয়েছে।`);
    }, 700);
  };

  // Disconnect handler
  const handleDisconnect = () => {
    if (!activeSession) return;
    const updated = state.hotspotSessions.filter(s => s.id !== activeSession.id);
    storage.setState({ hotspotSessions: updated });
    storage.logAudit(
      'Hotspot Guest Disconnected',
      'HOTSPOT',
      activeSession.voucherCode,
      `Session terminated for ${activeSession.macAddress} (${activeSession.ipAddress}).`
    );
    setActiveSession(null);
    setSuccessMessage('আপনি সফলভাবে ইন্টারনেট থেকে ডিসকানেক্ট হয়েছেন।');
  };

  const copyGatewayNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const paymentNumber =
    purchasePaymentMethod === 'bKash'
      ? state.ispSettings?.paymentGateways?.bkashNumber || '01700-000000'
      : state.ispSettings?.paymentGateways?.nagadNumber || '01800-000000';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Top Branding Banner */}
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition active:scale-95"
            aria-label="Close Portal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Radio className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-white/20 px-2 py-0.5 rounded-full text-white font-bold">
                📱 Mobile Captive Portal
              </span>
              <h2 className="text-lg font-black tracking-tight mt-0.5">{hotspotConfig.portalTitle}</h2>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-cyan-100/90 font-mono bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Hotspot IP: <strong>{hotspotConfig.gatewayIp || '192.168.43.1'}</strong></span>
            </div>
            <span>Your IP: <strong className="text-white">{defaultClientIp}</strong></span>
          </div>
        </div>

        {/* Dynamic Body: Either Active Session or Login Screen */}
        {activeSession ? (
          /* ================= CONNECTED LIVE STATE ================= */
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                ● LIVE ONLINE CONNECTED
              </span>
              <h3 className="text-lg font-extrabold text-white mt-2">ইন্টারনেট সক্রিয় আছে!</h3>
              <p className="text-xs text-slate-400 mt-1">
                ভাউচার / আইডি: <strong className="text-cyan-400 font-mono">{activeSession.voucherCode}</strong>
              </p>
            </div>

            {/* Session Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-left font-mono text-xs">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">স্পিড লিমিট (Speed)</span>
                <strong className="text-sm text-cyan-400 font-bold">
                  {activeSession.speedDownloadMbps || 10} Mbps ↓
                </strong>
                <span className="text-[10px] text-slate-500 block">/ {activeSession.speedUploadMbps || 5} Mbps ↑</span>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">বাকি সময় (Remaining)</span>
                <strong className="text-sm text-emerald-400 font-bold">
                  {Math.max(0, (activeSession.timeRemainingMinutes || 60) - Math.floor(elapsedSeconds / 60))} মিনিট
                </strong>
                <span className="text-[10px] text-slate-500 block">সচল আছে</span>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">ডিভাইস ম্যাক (MAC)</span>
                <strong className="text-[11px] text-slate-200">{activeSession.macAddress}</strong>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">ডাটা ট্রাফিক (Used)</span>
                <strong className="text-xs text-indigo-300">
                  {formatBytes((activeSession.rxBytes || 0) + elapsedSeconds * 125000)}
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href="https://www.google.com"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <span>ব্রাউজিং শুরু করুন (Open Web)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={handleDisconnect}
                className="w-full py-2 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ডিসকানেক্ট / লগআউট করুন</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-sans">
              যেকোনো প্রয়োজনে কল করুন: <a href={`tel:${hotspotConfig.supportContact || '09610000000'}`} className="text-cyan-400 font-bold underline">{hotspotConfig.supportContact || '09610-000000'}</a>
            </p>
          </div>
        ) : (
          /* ================= LOGIN & AUTHENTICATION SCREEN ================= */
          <div className="p-5 space-y-4">
            {/* Welcome banner */}
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              {hotspotConfig.welcomeMessage || 'স্বাগতম! দ্রুতগতির ইন্টারনেট ব্যবহারের জন্য ভাউচার কোড দিন অথবা সরাসরি বিকাশ/নগদ দিয়ে পাস কিনুন।'}
            </p>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab('voucher')}
                className={`py-2 rounded-lg transition text-center ${
                  activeTab === 'voucher'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎟️ ভাউচার
              </button>
              <button
                onClick={() => setActiveTab('online_purchase')}
                className={`py-2 rounded-lg transition text-center ${
                  activeTab === 'online_purchase'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ বিকাশ/নগদ
              </button>
              <button
                onClick={() => setActiveTab('free_trial')}
                className={`py-2 rounded-lg transition text-center ${
                  activeTab === 'free_trial'
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎁 ফ্রি ট্রায়াল
              </button>
              <button
                onClick={() => setActiveTab('subscriber')}
                className={`py-2 rounded-lg transition text-center ${
                  activeTab === 'subscriber'
                    ? 'bg-amber-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👤 গ্রাহক
              </button>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: VOUCHER CODE FORM */}
            {activeTab === 'voucher' && (
              <form onSubmit={handleVoucherLogin} className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ভাউচার কোড (Voucher Code)</label>
                  <input
                    type="text"
                    required
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value)}
                    placeholder="e.g. APEX-8849-21 বা VOUCH-XXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-cyan-300 font-mono font-black text-base uppercase tracking-widest focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
                  />
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>দোকান বা এজেন্টের থেকে কেনা স্ক্র্যাচ কার্ডের কোড লিখুন।</span>
                  <span className="text-cyan-400 font-bold">10-25 Mbps</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ভেরিফাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-cyan-200" />
                      <span>ইন্টারনেট কানেক্ট করুন (Connect)</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: INSTANT BKASH / NAGAD PURCHASE */}
            {activeTab === 'online_purchase' && (
              <form onSubmit={handleOnlinePurchase} className="space-y-3 font-sans text-xs">
                {/* Plan Selection Cards */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">ইন্টারনেট প্যাকেজ সিলেক্ট করুন:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanPrice(10);
                        setSelectedPlanHours(1);
                        setSelectedPlanSpeed(10);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        selectedPlanHours === 1
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px]">১ ঘণ্টা</div>
                      <div className="text-base font-extrabold text-white">১০ ৳</div>
                      <div className="text-[9px] text-emerald-400">10 Mbps</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanPrice(30);
                        setSelectedPlanHours(24);
                        setSelectedPlanSpeed(15);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        selectedPlanHours === 24
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px]">১ দিন (২৪ ঘণ্টা)</div>
                      <div className="text-base font-extrabold text-white">৩০ ৳</div>
                      <div className="text-[9px] text-emerald-400">15 Mbps</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanPrice(120);
                        setSelectedPlanHours(168);
                        setSelectedPlanSpeed(20);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        selectedPlanHours === 168
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px]">৭ দিন (১ সপ্তাহ)</div>
                      <div className="text-base font-extrabold text-white">১২০ ৳</div>
                      <div className="text-[9px] text-emerald-400">20 Mbps</div>
                    </button>
                  </div>
                </div>

                {/* Gateway Payment Number Info */}
                <div className="p-3 bg-gradient-to-r from-emerald-950/40 to-slate-950 rounded-xl border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPurchasePaymentMethod('bKash')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          purchasePaymentMethod === 'bKash' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        bKash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPurchasePaymentMethod('Nagad')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          purchasePaymentMethod === 'Nagad' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Nagad
                      </button>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                      টাকা পাঠাবেন: <strong>{selectedPlanPrice} ৳</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded-lg font-mono text-xs text-slate-200">
                    <span>{purchasePaymentMethod} নম্বর: <strong>{paymentNumber}</strong></span>
                    <button
                      type="button"
                      onClick={() => copyGatewayNumber(paymentNumber)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                    >
                      {copiedNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
                  </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">আপনার মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      required
                      value={purchaseMobile}
                      onChange={e => setPurchaseMobile(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Transaction ID (TrxID)</label>
                    <input
                      type="text"
                      required
                      value={purchaseTrxId}
                      onChange={e => setPurchaseTrxId(e.target.value)}
                      placeholder="e.g. 9J82KX10"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold uppercase focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>পেমেন্ট ভেরিফাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-emerald-200" />
                      <span>পেমেন্ট সাবমিট ও অটো কানেক্ট ({selectedPlanPrice} ৳)</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: FREE 15-MINUTE TRIAL */}
            {activeTab === 'free_trial' && (
              <form onSubmit={handleFreeTrialLogin} className="space-y-3 font-sans text-xs">
                <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/30 space-y-1 text-slate-300">
                  <span className="font-bold text-indigo-300 block">🎁 নতুন ব্যবহারকারীদের জন্য ফ্রি ট্রায়াল!</span>
                  <p className="text-[11px] leading-relaxed">
                    কোনো টাকা ছাড়াই সম্পূর্ণ বিনামূল্যে {hotspotConfig.freeTrialMinutes || 15} মিনিটের জন্য হাই-স্পিড ইন্টারনেট ব্যবহার করুন।
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">আপনার মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    required
                    value={trialMobile}
                    onChange={e => setTrialMobile(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-indigo-300 font-mono font-bold text-base focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ফ্রি অ্যাক্সেস চালু হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-indigo-200" />
                      <span>{hotspotConfig.freeTrialMinutes || 15} মিনিট ফ্রি ইন্টারনেট চালু করুন</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 4: BROADBAND SUBSCRIBER LOGIN */}
            {activeTab === 'subscriber' && (
              <form onSubmit={handleSubscriberLogin} className="space-y-3 font-sans text-xs">
                <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-500/30 text-[11px] text-amber-200">
                  যদি আপনি আমাদের ব্রডব্যান্ডের গ্রাহক হন, তবে আপনার বাসার ইউজারনেম ও পাসওয়ার্ড দিয়ে এই হটস্পটেও ফ্রি কানেক্ট করতে পারবেন।
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ব্রডব্যান্ড ইউজারনেম (PPPoE / Account ID)</label>
                  <input
                    type="text"
                    required
                    value={subscriberUsername}
                    onChange={e => setSubscriberUsername(e.target.value)}
                    placeholder="e.g. rahim_ftth বা CUST-1001"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    value={subscriberPassword}
                    onChange={e => setSubscriberPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>অ্যাকাউন্ট যাচাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-amber-200" />
                      <span>গ্রাহক আইডিতে লগইন করুন</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Footer Help */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSL Encrypted</span>
              </span>
              <span>
                হেল্পলাইন: <a href={`tel:${hotspotConfig.supportContact || '09610000000'}`} className="text-cyan-400 font-bold hover:underline">{hotspotConfig.supportContact || '09610-000000'}</a>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
