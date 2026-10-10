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
  AlertCircle
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
}

export const DEFAULT_WHOP_STORE_URL = 'https://whop.com/deepfocus-os';

export default function ProUpgradeModal({
  isOpen,
  onClose,
  isPro,
  activeKey,
  onActivateKey,
  onDeactivateKey,
  whopStoreUrl = DEFAULT_WHOP_STORE_URL
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
      setSuccessMsg('DeepFocus Pro Lifetime successfully activated! Welcome to the craft.');
      setInputKey('');
    } else {
      setErrorMsg('Invalid license key. Please verify your purchase email or Whop receipt.');
    }
  };

  const handleOpenStore = () => {
    window.open(whopStoreUrl, '_blank', 'noopener,noreferrer');
  };

  const features = [
    {
      icon: Laptop,
      title: '100% Offline Desktop OS (.exe)',
      desc: 'Your data lives only on your hardware. Zero telemetry, zero tracking, zero cloud outages.'
    },
    {
      icon: Music,
      title: '40Hz Gamma & Pure Focus Soundscapes',
      desc: 'Scientifically calibrated audio streams: 40Hz Gamma binaural, Brown Noise, Rain & Cafe.'
    },
    {
      icon: Calendar,
      title: 'Interactive Gantt Roadmap & Task Rollover',
      desc: 'Drag-and-drop timeline planning with 1-click automatic carry-over for weekly & monthly sprints.'
    },
    {
      icon: ShieldCheck,
      title: 'One-Time $49 • Zero Subscriptions Forever',
      desc: 'No monthly drain on your cash flow. Buy once, own forever, including all future updates.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[9600] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0b0c10] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85)] max-h-[92vh] overflow-y-auto">
        
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
            <span>DeepFocus Pro Lifetime</span>
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
          Reclaim Your Attention.<br />Own Your Tools For Life.
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-normal leading-relaxed">
          Notion is bloatware. Subscriptions are a tax on focus. DeepFocus OS is built for high-agency builders who demand ruthless simplicity and permanent ownership.
        </p>

        {/* Pricing Offer Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">$49</span>
              <span className="text-sm text-zinc-500 line-through font-mono">$79</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                SAVE $30 TODAY
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              One-time payment • Lifetime access to desktop app & web • No recurring fees
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenStore}
            className="px-5 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
          >
            <span>Get Pro On Whop ($49)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Core Value Props Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 hover:border-white/15 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-200">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">{feat.title}</h4>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal pl-8">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* License Key Activation Section */}
        <div className="mt-6 pt-6 border-t border-white/[0.08]">
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
                  <span>Pro Lifetime License is active</span>
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Key: {activeKey || 'DF-PRO-LIFETIME'}
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
                After purchasing on Whop, your license key is sent immediately via email and displayed on your Whop dashboard.
              </p>
            </form>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="mt-5 flex items-center justify-between text-[10px] text-zinc-500 pt-3 border-t border-white/[0.04]">
          <span>⚡ Delivered instantly via Whop.com</span>
          <span>🛡️ 30-Day Money-Back Guarantee</span>
          <span>🔒 256-bit Encrypted Checkout</span>
        </div>

      </div>
    </div>
  );
}
