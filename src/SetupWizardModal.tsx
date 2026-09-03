import React, { useState } from 'react';
import {
  Zap,
  Globe,
  Network,
  Shield,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Server
} from 'lucide-react';
import { StorageService } from '../../services/storage';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ isOpen, onClose }) => {
  const storage = StorageService.getInstance();
  const state = storage.getState();

  const [step, setStep] = useState<number>(1);

  // Step 1: WAN
  const [wanProto, setWanProto] = useState<'dhcp' | 'static' | 'pppoe'>('dhcp');
  const [wanIp, setWanIp] = useState('203.0.113.45');
  const [wanSubnet, setWanSubnet] = useState('255.255.255.0');
  const [wanGateway, setWanGateway] = useState('203.0.113.1');
  const [wanDns1, setWanDns1] = useState('1.1.1.1');
  const [wanDns2, setWanDns2] = useState('8.8.8.8');
  const [wanPppUser, setWanPppUser] = useState('upstream_isp_user');
  const [wanPppPass, setWanPppPass] = useState('upstream_pass');

  // Step 2: LAN & DHCP
  const [lanIp, setLanIp] = useState('192.168.10.1');
  const [lanSubnet, setLanSubnet] = useState('255.255.255.0');
  const [dhcpStart, setDhcpStart] = useState('192.168.10.100');
  const [dhcpEnd, setDhcpEnd] = useState('192.168.10.250');

  // Step 3: ISP Brand & Password
  const [ispName, setIspName] = useState('ApexISP Broadband Solutions');
  const [adminPassword, setAdminPassword] = useState('admin1234');

  const [isApplying, setIsApplying] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleApplyConfig = () => {
    setIsApplying(true);

    setTimeout(() => {
      // Save WAN Config
      storage.setState(prev => ({
        wanConfig: {
          ...prev.wanConfig,
          connectionType: wanProto,
          ipAddress: wanProto === 'static' ? wanIp : prev.wanConfig.ipAddress,
          subnetMask: wanProto === 'static' ? wanSubnet : prev.wanConfig.subnetMask,
          gateway: wanProto === 'static' ? wanGateway : prev.wanConfig.gateway,
          primaryDns: wanDns1,
          secondaryDns: wanDns2,
          pppoeUsername: wanProto === 'pppoe' ? wanPppUser : undefined,
          pppoePassword: wanProto === 'pppoe' ? wanPppPass : undefined
        },
        lanConfig: {
          ...prev.lanConfig,
          ipAddress: lanIp,
          subnetMask: lanSubnet,
          dhcpStart,
          dhcpEnd
        },
        dhcpConfig: {
          ...prev.dhcpConfig,
          subnet: `${lanIp.split('.').slice(0, 3).join('.')}.0/24`,
          rangeStart: dhcpStart,
          rangeEnd: dhcpEnd,
          gateway: lanIp,
          dnsServer: lanIp
        },
        isFirstRunWizardCompleted: true
      }));

      storage.logAudit(
        'First-Run Setup Wizard Completed',
        'SYSTEM',
        'Router Kernel & Network Stack',
        `Configured WAN (${wanProto}), LAN (${lanIp}), DHCP Scope (${dhcpStart}-${dhcpEnd}).`
      );

      setIsApplying(false);
      setIsDone(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">First-Run Quick Setup Wizard</h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Step {step} of 4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bootstrap Linux router uplink, LAN gateway, DHCP pools, and admin security.
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

        {/* Wizard Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Step Indicators */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800 text-center font-mono">
            {[
              { num: 1, label: 'WAN Uplink' },
              { num: 2, label: 'LAN Subnet' },
              { num: 3, label: 'ISP Branding' },
              { num: 4, label: 'Review & Apply' }
            ].map(s => (
              <div
                key={s.num}
                className={`flex-1 p-2 rounded-lg border transition ${
                  step === s.num
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : step > s.num
                    ? 'bg-slate-950 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <div className="text-[10px]">STEP {s.num}</div>
                <div className="truncate text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* STEP 1: WAN */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                Step 1: Internet WAN Connection (eth0)
              </h3>
              <p className="text-slate-400">
                Select how this virtual router connects to your upstream ISP / transit provider.
              </p>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Protocol Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dhcp', 'static', 'pppoe'] as const).map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setWanProto(p)}
                      className={`py-2 rounded-lg uppercase font-bold transition ${
                        wanProto === p
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {p === 'dhcp' ? 'DHCP Client' : p === 'static' ? 'Static IP' : 'PPPoE Client'}
                    </button>
                  ))}
                </div>
              </div>

              {wanProto === 'static' && (
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                  <div>
                    <label className="block text-slate-400 mb-1">Public IPv4</label>
                    <input
                      type="text"
                      value={wanIp}
                      onChange={e => setWanIp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Gateway</label>
                    <input
                      type="text"
                      value={wanGateway}
                      onChange={e => setWanGateway(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                    />
                  </div>
                </div>
              )}

              {wanProto === 'pppoe' && (
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                  <div>
                    <label className="block text-slate-400 mb-1">PPPoE Username</label>
                    <input
                      type="text"
                      value={wanPppUser}
                      onChange={e => setWanPppUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">PPPoE Password</label>
                    <input
                      type="password"
                      value={wanPppPass}
                      onChange={e => setWanPppPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Primary DNS</label>
                  <input
                    type="text"
                    value={wanDns1}
                    onChange={e => setWanDns1(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Secondary DNS</label>
                  <input
                    type="text"
                    value={wanDns2}
                    onChange={e => setWanDns2(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LAN */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Network className="w-4 h-4 text-indigo-400" />
                Step 2: LAN Gateway &amp; DHCP Pool (eth1)
              </h3>
              <p className="text-slate-400">
                Configure your local network subnet and automatic IP address leasing for subscribers and switches.
              </p>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Router LAN IPv4 Gateway</label>
                  <input
                    type="text"
                    value={lanIp}
                    onChange={e => setLanIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Subnet Mask</label>
                  <input
                    type="text"
                    value={lanSubnet}
                    onChange={e => setLanSubnet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">DHCP Pool Start</label>
                  <input
                    type="text"
                    value={dhcpStart}
                    onChange={e => setDhcpStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">DHCP Pool End</label>
                  <input
                    type="text"
                    value={dhcpEnd}
                    onChange={e => setDhcpEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BRAND & SECURITY */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Step 3: ISP Company Profile &amp; Super Admin Security
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ISP Organization / Brand Name</label>
                  <input
                    type="text"
                    value={ispName}
                    onChange={e => setIspName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Super Admin Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Step 4: Review Configuration Summary
              </h3>

              {isDone ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-sm">Router Initialized Successfully!</h4>
                  <p className="text-slate-300 text-xs">
                    All network interfaces, nftables NAT chains, and DHCP services are running.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">WAN Mode:</span>
                    <strong className="text-cyan-400 uppercase">{wanProto}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">LAN Gateway:</span>
                    <strong className="text-slate-100">{lanIp} / 24</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DHCP Range:</span>
                    <strong className="text-indigo-300">{dhcpStart} - {dhcpEnd}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DNS Servers:</span>
                    <strong className="text-slate-100">{wanDns1}, {wanDns2}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ISP Brand:</span>
                    <strong className="text-slate-100 font-sans">{ispName}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1 || isApplying || isDone}
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow-md"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : isDone ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
            >
              Finish &amp; Open NOC Dashboard
            </button>
          ) : (
            <button
              type="button"
              disabled={isApplying}
              onClick={handleApplyConfig}
              className="flex items-center gap-1.5 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition shadow-md disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isApplying ? 'Applying Configuration...' : 'Commit & Start Router'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
