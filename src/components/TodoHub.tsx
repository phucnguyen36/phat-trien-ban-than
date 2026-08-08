/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GoalTodo, TimeframeType, TimeEstimate } from '../types';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  Calendar as CalendarIcon, 
  Sliders, 
  LayoutGrid, 
  CalendarDays,
  Check,
  Play,
  Pause,
  Repeat,
  Clock,
  BarChart3,
  Zap,
  Key,
  Ban,
  Target,
  AlertCircle,
  RefreshCw,
  X,
  Pencil
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TodoHubProps {
  goals: GoalTodo[];
  onAddGoal: (text: string, timeframe: TimeframeType, timeEstimate?: TimeEstimate) => void;
  onToggleGoal: (id: string, completed: boolean) => void;
  onDeleteGoal: (id: string) => void;
  onEditGoal?: (id: string, newText: string) => void;
  isLightMode?: boolean;
}

export default function TodoHub({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onEditGoal,
  isLightMode
}: TodoHubProps) {
  // View mode toggle: Multi-column view vs Calendar Grid view vs Weekly/Monthly Review Dashboard
  const [viewMode, setViewMode] = useState<'columns' | 'calendar' | 'review'>('columns');

  // Calculate current actual date for Today highlight and default selection
  const today = useMemo(() => new Date(), []);
  const todayDayStr = useMemo(() => String(today.getDate()).padStart(2, '0'), [today]);
  const todayMonthStr = useMemo(() => String(today.getMonth() + 1).padStart(2, '0'), [today]);
  const todayYearStr = useMemo(() => String(today.getFullYear()), [today]);
  const todayWeekStr = useMemo(() => `W${Math.ceil(today.getDate() / 7)}`, [today]);

  const [selectedYear, setSelectedYear] = useState(todayYearStr);
  const [selectedMonth, setSelectedMonth] = useState(todayMonthStr);
  const [selectedWeek, setSelectedWeek] = useState(todayWeekStr);
  const [selectedDay, setSelectedDay] = useState(todayDayStr);

  const isTodayActive = useMemo(() => {
    return selectedDay === todayDayStr && selectedMonth === todayMonthStr && selectedYear === todayYearStr;
  }, [selectedDay, selectedMonth, selectedYear, todayDayStr, todayMonthStr, todayYearStr]);

  const weekRangeStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diffToMon));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    return `FROM '${fmt(mon)}' TO '${fmt(sun)}'`;
  }, []);

  const monthNameStr = useMemo(() => {
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const idx = parseInt(selectedMonth) - 1;
    return months[idx] || months[today.getMonth()];
  }, [selectedMonth, today]);

  // Filters for Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<TimeframeType, boolean>>({
    daily: true,
    weekly: true,
    monthly: true,
    yearly: true
  });

  // Individual column Quick-add input states
  const [inputs, setInputs] = useState<Record<TimeframeType, string>>({
    daily: '',
    weekly: '',
    monthly: '',
    yearly: ''
  });

  // A1 — Time Estimate state per column
  const TIME_ESTIMATES: { value: TimeEstimate; label: string; color: string }[] = [
    { value: '15m', label: '15m', color: 'text-emerald-400' },
    { value: '30m', label: '30m', color: 'text-emerald-400' },
    { value: '1h', label: '1h', color: 'text-amber-400' },
    { value: '2h', label: '2h', color: 'text-amber-400' },
    { value: 'half-day', label: '½day', color: 'text-red-400' },
  ];
  const [estimates, setEstimates] = useState<Record<TimeframeType, TimeEstimate | ''>>({ daily: '', weekly: '', monthly: '', yearly: '' });

  // B2 — Live Stopwatch Timer State
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<Record<string, number>>({});

  // Timer Tick Effect
  React.useEffect(() => {
    if (!activeTimerId) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => ({
        ...prev,
        [activeTimerId]: (prev[activeTimerId] || 0) + 1
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimerId]);

  // C2 — Recurring Tasks State (in-memory toggle)
  const [recurringTasks, setRecurringTasks] = useState<Record<string, boolean>>({});
  const toggleRecurring = (id: string) => {
    setRecurringTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Inline Editing Goal State
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState('');

  const handleStartEditGoal = (goal: GoalTodo) => {
    setEditingGoalId(goal.id);
    setEditingGoalText(getDisplayGoalText(goal.text));
  };

  const handleSaveEditGoal = (id: string) => {
    if (editingGoalText.trim() && onEditGoal) {
      onEditGoal(id, editingGoalText.trim());
    }
    setEditingGoalId(null);
  };

  // Calendar Quick-Add Input state
  const [calendarInputText, setCalendarInputText] = useState('');

  // Column Toggle Handler
  const toggleColumnVisibility = (tf: TimeframeType) => {
    setVisibleColumns(prev => ({ ...prev, [tf]: !prev[tf] }));
  };

  // Context Key Formatting
  const getContextKey = (timeframe: TimeframeType): string => {
    if (timeframe === 'daily') return `${selectedYear}-${selectedMonth}-${selectedDay}`;
    if (timeframe === 'weekly') return `${selectedYear}-${selectedMonth}-${selectedWeek}`;
    if (timeframe === 'monthly') return `${selectedYear}-${selectedMonth}`;
    if (timeframe === 'yearly') return `${selectedYear}`;
    return '';
  };

  // Filtered goals by Context
  const filteredGoals = useMemo(() => {
    const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;
    const activeCtxKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;

    return goals.filter(g => {
      const text = g.text;

      if (g.timeframe === 'daily') {
        if (text.startsWith(`[D:${activeCtxKey}]`)) return true;
        if (!text.startsWith('[D:') && activeCtxKey === todayCtxKey) return true;
        return false;
      }

      if (g.timeframe === 'weekly') {
        const ctxKey = `${selectedYear}-${selectedMonth}-${selectedWeek}`;
        const todayWeekKey = `${todayYearStr}-${todayMonthStr}-${todayWeekStr}`;
        if (text.startsWith(`[W:${ctxKey}]`)) return true;
        if (!text.startsWith('[W:') && ctxKey === todayWeekKey) return true;
        return false;
      }

      if (g.timeframe === 'monthly') {
        const ctxKey = `${selectedYear}-${selectedMonth}`;
        const todayMonthKey = `${todayYearStr}-${todayMonthStr}`;
        if (text.startsWith(`[M:${ctxKey}]`)) return true;
        if (!text.startsWith('[M:') && ctxKey === todayMonthKey) return true;
        return false;
      }

      if (g.timeframe === 'yearly') {
        const ctxKey = `${selectedYear}`;
        if (text.startsWith(`[Y:${ctxKey}]`)) return true;
        if (!text.startsWith('[Y:')) return true;
        return false;
      }

      return true;
    });
  }, [goals, selectedYear, selectedMonth, selectedWeek, selectedDay, todayYearStr, todayMonthStr, todayDayStr, todayWeekStr]);

  // Overdue / Incomplete Goals Reminder Logic
  const overdueIncompleteGoals = useMemo(() => {
    const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;
    return goals.filter(g => {
      if (g.completed) return false;
      if (g.timeframe === 'daily' && g.text.startsWith('[D:')) {
        const match = g.text.match(/^\[D:(\d{4}-\d{2}-\d{2})\]/);
        if (match && match[1] < todayCtxKey) return true;
      }
      return false;
    });
  }, [goals, todayYearStr, todayMonthStr, todayDayStr]);

  const [isOverdueBannerDismissed, setIsOverdueBannerDismissed] = useState(false);

  // Rollover all overdue tasks to today
  const handleRolloverOverdueGoals = async () => {
    const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;
    for (const g of overdueIncompleteGoals) {
      const cleanText = g.text.replace(/^\[D:\d{4}-\d{2}-\d{2}\]\s*/, '');
      await onAddGoal(`[D:${todayCtxKey}] ${cleanText}`, g.timeframe);
      await onDeleteGoal(g.id);
    }
  };

  // Strip context tag from display text
  const getDisplayGoalText = (text: string): string => {
    return text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '');
  };

  // Submit Goal
  const handleAdd = (e: React.FormEvent, timeframe: TimeframeType) => {
    e.preventDefault();
    const val = inputs[timeframe].trim();
    if (!val) return;

    const ctxKey = getContextKey(timeframe);
    let tag = '';
    if (timeframe === 'daily') tag = `[D:${ctxKey}] `;
    if (timeframe === 'weekly') tag = `[W:${ctxKey}] `;
    if (timeframe === 'monthly') tag = `[M:${ctxKey}] `;
    if (timeframe === 'yearly') tag = `[Y:${ctxKey}] `;

    const est = estimates[timeframe] || undefined;
    onAddGoal(`${tag}${val}`, timeframe, est as TimeEstimate | undefined);
    setInputs(prev => ({ ...prev, [timeframe]: '' }));
    setEstimates(prev => ({ ...prev, [timeframe]: '' }));
  };

  // Calendar Add Goal
  const handleCalendarAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarInputText.trim()) return;

    const ctxKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    const tag = `[D:${ctxKey}] `;
    onAddGoal(`${tag}${calendarInputText.trim()}`, 'daily');
    setCalendarInputText('');
  };

  // Calculate Win Rates
  const stats = useMemo(() => {
    const timeframes: TimeframeType[] = ['daily', 'weekly', 'monthly', 'yearly'];
    const result: Record<TimeframeType, { total: number; completed: number; rate: number }> = {
      daily: { total: 0, completed: 0, rate: 0 },
      weekly: { total: 0, completed: 0, rate: 0 },
      monthly: { total: 0, completed: 0, rate: 0 },
      yearly: { total: 0, completed: 0, rate: 0 },
    };

    timeframes.forEach(tf => {
      const scopeGoals = filteredGoals.filter(g => g.timeframe === tf);
      const total = scopeGoals.length;
      const completed = scopeGoals.filter(g => g.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      result[tf] = { total, completed, rate };
    });

    return result;
  }, [filteredGoals]);

  // Calendar Grid Data Setup
  const calendarDays = useMemo(() => {
    const y = parseInt(selectedYear);
    const m = parseInt(selectedMonth);
    if (isNaN(y) || isNaN(m)) return { totalDays: 31, startDayOfWeek: 0, daysArray: [] };

    const totalDays = new Date(y, m, 0).getDate();
    const startDayOfWeek = new Date(y, m - 1, 1).getDay();

    const daysArray = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dayStr = String(dayNum).padStart(2, '0');
      const ctxKey = `${selectedYear}-${selectedMonth}-${dayStr}`;

      const dayGoals = goals.filter(g => {
        if (g.timeframe !== 'daily') return false;
        if (g.text.startsWith(`[D:${ctxKey}]`)) return true;
        if (!g.text.startsWith('[D:') && ctxKey === '2026-07-16') return true;
        return false;
      });

      const total = dayGoals.length;
      const completed = dayGoals.filter(g => g.completed).length;

      return {
        dayNum,
        dayStr,
        ctxKey,
        dayGoals,
        total,
        completed,
        isToday: dayStr === todayDayStr && selectedMonth === todayMonthStr && selectedYear === todayYearStr,
        isSelected: dayStr === selectedDay
      };
    });

    return { totalDays, startDayOfWeek, daysArray };
  }, [selectedYear, selectedMonth, goals, todayDayStr, todayMonthStr, todayYearStr, selectedDay]);

  const renderColumn = (
    timeframe: TimeframeType, 
    label: string, 
    accentClass: string, 
    glowClass: string,
    barColor: string,
    activeContextDisplay: string
  ) => {
    const list = filteredGoals.filter(g => g.timeframe === timeframe);
    const { rate } = stats[timeframe];
    const isThisDailyAndToday = timeframe === 'daily' && isTodayActive;

    return (
      <div className={`flex flex-col justify-between p-6 md:p-7 min-h-[460px] w-full border transition-all duration-300 glass-panel-true ${
        isThisDailyAndToday ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : ''
      }`}>
        
        <div>
          {/* Column Header */}
          <div className="flex justify-between items-baseline mb-3">
            <h3 className="text-base font-bold tracking-tight text-white flex items-baseline gap-1.5 font-sans">
              <span>{label} Objectives</span>
              {isThisDailyAndToday && (
                <span className="ml-1.5 px-2 py-0.5 text-[9px] glass-pill-true text-emerald-300 font-bold uppercase animate-pulse">Today</span>
              )}
            </h3>
            <span className={`font-mono text-[11px] uppercase tracking-widest font-extrabold ${isThisDailyAndToday ? 'text-emerald-400' : accentClass}`}>
              {rate}% WIN
            </span>
          </div>

          {/* Dynamic Context Tag */}
          <div className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-semibold">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Scope: {activeContextDisplay}</span>
          </div>

          {timeframe === 'weekly' && (
            <div className="text-[10px] text-zinc-400 font-mono mb-4 uppercase tracking-wider">
              {weekRangeStr}
            </div>
          )}

          {/* Progress Bar Line */}
          <div className="h-1 w-full bg-black/40 rounded-full mb-6 overflow-hidden border border-white/10">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
              style={{ width: `${rate}%` }}
            />
          </div>

          {/* Quick Add Form */}
          <form onSubmit={(e) => handleAdd(e, timeframe)} className="mb-6 flex flex-col gap-2 w-full">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputs[timeframe]}
                onChange={(e) => setInputs(prev => ({ ...prev, [timeframe]: e.target.value }))}
                placeholder={`Add ${label.toLowerCase()} objective...`}
                className="w-full glass-input-true px-3 py-2 text-xs text-white placeholder-zinc-500 font-sans"
              />
              <button 
                type="submit"
                className="p-2 glass-button-true text-white transition-all flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {/* A1 — Time Estimate Quick Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">⏱ Est:</span>
              {TIME_ESTIMATES.map(({ value, label: lbl, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEstimates(prev => ({ ...prev, [timeframe]: prev[timeframe] === value ? '' : value }))}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                    estimates[timeframe] === value
                      ? `border-current bg-white/10 ${color}`
                      : 'border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </form>

          {/* To-Do Items List */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {list.length === 0 ? (
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest py-8 text-center glass-card-true">
                No objectives set
              </div>
            ) : (
              list.map(g => {
                const estMeta = g.timeEstimate ? TIME_ESTIMATES.find(e => e.value === g.timeEstimate) : null;
                const isTimerRunning = activeTimerId === g.id;
                const secs = timerSeconds[g.id] || 0;
                const mins = Math.floor(secs / 60);
                const remainingSecs = secs % 60;
                const timeStr = `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
                const isRec = recurringTasks[g.id] || g.isRecurring;

                return (
                  <div 
                    key={g.id} 
                    className={`group flex items-start justify-between gap-3 p-3 glass-card-true transition-all ${
                      isTimerRunning ? 'border-amber-500/50 bg-amber-500/10' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleGoal(g.id, !g.completed)}
                      className="mt-0.5 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                    >
                      {g.completed ? (
                        <CheckSquare className={`w-4 h-4 ${accentClass}`} />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingGoalId === g.id ? (
                        <div className="flex items-center gap-1 my-0.5">
                          <input
                            type="text"
                            value={editingGoalText}
                            onChange={(e) => setEditingGoalText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditGoal(g.id);
                              if (e.key === 'Escape') setEditingGoalId(null);
                            }}
                            className="w-full glass-input-true px-2 py-1 text-xs text-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditGoal(g.id)}
                            className="p-1 glass-button-true text-emerald-400 text-xs font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGoalId(null)}
                            className="p-1 text-zinc-400 hover:text-white text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEditGoal(g)}
                          className={`text-xs break-words whitespace-normal leading-relaxed transition-all duration-300 font-medium block cursor-pointer ${
                            g.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'
                          }`}
                          title="Double-click to edit goal"
                        >
                          {getDisplayGoalText(g.text)}
                        </span>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {/* A1 — Time Estimate Badge */}
                        {estMeta && (
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono font-bold ${estMeta.color} opacity-80`}>
                            ⏱ {estMeta.label}
                          </span>
                        )}
                        {/* B2 — Live Timer Badge */}
                        {secs > 0 && (
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono font-bold ${isTimerRunning ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`}>
                            <Clock className="w-3 h-3" /> {timeStr}
                          </span>
                        )}
                        {/* C2 — Recurring Badge */}
                        {isRec && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-1 rounded">
                            🔁 Auto-Reset
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: B2 Timer, C2 Repeat, Edit, Delete */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEditGoal(g)}
                        className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
                        title="Edit Goal Name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* B2 Stopwatch Button */}
                      <button
                        type="button"
                        onClick={() => setActiveTimerId(isTimerRunning ? null : g.id)}
                        className={`p-1 rounded transition-colors ${
                          isTimerRunning 
                            ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30' 
                            : 'text-zinc-500 hover:text-amber-300'
                        }`}
                        title={isTimerRunning ? 'Pause Stopwatch' : 'Start Time Tracking'}
                      >
                        {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      {/* C2 Recurring Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleRecurring(g.id)}
                        className={`p-1 rounded transition-colors ${
                          isRec ? 'text-sky-400' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                        title="Toggle Recurring Task (Auto-Reset)"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(g.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors focus:outline-none p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="todo-hub" className="p-6 md:p-8 glass-panel-true mb-12 border border-white/15 shadow-2xl">
      
      {/* Overdue / Incomplete Target Reminder Banner */}
      {!isOverdueBannerDismissed && overdueIncompleteGoals.length > 0 && (
        <div className="mb-6 p-4 glass-card-true border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-950/20 animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
                Pending Targets Reminder ({overdueIncompleteGoals.length} Overdue)
              </h4>
              <p className="text-zinc-300 text-xs mt-0.5 font-sans">
                You have {overdueIncompleteGoals.length} incomplete daily target{overdueIncompleteGoals.length > 1 ? 's' : ''} from previous days.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRolloverOverdueGoals}
              className="px-3 py-1.5 glass-button-true text-amber-300 hover:text-amber-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ROLLOVER TO TODAY</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOverdueBannerDismissed(true)}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
              title="Dismiss Reminder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Module Title & Mode Switcher Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-white/15 pb-6">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white uppercase font-sans">
            Tactical Roadmap & To-Do Hub
          </h2>
          <p className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase mt-1 font-semibold">
            MULTI-TIER TARGET MANAGEMENT: YEAR • MONTH • WEEK • DAY
          </p>
        </div>

        {/* View Mode Switcher + Context Control */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* View Mode Toggle Switch */}
          <div className="flex items-center glass-pill-true p-1">
            <button
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-full ${
                viewMode === 'columns'
                  ? 'bg-white/20 text-white font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>COLUMNS</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-full ${
                viewMode === 'calendar'
                  ? 'bg-sky-500/30 text-sky-200 font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>CALENDAR</span>
            </button>
            <button
              onClick={() => setViewMode('review')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all rounded-full ${
                viewMode === 'review'
                  ? 'bg-white/20 text-white font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>WEEKLY & MONTHLY REVIEW</span>
            </button>
          </div>

          {/* Date Context Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 glass-pill-true p-1.5">
            {/* Year */}
            <div className="flex items-center gap-1 glass-card-true px-2.5 py-1">
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">YEAR:</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer font-bold"
              >
                {['2025', '2026', '2027', '2028'].map(y => <option key={y} value={y} className="bg-black text-white">{y}</option>)}
              </select>
            </div>

            {/* Month */}
            <div className="flex items-center gap-1 glass-card-true px-2.5 py-1">
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">MONTH:</span>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer font-bold"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m} className="bg-black text-white">{m}</option>
                ))}
              </select>
            </div>

            {/* Week */}
            <div className="flex items-center gap-1 glass-card-true px-2.5 py-1">
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">WEEK:</span>
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer font-bold"
              >
                {['W1', 'W2', 'W3', 'W4', 'W5'].map(w => <option key={w} value={w} className="bg-black text-white">{w.replace('W', 'Week ')}</option>)}
              </select>
            </div>

            {/* Day */}
            <div className={`flex items-center gap-1 glass-card-true px-2.5 py-1 transition-colors ${
              isTodayActive ? 'bg-emerald-500/20 border-emerald-400/50' : ''
            }`}>
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">DAY:</span>
              <select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer font-bold"
              >
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                  <option key={d} value={d} className="bg-black text-white">{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Mode Rendering */}
      {viewMode === 'columns' ? (
        <>
          {/* Columns Visibility Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-3 glass-card-true">
            <span className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase font-bold">
              COLUMNS VISIBILITY:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleColumnVisibility('daily')}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full transition-all ${
                  visibleColumns.daily 
                    ? 'glass-pill-true text-sky-300 font-bold border-sky-400/40' 
                    : 'opacity-40 text-zinc-500'
                }`}
              >
                ● Day
              </button>
              <button
                onClick={() => toggleColumnVisibility('weekly')}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full transition-all ${
                  visibleColumns.weekly 
                    ? 'glass-pill-true text-purple-300 font-bold border-purple-400/40' 
                    : 'opacity-40 text-zinc-500'
                }`}
              >
                ● Week
              </button>
              <button
                onClick={() => toggleColumnVisibility('monthly')}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full transition-all ${
                  visibleColumns.monthly 
                    ? 'glass-pill-true text-amber-300 font-bold border-amber-400/40' 
                    : 'opacity-40 text-zinc-500'
                }`}
              >
                ● Month
              </button>
              <button
                onClick={() => toggleColumnVisibility('yearly')}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full transition-all ${
                  visibleColumns.yearly 
                    ? 'glass-pill-true text-emerald-300 font-bold border-emerald-400/40' 
                    : 'opacity-40 text-zinc-500'
                }`}
              >
                ● Year
              </button>
            </div>
          </div>

          {/* Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleColumns.daily && renderColumn('daily', 'Day', 'text-sky-300', 'glow-sky', 'bg-sky-400', `${selectedYear}-${selectedMonth}-${selectedDay}`)}
            {visibleColumns.weekly && renderColumn('weekly', 'Week', 'text-purple-300', 'glow-purple', 'bg-purple-400', `${selectedYear}-${selectedMonth}-${selectedWeek}`)}
            {visibleColumns.monthly && renderColumn('monthly', 'Month', 'text-amber-300', 'glow-amber', 'bg-amber-400', `${selectedYear}-${selectedMonth}`)}
            {visibleColumns.yearly && renderColumn('yearly', 'Year', 'text-emerald-300', 'glow-emerald', 'bg-emerald-400', `${selectedYear}`)}
          </div>
        </>
      ) : (
        /* Calendar View Mode */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 glass-card-true">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-sky-300 font-extrabold block">
                MONTHLY CALENDAR MATRIX • {monthNameStr} {selectedYear}
              </span>
              <span className="text-[10px] font-mono text-zinc-300">
                Click any day to view or add daily objectives
              </span>
            </div>

            <form onSubmit={handleCalendarAdd} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={calendarInputText}
                onChange={(e) => setCalendarInputText(e.target.value)}
                placeholder={`Add objective for Day ${selectedDay}...`}
                className="w-full md:w-72 glass-input-true px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 glass-button-true text-xs uppercase tracking-widest font-bold text-white flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>ADD</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-bold uppercase text-zinc-300">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className="p-2 glass-pill-true">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: calendarDays.startDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[90px] opacity-10 glass-card-true" />
            ))}

            {calendarDays.daysArray.map(day => (
              <div
                key={day.dayStr}
                onClick={() => setSelectedDay(day.dayStr)}
                className={`min-h-[90px] p-2 glass-card-true cursor-pointer transition-all flex flex-col justify-between ${
                  day.isSelected ? 'border-sky-400 bg-sky-500/20 shadow-lg' : ''
                } ${day.isToday ? 'border-emerald-400 bg-emerald-500/20' : ''}`}
              >
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className={day.isToday ? 'text-emerald-300 font-black' : day.isSelected ? 'text-sky-300' : 'text-white'}>
                    {day.dayNum}
                  </span>
                  {day.total > 0 && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                      day.completed === day.total ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/20 text-white'
                    }`}>
                      {day.completed}/{day.total}
                    </span>
                  )}
                </div>

                <div className="space-y-1 my-1 overflow-hidden max-h-[45px]">
                  {day.dayGoals.slice(0, 2).map(g => (
                    <div key={g.id} className="text-[9px] font-sans truncate text-zinc-300">
                      • {getDisplayGoalText(g.text)}
                    </div>
                  ))}
                  {day.dayGoals.length > 2 && (
                    <div className="text-[8px] font-mono text-sky-300 font-bold">
                      +{day.dayGoals.length - 2} more
                    </div>
                  )}
                </div>

                <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400"
                    style={{ width: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ---------------------------------------------------- */}
      {/* 3. WEEKLY & MONTHLY REVIEW DASHBOARD MODE */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'review' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Review Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(() => {
              const dailyCount = goals.filter(g => g.timeframe === 'daily').length;
              const dailyDone = goals.filter(g => g.timeframe === 'daily' && g.completed).length;
              const weeklyCount = goals.filter(g => g.timeframe === 'weekly').length;
              const weeklyDone = goals.filter(g => g.timeframe === 'weekly' && g.completed).length;
              const monthlyCount = goals.filter(g => g.timeframe === 'monthly').length;
              const monthlyDone = goals.filter(g => g.timeframe === 'monthly' && g.completed).length;

              return [
                { label: 'Daily Win Rate', done: dailyDone, total: dailyCount, color: 'text-emerald-400' },
                { label: 'Weekly Execution', done: weeklyDone, total: weeklyCount, color: 'text-violet-400' },
                { label: 'Monthly Targets', done: monthlyDone, total: monthlyCount, color: 'text-amber-400' },
              ].map(s => {
                const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <div key={s.label} className="p-4 glass-card-true border border-white/10 rounded-2xl text-center space-y-1">
                    <div className={`text-3xl font-black font-mono ${s.color}`}>{pct}%</div>
                    <div className="text-xs font-semibold text-white uppercase tracking-wider">{s.label}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{s.done} completed / {s.total} total</div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Bar Chart: Target Completion Velocity */}
          <div className="glass-card-true p-6 border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-300" />
              <span>Target Velocity Dashboard (Completion rate by Tier)</span>
            </h3>
            <div className="h-64 relative">
              <Bar 
                data={{
                  labels: ['Daily Tasks', 'Weekly Goals', 'Monthly Objectives', 'Yearly Vision'],
                  datasets: [
                    {
                      label: 'Completed Tasks',
                      data: [
                        goals.filter(g => g.timeframe === 'daily' && g.completed).length,
                        goals.filter(g => g.timeframe === 'weekly' && g.completed).length,
                        goals.filter(g => g.timeframe === 'monthly' && g.completed).length,
                        goals.filter(g => g.timeframe === 'yearly' && g.completed).length,
                      ],
                      backgroundColor: 'rgba(167, 139, 250, 0.7)',
                      borderColor: '#a78bfa',
                      borderWidth: 1,
                    },
                    {
                      label: 'Pending Tasks',
                      data: [
                        goals.filter(g => g.timeframe === 'daily' && !g.completed).length,
                        goals.filter(g => g.timeframe === 'weekly' && !g.completed).length,
                        goals.filter(g => g.timeframe === 'monthly' && !g.completed).length,
                        goals.filter(g => g.timeframe === 'yearly' && !g.completed).length,
                      ],
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                    }
                  ]
                }} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: '#e4e4e7', font: { family: 'Inter', size: 10 } } }
                  },
                  scales: {
                    x: { ticks: { color: '#a1a1aa', font: { family: 'Inter', size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#a1a1aa', font: { family: 'Inter', size: 10 } }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                  }
                }} 
              />
            </div>
          </div>

          {/* Weekly Reflection Questions */}
          <div className="glass-card-true p-6 border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-300" />
              <span>Weekly & Monthly Review Reflections</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Key, q: 'Highest Leverage Win', key: `df_weekly_review_q0_${new Date().getFullYear()}` },
                { icon: Ban, q: 'Biggest Time Waster', key: `df_weekly_review_q1_${new Date().getFullYear()}` },
                { icon: Target, q: 'Next Focus Priority', key: `df_weekly_review_q2_${new Date().getFullYear()}` },
              ].map((item) => {
                const IconComp = item.icon;
                return (
                  <div key={item.key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{item.q}</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter reflection note..."
                      className="w-full glass-input-true p-3 text-xs text-white rounded-xl resize-none font-sans"
                      onChange={(e) => localStorage.setItem(item.key, e.target.value)}
                      defaultValue={localStorage.getItem(item.key) || ''}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
