/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Flame, Coffee, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePomodoro } from '../context/PomodoroContext';

export const PomodoroCompletionModal: React.FC = () => {
  const {
    completionAlert,
    dismissCompletionAlert,
    switchMode,
    startTimer,
    durations
  } = usePomodoro();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#090a0f] border border-white/20 rounded-2xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative text-center space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={dismissCompletionAlert}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing Icon */}
        <div className="relative inline-flex items-center justify-center mx-auto my-1">
          <div className="absolute inset-0 rounded-full bg-white/10 animate-ping opacity-40 scale-125" />
          <div className="relative w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
            {isFocus ? (
              <Flame className="w-8 h-8 text-white" />
            ) : (
              <Coffee className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-zinc-200 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFocus ? 'Focus Session Completed' : 'Break Time Finished'}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isFocus ? 'Great Job! Time to recharge' : 'Recharged! Ready to focus'}
          </h3>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            {isFocus ? (
              <>
                You completed a deep focus block of{' '}
                <span className="text-white font-semibold">{completionAlert.completedMinutes} minutes</span> on:{' '}
                <span className="text-zinc-200 font-medium italic block mt-1 line-clamp-1">
                  &ldquo;{completionAlert.title}&rdquo;
                </span>
              </>
            ) : (
              <>
                Your break has ended. Take a breath and step into your next deep work block.
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleStartNext}
            className="w-full py-3 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{isFocus ? `Start Break (${nextDuration} min)` : `Start Focus (${nextDuration} min)`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={dismissCompletionAlert}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs sm:text-sm font-medium transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
