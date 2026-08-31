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
  Activity, 
  Calendar,
  Check,
  ArrowUpDown,
  Pencil,
  X,
  Link2
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface HabitTrackerProps {
  habits: HabitData[];
  goals?: GoalTodo[]; // A3 — Goal-Habit linking
  onAddHabit: (habitName: string, monthYear?: string) => void;
  onToggleHabitDay: (habitId: string, day: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit?: (id: string, newName: string) => void;
  isLightMode?: boolean;
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
  // A3 — Goal-Habit linking: track which habitId is expanded for goal-link
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
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'consistency' | 'default'>('name-asc');

  // Sorted Habits Memo
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
    return list;
  }, [filteredHabits, sortOrder]);

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

  // Chart Data
  const barChartData = useMemo(() => {
    return {
      labels: daysArray.map(d => String(d)),
      datasets: [
        {
          label: 'Completed habits',
          data: stats.dailyCounts,
          backgroundColor: 'rgba(21, 145, 220, 0.75)',
          borderColor: '#1591DC',
          borderWidth: 1,
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
        ticks: { color: '#a1a1aa', font: { family: 'Inter', size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#a1a1aa', font: { family: 'Inter', size: 9 }, stepSize: 1 },
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
          backgroundColor: ['#1591DC', 'rgba(255, 255, 255, 0.08)'],
          borderColor: ['rgba(21, 145, 220, 0.3)', 'rgba(255, 255, 255, 0.08)'],
          borderWidth: 2,
        }
      ]
    };
  }, [stats]);

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
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
                <option value="consistency" className="bg-[#12141a] text-white">Most Consistent</option>
                <option value="default" className="bg-[#12141a] text-white">Default Order</option>
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
            className="glass-input-true px-3.5 py-2 text-xs text-white placeholder-zinc-500 w-full md:w-64 rounded-lg"
          />
          <button 
            type="submit"
            className="px-4 py-2 btn-primary-cyan text-xs font-semibold flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Grid Layout of Matrix */}
      <div className="overflow-x-auto kuldeep-card p-3 mb-10">
        <div className="min-w-[900px]">
          
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
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full font-bold' 
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
            sortedFilteredHabits.map(h => (
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
                          className="p-1 text-emerald-400 hover:text-emerald-300"
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
                  
                  {/* Refined Secondary Text: Consistency stats & spacious Goal Link */}
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#9496a1] font-sans">
                    <span className="font-medium text-zinc-400">
                      {h.completedDays.length}/{totalDays}d
                    </span>
                    <span className="text-zinc-600 font-bold">•</span>
                    {/* Goal Link Selector */}
                    {goals.length > 0 ? (
                      <div className="flex items-center gap-1.5">
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
                              {g.text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '').slice(0, 35)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-500">
                        {Math.round((h.completedDays.length / (totalDays || 1)) * 100)}% consistency
                      </span>
                    )}
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
                            ? 'bg-[#1591DC] border-[#1591DC] text-white font-bold shadow-[0_0_12px_rgba(21,145,220,0.4)]' 
                            : isItToday
                              ? 'border-[#1591DC]/50 bg-[#1591DC]/15 hover:border-[#1591DC]'
                              : 'border-white/[0.12] bg-white/[0.02] hover:border-white/30'
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
            ))
          )}
        </div>
      </div>

      {/* Visual Analytics - Side by Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/[0.08] pt-8">
        
        {/* Left Column: Vertical Bar Chart */}
        <div className="lg:col-span-2 flex flex-col h-full self-stretch pr-0 lg:pr-8 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-8 lg:pb-0">
          <h4 className="text-xs font-semibold text-white mb-6">
            Daily completion volume
          </h4>
          <div className="flex-1 min-h-[220px] relative">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Right Column: Doughnut Consistency Chart */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full text-left mb-6">
            <h4 className="text-xs font-semibold text-white">
              Monthly consistency rate
            </h4>
          </div>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-4">
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
        </div>
      </div>
    </div>
  );
}
