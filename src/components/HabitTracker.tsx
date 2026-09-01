/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { HabitData, GoalTodo } from '../types';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  ArrowUpDown, 
  Pencil, 
  X, 
  Link2,
  Flame,
  Trophy,
  Zap,
  TrendingUp,
  CalendarDays,
  BarChart3
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface HabitTrackerProps {
  habits: HabitData[];
  goals?: GoalTodo[];
  onAddHabit: (habitName: string, monthYear?: string) => void;
  onToggleHabitDay: (habitId: string, day: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit?: (id: string, newName: string) => void;
  isLightMode?: boolean;
}

// Helper: Calculate streak for a habit
function calculateHabitStreak(completedDays: number[], totalDays: number, currentDay: number, isCurrentMonth: boolean) {
  if (!completedDays || completedDays.length === 0) return { current: 0, best: 0 };
  const daySet = new Set(completedDays);

  // Best streak in month
  let best = 0;
  let running = 0;
  for (let d = 1; d <= totalDays; d++) {
    if (daySet.has(d)) {
      running++;
      if (running > best) best = running;
    } else {
      running = 0;
    }
  }

  // Current streak (ending at today or yesterday if today is not checked yet)
  let current = 0;
  let target = isCurrentMonth ? currentDay : totalDays;
  if (isCurrentMonth && !daySet.has(target)) {
    target = currentDay - 1;
  }
  while (target >= 1 && daySet.has(target)) {
    current++;
    target--;
  }

  return { current, best };
}

export default function HabitTracker({
  habits,
  goals = [],
  onAddHabit,
  onToggleHabitDay,
  onDeleteHabit,
  onEditHabit,
  isLightMode
}: HabitTrackerProps) {
  const [newHabitName, setNewHabitName] = useState('');

  // Inline Habit Editing State
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitName, setEditingHabitName] = useState('');

  const handleStartEditHabit = (habit: HabitData) => {
    setEditingHabitId(habit.id);
    setEditingHabitName(habit.habitName);
  };

  const handleSaveEditHabit = (id: string) => {
    if (editingHabitName.trim() && onEditHabit) {
      onEditHabit(id, editingHabitName.trim());
    }
    setEditingHabitId(null);
  };

  // Goal-Habit linking state
  const [habitGoalLinks, setHabitGoalLinks] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('df_habit_goal_links') || '{}'); } catch { return {}; }
  });
  const saveHabitGoalLink = (habitId: string, goalId: string) => {
    const next = { ...habitGoalLinks, [habitId]: goalId };
    setHabitGoalLinks(next);
    localStorage.setItem('df_habit_goal_links', JSON.stringify(next));
  };
  
  // Current local month YYYY-MM
  const today = useMemo(() => new Date(), []);
  const todayDay = useMemo(() => today.getDate(), [today]);
  const defaultMonthStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [today]);

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(defaultMonthStr);

  const isCurrentMonthActive = useMemo(() => {
    return selectedMonthYear === defaultMonthStr;
  }, [selectedMonthYear, defaultMonthStr]);

  // Handle month total days
  const totalDays = useMemo(() => {
    const parts = selectedMonthYear.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return new Date(year, month, 0).getDate();
      }
    }
    return 31;
  }, [selectedMonthYear]);

  const daysArray = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [totalDays]);

  // Filtered habits for selected month
  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      if (h.monthYear) return h.monthYear === selectedMonthYear;
      return selectedMonthYear === defaultMonthStr;
    });
  }, [habits, selectedMonthYear, defaultMonthStr]);

  // Habit Sorting State (Default to A-Z Name sorting)
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'consistency' | 'streak'>('name-asc');

  // Sorted Habits Memo with Streak Stats
  const sortedFilteredHabits = useMemo(() => {
    const list = [...filteredHabits];
    if (sortOrder === 'name-asc') {
      return list.sort((a, b) => a.habitName.localeCompare(b.habitName, undefined, { sensitivity: 'base' }));
    }
    if (sortOrder === 'name-desc') {
      return list.sort((a, b) => b.habitName.localeCompare(a.habitName, undefined, { sensitivity: 'base' }));
    }
    if (sortOrder === 'consistency') {
      return list.sort((a, b) => b.completedDays.length - a.completedDays.length);
    }
    if (sortOrder === 'streak') {
      return list.sort((a, b) => {
        const streakA = calculateHabitStreak(a.completedDays, totalDays, todayDay, isCurrentMonthActive).current;
        const streakB = calculateHabitStreak(b.completedDays, totalDays, todayDay, isCurrentMonthActive).current;
        return streakB - streakA;
      });
    }
    return list;
  }, [filteredHabits, sortOrder, totalDays, todayDay, isCurrentMonthActive]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim(), selectedMonthYear);
    setNewHabitName('');
  };

  // Analytics Math
  const stats = useMemo(() => {
    const dailyCounts = daysArray.map(day => {
      return filteredHabits.reduce((acc, h) => {
        return acc + (h.completedDays.includes(day) ? 1 : 0);
      }, 0);
    });

    const totalPossibleCheckins = filteredHabits.length * totalDays;
    const totalCompletedCheckins = filteredHabits.reduce((acc, h) => acc + h.completedDays.length, 0);
    const consistency = totalPossibleCheckins > 0 ? Math.round((totalCompletedCheckins / totalPossibleCheckins) * 100) : 0;

    return {
      dailyCounts,
      totalCompletedCheckins,
      totalPossibleCheckins,
      consistency
    };
  }, [filteredHabits, daysArray, totalDays]);

  // Executive KPI 1: Best Active Streak
  const bestStreakMeta = useMemo(() => {
    let maxStreak = 0;
    let habitName = 'None';
    filteredHabits.forEach(h => {
      const s = calculateHabitStreak(h.completedDays, totalDays, todayDay, isCurrentMonthActive);
      if (s.current > maxStreak) {
        maxStreak = s.current;
        habitName = h.habitName;
      }
    });
    return { maxStreak, habitName };
  }, [filteredHabits, totalDays, todayDay, isCurrentMonthActive]);

  // Executive KPI 2: Today's execution
  const todayExecution = useMemo(() => {
    if (!isCurrentMonthActive) return { completed: 0, total: filteredHabits.length, rate: 0 };
    const completed = filteredHabits.filter(h => h.completedDays.includes(todayDay)).length;
    const total = filteredHabits.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, rate };
  }, [filteredHabits, todayDay, isCurrentMonthActive]);

  // Executive KPI 3: Top Performer Habit
  const topPerformer = useMemo(() => {
    if (filteredHabits.length === 0) return null;
    const sorted = [...filteredHabits].sort((a, b) => b.completedDays.length - a.completedDays.length);
    const top = sorted[0];
    const rate = Math.round((top.completedDays.length / (totalDays || 1)) * 100);
    return { name: top.habitName, days: top.completedDays.length, rate };
  }, [filteredHabits, totalDays]);

  // Weekly Breakdown
  const weeklyBreakdown = useMemo(() => {
    const weeks: { label: string; range: string; rate: number; completed: number; total: number }[] = [];
    const totalW = Math.ceil(totalDays / 7);
    for (let w = 0; w < totalW; w++) {
      const startDay = w * 7 + 1;
      const endDay = Math.min(totalDays, (w + 1) * 7);
      let completed = 0;
      const daysCount = (endDay - startDay + 1);
      const total = daysCount * filteredHabits.length;
      for (let d = startDay; d <= endDay; d++) {
        filteredHabits.forEach(h => {
          if (h.completedDays.includes(d)) completed++;
        });
      }
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      weeks.push({
        label: `Week ${w + 1}`,
        range: `Day ${startDay}–${endDay}`,
        rate,
        completed,
        total
      });
    }
    return weeks;
  }, [totalDays, filteredHabits]);

  // Day of Week Stats
  const dayOfWeekStats = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const parts = selectedMonthYear.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const totals = [0, 0, 0, 0, 0, 0, 0];

    daysArray.forEach(day => {
      const date = new Date(year, month, day);
      const dow = date.getDay();
      totals[dow] += filteredHabits.length;
      filteredHabits.forEach(h => {
        if (h.completedDays.includes(day)) {
          counts[dow]++;
        }
      });
    });

    return days.map((name, idx) => ({
      name,
      completed: counts[idx],
      total: totals[idx],
      rate: totals[idx] > 0 ? Math.round((counts[idx] / totals[idx]) * 100) : 0
    }));
  }, [selectedMonthYear, daysArray, filteredHabits]);

  // Chart Data
  const barChartData = useMemo(() => {
    return {
      labels: daysArray.map(d => String(d)),
      datasets: [
        {
          label: 'Completed habits',
          data: stats.dailyCounts,
          backgroundColor: '#1591DC',
          borderColor: '#1591DC',
          borderRadius: 2,
          borderWidth: 0,
          hoverBackgroundColor: '#38bdf8'
        }
      ]
    };
  }, [daysArray, stats]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: '#18181b',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { family: 'Inter', size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#71717a', font: { family: 'Inter', size: 9 }, stepSize: 1 },
        beginAtZero: true
      }
    }
  };

  const doughnutChartData = useMemo(() => {
    return {
      labels: ['Consistency', 'Remaining'],
      datasets: [
        {
          data: [stats.consistency, Math.max(0, 100 - stats.consistency)],
          backgroundColor: ['#1591DC', 'rgba(255, 255, 255, 0.06)'],
          borderColor: ['rgba(21, 145, 220, 0.2)', 'rgba(255, 255, 255, 0.06)'],
          borderWidth: 1,
        }
      ]
    };
  }, [stats]);

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '76%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: '#18181b',
        borderWidth: 1
      }
    }
  };

  const formattedMonthYearString = useMemo(() => {
    const parts = selectedMonthYear.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const monthNum = parseInt(parts[1], 10);
      if (!isNaN(year) && !isNaN(monthNum)) {
        const date = new Date(year, monthNum - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        return `${monthName} ${year}`;
      }
    }
    return selectedMonthYear;
  }, [selectedMonthYear]);

  return (
    <div id="habit-matrix" className="kuldeep-card p-6 md:p-8 mb-12 space-y-6">
      
      {/* Module Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans">
            Habits & Consistency
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <p className="text-xs text-[#9496a1]">
              Record • {formattedMonthYearString}
            </p>
            <div className="flex items-center gap-1.5 glass-pill-true px-3 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#1591DC]" />
              <span className="text-[#9496a1]">Month:</span>
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              />
            </div>

            {/* Habit Sorting Selector */}
            <div className="flex items-center gap-1.5 glass-pill-true px-3 py-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#9496a1]" />
              <span className="text-[#9496a1]">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium border-none"
              >
                <option value="name-asc" className="bg-[#12141a] text-white">Name (A → Z)</option>
                <option value="name-desc" className="bg-[#12141a] text-white">Name (Z → A)</option>
                <option value="streak" className="bg-[#12141a] text-white">Longest Streak</option>
                <option value="consistency" className="bg-[#12141a] text-white">Most Consistent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAdd} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder={`Add habit for ${selectedMonthYear}...`}
            className="glass-input-true px-3.5 py-2 text-xs text-white placeholder-zinc-500 w-full md:w-64 rounded-xl"
          />
          <button 
            type="submit"
            className="btn-primary-cyan px-4 py-2 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 rounded-xl shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* 🌟 1. MINIMALIST UNIFIED EXECUTIVE KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1: Best Active Streak */}
        <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06] flex items-center gap-3.5 hover:border-white/[0.12] transition-all">
          <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono text-white">
                {bestStreakMeta.maxStreak} {bestStreakMeta.maxStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-[11px] text-[#9496a1] truncate max-w-[130px]" title={bestStreakMeta.habitName}>
              {bestStreakMeta.habitName}
            </p>
          </div>
        </div>

        {/* Metric 2: Today's Execution */}
        <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06] flex items-center gap-3.5 hover:border-white/[0.12] transition-all">
          <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono text-white">
                {todayExecution.completed} / {todayExecution.total}
              </span>
              <span className="text-[10px] text-[#9496a1] font-mono">
                ({todayExecution.rate}%)
              </span>
            </div>
            <p className="text-[11px] text-[#9496a1]">
              Today's check-ins
            </p>
          </div>
        </div>

        {/* Metric 3: Top Performer Habit */}
        <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06] flex items-center gap-3.5 hover:border-white/[0.12] transition-all">
          <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono text-white">
                {topPerformer ? `${topPerformer.rate}%` : '0%'}
              </span>
            </div>
            <p className="text-[11px] text-[#9496a1] truncate max-w-[130px]" title={topPerformer?.name || 'No habits'}>
              {topPerformer?.name || 'No habits added'}
            </p>
          </div>
        </div>

        {/* Metric 4: Monthly Consistency Index */}
        <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06] flex items-center gap-3.5 hover:border-white/[0.12] transition-all">
          <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono text-white">
                {stats.consistency}%
              </span>
            </div>
            <p className="text-[11px] text-[#9496a1]">
              {stats.totalCompletedCheckins}/{stats.totalPossibleCheckins} total
            </p>
          </div>
        </div>
      </div>

      {/* 📊 2. INTERACTIVE 31-DAY HABIT MATRIX (CLEAN & MINIMALIST) */}
      <div className="glass-panel-true rounded-xl overflow-hidden border border-white/[0.08]">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            
            {/* Grid Headers */}
            <div className="grid grid-cols-[280px_repeat(31,1fr)] border-b border-white/[0.08] bg-white/[0.02] py-2.5 text-center items-center font-sans">
              <div className="text-left pl-4 text-xs font-semibold text-[#9496a1]">
                Habit
              </div>
              {daysArray.map(day => {
                const isItToday = isCurrentMonthActive && day === todayDay;
                return (
                  <div 
                    key={day} 
                    className={`text-[10px] font-mono font-medium py-1 transition-all ${
                      isItToday 
                        ? 'bg-[#1591DC]/20 text-white border border-[#1591DC]/40 rounded-full font-bold' 
                        : 'text-[#9496a1]'
                    }`}
                    title={isItToday ? 'Today' : undefined}
                  >
                    {day < 10 ? `0${day}` : day}
                  </div>
                );
              })}
              {Array.from({ length: 31 - totalDays }).map((_, idx) => (
                <div key={`empty-hdr-${idx}`} className="text-[9px] font-mono text-zinc-600">
                  -
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {sortedFilteredHabits.length === 0 ? (
              <div className="text-center py-12 text-[#9496a1] text-xs font-normal">
                No habits recorded for {formattedMonthYearString}. Add a new habit above to begin tracking.
              </div>
            ) : (
              sortedFilteredHabits.map(h => {
                const streak = calculateHabitStreak(h.completedDays, totalDays, todayDay, isCurrentMonthActive);
                const habitPct = Math.round((h.completedDays.length / (totalDays || 1)) * 100);

                return (
                  <div 
                    key={h.id} 
                    className="grid grid-cols-[280px_repeat(31,1fr)] border-b border-white/5 py-3 items-center group/row hover:bg-white/[0.05] transition-colors"
                  >
                    {/* Habit Label + Delete Button + Refined Secondary Subtext */}
                    <div className="flex flex-col pl-4 pr-3">
                      <div className="flex items-center justify-between">
                        {editingHabitId === h.id ? (
                          <div className="flex items-center gap-1 w-full my-0.5">
                            <input
                              type="text"
                              value={editingHabitName}
                              onChange={(e) => setEditingHabitName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditHabit(h.id);
                                if (e.key === 'Escape') setEditingHabitId(null);
                              }}
                              className="w-full glass-input-true px-2 py-0.5 text-xs text-white rounded-lg focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditHabit(h.id)}
                              className="p-1 text-[#1591DC] hover:text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingHabitId(null)}
                              className="p-1 text-zinc-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span 
                              onDoubleClick={() => handleStartEditHabit(h)}
                              className="text-xs font-semibold text-white tracking-normal pr-2 cursor-pointer hover:text-[#1591DC] transition-colors"
                              title="Double-click to edit habit name"
                            >
                              {h.habitName}
                            </span>

                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleStartEditHabit(h)}
                                className="text-[#9496a1] hover:text-white transition-all p-0.5"
                                title="Edit habit name"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDeleteHabit(h.id)}
                                className="text-[#9496a1] hover:text-red-400 transition-all p-0.5"
                                title="Delete habit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Clean Swiss Secondary Line: Stats, Streak, Goal Link */}
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#9496a1] font-sans">
                        <span className="font-medium text-zinc-300 font-mono">
                          {h.completedDays.length}/{totalDays}d • {habitPct}%
                        </span>

                        {streak.current > 1 && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-[#9496a1] font-mono">
                              {streak.current}d streak
                            </span>
                          </>
                        )}

                        {/* Goal Link Selector */}
                        {goals.length > 0 ? (
                          <>
                            <span className="text-zinc-600">•</span>
                            <div className="flex items-center gap-1">
                              <Link2 className="w-2.5 h-2.5 text-[#1591DC] shrink-0" />
                              <select
                                value={habitGoalLinks[h.id] || ''}
                                onChange={e => saveHabitGoalLink(h.id, e.target.value)}
                                className="bg-transparent text-[10px] text-[#9496a1] hover:text-white focus:outline-none cursor-pointer appearance-none"
                                title="Link habit to a Goal"
                              >
                                <option value="" className="bg-[#12141a] text-[#9496a1]">Link goal</option>
                                {goals.filter(g => !g.completed).map(g => (
                                  <option key={g.id} value={g.id} className="bg-[#12141a] text-white">
                                    {g.text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '').slice(0, 30)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Habit Grid squares */}
                    {daysArray.map(day => {
                      const isCompleted = h.completedDays.includes(day);
                      const isItToday = isCurrentMonthActive && day === todayDay;
                      return (
                        <div key={day} className={`flex justify-center items-center py-0.5 ${isItToday ? 'bg-[#1591DC]/10' : ''}`}>
                          <button
                            type="button"
                            onClick={() => onToggleHabitDay(h.id, day)}
                            className={`w-5 h-5 border transition-all duration-200 flex items-center justify-center rounded focus:outline-none ${
                              isCompleted 
                                ? 'bg-[#1591DC] border-[#1591DC] text-white font-bold' 
                                : isItToday
                                  ? 'border-[#1591DC]/40 bg-[#1591DC]/10 hover:border-[#1591DC]'
                                  : 'border-white/[0.10] bg-white/[0.02] hover:border-white/30'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </button>
                        </div>
                      );
                    })}
                    {Array.from({ length: 31 - totalDays }).map((_, idx) => (
                      <div key={`empty-cell-${idx}`} className="flex justify-center text-zinc-700 text-[10px]">
                        •
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 📅 3. CLEAN 4-WEEK PROGRESSION STRIP */}
      <div className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-[#1591DC]" />
            <span className="text-xs font-semibold text-white">Weekly Discipline Progression</span>
          </div>
          <span className="text-[11px] text-[#9496a1]">Monthly Rhythm</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {weeklyBreakdown.map((wb, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-semibold text-white font-sans">{wb.label}</span>
                <span className="text-[11px] font-mono font-bold text-white">
                  {wb.rate}%
                </span>
              </div>
              <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#1591DC]"
                  style={{ width: `${wb.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#9496a1]">
                <span>{wb.range}</span>
                <span>{wb.completed}/{wb.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📈 4. CHARTS SECTION (CLEAN SWISS MONOCHROME & CYAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-white/[0.08] pt-6">
        
        {/* Left Column (2 Cols): Daily completion volume bar chart */}
        <div className="lg:col-span-2 space-y-3 pr-0 lg:pr-6 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-6 lg:pb-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#1591DC]" />
              Daily Completion Volume
            </h4>
            <span className="text-[10px] text-[#9496a1] font-mono">30-Day Activity Curve</span>
          </div>
          <div className="h-[180px] relative">
            <Bar data={barChartData} options={barChartOptions} />
          </div>

          {/* Day of Week Performance Meter (Clean Monochrome) */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-white">Day of Week Performance</span>
              <span className="text-[#9496a1]">Consistency Distribution</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {dayOfWeekStats.map((dow, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center space-y-1">
                  <span className="text-[10px] font-medium text-[#9496a1] block">{dow.name}</span>
                  <span className="text-[11px] font-bold font-mono text-white">
                    {dow.rate}%
                  </span>
                  <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-[#1591DC]"
                      style={{ width: `${dow.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Monthly Doughnut */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-full text-left">
            <h4 className="text-xs font-semibold text-white">
              Monthly Consistency Rate
            </h4>
          </div>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            <div className="absolute text-center">
              <span className="text-3xl font-bold font-mono text-[#1591DC] tracking-tight">
                {stats.consistency}%
              </span>
              <p className="text-xs text-[#9496a1] mt-1 font-medium">
                Consistency
              </p>
            </div>
          </div>

          <div className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-[11px]">
            <div className="flex justify-between text-[#9496a1]">
              <span>Total Check-ins:</span>
              <span className="font-mono font-semibold text-white">{stats.totalCompletedCheckins}</span>
            </div>
            <div className="flex justify-between text-[#9496a1]">
              <span>Tracking Habits:</span>
              <span className="font-mono font-semibold text-white">{filteredHabits.length} habits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
