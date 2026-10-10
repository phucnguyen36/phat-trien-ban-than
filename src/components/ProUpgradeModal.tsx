/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  ExternalLink, 
  Key, 
  X, 
  Laptop, 
  Music, 
  Calendar, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Infinity
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

export const DEFAULT_WHOP_STORE_URL = 'https://whop.com/deepfocus-os';
export const DEFAULT_WHOP_MONTHLY_URL = 'https://whop.com/checkout/deepfocus-monthly';
export const DEFAULT_WHOP_LIFETIME_URL = 'https://whop.com/checkout/deepfocus-lifetime';

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

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = inputKey.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Please enter a valid license key.');
      return;
    }

    if (clean.length < 6) {
      setErrorMsg('License key format is invalid. Keys are typically DF-XXXX-YYYY.');
      return;
    }

    const success = onActivateKey(clean);
    if (success) {
      setSuccessMsg('DeepFocus Pro successfully activated! Welcome to the craft.');
      setInputKey('');
    } else {
      setErrorMsg('Invalid license key. Please verify your purchase receipt or Whop dashboard.');
    }
  };

  const handleOpenStore = () => {
    window.open(whopStoreUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenMonthly = () => {
    window.open(whopMonthlyUrl || whopStoreUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenLifetime = () => {
    window.open(whopLifetimeUrl || whopStoreUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[9600] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0b0c10] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>DeepFocus Pro Access</span>
          </div>
          {isPro && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACTIVE LICENSE</span>
            </div>
          )}
        </div>

        {/* Title & Philosophy */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          Reclaim Your Attention.<br />Choose Your Flow Engine.
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-normal leading-relaxed">
          Notion is bloatware. Cluttered apps tax your mental runway. DeepFocus OS gives high-agency creators ruthless clarity, 100% offline security, and zero distraction.
        </p>

        {/* DUAL PRICING TIERS: $29/MONTH VS $99 BUY-OUT */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* TIER 1: MONTHLY PLAN ($29/mo) */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col justify-between space-y-4 hover:border-white/20 transition-all">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Pass</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Flexible, pay-as-you-go flow</p>
                </div>
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-3xl font-extrabold text-white tracking-tight">$29</span>
                <span className="text-xs text-zinc-400 font-medium">/ month</span>
              </div>

              <ul className="space-y-2 text-[11px] text-zinc-300 pt-2 border-t border-white/[0.06]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Full access to web & desktop workspaces</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>All 40Hz Gamma soundscapes & binaurals</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Gantt roadmap & automatic task rollover</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Cancel anytime with 1 click on Whop</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleOpenMonthly}
              className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/15 text-white font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Subscribe ($29/mo)</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          {/* TIER 2: LIFETIME BUY-OUT ($99 ONE-TIME - BEST VALUE) */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-b from-amber-500/[0.06] to-white/[0.02] border border-amber-500/30 flex flex-col justify-between space-y-4 shadow-[0_0_25px_rgba(245,158,11,0.08)] hover:border-amber-400/50 transition-all">
            
            {/* Best Value Highlight Pill */}
            <div className="absolute -top-3 right-5 px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[9px] uppercase tracking-wider shadow-sm">
              Best Value • Save 72%
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Lifetime Buy-Out</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-[11px] text-zinc-300 mt-0.5">Pay once. Own it forever.</p>
                </div>
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <Infinity className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl font-extrabold text-white tracking-tight">$99</span>
                <span className="text-xs text-zinc-400 font-medium">one-time payment</span>
                <span className="text-[10px] text-amber-300 font-mono">Zero rent forever</span>
              </div>

              <ul className="space-y-2 text-[11px] text-zinc-200 pt-2 border-t border-amber-500/20">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 font-bold" />
                  <span className="font-medium text-white">100% Offline Standalone Desktop App (.exe)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 font-bold" />
                  <span>Permanent Whop License Key inside receipt</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 font-bold" />
                  <span>All future v5.x & v6.x major updates included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 font-bold" />
                  <span>Personal & Commercial license rights</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleOpenLifetime}
              className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Own Forever ($99)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Core Value Props Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-zinc-300" />
              <h4 className="text-xs font-semibold text-white">100% Offline Architecture</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal pl-5">
              Zero cloud telemetry. Your notes, goals, and financials stay locked on your device.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-zinc-300" />
              <h4 className="text-xs font-semibold text-white">40Hz Gamma Soundscapes</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal pl-5">
              Acoustic neuro-entrainment streams for prefrontal cortex focus and deep flow.
            </p>
          </div>
        </div>

        {/* License Key Activation Section */}
        <div className="mt-6 pt-5 border-t border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                {isPro ? 'License Status' : 'Activate Existing License'}
              </h3>
            </div>
            {isPro && onDeactivateKey && (
              <button
                type="button"
                onClick={onDeactivateKey}
                className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Deactivate key
              </button>
            )}
          </div>

          {isPro ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Pro License is active</span>
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Key: {activeKey || 'DF-PRO-ACTIVE'}
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                Verified
              </span>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter Whop License Key (e.g. DF-8921-X4KP)..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.1] focus:border-white/30 px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 rounded-xl focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputKey.trim()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-40 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0"
                >
                  Activate
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-1.5 text-rose-400 text-[11px] animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <p className="text-[10px] text-zinc-500 leading-normal">
                Whether you choose Monthly ($29/mo) or Lifetime Buy-Out ($99), your key is delivered instantly via email and visible on your Whop dashboard.
              </p>
            </form>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="mt-5 flex items-center justify-between text-[10px] text-zinc-500 pt-3 border-t border-white/[0.04]">
          <span>⚡ Instant delivery via Whop.com</span>
          <span>🛡️ 30-Day Money-Back Guarantee</span>
          <span>🔒 Apple Pay / Google Pay / Visa</span>
        </div>

      </div>
    </div>
  );
}
