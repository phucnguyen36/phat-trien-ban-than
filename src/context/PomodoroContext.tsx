/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';

export type TimerMode = 'focus' | 'short_break' | 'long_break';
export type AmbientSoundType = 'off' | 'brown' | 'white' | 'rain' | 'binaural';

export interface FocusSessionRecord {
  id: string;
  timestamp: number;
  durationMinutes: number;
  taskTitle: string;
  mode: TimerMode;
}

interface PomodoroContextType {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  totalSessionSeconds: number;
  durations: Record<TimerMode, number>;
  activeFocusGoalId: string | null;
  todaySessions: FocusSessionRecord[];
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  isZenMode: boolean;
  
  sessionsCompleted: number;
  
  // Actions
  toggleTimer: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addSeconds: (secs?: number) => void;
  switchMode: (newMode: TimerMode, customMins?: number) => void;
  setModeDuration: (newMode: TimerMode, minutes: number) => void;
  setActiveFocusGoalId: (id: string | null) => void;
  setAmbientSound: (type: AmbientSoundType) => void;
  setAmbientVolume: (vol: number) => void;
  setIsZenMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  playAlarmChime: () => void;
  requestNotificationPermission: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

// Rich Harmonic Tibetan Singing Bowl & Chime Sound
export const playPomodoroAlarmChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    
    // Wave 1: Resonant C5 Major Bell Chord (523Hz, 659Hz, 784Hz, 1046Hz, 1318Hz)
    const bellFrequencies = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    bellFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      
      const startTime = now + idx * 0.04;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.22 / (idx + 1), startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 2.9);
    });

    // Wave 2: Echo chime after 1.2s to ensure the user hears it clearly even from another room/tab
    setTimeout(() => {
      try {
        if (ctx.state === 'closed') return;
        const now2 = ctx.currentTime;
        [659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now2 + idx * 0.04);
          const startTime = now2 + idx * 0.04;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 2.6);
        });
      } catch (e) {}
    }, 1200);

  } catch (err) {
    console.warn('Audio chime failed:', err);
  }
};

