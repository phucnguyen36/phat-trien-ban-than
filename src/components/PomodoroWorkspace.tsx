/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  GoalTodo, 
  HabitData, 
  DailyJournal, 
  TimeframeType, 
  TimeEstimate, 
  PriorityLevel 
} from '../types';
import { 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Sparkles, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Plus, 
  ListChecks, 
  FileText, 
  BookOpen, 
  Activity, 
  Kanban, 
  Clock, 
  ArrowRight, 
  ExternalLink, 
  Headphones, 
  Zap, 
  Copy, 
  Check, 
  PlusCircle,
  Sliders,
  Bell,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

interface PomodoroWorkspaceProps {
  goals: GoalTodo[];
  habits: HabitData[];
  journalEntries: DailyJournal[];
  scratchpadText: string;
  onSaveScratchpad: (text: string) => Promise<void> | void;
  onToggleGoal: (id: string, completed: boolean) => void;
  onAddGoal?: (text: string, timeframe: TimeframeType, timeEstimate?: TimeEstimate) => void;
  onUpdateGoal?: (updatedGoal: GoalTodo) => void;
  onToggleHabitDay?: (id: string, day: number) => void;
  onSaveJournal?: (date: string, energy: number, text: string) => void;
  activeFocusGoalId: string | null;
  setActiveFocusGoalId: (id: string | null) => void;
  onNavigate: (section: string) => void;
  isLightMode?: boolean;
}

type TimerMode = 'focus' | 'short_break' | 'long_break';
type AmbientSoundType = 'off' | 'brown' | 'white' | 'rain' | 'binaural';

interface FocusSessionRecord {
  id: string;
  timestamp: number;
  durationMinutes: number;
  taskTitle: string;
  mode: TimerMode;
}

export default function PomodoroWorkspace({
  goals,
  habits,
  journalEntries,
  scratchpadText,
  onSaveScratchpad,
  onToggleGoal,
  onAddGoal,
  onUpdateGoal,
  onToggleHabitDay,
  onSaveJournal,
  activeFocusGoalId,
  setActiveFocusGoalId,
  onNavigate,
  isLightMode
}: PomodoroWorkspaceProps) {
  // Today's date keys
  const today = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const todayDayNumber = useMemo(() => today.getDate(), [today]);

  // Timer mode state
  const [mode, setMode] = useState<TimerMode>('focus');

  // Custom durations (stored in localStorage)
  const [durations, setDurations] = useState<Record<TimerMode, number>>(() => ({
    focus: parseInt(localStorage.getItem('df_timer_focus') || '25', 10),
    short_break: parseInt(localStorage.getItem('df_timer_short_break') || '5', 10),
    long_break: parseInt(localStorage.getItem('df_timer_long_break') || '15', 10),
  }));

  const [timeLeft, setTimeLeft] = useState<number>(durations.focus * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState<number>(durations.focus * 60);

  // Zen / Distraction-free mode
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Ambient sound synthesizer state
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('off');
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    return parseFloat(localStorage.getItem('df_ambient_volume') || '0.3');
  });

  // Daily focus history
  const [todaySessions, setTodaySessions] = useState<FocusSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`df_focus_history_${todayDateStr}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Scratchpad local state for fast typing + debounced save
  const [localScratchpad, setLocalScratchpad] = useState<string>(scratchpadText || '');
  const [copiedScratchpad, setCopiedScratchpad] = useState<boolean>(false);
  const [journalLogged, setJournalLogged] = useState<boolean>(false);

  // Task selection drawer / popover state
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState<boolean>(false);
  const [newQuickTaskText, setNewQuickTaskText] = useState<string>('');

  // Audio Context Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ source?: AudioNode; gain?: GainNode; filter?: AudioNode } | null>(null);

  // Keep local scratchpad updated when parent updates
  useEffect(() => {
    setLocalScratchpad(scratchpadText || '');
  }, [scratchpadText]);

  // Strip context tag from display text
  const cleanGoalText = (text?: string | null): string => {
    if (!text) return '';
    return text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '');
  };

  // Find active goal object
  const activeGoal = useMemo(() => {
    if (!activeFocusGoalId) return null;
    return goals.find(g => g.id === activeFocusGoalId) || null;
  }, [activeFocusGoalId, goals]);

  // Filter available candidate tasks
  const candidateTasks = useMemo(() => {
    return goals.filter(g => !g.completed);
  }, [goals]);

  // Calculate deep work habit for today
  const deepWorkHabit = useMemo(() => {
    return habits.find(h => 
      h.habitName.toLowerCase().includes('deep work') || 
      h.habitName.toLowerCase().includes('focus') ||
      h.habitName.toLowerCase().includes('tập trung')
    ) || habits[0] || null;
  }, [habits]);

  const isHabitCheckedToday = useMemo(() => {
    if (!deepWorkHabit) return false;
    return deepWorkHabit.completedDays.includes(todayDayNumber);
  }, [deepWorkHabit, todayDayNumber]);

  // Total deep work minutes today
  const totalFocusMinutesToday = useMemo(() => {
    return todaySessions
      .filter(s => s.mode === 'focus')
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [todaySessions]);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`df_focus_history_${todayDateStr}`, JSON.stringify(todaySessions));
    } catch (e) {}
  }, [todaySessions, todayDateStr]);

  // Save ambient volume
  useEffect(() => {
    localStorage.setItem('df_ambient_volume', String(ambientVolume));
    if (soundNodesRef.current?.gain) {
      soundNodesRef.current.gain.gain.setValueAtTime(ambientVolume, audioContextRef.current?.currentTime || 0);
    }
  }, [ambientVolume]);

  // Web Audio Chime Sound
  const playHarmonicChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const freqs = mode === 'focus' ? [528, 660, 792] : [440, 554, 659];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 1.8);
      });
    } catch (e) {
      console.warn('Audio chime failed', e);
    }
  };

  // Ambient Sound Engine (Brown Noise, White Noise, Rain, Binaural Beats)
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
        // Binaural Alpha (200Hz Left / 210Hz Right = 10Hz Alpha flow)
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, ctx.currentTime);

        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(210, ctx.currentTime);

        const gainL = ctx.createGain();
        gainL.gain.value = 0.5;
        const gainR = ctx.createGain();
        gainR.gain.value = 0.5;

        oscL.connect(gainL);
        oscR.connect(gainR);
        gainL.connect(merger, 0, 0);
        gainR.connect(merger, 0, 1);
        merger.connect(masterGain);

        oscL.start();
        oscR.start();

        soundNodesRef.current = {
          source: merger,
          gain: masterGain
        };
      } else {
        // Synthesize 5 seconds of looped noise buffer
        const bufferSize = ctx.sampleRate * 5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (soundType === 'brown') {
            // Brown noise: integrated random walk
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // boost brown gain
          } else if (soundType === 'rain') {
            // Rain simulation: pink filtered noise with random drops
            output[i] = (lastOut + (0.05 * white)) / 1.05;
            lastOut = output[i];
            if (Math.random() < 0.003) {
              output[i] += (Math.random() - 0.5) * 0.8;
            }
          } else {
            // Pure White noise
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

  // Change ambient sound
  const handleAmbientChange = (type: AmbientSoundType) => {
    setAmbientSound(type);
    if (type === 'off') {
      stopAmbientSound();
    } else {
      startAmbientSound(type);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Timer Tick Engine
  useEffect(() => {
    let interval: any = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playHarmonicChime();

      // Record session completion
      const completedMins = Math.round(totalSessionSeconds / 60);
      const newRecord: FocusSessionRecord = {
        id: 's_' + Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        durationMinutes: completedMins,
        taskTitle: activeGoal ? cleanGoalText(activeGoal.text) : 'Deep Work Session',
        mode
      };

      setTodaySessions(prev => [newRecord, ...prev]);

      // If finished a focus block, prompt short break
      if (mode === 'focus') {
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

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, totalSessionSeconds, activeGoal, durations]);

  // Tab Title updates
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (isRunning) {
      const modeIcon = mode === 'focus' ? '🎯' : '☕';
      const taskSnippet = activeGoal ? ` — ${cleanGoalText(activeGoal.text).slice(0, 24)}...` : '';
      document.title = `${modeIcon} ${timeFormatted} Deep Focus${taskSnippet}`;
    } else {
      document.title = 'Deep Focus — Self Development OS';
    }
  }, [isRunning, timeLeft, mode, activeGoal]);

  // Hotkey listener: Space to toggle, R to reset, B for break
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning(prev => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleSwitchMode(mode === 'focus' ? 'short_break' : 'focus');
      } else if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, mode]);

  // Handlers
  const handleToggleTimer = () => {
    if (timeLeft === 0) {
      const dur = durations[mode] * 60;
      setTimeLeft(dur);
      setTotalSessionSeconds(dur);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    const dur = durations[mode] * 60;
    setTimeLeft(dur);
    setTotalSessionSeconds(dur);
  };

  const handleAddFiveMinutes = () => {
    setTimeLeft(prev => prev + 300);
    setTotalSessionSeconds(prev => prev + 300);
  };

  const handleSwitchMode = (newMode: TimerMode, customMins?: number) => {
    setIsRunning(false);
    setMode(newMode);
    const minutes = customMins || durations[newMode];
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setTotalSessionSeconds(seconds);
  };

  const handleSetCustomFocusMinutes = (mins: number) => {
    setDurations(prev => {
      const updated = { ...prev, focus: mins };
      localStorage.setItem('df_timer_focus', String(mins));
      return updated;
    });
    handleSwitchMode('focus', mins);
  };

  // Quick add new task from inside Pomodoro
  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickTaskText.trim() || !onAddGoal) return;
    onAddGoal(newQuickTaskText.trim(), 'daily', '30m');
    setNewQuickTaskText('');
  };

  // Scratchpad save
  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalScratchpad(val);
    onSaveScratchpad(val);
  };

  // Insert code snippet template
  const handleInsertSnippet = (snippetType: 'code' | 'terminal' | 'todo' | 'bug') => {
    let snippet = '';
    if (snippetType === 'code') {
      snippet = `\n\`\`\`typescript\n// Implementation\n\n\`\`\`\n`;
    } else if (snippetType === 'terminal') {
      snippet = `\n$ npm run build\n$ git status\n`;
    } else if (snippetType === 'todo') {
      snippet = `\n- [ ] Immediate subtask:\n- [ ] Edge case check:\n`;
    } else if (snippetType === 'bug') {
      snippet = `\n### Root Cause Analysis\n- Symptom:\n- Trigger:\n- Fix:\n`;
    }
    const updated = localScratchpad + snippet;
    setLocalScratchpad(updated);
    onSaveScratchpad(updated);
  };

  // Copy scratchpad
  const handleCopyScratchpad = () => {
    navigator.clipboard.writeText(localScratchpad);
    setCopiedScratchpad(true);
    setTimeout(() => setCopiedScratchpad(false), 2000);
  };

  // Export scratchpad to daily journal
  const handleExportToJournal = () => {
    if (!onSaveJournal || !localScratchpad.trim()) return;
    const existingToday = journalEntries.find(j => j.id === todayDateStr);
    const existingText = existingToday?.text || '';
    const updatedJournalText = existingText 
      ? `${existingText}\n\n## Deep Work Session Reflection (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})\n${localScratchpad}`
      : `## Deep Work Session Reflection (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})\n${localScratchpad}`;
    
    onSaveJournal(todayDateStr, existingToday?.energy || 5, updatedJournalText);
    setJournalLogged(true);
    setTimeout(() => setJournalLogged(false), 3000);
  };

  // Subtask toggle inside active goal
  const handleToggleSubTask = (subIndex: number) => {
    if (!activeGoal || !onUpdateGoal || !activeGoal.subTasks) return;
    const updatedSubTasks = activeGoal.subTasks.map((st, idx) => {
      if (idx === subIndex) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });
    onUpdateGoal({
      ...activeGoal,
      subTasks: updatedSubTasks
    });
  };

  // Progress computation
  const progressRatio = totalSessionSeconds > 0 
    ? Math.max(0, Math.min(1, (totalSessionSeconds - timeLeft) / totalSessionSeconds)) 
    : 0;
  const progressPercentage = Math.round(progressRatio * 100);

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;
  const timeFormatted = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  return (
    <div className={`space-y-6 font-sans animate-fadeIn ${isZenMode ? 'fixed inset-0 z-50 bg-[#0b0c10] p-6 md:p-12 overflow-y-auto' : ''}`}>
      
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="glass-panel-true p-4 md:p-5 rounded-2xl border border-white/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1591DC]/15 border border-[#1591DC]/30 flex items-center justify-center text-[#1591DC] shadow-[0_0_20px_rgba(21,145,220,0.2)]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Pomodoro Deep Work Station
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1591DC]/15 text-[#1591DC] border border-[#1591DC]/30 uppercase tracking-wider">
                Full-Stack
              </span>
            </div>
            <p className="text-xs text-[#9496a1] mt-0.5">
              Uninterrupted flow state linked with tasks, habits & dev scratchpad
            </p>
          </div>
        </div>

        {/* Right Tools: Daily Stats & Zen Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Today's Focus KPI */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#9496a1] uppercase tracking-wider">Today:</span>
              <span className="font-bold text-white tabular-nums">
                {todaySessions.filter(s => s.mode === 'focus').length} / 8 blocks
              </span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1 text-[#1591DC]">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-semibold tabular-nums">
                {Math.floor(totalFocusMinutesToday / 60)}h {totalFocusMinutesToday % 60}m
              </span>
            </div>
          </div>

          {/* Zen Mode Button */}
          <button
            type="button"
            onClick={() => setIsZenMode(!isZenMode)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
              isZenMode 
                ? 'bg-[#1591DC] text-white border-[#1591DC] shadow-lg' 
                : 'bg-white/[0.03] border-white/[0.08] text-[#9496a1] hover:text-white hover:border-white/20'
            }`}
            title={isZenMode ? "Exit Zen Mode (Esc)" : "Enter Fullscreen Zen Mode"}
          >
            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isZenMode ? 'Exit Zen' : 'Zen Mode'}</span>
          </button>

          {/* Quick link to Tasks Database */}
          <button
            type="button"
            onClick={() => onNavigate('todo-hub')}
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#9496a1] hover:text-white hover:border-white/20 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            title="Switch to Tasks & Database View"
          >
            <Kanban className="w-3.5 h-3.5 text-[#1591DC]" />
            <span>Database</span>
          </button>
        </div>

      </div>

      {/* 2. MAIN 2-COLUMN WORKSPACE: LEFT = TIMER & OBJECTIVE, RIGHT = SCRATCHPAD & HABIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: SWISS MASTER TIMER & ACTIVE OBJECTIVE (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Master Swiss Timer Card */}
          <div className="glass-panel-true p-6 md:p-8 rounded-2xl border border-white/15 relative overflow-hidden flex flex-col items-center justify-center text-center space-y-6 shadow-2xl">
            
            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
              isRunning ? 'opacity-30 bg-[#1591DC]' : 'opacity-10 bg-white/10'
            }`} />

            {/* Mode Selectors */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] z-10">
              <button
                type="button"
                onClick={() => handleSwitchMode('focus')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'focus' 
                    ? 'bg-[#1591DC] text-white shadow-[0_0_15px_rgba(21,145,220,0.4)]' 
                    : 'text-[#9496a1] hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Deep Focus</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('short_break')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'short_break' 
                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                    : 'text-[#9496a1] hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Short Break</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('long_break')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'long_break' 
                    ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                    : 'text-[#9496a1] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Long Break</span>
              </button>
            </div>

            {/* Presets Row */}
            {mode === 'focus' && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 z-10">
                {[
                  { label: '25m', mins: 25 },
                  { label: '45m', mins: 45 },
                  { label: '50m', mins: 50 },
                  { label: '90m Ultradian', mins: 90 }
                ].map(p => (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => handleSetCustomFocusMinutes(p.mins)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium tabular-nums transition-all cursor-pointer ${
                      durations.focus === p.mins
                        ? 'bg-white/20 text-white border border-white/40 font-semibold'
                        : 'bg-white/[0.03] border border-white/[0.06] text-[#9496a1] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Circular Progress & Clock Face */}
            <div className="relative flex items-center justify-center w-64 h-64 md:w-72 md:h-72 my-2 select-none z-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Track Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-white/[0.06]"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                {/* Active Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className={`transition-all duration-1000 ${
                    mode === 'focus' ? 'stroke-[#1591DC]' : mode === 'short_break' ? 'stroke-emerald-400' : 'stroke-amber-400'
                  }`}
                  strokeWidth="4"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 * (1 - progressRatio)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Center Readout */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl md:text-6xl font-extrabold text-white tracking-tight tabular-nums font-sans drop-shadow-md">
                  {timeFormatted}
                </span>
                <span className={`text-xs uppercase tracking-widest font-semibold mt-2 ${
                  mode === 'focus' ? 'text-[#1591DC]' : mode === 'short_break' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {mode === 'focus' ? (isRunning ? 'In The Zone' : 'Ready to Focus') : 'Rest & Recharge'}
                </span>
                <span className="text-[11px] text-[#9496a1] mt-1 tabular-nums">
                  {progressPercentage}% completed
                </span>
              </div>
            </div>

            {/* Main Action Controls */}
            <div className="flex items-center gap-3 z-10">
              <button
                type="button"
                onClick={handleReset}
                className="p-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#9496a1] hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                title="Reset session (R)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleTimer}
                className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center gap-2 cursor-pointer ${
                  isRunning 
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' 
                    : 'btn-primary-cyan text-white shadow-[#1591DC]/30'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Flow</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Flow (Space)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAddFiveMinutes}
                className="px-3.5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-[#ededf3] hover:text-white hover:bg-white/[0.08] text-xs font-semibold tabular-nums transition-all cursor-pointer"
                title="Extend focus block by +5 minutes"
              >
                +5m
              </button>
            </div>

            {/* Ambient Soundscapes & Sound Generator Bar */}
            <div className="w-full pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs z-10">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#1591DC]" />
                <span className="font-semibold text-white">Focus Soundscapes:</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'off', label: 'Mute' },
                  { id: 'brown', label: 'Brown Noise' },
                  { id: 'rain', label: 'Rain Patter' },
                  { id: 'binaural', label: '10Hz Alpha' },
                  { id: 'white', label: 'White Noise' }
                ].map(snd => (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => handleAmbientChange(snd.id as AmbientSoundType)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      ambientSound === snd.id
                        ? 'bg-[#1591DC] text-white font-semibold shadow-sm'
                        : 'bg-white/[0.03] border border-white/[0.06] text-[#9496a1] hover:text-white'
                    }`}
                  >
                    {snd.label}
                  </button>
                ))}
              </div>

              {ambientSound !== 'off' && (
                <div className="flex items-center gap-2 pl-2">
                  <Volume2 className="w-3.5 h-3.5 text-[#9496a1]" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-20 accent-[#1591DC] cursor-pointer"
                    title="Ambient sound volume"
                  />
                </div>
              )}
            </div>

          </div>

          {/* ACTIVE OBJECTIVE CARD (LINKED WITH TASKS & DATABASE) */}
          <div className="glass-panel-true p-5 rounded-2xl border border-white/15 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1591DC] animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Target Deliverable (Locked In)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsTaskSelectorOpen(!isTaskSelectorOpen)}
                className="text-xs text-[#1591DC] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{activeGoal ? 'Change Task' : 'Select Task'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTaskSelectorOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Task Selector Dropdown Panel */}
            {isTaskSelectorOpen && (
              <div className="p-3 rounded-xl bg-[#0e1015] border border-white/[0.1] space-y-3 animate-fadeIn">
                <div className="text-xs text-[#9496a1] font-medium">
                  Select an active task from your database to anchor this focus session:
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {candidateTasks.length === 0 ? (
                    <div className="text-xs text-zinc-500 py-3 text-center">
                      No active tasks found in database. Create one below:
                    </div>
                  ) : (
                    candidateTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setActiveFocusGoalId(task.id);
                          setIsTaskSelectorOpen(false);
                        }}
                        className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          activeFocusGoalId === task.id
                            ? 'bg-[#1591DC]/20 text-white font-semibold border border-[#1591DC]/40'
                            : 'bg-white/[0.02] hover:bg-white/[0.06] text-[#ededf3]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Square className="w-3.5 h-3.5 text-[#9496a1] shrink-0" />
                          <span className="truncate">{cleanGoalText(task.text)}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#9496a1] shrink-0 capitalize">
                          {task.timeframe}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Add Task On The Fly */}
                <form onSubmit={handleCreateQuickTask} className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <input
                    type="text"
                    value={newQuickTaskText}
                    onChange={(e) => setNewQuickTaskText(e.target.value)}
                    placeholder="+ Add new task to Today's backlog..."
                    className="flex-1 bg-white/[0.03] border border-white/[0.08] focus:border-[#1591DC] px-3 py-1.5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-1.5 btn-primary-cyan text-white rounded-lg shrink-0 cursor-pointer"
                    title="Add task"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Display Locked In Task */}
            {activeGoal ? (
              <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.08] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleGoal(activeGoal.id, !activeGoal.completed)}
                      className="mt-0.5 text-[#9496a1] hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    >
                      {activeGoal.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <h4 className={`text-sm font-semibold leading-snug break-words ${
                        activeGoal.completed ? 'line-through text-[#9496a1]' : 'text-white'
                      }`}>
                        {cleanGoalText(activeGoal.text)}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#9496a1]">
                        <span className="capitalize text-zinc-400">
                          {activeGoal.timeframe} Roadmap
                        </span>
                        {activeGoal.priority && (
                          <>
                            <span>•</span>
                            <span className="text-[#1591DC] font-medium">{activeGoal.priority}</span>
                          </>
                        )}
                        {activeGoal.timeEstimate && (
                          <>
                            <span>•</span>
                            <span className="tabular-nums">{activeGoal.timeEstimate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleGoal(activeGoal.id, !activeGoal.completed)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      activeGoal.completed
                        ? 'bg-zinc-800 text-zinc-400'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{activeGoal.completed ? 'Done' : 'Mark Done'}</span>
                  </button>
                </div>

                {/* Interactive Subtasks in this Goal */}
                {activeGoal.subTasks && activeGoal.subTasks.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] text-[#9496a1] uppercase tracking-wider font-semibold">
                      Milestones ({activeGoal.subTasks.filter(s => s.completed).length}/{activeGoal.subTasks.length}):
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {activeGoal.subTasks.map((st, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleToggleSubTask(idx)}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/[0.03] cursor-pointer text-xs transition-colors"
                        >
                          {st.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-[#9496a1] shrink-0" />
                          )}
                          <span className={st.completed ? 'line-through text-[#9496a1]' : 'text-[#ededf3]'}>
                            {st.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 px-4 text-center rounded-xl border border-dashed border-white/[0.1] bg-[#0e1015] space-y-2">
                <p className="text-xs font-medium text-[#ededf3]">No target task selected</p>
                <p className="text-[11px] text-[#9496a1]">
                  Click "Select Task" above to link a deliverable from your database to this focus session.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: DEV SCRATCHPAD, HABIT MATRIX LINK & SESSION LOG (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* FULL-STACK DEV SCRATCHPAD & NOTES */}
          <div className="glass-panel-true p-5 rounded-2xl border border-white/15 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1591DC]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Dev Scratchpad & Code Snippets
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyScratchpad}
                  className="p-1.5 rounded-lg text-[#9496a1] hover:text-white bg-white/[0.03] hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Copy scratchpad content"
                >
                  {copiedScratchpad ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleExportToJournal}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    journalLogged
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#9496a1] hover:text-white border border-white/[0.08]'
                  }`}
                  title="Log scratchpad notes to Today's Daily Journal"
                >
                  <BookOpen className="w-3 h-3 text-[#1591DC]" />
                  <span>{journalLogged ? 'Logged to Journal!' : 'Send to Journal'}</span>
                </button>
              </div>
            </div>

            {/* Quick Insertion Helpers */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => handleInsertSnippet('code')}
                className="px-2 py-0.5 rounded text-[10px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[#9496a1] hover:text-white transition-colors cursor-pointer"
              >
                + Code Block
              </button>
              <button
                type="button"
                onClick={() => handleInsertSnippet('terminal')}
                className="px-2 py-0.5 rounded text-[10px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[#9496a1] hover:text-white transition-colors cursor-pointer"
              >
                + Commands
              </button>
              <button
                type="button"
                onClick={() => handleInsertSnippet('todo')}
                className="px-2 py-0.5 rounded text-[10px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[#9496a1] hover:text-white transition-colors cursor-pointer"
              >
                + Subtasks
              </button>
              <button
                type="button"
                onClick={() => handleInsertSnippet('bug')}
                className="px-2 py-0.5 rounded text-[10px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[#9496a1] hover:text-white transition-colors cursor-pointer"
              >
                + RCA Log
              </button>
            </div>

            {/* Editor Area */}
            <textarea
              value={localScratchpad}
              onChange={handleScratchpadChange}
              placeholder="Dump quick thoughts, SQL queries, CLI commands, API payloads, or bug hypotheses here... Auto-saved continuously."
              className="w-full h-44 bg-[#0e1015] border border-white/[0.08] focus:border-[#1591DC] p-3 text-xs text-[#ededf3] font-mono leading-relaxed rounded-xl focus:outline-none resize-none transition-colors"
            />
            <div className="flex justify-between items-center text-[10px] text-[#9496a1] pt-1">
              <span>Auto-saved to Cloud & LocalStorage</span>
              <span>{localScratchpad.length} chars</span>
            </div>
          </div>

          {/* HABIT MATRIX INTEGRATION CARD */}
          {deepWorkHabit && (
            <div className="glass-panel-true p-5 rounded-2xl border border-white/15 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Habit Matrix Link
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('habit-matrix')}
                  className="text-[11px] text-[#1591DC] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Habits Tab</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e1015] border border-white/[0.08] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {deepWorkHabit.habitName}
                  </h4>
                  <p className="text-[10px] text-[#9496a1] mt-0.5">
                    {deepWorkHabit.completedDays.length} days completed this month
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleHabitDay && onToggleHabitDay(deepWorkHabit.id, todayDayNumber)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isHabitCheckedToday
                      ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-[#ededf3] border border-white/[0.1]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isHabitCheckedToday ? 'Checked Today' : 'Check In'}</span>
                </button>
              </div>
            </div>
          )}

          {/* DAILY FOCUS SESSION LOG */}
          <div className="glass-panel-true p-5 rounded-2xl border border-white/15 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Today's Session Log
                </h3>
              </div>
              <span className="text-[11px] text-[#9496a1] tabular-nums font-semibold">
                {todaySessions.length} total
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {todaySessions.length === 0 ? (
                <div className="text-xs text-[#9496a1] py-6 text-center border border-dashed border-white/[0.06] rounded-xl">
                  No completed sessions yet today. Start the timer to log your first block!
                </div>
              ) : (
                todaySessions.map(session => (
                  <div
                    key={session.id}
                    className="p-2.5 rounded-xl bg-[#0e1015] border border-white/[0.06] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${
                        session.mode === 'focus' ? 'bg-[#1591DC]' : 'bg-emerald-400'
                      }`} />
                      <span className="text-white font-medium truncate">
                        {session.taskTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[#9496a1] tabular-nums text-[11px]">
                      <span>{session.durationMinutes}m</span>
                      <span>•</span>
                      <span>
                        {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
