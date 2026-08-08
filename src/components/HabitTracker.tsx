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
  Check
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface HabitTrackerProps {
  habits: HabitData[];
  goals?: GoalTodo[]; // A3 — Goal-Habit linking
  onAddHabit: (habitName: string) => void;
  onToggleHabitDay: (habitId: string, day: number) => void;
  onDeleteHabit: (habitId: string) => void;
  isLightMode?: boolean;
}

export default function HabitTracker({
  habits,
  goals = [],
  onAddHabit,
  onToggleHabitDay,
  onDeleteHabit,
  isLightMode
}: HabitTrackerProps) {
  const [newHabitName, setNewHabitName] = useState('');
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
      return selectedMonthYear === '2026-07';
    });
  }, [habits, selectedMonthYear]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim());
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
          label: 'HABITS COMPLETED',
          data: stats.dailyCounts,
          backgroundColor: 'rgba(110, 231, 183, 0.65)',
          borderColor: '#6ee7b7',
          borderWidth: 1,
          hoverBackgroundColor: '#6ee7b7'
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
      labels: ['CONSISTENCY', 'REMAINING'],
      datasets: [
        {
          data: [stats.consistency, Math.max(0, 100 - stats.consistency)],
          backgroundColor: ['#6ee7b7', 'rgba(255, 255, 255, 0.1)'],
          borderColor: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)'],
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
        const monthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
        return `${monthName} ${year}`;
      }
    }
    return selectedMonthYear;
  }, [selectedMonthYear]);

  return (
    <div id="habit-matrix" className="p-6 md:p-8 glass-panel-true mb-12 border border-white/15 shadow-2xl">
      
      {/* Module Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/15 pb-6">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white uppercase font-sans">
            Self-Mastery Habit Matrix
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-1.5">
            <p className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase font-bold">
              DISCIPLINE EQUALS FREEDOM • {formattedMonthYearString}
            </p>
            <div className="flex items-center gap-2 glass-pill-true px-3 py-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-300" />
              <span className="text-[9px] font-mono text-zinc-300 uppercase font-bold">SELECT MONTH:</span>
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-pointer font-bold"
              />
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
            className="glass-input-true px-3 py-2 text-xs text-white placeholder-zinc-500 w-full md:w-64"
          />
          <button 
            type="submit"
            className="px-4 py-2 glass-button-true text-white transition-all font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>ADD</span>
          </button>
        </form>
      </div>

      {/* Grid Layout of Matrix */}
      <div className="overflow-x-auto glass-panel-true mb-10 border border-white/15 p-2">
        <div className="min-w-[900px]">
          
          {/* Grid Headers */}
          <div className="grid grid-cols-[200px_repeat(31,1fr)] border-b border-white/15 bg-white/[0.04] py-3 text-center items-center">
            <div className="text-left pl-4 text-[10px] font-mono tracking-wider text-zinc-300 uppercase font-bold">
              HABIT
            </div>
            {daysArray.map(day => {
              const isItToday = isCurrentMonthActive && day === todayDay;
              return (
                <div 
                  key={day} 
                  className={`text-[9px] font-mono font-bold py-1 transition-all ${
                    isItToday 
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 rounded-full font-black' 
                      : 'text-zinc-300'
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
          {filteredHabits.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 font-mono text-xs uppercase tracking-widest">
              No habits recorded for {formattedMonthYearString}. Add a new habit above.
            </div>
          ) : (
            filteredHabits.map(h => (
              <div 
                key={h.id} 
                className="grid grid-cols-[200px_repeat(31,1fr)] border-b border-white/5 py-3 items-center group/row hover:bg-white/[0.05] transition-colors"
              >
                {/* Habit Label + Delete Button + A3 Goal Link */}
                <div className="flex flex-col pl-4 pr-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate pr-2">
                      {h.habitName}
                    </span>
                    <button
                      onClick={() => onDeleteHabit(h.id)}
                      className="opacity-0 group-hover/row:opacity-100 text-zinc-400 hover:text-red-400 transition-all p-0.5"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* A3 — Linked Goal */}
                  {goals.length > 0 && (
                    <select
                      value={habitGoalLinks[h.id] || ''}
                      onChange={e => saveHabitGoalLink(h.id, e.target.value)}
                      className="mt-0.5 bg-transparent text-[9px] font-mono text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer truncate max-w-[160px] transition-colors"
                      title="Link to a Goal"
                    >
                      <option value="">+ link goal</option>
                      {goals.filter(g => !g.completed).map(g => (
                        <option key={g.id} value={g.id} className="bg-zinc-900 text-white">
                          {g.text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '').slice(0, 30)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Habit Grid squares */}
                {daysArray.map(day => {
                  const isCompleted = h.completedDays.includes(day);
                  const isItToday = isCurrentMonthActive && day === todayDay;
                  return (
                    <div key={day} className={`flex justify-center items-center py-0.5 ${isItToday ? 'bg-emerald-500/10' : ''}`}>
                      <button
                        type="button"
                        onClick={() => onToggleHabitDay(h.id, day)}
                        className={`w-5 h-5 border transition-all duration-300 flex items-center justify-center rounded-sm focus:outline-none ${
                          isCompleted 
                            ? 'bg-[#6ee7b7] border-[#6ee7b7] text-black font-extrabold shadow-[0_0_10px_rgba(110,231,183,0.6)] scale-105' 
                            : isItToday
                              ? 'border-emerald-400/60 bg-emerald-500/20 hover:border-emerald-300'
                              : 'border-white/20 bg-black/30 hover:border-white/50'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/15 pt-8">
        
        {/* Left Column: Vertical Bar Chart */}
        <div className="lg:col-span-2 flex flex-col h-full self-stretch pr-0 lg:pr-8 border-b lg:border-b-0 lg:border-r border-white/15 pb-8 lg:pb-0">
          <h4 className="text-xs font-mono tracking-widest text-zinc-300 uppercase mb-6 font-bold">
            DAILY COMPLETION VOLUME
          </h4>
          <div className="flex-1 min-h-[220px] relative">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Right Column: Doughnut Consistency Chart */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full text-left mb-6">
            <h4 className="text-xs font-mono tracking-widest text-zinc-300 uppercase font-bold">
              MONTHLY CONSISTENCY RATE
            </h4>
          </div>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-4">
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold font-mono text-[#6ee7b7] tracking-tighter">
                {stats.consistency}%
              </span>
              <p className="text-[8px] font-mono text-zinc-300 uppercase tracking-widest mt-1 font-bold">
                CONSISTENCY
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
