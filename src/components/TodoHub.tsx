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
    const y = parseInt(selectedYear);
    const m = parseInt(selectedMonth);
    if (isNaN(y) || isNaN(m)) return '';
    
    const lastDay = new Date(y, m, 0).getDate();
    
    let start = 1;
    let end = 7;
    
    if (selectedWeek === 'W1') { start = 1; end = 7; }
    else if (selectedWeek === 'W2') { start = 8; end = 14; }
    else if (selectedWeek === 'W3') { start = 15; end = 21; }
    else if (selectedWeek === 'W4') { start = 22; end = 28; }
    else if (selectedWeek === 'W5') { 
      start = 29; 
      end = lastDay; 
    }
    
    if (start > lastDay) return 'N/A';
    return `From ${start.toString().padStart(2, '0')}/${selectedMonth}/${selectedYear} to ${end.toString().padStart(2, '0')}/${selectedMonth}/${selectedYear}`;
  }, [selectedYear, selectedMonth, selectedWeek]);

  // Inputs for column form
  const [inputs, setInputs] = useState<Record<TimeframeType, string>>({
    daily: '',
    weekly: '',
    monthly: '',
    yearly: ''
  });

  // Calendar quick input state
  const [calendarInput, setCalendarInput] = useState('');

  // Customizable Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<TimeframeType, boolean>>({
    daily: true,
    weekly: true,
    monthly: true,
    yearly: true
  });

  const toggleColumn = (tf: TimeframeType) => {
    setVisibleColumns(prev => {
      const next = { ...prev, [tf]: !prev[tf] };
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

  const showAllColumns = () => {
    setVisibleColumns({ daily: true, weekly: true, monthly: true, yearly: true });
  };

  const visibleCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  const gridColsClass = useMemo(() => {
    if (visibleCount === 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (visibleCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (visibleCount === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';
  }, [visibleCount]);

  const dayContext = `${selectedYear}-${selectedMonth}-${selectedDay}`; // e.g. 2026-07-16
  const weekContext = `${selectedYear}-${selectedMonth}-${selectedWeek}`; // e.g. 2026-07-W3
  const monthContext = `${selectedYear}-${selectedMonth}`; // e.g. 2026-07
  const yearContext = selectedYear; // e.g. 2026

  // Filter goals for active selected context
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (g.timeframe === 'daily') {
        const prefix = `[D:${dayContext}]`;
        if (g.text.startsWith('[D:')) {
          return g.text.startsWith(prefix);
        }
        return dayContext === '2026-07-16';
      }
      if (g.timeframe === 'weekly') {
        const prefix = `[W:${weekContext}]`;
        if (g.text.startsWith('[W:')) {
          return g.text.startsWith(prefix);
        }
        return weekContext === '2026-07-W3';
      }
      if (g.timeframe === 'monthly') {
        const prefix = `[M:${monthContext}]`;
        if (g.text.startsWith('[M:')) {
          return g.text.startsWith(prefix);
        }
        return monthContext === '2026-07';
      }
      if (g.timeframe === 'yearly') {
        const prefix = `[Y:${yearContext}]`;
        if (g.text.startsWith('[Y:')) {
          return g.text.startsWith(prefix);
        }
        return yearContext === '2026';
      }
      return false;
    });
  }, [goals, dayContext, weekContext, monthContext, yearContext]);

  // Handle Add Goal
  const handleAdd = (e: React.FormEvent, timeframe: TimeframeType) => {
    e.preventDefault();
    const rawText = inputs[timeframe].trim();
    if (!rawText) return;

    let prefix = '';
    if (timeframe === 'daily') prefix = `[D:${dayContext}] `;
    else if (timeframe === 'weekly') prefix = `[W:${weekContext}] `;
    else if (timeframe === 'monthly') prefix = `[M:${monthContext}] `;
    else if (timeframe === 'yearly') prefix = `[Y:${yearContext}] `;

    onAddGoal(prefix + rawText, timeframe);
    setInputs(prev => ({ ...prev, [timeframe]: '' }));
  };

  // Handle Calendar Add Goal
  const handleCalendarAdd = (e: React.FormEvent, targetDayStr: string) => {
    e.preventDefault();
    const rawText = calendarInput.trim();
    if (!rawText) return;

    const targetContext = `${selectedYear}-${selectedMonth}-${targetDayStr}`;
    const prefix = `[D:${targetContext}] `;
    onAddGoal(prefix + rawText, 'daily');
    setCalendarInput('');
  };

  // Metrics calculation of filtered goals for each scope
  const stats = useMemo(() => {
    const timeframes: TimeframeType[] = ['daily', 'weekly', 'monthly', 'yearly'];
    const result = {} as Record<TimeframeType, { total: number; completed: number; rate: number }>;

    timeframes.forEach(tf => {
      const scopeGoals = filteredGoals.filter(g => g.timeframe === tf);
      const total = scopeGoals.length;
      const completed = scopeGoals.filter(g => g.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      result[tf] = { total, completed, rate };
    });

    return result;
  }, [filteredGoals]);

  // Calendar Grid Data Setup for selected Month/Year
  const calendarDays = useMemo(() => {
    const y = parseInt(selectedYear);
    const m = parseInt(selectedMonth);
    if (isNaN(y) || isNaN(m)) return { totalDays: 31, startDayOfWeek: 0, daysArray: [] };

    const totalDays = new Date(y, m, 0).getDate();
    // 0 = Sun, 1 = Mon, ..., 6 = Sat
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

  // ChartJS Data setup for 4 columns: Day, Week, Month, Year
  const chartData = useMemo(() => {
    return {
      labels: ['DAY', 'WEEK', 'MONTH', 'YEAR'],
      datasets: [
        {
          label: 'COMPLETED',
          data: [
            stats.daily.completed,
            stats.weekly.completed,
            stats.monthly.completed,
            stats.yearly.completed
          ],
          backgroundColor: 'rgba(125, 211, 252, 0.55)', // Bright Pastel Sky Blue
          borderColor: '#7dd3fc',
          borderWidth: 1,
        },
        {
          label: 'REMAINING',
          data: [
            stats.daily.total - stats.daily.completed,
            stats.weekly.total - stats.weekly.completed,
            stats.monthly.total - stats.monthly.completed,
            stats.yearly.total - stats.yearly.completed
          ],
          backgroundColor: isLightMode ? 'rgba(203, 213, 225, 0.4)' : 'rgba(39, 39, 42, 0.4)',
          borderColor: isLightMode ? '#cbd5e1' : '#27272a',
          borderWidth: 1,
        }
      ]
    };
  }, [stats, isLightMode]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isLightMode ? '#334155' : '#a1a1aa',
          font: { family: 'Inter', size: 9 }
        }
      },
      tooltip: {
        backgroundColor: isLightMode ? '#ffffff' : '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: isLightMode ? '#cbd5e1' : '#18181b',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: isLightMode ? '#475569' : '#71717a', font: { family: 'Inter', size: 9 } }
      },
      y: {
        stacked: true,
        grid: { color: isLightMode ? '#e2e8f0' : '#09090b' },
        ticks: { color: isLightMode ? '#475569' : '#71717a', font: { family: 'Inter', size: 9 }, stepSize: 1 }
      }
    }
  };

  // Strip prefix for clean user viewing
  const getDisplayGoalText = (text: string) => {
    return text.replace(/^\[[DWMY]:[^\]]+\]\s*/, '');
  };

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
      <div className={`flex flex-col justify-between p-6 md:p-8 min-h-[450px] w-full border transition-all duration-300 rounded-none ${
        isThisDailyAndToday 
          ? 'border-emerald-500/40 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
          : 'border-zinc-900/40 bg-black'
      }`}>
        
        <div>
          {/* Column Header */}
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-base font-medium tracking-tight text-zinc-100 flex items-baseline gap-1.5">
              <span>{label} Objectives</span>
              {isThisDailyAndToday && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[8px] bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold uppercase animate-pulse">Today</span>
              )}
            </h3>
            <span className={`font-mono text-[10px] uppercase tracking-widest ${isThisDailyAndToday ? 'text-emerald-400 font-bold' : accentClass}`}>
              {rate}% WIN
            </span>
          </div>

          {/* Dynamic Context Tag */}
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <CalendarIcon className="w-3 h-3" />
            <span>Scope: {activeContextDisplay}</span>
          </div>

          {timeframe === 'weekly' && (
            <div className="text-[10px] text-zinc-500 font-mono mb-4 uppercase tracking-wider">
              {weekRangeStr}
            </div>
          )}

          {/* Minimal Pastel Progress Line */}
          <div className="h-[1px] w-full bg-zinc-900/60 mb-6 overflow-hidden relative">
            <div 
              className={`h-full ${isThisDailyAndToday ? 'bg-[#10b981] glow-success' : barColor} transition-all duration-700 ease-out ${glowClass}`}
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
              className="w-full bg-[#050506] border border-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 rounded-none font-sans"
            />
            <button 
              type="submit"
              className="p-2 border border-zinc-900 hover:border-zinc-700 bg-transparent text-zinc-400 hover:text-zinc-200 transition-colors rounded-none"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* To-Do Items List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {list.length === 0 ? (
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest py-8 text-center border border-dashed border-zinc-900/40">
                No objectives set
              </div>
            ) : (
              list.map(g => (
                <div 
                  key={g.id} 
                  className="group flex items-start justify-between gap-3 p-3 bg-black border border-zinc-900/40 hover:border-zinc-800 transition-colors rounded-none"
                >
                  <button
                    type="button"
                    onClick={() => onToggleGoal(g.id, !g.completed)}
                    className="mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                  >
                    {g.completed ? (
                      <CheckSquare className={`w-4 h-4 ${accentClass}`} />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-800" />
                    )}
                  </button>
                  <span className={`flex-1 text-sm break-words whitespace-normal leading-relaxed transition-all duration-300 ${
                    g.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'
                  }`}>
                    {getDisplayGoalText(g.text)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(g.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-colors focus:outline-none p-0.5"
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
    <div className="p-8 md:p-12 bg-black border border-zinc-900/40 mb-12 rounded-none">
      
      {/* Module Title & Mode Switcher Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-zinc-900/40 pb-6">
        <div>
          <h2 className="text-lg md:text-xl font-medium tracking-tight text-white">
            Tactical Roadmap & To-Do Hub
          </h2>
          <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase mt-1">
            MULTI-TIER TARGET MANAGEMENT: YEAR • MONTH • WEEK • DAY
          </p>
        </div>

        {/* View Mode Switcher + Context Control */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* View Mode Toggle Switch */}
          <div className="flex items-center bg-[#050506] border border-zinc-900 p-1">
            <button
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                viewMode === 'columns'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>COLUMNS</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                viewMode === 'calendar'
                  ? 'bg-sky-950 border border-sky-500/40 text-sky-300 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>CALENDAR VIEW</span>
            </button>
          </div>

          {/* Date Context Dropdowns */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950/60 p-1.5 border border-zinc-900">
            {/* Year */}
            <div className="flex items-center gap-1 bg-black border border-zinc-900/40 px-2 py-1">
              <span className="text-[9px] font-mono text-zinc-500">YEAR:</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-zinc-300 focus:outline-none cursor-pointer"
              >
                {['2025', '2026', '2027', '2028'].map(y => <option key={y} value={y} className="bg-black text-zinc-300">{y}</option>)}
              </select>
            </div>

            {/* Month */}
            <div className="flex items-center gap-1 bg-black border border-zinc-900/40 px-2 py-1">
              <span className="text-[9px] font-mono text-zinc-500">MONTH:</span>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-zinc-300 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m} className="bg-black text-zinc-300">{m}</option>
                ))}
              </select>
            </div>

            {/* Week */}
            <div className="flex items-center gap-1 bg-black border border-zinc-900/40 px-2 py-1">
              <span className="text-[9px] font-mono text-zinc-500">WEEK:</span>
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-zinc-300 focus:outline-none cursor-pointer"
              >
                {['W1', 'W2', 'W3', 'W4', 'W5'].map(w => <option key={w} value={w} className="bg-black text-zinc-300">{w.replace('W', 'Week ')}</option>)}
              </select>
            </div>

            {/* Day */}
            <div className={`flex items-center gap-1 bg-black border px-2 py-1 transition-colors duration-300 ${
              isTodayActive ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-zinc-900/40'
            }`}>
              <span className={`text-[9px] font-mono ${isTodayActive ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>DAY:</span>
              <select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)}
                className={`bg-transparent text-[11px] font-mono focus:outline-none cursor-pointer ${
                  isTodayActive ? 'text-emerald-300 font-semibold' : 'text-zinc-300'
                }`}
              >
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => {
                  const isItToday = d === todayDayStr && selectedMonth === todayMonthStr && selectedYear === todayYearStr;
                  return (
                    <option key={d} value={d} className={isItToday ? 'text-emerald-400 bg-black font-bold' : 'bg-black text-zinc-300'}>
                      {d}{isItToday ? ' • Today' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area based on ViewMode */}
      {viewMode === 'calendar' ? (
        /* CALENDAR GRID VIEW */
        <div className="space-y-8">
          
          {/* Calendar Header Control Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#050506] border border-zinc-900 p-4 gap-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
                  MONTHLY CALENDAR ROADMAP: {selectedMonth}/{selectedYear}
                </h3>
                <p className="text-[10px] font-mono text-zinc-500">
                  Click any day box to inspect or add tasks directly to that specific date.
                </p>
              </div>
            </div>

            {/* Quick Selected Day Focused Card */}
            <div className="flex items-center gap-3 bg-black border border-zinc-800 px-4 py-2 w-full md:w-auto">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">ACTIVE DAY:</span>
              <span className="text-xs font-mono font-bold text-sky-400">{selectedDay}/{selectedMonth}/{selectedYear}</span>
              <form onSubmit={(e) => handleCalendarAdd(e, selectedDay)} className="flex items-center gap-2 ml-2 flex-1 md:flex-none">
                <input
                  type="text"
                  value={calendarInput}
                  onChange={(e) => setCalendarInput(e.target.value)}
                  placeholder={`Add task for day ${selectedDay}...`}
                  className="bg-[#050506] border border-zinc-800 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-sky-500 w-44 font-sans"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-sky-950 border border-sky-600/50 hover:border-sky-400 text-sky-300 text-xs font-mono uppercase"
                >
                  + ADD
                </button>
              </form>
            </div>
          </div>

          {/* 7-Day Header */}
          <div className="grid grid-cols-7 text-center font-mono text-[11px] text-zinc-500 border-b border-zinc-900 pb-2 uppercase tracking-widest font-semibold">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty padding cells for start of month */}
            {Array.from({ length: calendarDays.startDayOfWeek }).map((_, idx) => (
              <div key={`empty-cal-${idx}`} className="min-h-[110px] bg-[#020202] border border-zinc-950 p-2 opacity-30" />
            ))}

            {/* Actual Day Cells */}
            {calendarDays.daysArray.map((dayItem) => {
              const isSelected = dayItem.dayStr === selectedDay;
              
              return (
                <div
                  key={dayItem.dayStr}
                  onClick={() => setSelectedDay(dayItem.dayStr)}
                  className={`min-h-[120px] p-2.5 flex flex-col justify-between border cursor-pointer transition-all duration-200 relative group/day ${
                    dayItem.isToday
                      ? 'border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : isSelected
                      ? 'border-sky-500/60 bg-sky-950/20 shadow-[0_0_12px_rgba(125,211,252,0.15)]'
                      : 'border-zinc-900/80 bg-black hover:border-zinc-700'
                  }`}
                >
                  {/* Top Cell Bar */}
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono font-bold ${
                        dayItem.isToday 
                          ? 'text-emerald-400 text-sm' 
                          : isSelected 
                          ? 'text-sky-300' 
                          : 'text-zinc-400'
                      }`}>
                        {dayItem.dayNum < 10 ? `0${dayItem.dayNum}` : dayItem.dayNum}
                      </span>
                      {dayItem.isToday && (
                        <span className="px-1 py-0.2 text-[7px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 uppercase font-bold">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Task count pill */}
                    {dayItem.total > 0 && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-none border ${
                        dayItem.completed === dayItem.total
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}>
                        {dayItem.completed}/{dayItem.total}
                      </span>
                    )}
                  </div>

                  {/* Task Miniatures List */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] my-1 scrollbar-none">
                    {dayItem.dayGoals.slice(0, 3).map(g => (
                      <div 
                        key={g.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleGoal(g.id, !g.completed);
                        }}
                        className={`text-[10px] font-sans px-1.5 py-0.5 border truncate flex items-center gap-1 transition-all ${
                          g.completed 
                            ? 'bg-zinc-950 text-zinc-600 border-zinc-900 line-through' 
                            : 'bg-[#050506] text-zinc-200 border-zinc-800 hover:border-sky-500/40'
                        }`}
                        title={getDisplayGoalText(g.text)}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${g.completed ? 'bg-zinc-700' : 'bg-sky-400'}`} />
                        <span className="truncate">{getDisplayGoalText(g.text)}</span>
                      </div>
                    ))}
                    {dayItem.dayGoals.length > 3 && (
                      <div className="text-[8px] font-mono text-zinc-500 text-center uppercase tracking-wider">
                        +{dayItem.dayGoals.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Bottom Day Cell Action */}
                  <div className="text-[8px] font-mono text-zinc-600 uppercase flex justify-between items-center border-t border-zinc-900/60 pt-1">
                    <span>{isSelected ? 'SELECTED' : 'CLICK TO VIEW'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side Overview for Weekly/Monthly/Yearly Goals in Calendar Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-900">
            {/* Weekly Overview */}
            <div className="bg-[#050506] border border-zinc-900 p-4">
              <h4 className="text-xs font-mono font-bold text-purple-300 uppercase mb-2">
                WEEKLY OBJECTIVES ({selectedWeek})
              </h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {filteredGoals.filter(g => g.timeframe === 'weekly').map(g => (
                  <div key={g.id} className="flex items-center justify-between text-xs text-zinc-300 bg-black p-2 border border-zinc-900">
                    <span className={g.completed ? 'line-through text-zinc-600' : ''}>{getDisplayGoalText(g.text)}</span>
                    <button onClick={() => onToggleGoal(g.id, !g.completed)}>
                      {g.completed ? <CheckSquare className="w-3.5 h-3.5 text-purple-400" /> : <Square className="w-3.5 h-3.5 text-zinc-700" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Overview */}
            <div className="bg-[#050506] border border-zinc-900 p-4">
              <h4 className="text-xs font-mono font-bold text-amber-300 uppercase mb-2">
                MONTHLY GOALS ({selectedMonth}/{selectedYear})
              </h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {filteredGoals.filter(g => g.timeframe === 'monthly').map(g => (
                  <div key={g.id} className="flex items-center justify-between text-xs text-zinc-300 bg-black p-2 border border-zinc-900">
                    <span className={g.completed ? 'line-through text-zinc-600' : ''}>{getDisplayGoalText(g.text)}</span>
                    <button onClick={() => onToggleGoal(g.id, !g.completed)}>
                      {g.completed ? <CheckSquare className="w-3.5 h-3.5 text-amber-400" /> : <Square className="w-3.5 h-3.5 text-zinc-700" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Yearly Overview */}
            <div className="bg-[#050506] border border-zinc-900 p-4">
              <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase mb-2">
                ANNUAL ROADMAP ({selectedYear})
              </h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {filteredGoals.filter(g => g.timeframe === 'yearly').map(g => (
                  <div key={g.id} className="flex items-center justify-between text-xs text-zinc-300 bg-black p-2 border border-zinc-900">
                    <span className={g.completed ? 'line-through text-zinc-600' : ''}>{getDisplayGoalText(g.text)}</span>
                    <button onClick={() => onToggleGoal(g.id, !g.completed)}>
                      {g.completed ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5 text-zinc-700" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* MULTI-COLUMN VIEW */
        <div className="flex flex-col gap-10">
          
          {/* Column Visibility Customizer toolbar */}
          <div className="flex flex-wrap items-center gap-2 bg-zinc-950/60 p-3 border border-zinc-900/40">
            <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-wider mr-1">
              COLUMNS VISIBILITY:
            </span>
            {[
              { id: 'daily' as TimeframeType, label: 'Day', color: 'border-sky-500/40 text-sky-400' },
              { id: 'weekly' as TimeframeType, label: 'Week', color: 'border-purple-500/40 text-purple-400' },
              { id: 'monthly' as TimeframeType, label: 'Month', color: 'border-amber-500/40 text-amber-400' },
              { id: 'yearly' as TimeframeType, label: 'Year', color: 'border-emerald-500/40 text-emerald-400' }
            ].map((col) => {
              const isVis = visibleColumns[col.id];
              return (
                <button
                  key={col.id}
                  onClick={() => toggleColumn(col.id)}
                  className={`px-2.5 py-1 text-[10px] font-mono border transition-all rounded-none flex items-center gap-1.5 ${
                    isVis 
                      ? `${col.color} bg-black font-semibold shadow-sm` 
                      : 'border-zinc-900 text-zinc-600 bg-black/40 hover:text-zinc-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isVis ? 'bg-current' : 'bg-zinc-800'}`} />
                  <span>{col.label}</span>
                </button>
              );
            })}
            
            {visibleCount < 4 && (
              <button
                onClick={showAllColumns}
                className="px-2 py-1 text-[9px] font-mono border border-zinc-800 text-zinc-400 hover:text-white bg-black transition-colors uppercase tracking-widest ml-1"
              >
                [ SHOW ALL ]
              </button>
            )}
          </div>

          {/* Columns Layout with dynamic CSS grid */}
          <div className={`grid ${gridColsClass} gap-6 lg:gap-8 w-full items-stretch transition-all duration-300`}>
            {/* Day column: Pastel Blue */}
            {visibleColumns.daily && renderColumn(
              'daily', 
              'Day', 
              'text-pastel-blue', 
              'glow-pastel-blue', 
              'bg-[#7dd3fc]', 
              `${selectedDay}/${selectedMonth}/${selectedYear}`
            )}

            {/* Week column: Pastel Purple */}
            {visibleColumns.weekly && renderColumn(
              'weekly', 
              'Week', 
              'text-pastel-purple', 
              'glow-pastel-purple', 
              'bg-[#d8b4fe]', 
              `${selectedWeek.replace('W', 'Week ')} (${selectedMonth}/${selectedYear})`
            )}

            {/* Month column: Pastel Apricot */}
            {visibleColumns.monthly && renderColumn(
              'monthly', 
              'Month', 
              'text-pastel-amber', 
              'glow-pastel-amber', 
              'bg-[#fde68a]', 
              `Month ${selectedMonth}/${selectedYear}`
            )}

            {/* Year column: Pastel Green */}
            {visibleColumns.yearly && renderColumn(
              'yearly', 
              'Year', 
              'text-[#6ee7b7]', 
              'glow-pastel-green', 
              'bg-[#6ee7b7]', 
              `Year ${selectedYear}`
            )}
          </div>

          {/* Visual Metrics Chart Panel */}
          <div className="border-t border-zinc-900/40 pt-8 mt-4">
            <div className="mb-6">
              <h4 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                CURRENT PROGRESS METRICS
              </h4>
            </div>
            <div className="h-[220px] w-full max-w-4xl mx-auto relative">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
