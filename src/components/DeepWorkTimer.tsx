/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Coffee, Sparkles, CheckCircle2, ChevronDown, Bell } from 'lucide-react';

interface DeepWorkTimerProps {
  isLightMode?: boolean;
}

type TimerMode = 'focus' | 'short_break' | 'long_break';

const MODE_CONFIGS: Record<TimerMode, { label: string; defaultMinutes: number; color: string; bg: string; border: string; icon: any }> = {
  focus: {
    label: 'Focus',
    defaultMinutes: 25,
    color: '#1591DC',
    bg: 'bg-[#1591DC]/15',
    border: 'border-[#1591DC]/40',
    icon: Flame
  },
  short_break: {
    label: 'Short Break',
    defaultMinutes: 5,
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    icon: Coffee
  },
  long_break: {
    label: 'Long Break',
    defaultMinutes: 15,
    color: '#f59e0b',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    icon: Sparkles
  }
};

const FOCUS_PRESETS = [
  { label: '25 min', minutes: 25, desc: 'Pomodoro' },
  { label: '45 min', minutes: 45, desc: 'Deep Focus' },
  { label: '60 min', minutes: 60, desc: 'Power Hour' },
  { label: '90 min', minutes: 90, desc: 'Ultradian Cycle' },
];

export const DeepWorkTimer: React.FC<DeepWorkTimerProps> = ({ isLightMode }) => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [durations, setDurations] = useState<Record<TimerMode, number>>(() => {
    return {
      focus: parseInt(localStorage.getItem('df_timer_focus') || '25', 10),
      short_break: parseInt(localStorage.getItem('df_timer_short_break') || '5', 10),
      long_break: parseInt(localStorage.getItem('df_timer_long_break') || '15', 10),
    };
  });

  const [timeLeft, setTimeLeft] = useState<number>(durations.focus * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>(String(durations.focus));
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(() => {
    return parseInt(localStorage.getItem('df_pomo_sessions') || '0', 10);
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      
      // Play chime sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(mode === 'focus' ? 659.25 : 523.25, audioCtx.currentTime); // E5 or C5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {
        console.error('Audio chime error:', e);
      }

      // If finished focus, increment session count and suggest break
      if (mode === 'focus') {
        const updated = sessionsCompleted + 1;
        setSessionsCompleted(updated);
        localStorage.setItem('df_pomo_sessions', String(updated));
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessionsCompleted]);

  // Tab Title updates
  useEffect(() => {
    if (isRunning) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      const modePrefix = mode === 'focus' ? '🎯' : '☕';
      document.title = `${modePrefix} (${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}) Deep Focus`;
    } else {
      document.title = 'Deep Focus — Self Development OS';
    }
  }, [isRunning, timeLeft, mode]);

  const handleToggle = () => {
    if (timeLeft === 0) {
      setTimeLeft(durations[mode] * 60);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
  };

  const handleSwitchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(durations[newMode] * 60);
    setCustomInput(String(durations[newMode]));
  };

  const handleSelectPreset = (mins: number) => {
    const updated = { ...durations, [mode]: mins };
    setDurations(updated);
    localStorage.setItem(`df_timer_${mode}`, String(mins));
    setTimeLeft(mins * 60);
    setIsRunning(false);
    setCustomInput(String(mins));
    setIsOpenMenu(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0 && val <= 360) {
      handleSelectPreset(val);
    }
  };

  const currentConfig = MODE_CONFIGS[mode];
  const ModeIcon = currentConfig.icon;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="relative" ref={menuRef}>
      {/* Header Widget Pill */}
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all select-none ${
          isRunning 
            ? `${currentConfig.bg} ${currentConfig.border} shadow-[0_0_15px_rgba(21,145,220,0.25)]` 
            : 'glass-button-true'
        }`}
      >
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center justify-center w-5 h-5 rounded-full transition-transform active:scale-90 ${
            isRunning 
              ? 'text-white' 
              : 'text-[#9496a1] hover:text-white'
          }`}
          style={{ backgroundColor: isRunning ? currentConfig.color : undefined }}
          title={isRunning ? "Pause timer" : `Start ${currentConfig.label}`}
        >
          {isRunning ? (
            <Pause className="w-2.5 h-2.5 fill-current" />
          ) : (
            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Timer Display */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-tight focus:outline-none"
        >
          <span style={{ color: isRunning ? currentConfig.color : '#ffffff' }}>
            {formattedTime}
          </span>
          {isRunning && (
            <span 
              className="w-1.5 h-1.5 rounded-full animate-ping" 
              style={{ backgroundColor: currentConfig.color }}
            />
          )}
        </button>

        {/* Mode Label */}
        <span className="hidden sm:inline text-[10px] text-[#9496a1] font-sans font-medium">
          {currentConfig.label}
        </span>

        {/* Reset / Settings dropdown trigger */}
        <div className="flex items-center gap-1 pl-1 border-l border-white/[0.08]">
          {isRunning && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[#9496a1] hover:text-white transition-colors p-0.5"
              title="Reset Timer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpenMenu(prev => !prev)}
            className="text-[#9496a1] hover:text-white transition-colors p-0.5 flex items-center"
            title="Configure timer modes"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpenMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpenMenu && (
        <div className="absolute right-0 mt-2 w-72 glass-panel-true border border-white/[0.08] shadow-2xl p-4 rounded-2xl z-50 font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <ModeIcon className="w-3.5 h-3.5 text-[#1591DC]" />
              <span className="text-xs font-semibold text-white">Focus Timer</span>
            </div>
            {sessionsCompleted > 0 && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                {sessionsCompleted} pomodoros done
              </span>
            )}
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-3 gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] mb-3">
            {(['focus', 'short_break', 'long_break'] as TimerMode[]).map(m => {
              const active = mode === m;
              const conf = MODE_CONFIGS[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSwitchMode(m)}
                  className={`py-1.5 text-[11px] rounded-lg font-medium transition-all text-center ${
                    active
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-[#9496a1] hover:text-white'
                  }`}
                >
                  {conf.label}
                </button>
              );
            })}
          </div>

          {/* Presets for Focus Mode */}
          {mode === 'focus' && (
            <div className="space-y-1 mb-3">
              {FOCUS_PRESETS.map((preset) => {
                const isSelected = durations.focus === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => handleSelectPreset(preset.minutes)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-[#1591DC]/15 border border-[#1591DC]/30 text-white font-medium'
                        : 'hover:bg-white/[0.04] text-[#9496a1] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{preset.label}</span>
                      <span className="text-[10px] text-[#9496a1] font-normal">({preset.desc})</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1591DC]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Presets for Breaks */}
          {mode === 'short_break' && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[3, 5, 10].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectPreset(m)}
                  className={`py-2 text-xs rounded-xl border text-center transition-all ${
                    durations.short_break === m
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                      : 'border-white/[0.08] text-[#9496a1] hover:text-white'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          )}

          {mode === 'long_break' && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[15, 20, 30].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectPreset(m)}
                  className={`py-2 text-xs rounded-xl border text-center transition-all ${
                    durations.long_break === m
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                      : 'border-white/[0.08] text-[#9496a1] hover:text-white'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          )}

          {/* Custom Duration Form */}
          <form onSubmit={handleCustomSubmit} className="pt-2.5 border-t border-white/[0.08]">
            <label className="text-[11px] text-[#9496a1] block mb-1.5 font-medium">
              Custom Duration (minutes)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="360"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full glass-input-true px-3 py-1.5 text-xs text-white rounded-xl focus:outline-none"
                placeholder="Minutes..."
              />
              <button
                type="submit"
                className="btn-primary-cyan px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0"
              >
                Set
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DeepWorkTimer;
