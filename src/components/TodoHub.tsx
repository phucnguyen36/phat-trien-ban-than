/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GoalTodo, TimeframeType } from '../types';
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
  Check
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TodoHubProps {
  goals: GoalTodo[];
  onAddGoal: (text: string, timeframe: TimeframeType) => void;
  onToggleGoal: (id: string, completed: boolean) => void;
  onDeleteGoal: (id: string) => void;
  isLightMode?: boolean;
}

export default function TodoHub({ goals, onAddGoal, onToggleGoal, onDeleteGoal, isLightMode }: TodoHubProps) {
  // View mode toggle: Multi-column view vs Calendar Grid view
  const [viewMode, setViewMode] = useState<'columns' | 'calendar'>('columns');

  // Current local date defaults to 2026-07-16
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('07');
  const [selectedWeek, setSelectedWeek] = useState('W3');
  const [selectedDay, setSelectedDay] = useState('16');

  // Calculate current actual date for Today highlight
  const today = useMemo(() => new Date(), []);
  const todayDayStr = useMemo(() => String(today.getDate()).padStart(2, '0'), [today]);
  const todayMonthStr = useMemo(() => String(today.getMonth() + 1).padStart(2, '0'), [today]);
  const todayYearStr = useMemo(() => String(today.getFullYear()), [today]);

  const isTodayActive = useMemo(() => {
    return selectedDay === todayDayStr && selectedMonth === todayMonthStr && selectedYear === todayYearStr;
  }, [selectedDay, selectedMonth, selectedYear, todayDayStr, todayMonthStr, todayYearStr]);

  const weekRangeStr = useMemo(() => {
    return `FROM '15/07/2026' TO '21/07/2026'`;
  }, []);

  const monthNameStr = useMemo(() => {
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const idx = parseInt(selectedMonth) - 1;
    return months[idx] || 'JULY';
  }, [selectedMonth]);

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
    return goals.filter(g => {
      const text = g.text;

      if (g.timeframe === 'daily') {
        const ctxKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
        if (text.startsWith(`[D:${ctxKey}]`)) return true;
        if (!text.startsWith('[D:') && ctxKey === '2026-07-16') return true;
        return false;
      }

      if (g.timeframe === 'weekly') {
        const ctxKey = `${selectedYear}-${selectedMonth}-${selectedWeek}`;
        if (text.startsWith(`[W:${ctxKey}]`)) return true;
        if (!text.startsWith('[W:') && ctxKey === '2026-07-W3') return true;
        return false;
      }

      if (g.timeframe === 'monthly') {
        const ctxKey = `${selectedYear}-${selectedMonth}`;
        if (text.startsWith(`[M:${ctxKey}]`)) return true;
        if (!text.startsWith('[M:') && ctxKey === '2026-07') return true;
        return false;
      }

      if (g.timeframe === 'yearly') {
        const ctxKey = `${selectedYear}`;
        if (text.startsWith(`[Y:${ctxKey}]`)) return true;
        if (!text.startsWith('[Y:') && ctxKey === '2026') return true;
        return false;
      }

      return true;
    });
  }, [goals, selectedYear, selectedMonth, selectedWeek, selectedDay]);

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

    onAddGoal(`${tag}${val}`, timeframe);
    setInputs(prev => ({ ...prev, [timeframe]: '' }));
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
          <form onSubmit={(e) => handleAdd(e, timeframe)} className="mb-6 flex gap-2 w-full">
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
          </form>

          {/* To-Do Items List */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {list.length === 0 ? (
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest py-8 text-center glass-card-true">
                No objectives set
              </div>
            ) : (
              list.map(g => (
                <div 
                  key={g.id} 
                  className="group flex items-start justify-between gap-3 p-3 glass-card-true transition-all"
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
                  <span className={`flex-1 text-xs break-words whitespace-normal leading-relaxed transition-all duration-300 font-medium ${
                    g.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'
                  }`}>
                    {getDisplayGoalText(g.text)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(g.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-colors focus:outline-none p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="todo-hub" className="p-6 md:p-8 glass-panel-true mb-12 border border-white/15 shadow-2xl">
      
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
              <span>CALENDAR VIEW</span>
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
    </div>
  );
}
