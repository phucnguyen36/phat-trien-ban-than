/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, X, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { usePomodoro } from '../context/PomodoroContext';

interface MiniTimerCardProps {
  isPiP?: boolean;
  isFramelessNative?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onOpenPiP?: () => void;
}

export const MiniTimerCard: React.FC<MiniTimerCardProps> = ({
  isPiP = false,
  isFramelessNative = false,
  onClose,
  onMinimize,
  onOpenPiP
}) => {
  const {
    mode,
    timeLeft,
    isRunning,
    totalSessionSeconds,
    activeTaskTitle,
    toggleTimer,
    addSeconds
  } = usePomodoro();

  const isFocus = mode === 'focus';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const progressRatio = totalSessionSeconds > 0 
    ? Math.max(0, Math.min(1, (totalSessionSeconds - timeLeft) / totalSessionSeconds)) 
    : 0;

  // Ultra-clean Swiss Minimalist styling:
  // Note: For isFramelessNative (Electron transparent window), we avoid outer box-shadow and backdrop-filter
  // because Chromium/Windows DWM clips blur/shadow to the rectangular window bounds (causing a gray box at the 4 corners).
  const containerClasses = isPiP
    ? "w-full h-full bg-[#090a10] text-white px-3.5 pt-2.5 pb-3.5 flex flex-col justify-between select-none overflow-hidden relative"
    : isFramelessNative
    ? "w-[280px] h-[78px] rounded-2xl bg-[#090a10] text-white border border-white/15 px-3.5 pt-2.5 pb-3.5 flex flex-col justify-between select-none cursor-move overflow-hidden relative group"
    : "w-[280px] h-[78px] rounded-2xl bg-[#090a10]/95 text-white border border-white/12 px-3.5 pt-2.5 pb-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col justify-between select-none relative group transition-all duration-200 overflow-hidden";

  const dragStyle = isFramelessNative
    ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties)
    : undefined;

  const noDragStyle = isFramelessNative
    ? ({ WebkitAppRegion: 'no-drag' } as React.CSSProperties)
    : undefined;

  return (
    <div 
      className={containerClasses}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...dragStyle
      }}
    >
      {/* Top Meta Row */}
      <div className="flex items-center justify-between gap-2 leading-none">
        {/* Mode Indicator & Task Title */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Subtle Breathing Status Light */}
          <span 
            className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
              isFocus 
                ? (isRunning ? 'bg-amber-400 ring-2 ring-amber-400/20 animate-pulse' : 'bg-amber-400/70') 
                : (isRunning ? 'bg-emerald-400 ring-2 ring-emerald-400/20 animate-pulse' : 'bg-emerald-400/70')
            }`} 
          />

          {/* Clean Mode Label */}
          <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 shrink-0">
            {isFocus ? 'Focus' : 'Break'}
          </span>

          <span className="text-zinc-600 text-[10px] shrink-0 font-normal">•</span>

          {/* Clean Task Title */}
          <span 
            className="text-[11px] text-zinc-300 font-medium truncate flex-1 min-w-0 tracking-tight"
            title={activeTaskTitle || (isFocus ? 'Deep Work Session' : 'Rest Break')}
          >
            {activeTaskTitle || (isFocus ? 'Deep Work Session' : 'Rest Break')}
          </span>
        </div>

        {/* Minimalist Micro-Actions */}
        <div className="flex items-center gap-0.5 shrink-0" style={noDragStyle}>
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Minimize to pill"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {!isPiP && !isFramelessNative && onOpenPiP && (
            <button
              type="button"
              onClick={onOpenPiP}
              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Pin to Desktop (Picture-in-Picture)"
            >
              <Pin className="w-3 h-3" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Countdown & Quick Controls */}
      <div className="flex items-center justify-between gap-3 mt-0.5 leading-none">
        {/* Time Digits (Pure Sans Tabular Numerals) */}
        <div className="text-[24px] font-semibold tracking-tight tabular-nums text-white leading-none font-sans select-none">
          {timeFormatted}
        </div>

        {/* Controls Group */}
        <div className="flex items-center gap-1.5 shrink-0" style={noDragStyle}>
          <button
            type="button"
            onClick={() => addSeconds(300)}
            className="h-6 px-2 text-[10px] font-semibold rounded-md bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title="Add 5 minutes"
          >
            +5m
          </button>

          <button
            type="button"
            onClick={toggleTimer}
            className={`h-7 w-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
              isRunning
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/15'
            }`}
            title={isRunning ? "Pause" : "Start"}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Inset Progress Rail — kept safely inside horizontal padding so it never bleeds into rounded-2xl corners */}
      <div className="absolute bottom-[5px] left-3.5 right-3.5 h-[2px] bg-white/[0.08] overflow-hidden rounded-full">
        <div 
          className="h-full bg-white/80 transition-all duration-300 rounded-full"
          style={{ width: `${Math.round(progressRatio * 100)}%` }}
        />
      </div>
    </div>
  );
};

export const FloatingMiniTimer: React.FC = () => {
  // If running inside the standalone frameless mini window, don't mount another in-app floating widget
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mini') === 'true') {
    return null;
  }

  const {
    isMiniTimerEnabled,
    setIsMiniTimerEnabled,
    isPiPActive,
    pipWindow,
    openPiP,
    closePiP,
    timeLeft,
    mode
  } = usePomodoro();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isFocus = mode === 'focus';

  return (
    <>
      {/* 1. OS-Level Floating Window via Document Picture-in-Picture */}
      {isPiPActive && pipWindow && createPortal(
        <MiniTimerCard isPiP={true} onClose={closePiP} />,
        pipWindow.document.body
      )}

      {/* 2. In-App Corner Floating HUD (Bottom Right Corner) */}
      {isMiniTimerEnabled && !isPiPActive && (
        <div className="fixed bottom-6 right-6 z-40 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          {isCollapsed ? (
            /* Collapsed Minimal Pill */
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#090a10] border border-white/15 shadow-[0_10px_28px_rgba(0,0,0,0.65)] text-xs select-none">
              <span 
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isFocus ? 'bg-amber-400' : 'bg-emerald-400'
                }`} 
              />
              <span className="tabular-nums font-semibold text-white tracking-tight">
                {timeFormatted}
              </span>
              <span className="text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
                {isFocus ? 'Focus' : 'Break'}
              </span>

              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="p-0.5 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Expand HUD"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMiniTimerEnabled(false)}
                className="p-0.5 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer ml-0.5"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Expanded Clean Mini Card */
            <MiniTimerCard
              isPiP={false}
              onClose={() => setIsMiniTimerEnabled(false)}
              onMinimize={() => setIsCollapsed(true)}
              onOpenPiP={openPiP}
            />
          )}
        </div>
      )}
    </>
  );
};

export const MiniTimerStandalone: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('mini-window-html');
    document.body.classList.add('mini-window-body');
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';
  }, []);

  const handleClose = () => {
    if ((window as any).electronAPI?.closeMiniTimer) {
      (window as any).electronAPI.closeMiniTimer();
    } else {
      window.close();
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent select-none overflow-hidden">
      <MiniTimerCard
        isFramelessNative={true}
        onClose={handleClose}
      />
    </div>
  );
};
