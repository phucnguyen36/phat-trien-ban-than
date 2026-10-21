/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, X, Pin, Maximize2 } from 'lucide-react';
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

  // Ultra-clean Swiss / Linear dark glass styling
  const containerClasses = isPiP
    ? "w-full h-full bg-[#090a0f] text-white p-3 flex flex-col justify-between select-none"
    : isFramelessNative
    ? "w-[272px] h-[90px] rounded-2xl bg-[#090a0f]/95 text-white border border-white/15 p-3 shadow-2xl backdrop-blur-2xl flex flex-col justify-between select-none cursor-move"
    : "relative w-[272px] select-none rounded-2xl bg-[#090a0f]/95 text-white border border-white/15 p-3 shadow-2xl backdrop-blur-2xl";

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
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Mode Badge & Task Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Subtle Status Pill Indicator */}
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors ${
            isFocus 
              ? 'bg-white/10 text-zinc-200 border border-white/10' 
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isFocus 
                ? (isRunning ? 'bg-amber-400 animate-pulse' : 'bg-amber-400/80') 
                : (isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400/80')
            }`} />
            <span>{isFocus ? 'Focus' : 'Break'}</span>
          </div>

          {/* Clean Task Title with ample room */}
          <span 
            className="text-xs text-zinc-300 font-medium truncate flex-1 min-w-0"
            title={activeTaskTitle || (isFocus ? 'Deep Work' : 'Rest Break')}
          >
            {activeTaskTitle || (isFocus ? 'Deep Work' : 'Rest Break')}
          </span>
        </div>

        {/* Action Buttons (Clean & minimal) */}
        <div className="flex items-center gap-1 shrink-0" style={noDragStyle}>
          {!isPiP && !isFramelessNative && onOpenPiP && (
            <button
              type="button"
              onClick={onOpenPiP}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Pin to Desktop (Picture-in-Picture)"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Countdown & Quick Controls */}
      <div className="flex items-center justify-between gap-3 my-0.5">
        {/* Time Digits */}
        <div className="text-[28px] font-bold tracking-tight tabular-nums font-mono text-white leading-none">
          {timeFormatted}
        </div>

        {/* Unified Controls Group */}
        <div className="flex items-center gap-1.5" style={noDragStyle}>
          <button
            type="button"
            onClick={toggleTimer}
            className={`h-7 w-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isRunning ? "Pause" : "Start"}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => addSeconds(300)}
            className="h-7 px-2.5 text-[11px] font-semibold rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-zinc-200 hover:text-white transition-all cursor-pointer border border-white/10 active:scale-95 flex items-center justify-center"
            title="Add 5 minutes"
          >
            +5m
          </button>
        </div>
      </div>

      {/* Thin Bottom Progress Bar */}
      <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mt-1">
        <div 
          className="h-full bg-white/90 transition-all duration-500 rounded-full"
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
        <div className="fixed bottom-5 right-5 z-40 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          {isCollapsed ? (
            /* Collapsed Minimal Pill */
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#090a0f]/95 border border-white/15 shadow-xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white hover:text-zinc-200 transition-all cursor-pointer"
                title="Expand timer"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isFocus ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className="tabular-nums font-mono">{timeFormatted}</span>
                <Maximize2 className="w-3 h-3 text-zinc-400 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMiniTimerEnabled(false)}
                className="p-1 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer mr-1"
                title="Close"
              >
                <X className="w-3 h-3" />
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
    <div className="w-screen h-screen flex items-center justify-center bg-transparent select-none p-1 overflow-hidden">
      <MiniTimerCard
        isFramelessNative={true}
        onClose={handleClose}
      />
    </div>
  );
};