export const PomodoroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Today date string
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Mode & Durations with Persistence across reloads
  const [mode, setMode] = useState<TimerMode>(() => {
    const saved = localStorage.getItem('df_timer_mode') as TimerMode;
    return (saved && ['focus', 'short_break', 'long_break'].includes(saved)) ? saved : 'focus';
  });

  const [durations, setDurations] = useState<Record<TimerMode, number>>(() => ({
    focus: parseInt(localStorage.getItem('df_timer_focus') || '25', 10),
    short_break: parseInt(localStorage.getItem('df_timer_short_break') || '5', 10),
    long_break: parseInt(localStorage.getItem('df_timer_long_break') || '15', 10),
  }));

  // Restore running timer seamlessly if page was reloaded mid-session
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const savedIsRunning = localStorage.getItem('df_timer_is_running') === 'true';
    const savedTargetEnd = localStorage.getItem('df_timer_target_end_time');
    if (savedIsRunning && savedTargetEnd) {
      const remaining = Math.ceil((parseInt(savedTargetEnd, 10) - Date.now()) / 1000);
      return remaining > 0;
    }
    return false;
  });

  const [targetEndTime, setTargetEndTime] = useState<number | null>(() => {
    const savedIsRunning = localStorage.getItem('df_timer_is_running') === 'true';
    const savedTargetEnd = localStorage.getItem('df_timer_target_end_time');
    if (savedIsRunning && savedTargetEnd) {
      const remaining = Math.ceil((parseInt(savedTargetEnd, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        return parseInt(savedTargetEnd, 10);
      }
    }
    return null;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const savedIsRunning = localStorage.getItem('df_timer_is_running') === 'true';
    const savedTargetEnd = localStorage.getItem('df_timer_target_end_time');
    if (savedIsRunning && savedTargetEnd) {
      const remaining = Math.ceil((parseInt(savedTargetEnd, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        return remaining;
      }
    }
    const savedTimeLeft = localStorage.getItem('df_timer_time_left');
    if (savedTimeLeft) {
      const parsed = parseInt(savedTimeLeft, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const savedMode = (localStorage.getItem('df_timer_mode') as TimerMode) || 'focus';
    const savedFocus = parseInt(localStorage.getItem(`df_timer_${savedMode}`) || '25', 10);
    return savedFocus * 60;
  });

  const [totalSessionSeconds, setTotalSessionSeconds] = useState<number>(() => {
    const savedTotal = localStorage.getItem('df_timer_total_session_seconds');
    if (savedTotal) {
      const parsed = parseInt(savedTotal, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const savedMode = (localStorage.getItem('df_timer_mode') as TimerMode) || 'focus';
    const savedFocus = parseInt(localStorage.getItem(`df_timer_${savedMode}`) || '25', 10);
    return savedFocus * 60;
  });

  // Active focus goal
  const [activeFocusGoalId, setActiveFocusGoalId] = useState<string | null>(() => {
    return localStorage.getItem('df_active_focus_goal_id') || null;
  });

  // Today sessions history
  const [todaySessions, setTodaySessions] = useState<FocusSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`df_focus_history_${todayDateStr}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Sessions count
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(() => {
    return parseInt(localStorage.getItem('df_pomo_sessions') || '0', 10);
  });

  // Zen mode
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Ambient sound synthesizer state
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('off');
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    return parseFloat(localStorage.getItem('df_ambient_volume') || '0.3');
  });

  // Audio Context Ref for Ambient Sound
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ source?: AudioNode; gain?: GainNode; filter?: AudioNode } | null>(null);

  // Synchronize timer state to localStorage so page refresh never loses timer
  useEffect(() => {
    try {
      localStorage.setItem('df_timer_mode', mode);
      localStorage.setItem('df_timer_is_running', String(isRunning));
      if (targetEndTime) {
        localStorage.setItem('df_timer_target_end_time', String(targetEndTime));
      } else {
        localStorage.removeItem('df_timer_target_end_time');
      }
      localStorage.setItem('df_timer_time_left', String(timeLeft));
      localStorage.setItem('df_timer_total_session_seconds', String(totalSessionSeconds));
    } catch (e) {}
  }, [mode, isRunning, targetEndTime, timeLeft, totalSessionSeconds]);

  // Sync activeFocusGoalId to localStorage
  useEffect(() => {
    if (activeFocusGoalId) {
      localStorage.setItem('df_active_focus_goal_id', activeFocusGoalId);
    } else {
      localStorage.removeItem('df_active_focus_goal_id');
    }
  }, [activeFocusGoalId]);

  // Sync todaySessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`df_focus_history_${todayDateStr}`, JSON.stringify(todaySessions));
    } catch (e) {}
  }, [todaySessions, todayDateStr]);

  // Ambient sound volume sync
  useEffect(() => {
    localStorage.setItem('df_ambient_volume', String(ambientVolume));
    if (soundNodesRef.current?.gain && audioContextRef.current) {
      soundNodesRef.current.gain.gain.setValueAtTime(ambientVolume, audioContextRef.current.currentTime);
    }
  }, [ambientVolume]);

  // Ambient sound engine
  const stopAmbientSound = () => {
    if (soundNodesRef.current?.source) {
      try {
        (soundNodesRef.current.source as any).stop?.();
        soundNodesRef.current.source.disconnect();
      } catch (e) {}
    }
    soundNodesRef.current = null;
  };

  const startAmbientSound = (soundType: AmbientSoundType) => {
    stopAmbientSound();
    if (soundType === 'off') return;

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(ambientVolume, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (soundType === 'binaural') {
        // Binaural Beat: Left 200Hz, Right 210Hz => 10Hz Alpha waves for Flow
        const merger = ctx.createChannelMerger(2);
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, ctx.currentTime);
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(210, ctx.currentTime);

        const gainL = ctx.createGain();
        const gainR = ctx.createGain();
        gainL.gain.value = 0.5;
        gainR.gain.value = 0.5;

        oscL.connect(gainL);
        gainL.connect(merger, 0, 0);

        oscR.connect(gainR);
        gainR.connect(merger, 0, 1);

        merger.connect(masterGain);
        oscL.start();
        oscR.start();

        soundNodesRef.current = {
          source: oscL,
          gain: masterGain
        };
      } else {
        // Noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (soundType === 'brown') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          } else if (soundType === 'rain') {
            output[i] = (lastOut + (0.05 * white)) / 1.05;
            lastOut = output[i];
            if (Math.random() < 0.003) {
              output[i] += (Math.random() - 0.5) * 0.8;
            }
          } else {
            output[i] = white * 0.15;
          }
        }

        const whiteNoiseSource = ctx.createBufferSource();
        whiteNoiseSource.buffer = buffer;
        whiteNoiseSource.loop = true;

        if (soundType === 'rain') {
          const biquad = ctx.createBiquadFilter();
          biquad.type = 'lowpass';
          biquad.frequency.setValueAtTime(1400, ctx.currentTime);
          whiteNoiseSource.connect(biquad);
          biquad.connect(masterGain);
        } else if (soundType === 'brown') {
          const biquad = ctx.createBiquadFilter();
          biquad.type = 'lowpass';
          biquad.frequency.setValueAtTime(600, ctx.currentTime);
          whiteNoiseSource.connect(biquad);
          biquad.connect(masterGain);
        } else {
          whiteNoiseSource.connect(masterGain);
        }

        whiteNoiseSource.start();

        soundNodesRef.current = {
          source: whiteNoiseSource,
          gain: masterGain
        };
      }
    } catch (err) {
      console.warn('Failed to start ambient sound:', err);
    }
  };

  const handleSetAmbientSound = (type: AmbientSoundType) => {
    setAmbientSound(type);
    if (type === 'off') {
      stopAmbientSound();
    } else {
      startAmbientSound(type);
    }
  };

  // Notification helper
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const notifyUserOnComplete = (finishedMode: TimerMode) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = finishedMode === 'focus' ? '🎯 Pomodoro Hoàn Thành!' : '⚡ Hết Giờ Nghỉ!';
      const body = finishedMode === 'focus'
        ? 'Tuyệt vời! Bạn đã hoàn thành một phiên làm việc sâu. Hãy nghỉ ngơi 5 phút.'
        : 'Thời gian nghỉ đã hết. Sẵn sàng cho phiên tập trung tiếp theo chưa?';
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }
  };

  // Core Timer Engine using Timestamp tracking for immune-to-tab-throttle accuracy
  useEffect(() => {
    if (!isRunning || !targetEndTime) return;

    const checkTime = () => {
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
      
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        // TIMER EXPIRED!
        setIsRunning(false);
        setTargetEndTime(null);

        // Sound Alarm Chime
        playPomodoroAlarmChime();

        // Browser notification
        notifyUserOnComplete(mode);

        // Record history
        const completedMins = Math.round(totalSessionSeconds / 60);
        const newRecord: FocusSessionRecord = {
          id: 's_' + Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          durationMinutes: completedMins,
          taskTitle: 'Deep Work Session',
          mode
        };
        setTodaySessions(prev => [newRecord, ...prev]);

        // Auto transition to next mode
        if (mode === 'focus') {
          const updatedCount = sessionsCompleted + 1;
          setSessionsCompleted(updatedCount);
          try {
            localStorage.setItem('df_pomo_sessions', String(updatedCount));
          } catch (e) {}

          setMode('short_break');
          const nextSecs = durations.short_break * 60;
          setTimeLeft(nextSecs);
          setTotalSessionSeconds(nextSecs);
        } else {
          setMode('focus');
          const nextSecs = durations.focus * 60;
          setTimeLeft(nextSecs);
          setTotalSessionSeconds(nextSecs);
        }
      }
    };

    // Immediate check
    checkTime();

    // High frequency interval (250ms) to ensure smooth ticking even if browser throttles
    const interval = setInterval(checkTime, 250);
    return () => clearInterval(interval);
  }, [isRunning, targetEndTime, mode, totalSessionSeconds, durations, sessionsCompleted]);

  // Tab Title updates
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    if (isRunning) {
      const modeIcon = mode === 'focus' ? '🎯' : '☕';
      document.title = `${modeIcon} ${timeFormatted} — Deep Focus`;
    } else {
      document.title = 'Deep Focus — Self Development OS';
    }
  }, [isRunning, timeLeft, mode]);

  // Timer Control Functions
  const startTimer = () => {
    requestNotificationPermission();
    let currentRemaining = timeLeft;
    if (currentRemaining <= 0) {
      currentRemaining = durations[mode] * 60;
      setTimeLeft(currentRemaining);
      setTotalSessionSeconds(currentRemaining);
    }
    setTargetEndTime(Date.now() + currentRemaining * 1000);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (targetEndTime) {
      const remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
    setTargetEndTime(null);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    const initialSecs = durations[mode] * 60;
    setTimeLeft(initialSecs);
    setTotalSessionSeconds(initialSecs);
  };

  const addSeconds = (secs: number = 300) => {
    if (targetEndTime) {
      setTargetEndTime(prev => (prev ? prev + secs * 1000 : null));
    }
    setTimeLeft(prev => prev + secs);
    setTotalSessionSeconds(prev => prev + secs);
  };

  const switchMode = (newMode: TimerMode, customMins?: number) => {
    setIsRunning(false);
    setTargetEndTime(null);
    setMode(newMode);
    const mins = customMins || durations[newMode];
    const initialSecs = mins * 60;
    setTimeLeft(initialSecs);
    setTotalSessionSeconds(initialSecs);
  };

  const setModeDuration = (targetMode: TimerMode, minutes: number) => {
    const updated = { ...durations, [targetMode]: minutes };
    setDurations(updated);
    localStorage.setItem(`df_timer_${targetMode}`, String(minutes));
    if (mode === targetMode && !isRunning) {
      setTimeLeft(minutes * 60);
      setTotalSessionSeconds(minutes * 60);
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        timeLeft,
        isRunning,
        totalSessionSeconds,
        durations,
        activeFocusGoalId,
        todaySessions,
        ambientSound,
        ambientVolume,
        isZenMode,
        sessionsCompleted,
        toggleTimer,
        startTimer,
        pauseTimer,
        resetTimer,
        addSeconds,
        switchMode,
        setModeDuration,
        setActiveFocusGoalId,
        setAmbientSound: handleSetAmbientSound,
        setAmbientVolume,
        setIsZenMode,
        playAlarmChime: playPomodoroAlarmChime,
        requestNotificationPermission
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
