/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Coffee, Sparkles, CheckCircle2, ChevronDown, Bell } from 'lucide-react';

import { usePomodoro, TimerMode } from '../context/PomodoroContext';

interface DeepWorkTimerProps {
  isLightMode?: boolean;
  onOpenWorkspace?: () => void;
}

const MODE_CONFIGS: Record<TimerMode, { label: string; defaultMinutes: number; color: string; bg: string; border: string; icon: any }> = {
  focus: {
    label: 'Focus',
    defaultMinutes: 25,
    color: '#ffffff',
    bg: 'bg-white/[0.08]',
    border: 'border-white/20',
    icon: Flame
  },
  short_break: {
    label: 'Short Break',
    defaultMinutes: 5,
    color: '#e4e4e7',
    bg: 'bg-white/[0.08]',
    border: 'border-white/20',
    icon: Coffee
  },
  long_break: {
    label: 'Long Break',
    defaultMinutes: 15,
    color: '#d4d4d8',
    bg: 'bg-white/[0.08]',
    border: 'border-white/20',
    icon: Sparkles
  }
};

const FOCUS_PRESETS = [
  { label: '25 min', minutes: 25, desc: 'Pomodoro' },
  { label: '45 min', minutes: 45, desc: 'Deep Focus' },
  { label: '60 min', minutes: 60, desc: 'Power Hour' },
  { label: '90 min', minutes: 90, desc: 'Ultradian Cycle' },
];

export const DeepWorkTimer: React.FC<DeepWorkTimerProps> = ({ isLightMode, onOpenWorkspace }) => {
  const {
    mode,
    timeLeft,
    isRunning,
    durations,
    sessionsCompleted,
    todaySessions,
    toggleTimer,
    resetTimer,
    switchMode,
    setModeDuration
  } = usePomodoro();

  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>(String(durations[mode] || 25));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomInput(String(durations[mode] || 25));
  }, [mode, durations]);

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

  const handleToggle = () => {
    toggleTimer();
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetTimer();
  };

  const handleSwitchMode = (newMode: TimerMode) => {
    switchMode(newMode);
    setCustomInput(String(durations[newMode] || 25));
  };

  const handleSelectPreset = (mins: number) => {
    setModeDuration(mode, mins);
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
            ? `${currentConfig.bg} ${currentConfig.border} shadow-[0_0_15px_rgba(255,255,255,0.08)]` 
            : 'glass-button-true'
        }`}
      >
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center justify-center w-5 h-5 rounded-full transition-transform active:scale-90 ${
            isRunning 
              ? 'bg-white text-black' 
              : 'text-[#9496a1] hover:text-white'
          }`}
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
              <ModeIcon className="w-3.5 h-3.5 text-zinc-300" />
              <span className="text-xs font-semibold text-white">Focus Timer</span>
            </div>
            {todaySessions.filter(s => s.mode === 'focus').length > 0 ? (
              <span className="text-[10px] text-zinc-200 bg-white/[0.08] border border-white/10 px-2 py-0.5 rounded-full font-semibold">
                {todaySessions.filter(s => s.mode === 'focus').length} today
              </span>
            ) : sessionsCompleted > 0 ? (
              <span className="text-[10px] text-zinc-300 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full font-medium">
                {sessionsCompleted} done
              </span>
            ) : null}
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
                        ? 'bg-white text-black font-semibold'
                        : 'hover:bg-white/[0.04] text-[#9496a1] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{preset.label}</span>
                      <span className={`text-[10px] font-normal ${isSelected ? 'text-zinc-600' : 'text-[#9496a1]'}`}>({preset.desc})</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
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
                      ? 'bg-white text-black font-semibold border-white'
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
                      ? 'bg-white text-black font-semibold border-white'
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

          {onOpenWorkspace && (
            <button
              type="button"
              onClick={() => {
                setIsOpenMenu(false);
                onOpenWorkspace();
              }}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Open Pomodoro Workspace</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeepWorkTimer;
