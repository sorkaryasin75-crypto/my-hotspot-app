import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  Signal,
  CheckCircle2,
  Lock,
  RefreshCw,
  Info,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  BellRing,
  Share2,
  Radio,
  Zap,
  ChevronRight,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { SmsService } from '../../../services/smsService';

interface WifiScannerSimulatorProps {
  ssid: string;
  gatewayIp: string;
  isBroadcasting: boolean;
  onOpenPortal: () => void;
}

type ConnectStep = 'disconnected' | 'scanning' | 'connecting' | 'authenticating' | 'obtaining_ip' | 'connected_signin_required' | 'authorized';

export const WifiScannerSimulator: React.FC<WifiScannerSimulatorProps> = ({
  ssid,
  gatewayIp,
  isBroadcasting,
  onOpenPortal
}) => {
  const [connectStep, setConnectStep] = useState<ConnectStep>('disconnected');
  const [assignedIp, setAssignedIp] = useState<string>('192.168.43.104');
  const [signalStrength, setSignalStrength] = useState<number>(-48);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedBand, setSelectedBand] = useState<'2.4GHz' | '5GHz'>('5GHz');

  // Real App Shareable URL for testing on actual secondary phone
  const testUrl = window.location.origin;

  const handleStartConnection = () => {
    if (!isBroadcasting) {
      alert('সফটওয়্যারটির হটস্পট সিগন্যাল বর্তমানে অফ রয়েছে। দয়া করে প্রথমে সিগন্যাল চালু করুন।');
      return;
    }

    setConnectStep('connecting');
    setShowNotification(false);

    // Step 1: Connecting
    setTimeout(() => {
      setConnectStep('authenticating');
    }, 900);

    // Step 2: Authenticating
    setTimeout(() => {
      setConnectStep('obtaining_ip');
      // Generate realistic IP on gateway subnet
      const subnet = gatewayIp.substring(0, gatewayIp.lastIndexOf('.'));
      const randomHost = Math.floor(Math.random() * 80) + 100;
      setAssignedIp(`${subnet}.${randomHost}`);
    }, 1800);

    // Step 3: Obtaining IP -> Connected (Captive Sign-in required)
    setTimeout(() => {
      setConnectStep('connected_signin_required');
      setShowNotification(true);
    }, 2800);
  };

  const handleDisconnect = () => {
    setConnectStep('disconnected');
    setShowNotification(false);
  };

  const handleRescan = () => {
    setConnectStep('scanning');
    setShowNotification(false);
    setTimeout(() => {
      setConnectStep('disconnected');
      setSignalStrength(Math.floor(Math.random() * 8) - 52);
    }, 1000);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(testUrl);
    setCopiedShareUrl(true);
    setTimeout(() => setCopiedShareUrl(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              অন্যান্য ইউজারদের মোবাইলের Wi-Fi স্ক্যানার ও কানেকশন লাইভ প্রিভিউ
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            অন্য যেকোনো ব্যক্তি তাদের মোবাইলের Wi-Fi সেটিংসে গেলে কীভাবে আপনার হটস্পট দেখতে পাবে এবং স্বয়ংক্রিয় সাইন-ইন চালু হবে তা এখানে লাইভ পরীক্ষা করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRescan}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
            title="Rescan Wi-Fi networks"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${connectStep === 'scanning' ? 'animate-spin' : ''}`} />
            <span>স্ক্যান রিফ্রেশ</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Simulated Android 14/15 Wi-Fi Settings Mockup */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-slate-950 border-[6px] border-slate-800 rounded-[2.5rem] p-4 shadow-2xl space-y-3 relative overflow-hidden font-sans">
            {/* Phone Camera Notch & Status Bar */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 pt-1 pb-2 border-b border-slate-850">
              <span className="font-bold text-slate-200">12:45</span>
              <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto border border-slate-800 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
              </div>
              <div className="flex items-center gap-1.5">
                {connectStep === 'connected_signin_required' || connectStep === 'authorized' ? (
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">No WiFi</span>
                )}
                <span className="text-[10px]">88%</span>
              </div>
            </div>

            {/* Android Wi-Fi Title & Toggle */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h4 className="text-white font-bold text-sm">Wi-Fi</h4>
                <span className="text-[10px] text-emerald-400">On (Scanning nearby...)</span>
              </div>
              <div className="w-10 h-5 bg-cyan-600 rounded-full p-0.5 flex items-center justify-end">
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </div>
            </div>

            {/* Android Top Notification Dropdown Simulator */}
            {showNotification && (
              <div
                onClick={onOpenPortal}
                className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-2xl shadow-lg cursor-pointer transition hover:scale-[1.02] active:scale-95 space-y-1 animate-in slide-in-from-top duration-300"
              >
                <div className="flex items-center justify-between text-[10px] text-amber-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <BellRing className="w-3 h-3 text-amber-400 animate-bounce" />
                    Android System • Wi-Fi
                  </span>
                  <span className="text-[9px] text-slate-400">just now</span>
                </div>
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Sign in to Wi-Fi network</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-[11px] text-amber-200 truncate font-mono">
                  {ssid}
                </div>
                <div className="text-[9px] text-amber-300/80 font-sans">
                  👉 পোর্টাল খুলতে এখানে ট্যাপ করুন
                </div>
              </div>
            )}

            {/* Available Networks List */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-400 px-1 uppercase tracking-wider">
                Available Networks
              </div>

              {/* TARGET BROADCASTED APEX HOTSPOT NETWORK */}
              <div
                onClick={connectStep === 'disconnected' ? handleStartConnection : undefined}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  connectStep !== 'disconnected'
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900 hover:bg-slate-850 border-cyan-500/40 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Signal className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-cyan-300 font-bold text-xs block truncate max-w-[170px]">
                        {ssid}
                      </strong>
                      <span className="text-[10px] block font-mono">
                        {connectStep === 'disconnected' && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Open • Tap to Connect
                          </span>
                        )}
                        {connectStep === 'connecting' && <span className="text-cyan-400 animate-pulse">Connecting...</span>}
                        {connectStep === 'authenticating' && <span className="text-amber-400 animate-pulse">Authenticating...</span>}
                        {connectStep === 'obtaining_ip' && <span className="text-indigo-400 animate-pulse">Obtaining IP address...</span>}
                        {connectStep === 'connected_signin_required' && (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Connected, Sign-in required
                          </span>
                        )}
                        {connectStep === 'authorized' && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected (Internet Active)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-cyan-400 font-mono text-[10px]">
                    <Wifi className="w-4 h-4" />
                  </div>
                </div>

                {/* Connected Quick Action bar */}
                {connectStep === 'connected_signin_required' && (
                  <div className="mt-3 pt-2.5 border-t border-cyan-500/30 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPortal();
                      }}
                      className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-yellow-300" />
                      <span>লগইন পোর্টাল খুলুন</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnect();
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
                    >
                      Forget
                    </button>
                  </div>
                )}
              </div>

              {/* Other standard nearby Wi-Fis for realistic comparison */}
              <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-slate-400 text-xs opacity-60">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  <span className="truncate max-w-[140px]">Home_Fiber_5G</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>Saved</span>
                  <Wifi className="w-3 h-3" />
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-slate-400 text-xs opacity-50">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  <span className="truncate max-w-[140px]">TP-Link_Extender</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>Encrypted</span>
                  <Wifi className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="pt-2 flex justify-center">
              <div className="w-24 h-1 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right: Real-World Testing & Cross-Phone Link */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              কানেকশন ডায়াগনস্টিক তথ্য (Live Wi-Fi Handshake)
            </h4>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">Wi-Fi SSID:</span>
                <strong className="text-cyan-300 font-bold">{ssid}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">BSSID / MAC:</span>
                <span className="text-slate-300">02:00:00:43:88:AC</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">Assigned Client IP:</span>
                <strong className="text-emerald-400">{connectStep !== 'disconnected' ? assignedIp : 'Waiting for connection...'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">Default Gateway:</span>
                <span className="text-slate-300">{gatewayIp}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-slate-400">Signal RSSI:</span>
                <span className="text-cyan-400">{signalStrength} dBm (Excellent)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frequency Band:</span>
                <span className="text-indigo-400">{selectedBand} (Dual Band 802.11ac)</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={handleStartConnection}
                disabled={connectStep !== 'disconnected'}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>ওয়াইফাই কানেকশন সিমুলেট করুন</span>
              </button>

              <button
                onClick={onOpenPortal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>সরাসরি পোর্টাল টেস্ট</span>
              </button>
            </div>
          </div>

          {/* Real Second Phone Testing Share Card */}
          <div className="p-4 bg-gradient-to-br from-cyan-950/40 via-slate-950 to-blue-950/30 border border-cyan-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-cyan-400" />
                আলাদা ফিজিক্যাল মোবাইল দিয়ে টেস্ট করুন
              </h4>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-bold">
                REAL TESTING
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              আপনার অন্য যেকোনো মোবাইল দিয়ে এই লিংকে ঢুকলে বা QR কোড স্ক্যান করলেই সেটিকে ক্লায়েন্ট ডিভাইস হিসেবে চিহ্নিত করে রিয়েল-টাইম ক্যাপটিভ পোর্টাল চালু হবে:
            </p>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-300 truncate">{testUrl}</span>
              <button
                onClick={handleCopyShareLink}
                className="px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 rounded-lg text-xs font-sans font-bold flex items-center gap-1 shrink-0 transition"
              >
                {copiedShareUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedShareUrl ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  const sms = SmsService.getInstance();
                  const msg = `Apex Hotspot-এ কানেক্ট করতে ব্রাউজারে খুলুন: ${testUrl}`;
                  sms.openWhatsApp('', msg);
                }}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>অন্য মোবাইলে হোয়াটসঅ্যাপে পাঠান</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
