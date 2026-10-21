/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Flame, Coffee, X, Pin, Maximize2, Minimize2 } from 'lucide-react';
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

  // Base styling depending on context
  const containerClasses = isPiP
    ? "w-full h-full bg-[#09090b] text-white p-2.5 flex flex-col justify-between select-none"
    : isFramelessNative
    ? "w-[260px] h-[88px] rounded-2xl bg-[#09090b]/95 text-white border border-white/20 p-2.5 shadow-2xl backdrop-blur-xl flex flex-col justify-between select-none cursor-move"
    : "relative w-[260px] select-none rounded-2xl bg-[#09090b] text-white border border-white/20 p-3 shadow-2xl backdrop-blur-xl";

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
        {/* Mode Badge & Task */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
            isFocus 
              ? 'bg-white text-black' 
              : 'bg-white/10 text-zinc-300'
          }`}>
            {isFocus ? <Flame className="w-2.5 h-2.5 fill-current" /> : <Coffee className="w-2.5 h-2.5" />}
            <span>{isFocus ? 'Focus' : 'Break'}</span>
          </div>

          <span 
            className="text-[11px] text-zinc-400 font-medium truncate max-w-[130px]"
            title={activeTaskTitle || (isFocus ? 'Deep Work' : 'Rest Block')}
          >
            {activeTaskTitle || (isFocus ? 'Deep Work' : 'Rest')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0" style={noDragStyle}>
          {!isPiP && !isFramelessNative && onOpenPiP && (
            <button
              type="button"
              onClick={onOpenPiP}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Ghim nổi ra ngoài màn hình Desktop (Picture-in-Picture)"
            >
              <Pin className="w-3 h-3" />
            </button>
          )}

          {!isPiP && !isFramelessNative && onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Thu nhỏ thành chấm tròn"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tắt đồng hồ nhỏ"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Countdown & Quick Controls */}
      <div className="flex items-center justify-between gap-3 my-0.5">
        {/* Time Digits */}
        <div className="text-2xl sm:text-[26px] font-extrabold tracking-tight tabular-nums font-sans text-white leading-none">
          {timeFormatted}
        </div>

        {/* Play/Pause & +5m */}
        <div className="flex items-center gap-1.5" style={noDragStyle}>
          <button
            type="button"
            onClick={toggleTimer}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
            title={isRunning ? "Tạm dừng" : "Tiếp tục"}
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
            className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors cursor-pointer border border-white/5 active:scale-95"
            title="Cộng thêm 5 phút"
          >
            +5m
          </button>
        </div>
      </div>

      {/* Thin Bottom Progress Bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
        <div 
          className="h-full bg-white transition-all duration-500 rounded-full"
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
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#09090b]/95 border border-white/20 shadow-xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white hover:text-zinc-200 transition-all cursor-pointer"
                title="Bấm để mở rộng đồng hồ"
              >
                {isFocus ? <Flame className="w-3.5 h-3.5 text-white" /> : <Coffee className="w-3.5 h-3.5 text-zinc-300" />}
                <span className="tabular-nums font-sans">{timeFormatted}</span>
                <Maximize2 className="w-3 h-3 text-zinc-400 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMiniTimerEnabled(false)}
                className="p-1 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer mr-1"
                title="Tắt đồng hồ"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            /* Expanded Full Mini Card */
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
