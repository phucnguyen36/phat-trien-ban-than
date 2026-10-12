/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Lock, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  Infinity as InfinityIcon,
  Flame,
  BookOpen
} from 'lucide-react';
import { DEFAULT_WHOP_LIFETIME_URL, DEFAULT_WHOP_MONTHLY_URL } from './ProUpgradeModal';

interface ProFeatureLockGateProps {
  featureId: 'todo-hub' | 'habit-matrix' | 'expense-ledger';
  title: string;
  tagline: string;
  benefits: string[];
  onOpenUpgradeModal: () => void;
  accentColor?: string;
}

export default function ProFeatureLockGate({
  featureId,
  title,
  tagline,
  benefits,
  onOpenUpgradeModal,
  accentColor = '#10b981'
}: ProFeatureLockGateProps) {
  const handleDirectLifetime = () => {
    window.open(DEFAULT_WHOP_LIFETIME_URL, '_blank', 'noopener,noreferrer');
  };

  const handleDirectMonthly = () => {
    window.open(DEFAULT_WHOP_MONTHLY_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6 animate-fadeIn select-none">
      <div className="relative bg-[#0b0c10] border border-white/15 rounded-3xl p-8 sm:p-12 shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Ambient Subtle Glow (Black & White Standard) */}
        <div 
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[120px] opacity-10 pointer-events-none bg-white/10"
        />
        <div 
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[120px] opacity-10 pointer-events-none bg-white/5"
        />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-wider uppercase">
            <Lock className="w-3.5 h-3.5 text-white" />
            <span>DeepFocus Pro Exclusive</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-400 text-xs">
            <span>Free Tier: </span>
            <span className="text-white font-medium flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-white inline" /> Pomodoro + 
              <BookOpen className="w-3 h-3 text-white inline" /> Journal
            </span>
          </div>
        </div>

        {/* Feature Hero Info */}
        <div className="space-y-3 mb-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            {tagline}
          </p>
        </div>

        {/* Benefits Checklist */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 mb-8 relative z-10 space-y-3">
          <p className="text-xs uppercase font-semibold text-zinc-400 tracking-wider mb-2">
            Included in DeepFocus Pro Sovereign License:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-10">
          
          {/* Monthly Pass Option */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Monthly Membership</span>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-3xl font-black font-mono tracking-tight">$29</span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
            </div>
            <button
              onClick={handleDirectMonthly}
              className="w-full py-2.5 px-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Subscribe ($29/mo)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6 Months Pass (Featured) */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/20 hover:border-white/40 transition-all flex flex-col justify-between relative shadow-[0_0_20px_rgba(255,255,255,0.03)]">
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-wider">
              Save 43% • Best Value
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                <span>6-Month Pass</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">Save $75 vs monthly</span>
              </div>
              <div className="flex items-baseline gap-1.5 text-white">
                <span className="text-3xl font-black font-mono tracking-tight">$99</span>
                <span className="text-xs text-zinc-400 font-medium">/ 6 months (~$16.5/mo)</span>
              </div>
            </div>
            <button
              onClick={handleDirectLifetime}
              className="w-full py-2.5 px-4 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-black text-black" />
              <span>Get 6 Months ($99)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Key Activation & Secondary Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.08] relative z-10 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Already have a Whop license key?</span>
          </div>

          <button
            onClick={onOpenUpgradeModal}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Enter License Key to Unlock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
