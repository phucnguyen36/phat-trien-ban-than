/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Check, 
  ExternalLink, 
  Key, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Infinity as InfinityIcon
} from 'lucide-react';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  activeKey?: string | null;
  onActivateKey: (key: string) => boolean;
  onDeactivateKey?: () => void;
  accentColor?: string;
  whopStoreUrl?: string;
  whopMonthlyUrl?: string;
  whopLifetimeUrl?: string;
}

export const DEFAULT_WHOP_STORE_URL = 'https://whop.com/thomasnguyen/deep-focus-os/';
export const DEFAULT_WHOP_MONTHLY_URL = 'https://whop.com/checkout/plan_6rzHyaaNhKAaU';
export const DEFAULT_WHOP_LIFETIME_URL = 'https://whop.com/checkout/plan_vrUwKeR11Yh0T';

export default function ProUpgradeModal({
  isOpen,
  onClose,
  isPro,
  activeKey,
  onActivateKey,
  onDeactivateKey,
  whopStoreUrl = DEFAULT_WHOP_STORE_URL,
  whopMonthlyUrl = DEFAULT_WHOP_MONTHLY_URL,
  whopLifetimeUrl = DEFAULT_WHOP_LIFETIME_URL
}: ProUpgradeModalProps) {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = inputKey.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Please enter a valid license key.');
      return;
    }

    if (clean.length < 6) {
      setErrorMsg('License key format is invalid. Keys are formatted as DFOS-LIFE-XXXX-XXXX or DFOS-PASS-XXXX-XXXX.');
      return;
    }

    setIsVerifying(true);
    try {
      let isSuccess = false;
      let serverError = '';
      let detectedPlanType: string | undefined;

      try {
        const res = await fetch('/api/verify-license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licenseKey: clean })
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          isSuccess = true;
          detectedPlanType = data.planType;
          try {
            if (data.planType) localStorage.setItem('df_license_plan_type', data.planType);
            if (data.expiresAt) localStorage.setItem('df_license_expires_at', String(data.expiresAt));
          } catch (e) {}
        } else {
          serverError = data.error || 'Invalid license key.';
        }
      } catch (networkErr) {
        isSuccess = Boolean(onActivateKey(clean));
      }

      if (isSuccess) {
        onActivateKey(clean);
        const planLabel = detectedPlanType === 'monthly' ? 'Monthly Pass' : 'Lifetime Buyout';
        setSuccessMsg(`DeepFocus Pro (${planLabel}) successfully activated! Welcome to the craft.`);
        setInputKey('');
      } else {
        setErrorMsg(serverError || 'Invalid license key. Please verify your purchase receipt or Whop dashboard.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenMonthly = () => {
    window.open(whopMonthlyUrl || whopStoreUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenLifetime = () => {
    window.open(whopLifetimeUrl || whopStoreUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[9600] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0b0c10] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Pure White Badges & Emerald Green (Không vàng, không đỏ) */}
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-bold tracking-wider uppercase shadow-sm">
            <span>DeepFocus Pro</span>
          </div>
          {isPro && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Active</span>
            </div>
          )}
        </div>

        {/* Minimalist Headline */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
          Choose Your Flow Engine
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-normal leading-relaxed">
          Sovereign local workspace. Zero bloat. 100% offline privacy.
        </p>

        {/* Dual Pricing Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Tier 1: Monthly ($29/mo) */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Monthly Pass</span>
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">$29</span>
                <span className="text-xs text-zinc-400">/ mo</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-zinc-300 pt-2 border-t border-white/[0.06]">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Web & Desktop workspaces</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>All 40Hz Gamma soundscapes</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Cancel anytime on Whop</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={handleOpenMonthly}
              className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Subscribe ($29/mo)</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          {/* Tier 2: Lifetime Buyout ($99) */}
          <div className="relative p-4 sm:p-4.5 rounded-2xl bg-white/[0.03] border border-white/20 hover:border-white/40 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(255,255,255,0.02)]">
            
            {/* White Badge (Huy hiệu màu trắng theo yêu cầu) */}
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-white text-black font-extrabold text-[9px] uppercase tracking-wider shadow-sm">
              Save 72% • Best Value
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  Lifetime Buy-Out
                </span>
                <InfinityIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">$99</span>
                <span className="text-xs text-zinc-400">one-time</span>
                <span className="text-[10px] text-zinc-400 font-mono">• zero rent</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-zinc-200 pt-2 border-t border-white/10">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="font-medium text-white">Standalone Desktop App (.exe)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Permanent Whop license key</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>All future updates included</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleOpenLifetime}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs tracking-wider uppercase transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Own Forever ($99)</span>
              <ExternalLink className="w-3 h-3 text-black" />
            </button>
          </div>

        </div>

        {/* License Activation Area */}
        <div className="mt-5 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span>{isPro ? 'License Status' : 'Activate Existing License'}</span>
            </div>
            {isPro && onDeactivateKey && (
              <button
                type="button"
                onClick={onDeactivateKey}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer transition-colors"
              >
                Deactivate key
              </button>
            )}
          </div>

          {isPro ? (
            <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-zinc-300 font-medium">Active:</span>
                <span className="font-mono text-emerald-300 text-[11px]">{activeKey || 'DFOS-PRO-ACTIVE'}</span>
              </div>
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-black tracking-wider shadow-sm">
                VERIFIED
              </span>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter Whop License Key (DFOS-LIFE-XXXX)..."
                  disabled={isVerifying}
                  className="flex-1 bg-white/[0.03] border border-white/[0.1] focus:border-emerald-500/50 px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 rounded-xl focus:outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputKey.trim() || isVerifying}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-40 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Activate</span>
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-1.5 text-zinc-300 text-[11px] animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Clean Footer Guarantee */}
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-500 font-sans">
          <span>Instant delivery via Whop</span>
          <span>•</span>
          <span>30-Day Money-Back</span>
          <span>•</span>
          <span>Apple Pay / Google Pay / Cards</span>
        </div>

      </div>
    </div>
  );
}
