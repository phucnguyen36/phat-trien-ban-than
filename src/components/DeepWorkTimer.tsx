/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle2, ChevronDown } from 'lucide-react';

interface DeepWorkTimerProps {
  isLightMode?: boolean;
}

const PRESET_DURATIONS = [
  { label: '25 min', minutes: 25, desc: 'Pomodoro' },
  { label: '45 min', minutes: 45, desc: 'Standard Focus' },
  { label: '60 min', minutes: 60, desc: 'Power Hour' },
  { label: '90 min', minutes: 90, desc: 'Ultradian Cycle' },
];

export const DeepWorkTimer: React.FC<DeepWorkTimerProps> = ({ isLightMode }) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('df_deep_work_duration');
    return saved ? parseInt(saved, 10) : 45;
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem('df_deep_work_duration');
    return (saved ? parseInt(saved, 10) : 45) * 60;
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>(String(selectedMinutes));
  const [totalCompletedSessions, setTotalCompletedSessions] = useState<number>(() => {
    const saved = localStorage.getItem('df_deep_work_sessions_today');
    return saved ? parseInt(saved, 10) : 0;
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
      } catch (e) {
        console.error('Audio chime error:', e);
      }

      const updated = totalCompletedSessions + 1;
      setTotalCompletedSessions(updated);
      localStorage.setItem('df_deep_work_sessions_today', String(updated));
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, totalCompletedSessions]);

  useEffect(() => {
    if (isRunning) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      document.title = `(${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}) Deep Focus`;
    } else {
      document.title = 'Deep Focus — Self Development OS';
    }
  }, [isRunning, timeLeft]);

  const handleToggle = () => {
    if (timeLeft === 0) {
      setTimeLeft(selectedMinutes * 60);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(false);
    setTimeLeft(selectedMinutes * 60);
  };

  const handleSelectPreset = (mins: number) => {
    setSelectedMinutes(mins);
    localStorage.setItem('df_deep_work_duration', String(mins));
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="relative" ref={menuRef}>
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all select-none ${
          isRunning 
            ? 'bg-[#1591DC]/15 border-[#1591DC]/40 shadow-[0_0_15px_rgba(21,145,220,0.25)]' 
            : 'glass-button-true'
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center justify-center w-5 h-5 rounded-full transition-transform active:scale-90 ${
            isRunning 
              ? 'bg-[#1591DC] text-white' 
              : 'text-[#9496a1] hover:text-white'
          }`}
          title={isRunning ? 'Tạm dừng Deep Work' : 'Bắt đầu phiên Deep Work'}
        >
          {isRunning ? (
            <Pause className="w-2.5 h-2.5 fill-current" />
          ) : (
            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-tight focus:outline-none"
        >
          <span className={isRunning ? 'text-[#38bdf8]' : 'text-white'}>
            {formattedTime}
          </span>
          {isRunning && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#1591DC] animate-ping" />
          )}
        </button>

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
            title="Tùy chỉnh thời gian tập trung"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpenMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpenMenu && (
        <div className="absolute right-0 mt-2 w-64 glass-panel-true border border-white/[0.08] shadow-2xl p-4 rounded-2xl z-50 font-sans">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#1591DC]" />
              <span className="text-xs font-semibold text-white">Deep Work Timer</span>
            </div>
            {totalCompletedSessions > 0 && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                {totalCompletedSessions} phiên
              </span>
            )}
          </div>

          <div className="space-y-1 mb-3">
            {PRESET_DURATIONS.map((preset) => {
              const isSelected = selectedMinutes === preset.minutes;
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

          <form onSubmit={handleCustomSubmit} className="pt-2.5 border-t border-white/[0.08]">
            <label className="text-[11px] text-[#9496a1] block mb-1.5 font-medium">
              Tùy chỉnh số phút
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="360"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full glass-input-true px-3 py-1.5 text-xs text-white rounded-xl focus:outline-none"
                placeholder="Phút..."
              />
              <button
                type="submit"
                className="btn-primary-cyan px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DeepWorkTimer;
