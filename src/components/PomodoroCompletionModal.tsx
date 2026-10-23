/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { usePomodoro } from '../context/PomodoroContext';

export const PomodoroCompletionModal: React.FC = () => {
  const {
    completionAlert,
    dismissCompletionAlert,
    switchMode,
    startTimer,
    durations
  } = usePomodoro();

  const [timeLeftSecs, setTimeLeftSecs] = useState<number>(15);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const totalDismissTime = 15;

  // Reset auto-dismiss timer whenever a new alert arrives
  useEffect(() => {
    if (!completionAlert) return;
    setTimeLeftSecs(totalDismissTime);
  }, [completionAlert]);

  // Smooth auto-dismiss countdown (pauses on hover)
  useEffect(() => {
    if (!completionAlert) return;
    if (isHovered) return;

    const timer = setInterval(() => {
      setTimeLeftSecs((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer);
          dismissCompletionAlert();
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [completionAlert, isHovered, dismissCompletionAlert]);

  // Close on ESC key
  useEffect(() => {
    if (!completionAlert) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissCompletionAlert();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completionAlert, dismissCompletionAlert]);

  if (!completionAlert) return null;

  const isFocus = completionAlert.mode === 'focus';
  const nextMode = isFocus ? 'short_break' : 'focus';
  const nextDuration = isFocus ? durations.short_break : durations.focus;

  const handleStartNext = () => {
    switchMode(nextMode);
    startTimer();
    dismissCompletionAlert();
  };

  const progressRatio = Math.max(0, Math.min(1, timeLeftSecs / totalDismissTime));

  return (
    <div 
      className="fixed top-6 right-6 z-50 pointer-events-none select-none animate-in fade-in slide-in-from-top-3 duration-300"
      role="region"
      aria-label="Session Completion Notification"
    >
      <div 
        className="pointer-events-auto w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl bg-[#090a10]/95 backdrop-blur-2xl border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.85)] p-4 text-white relative overflow-hidden group transition-all"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/10 text-zinc-200 border border-white/10">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{isFocus ? 'Focus Completed' : 'Break Ended'}</span>
            </span>

            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{completionAlert.completedMinutes}m logged</span>
            </span>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={dismissCompletionAlert}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-2.5 space-y-1">
          <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">
            {isFocus ? 'Session complete. Time to recharge.' : 'Break finished. Ready for deep work.'}
          </h4>

          <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
            {isFocus 
              ? (completionAlert.title ? `Task: "${completionAlert.title}"` : 'Great focus block logged to your record.')
              : 'Take a breath and step into your next deep focus block.'
            }
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 mt-3.5">
          <button
            type="button"
            onClick={handleStartNext}
            className="flex-1 py-2 px-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer active:scale-98"
          >
            <span>{isFocus ? `Start Break (${nextDuration}m)` : `Start Focus (${nextDuration}m)`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={dismissCompletionAlert}
            className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>

        {/* Auto-dismiss Countdown Progress Baseline */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.06] overflow-hidden">
          <div 
            className="h-full bg-white/40 transition-all duration-100 ease-linear"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
