/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { HabitData } from '../types';
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
import { Plus, Trash2, Check, Calendar } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface HabitTrackerProps {
  habits: HabitData[];
  onAddHabit: (habitName: string, monthYear: string) => void;
  onToggleHabitDay: (id: string, day: number) => void;
  onDeleteHabit: (id: string) => void;
  isLightMode?: boolean;
}

export default function HabitTracker({ habits, onAddHabit, onToggleHabitDay, onDeleteHabit, isLightMode }: HabitTrackerProps) {
  const [newHabitName, setNewHabitName] = useState('');
  
  // Local state for Month & Year selection
  const [selectedMonthYear, setSelectedMonthYear] = useState('2026-07');

  // Detect today's date for precise glowing green column highlights
  const today = useMemo(() => new Date(), []);
  const todayDay = useMemo(() => today.getDate(), [today]);
  const todayMonthYear = useMemo(() => {
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${m}`;
  }, [today]);

  const isCurrentMonthActive = useMemo(() => {
    return selectedMonthYear === todayMonthYear;
  }, [selectedMonthYear, todayMonthYear]);

  // Dynamic number of days based on selected month and year
  const totalDays = useMemo(() => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    if (!year || !month) return 31;
    return new Date(year, month, 0).getDate();
  }, [selectedMonthYear]);

  const daysArray = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [totalDays]);

  // Filter habits belonging to the selected month and year
  const filteredHabits = useMemo(() => {
    return habits.filter(h => h.monthYear === selectedMonthYear);
  }, [habits, selectedMonthYear]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newHabitName.trim();
    if (!name) return;
    onAddHabit(name, selectedMonthYear);
    setNewHabitName('');
  };

  // Metric 1: Consistency Rate % (Overall completed slots vs total possible slots for filtered habits)
  const stats = useMemo(() => {
    const totalPossibleSlots = filteredHabits.length * totalDays;
    if (totalPossibleSlots === 0) return { totalCompleted: 0, consistency: 0 };
    
    let totalCompleted = 0;
    filteredHabits.forEach(h => {
      totalCompleted += h.completedDays.length;
    });

    const consistency = Math.round((totalCompleted / totalPossibleSlots) * 100);
    return { totalCompleted, consistency };
  }, [filteredHabits, totalDays]);

  // Metric 2: Completed habits per day (array of size totalDays)
  const completedPerDay = useMemo(() => {
    const dailyCounts = Array(totalDays).fill(0);
    filteredHabits.forEach(h => {
      h.completedDays.forEach(day => {
        if (day >= 1 && day <= totalDays) {
          dailyCounts[day - 1]++;
        }
      });
    });
    return dailyCounts;
  }, [filteredHabits, totalDays]);

  // Chart 1: Completed Habits Per Day (Vertical Bar Chart with Pastel Emerald Green)
  const barChartData = useMemo(() => {
    return {
      labels: daysArray.map(d => `${d}`),
      datasets: [
        {
          label: 'COMPLETED HABITS COUNT',
          data: completedPerDay,
          backgroundColor: 'rgba(110, 231, 183, 0.45)', // Pastel Emerald Green Glow
          borderColor: '#6ee7b7',
          borderWidth: 1,
        }
      ]
    };
  }, [completedPerDay, daysArray]);

   const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
        grid: { display: false },
        ticks: { color: isLightMode ? '#475569' : '#71717a', font: { family: 'Inter', size: 9 } }
      },
      y: {
        grid: { color: isLightMode ? '#e2e8f0' : '#09090b' },
        ticks: { color: isLightMode ? '#475569' : '#71717a', font: { family: 'Inter', size: 9 }, stepSize: 1 }
      }
    }
  };

  // Chart 2: Consistency Doughnut Chart with Pastel Colors
  const doughnutChartData = useMemo(() => {
    const rate = stats.consistency;
    return {
      labels: ['COMPLETED', 'REMAINING'],
      datasets: [
        {
          data: [rate, Math.max(0, 100 - rate)],
          backgroundColor: isLightMode ? ['#10b981', '#f1f5f9'] : ['#6ee7b7', '#18181b'], // Pastel emerald and dark slate
          borderColor: isLightMode ? ['#e2e8f0', '#e2e8f0'] : ['#000000', '#000000'],
          borderWidth: 2,
        }
      ]
    };
  }, [stats, isLightMode]);

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isLightMode ? '#ffffff' : '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: isLightMode ? '#cbd5e1' : '#18181b',
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
    <div className="p-8 md:p-12 bg-black border border-zinc-900/40 mb-12 rounded-none">
      
      {/* Module Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-900/40 pb-6">
        <div>
          <h2 className="text-lg md:text-xl font-medium tracking-tight text-white">
            Self-Mastery Habit Matrix
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-1.5">
            <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
              DISCIPLINE EQUALS FREEDOM • {formattedMonthYearString}
            </p>
            <div className="flex items-center gap-1.5 border border-zinc-900/40 bg-zinc-950/60 px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[9px] font-mono text-zinc-500 uppercase">SELECT MONTH:</span>
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="bg-black border border-zinc-900/40 px-2 py-0.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono rounded-none"
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
            className="bg-[#050506] border border-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 rounded-none w-full md:w-64"
          />
          <button 
            type="submit"
            className="px-4 py-2 border border-zinc-900 hover:border-zinc-700 bg-transparent text-zinc-400 hover:text-zinc-200 transition-all rounded-none font-mono text-xs uppercase"
          >
            ADD
          </button>
        </form>
      </div>

      {/* Grid Layout of Matrix */}
      <div className="overflow-x-auto border border-zinc-900 mb-10 bg-[#020202]">
        <div className="min-w-[900px]">
          
          {/* Grid Headers */}
          <div className="grid grid-cols-[200px_repeat(31,1fr)] border-b border-zinc-900 bg-[#050506] py-3 text-center items-center">
            <div className="text-left pl-4 text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
              HABIT
            </div>
            {daysArray.map(day => {
              const isItToday = isCurrentMonthActive && day === todayDay;
              return (
                <div 
                  key={day} 
                  className={`text-[9px] font-mono font-semibold py-1 transition-all duration-300 ${
                    isItToday 
                      ? 'bg-emerald-950/80 text-[#6ee7b7] border border-emerald-500/40 rounded shadow-[0_0_10px_rgba(110,231,183,0.3)] scale-110 font-bold' 
                      : 'text-zinc-500'
                  }`}
                  title={isItToday ? 'Today' : undefined}
                >
                  {day < 10 ? `0${day}` : day}
                </div>
              );
            })}
            {/* Pad empty cells if days in month is less than 31 so grid shape remains visually identical */}
            {Array.from({ length: 31 - totalDays }).map((_, idx) => (
              <div key={`empty-hdr-${idx}`} className="text-[9px] font-mono text-zinc-800">
                -
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {filteredHabits.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 font-mono text-xs uppercase tracking-widest">
              No habits recorded for {formattedMonthYearString}. Add a new habit above.
            </div>
          ) : (
            filteredHabits.map(h => (
              <div 
                key={h.id} 
                className="grid grid-cols-[200px_repeat(31,1fr)] border-b border-zinc-900/50 py-3 items-center group/row hover:bg-[#050506]/40 transition-colors"
              >
                {/* Habit Label + Delete Button */}
                <div className="flex items-center justify-between pl-4 pr-3 min-w-0">
                  <span className="text-xs font-medium text-zinc-200 truncate pr-2">
                    {h.habitName}
                  </span>
                  <button
                    onClick={() => onDeleteHabit(h.id)}
                    className="opacity-0 group-hover/row:opacity-100 text-zinc-700 hover:text-red-500 transition-all p-0.5"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Habit Grid squares */}
                {daysArray.map(day => {
                  const isCompleted = h.completedDays.includes(day);
                  const isItToday = isCurrentMonthActive && day === todayDay;
                  return (
                    <div key={day} className={`flex justify-center items-center py-0.5 ${isItToday ? 'bg-emerald-950/5 border-x border-emerald-500/5' : ''}`}>
                      <button
                        type="button"
                        onClick={() => onToggleHabitDay(h.id, day)}
                        className={`w-5 h-5 border transition-all duration-300 flex items-center justify-center rounded-none focus:outline-none ${
                          isCompleted 
                            ? 'bg-[#6ee7b7] border-[#6ee7b7]/80 text-black glow-success scale-105 shadow-[0_0_8px_rgba(110,231,183,0.4)]' 
                            : isItToday
                              ? 'border-emerald-500/50 bg-emerald-950/20 hover:border-emerald-400'
                              : 'border-zinc-900 bg-transparent hover:border-zinc-700'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </div>
                  );
                })}
                {/* Pad empty cells to 31 */}
                {Array.from({ length: 31 - totalDays }).map((_, idx) => (
                  <div key={`empty-cell-${idx}`} className="flex justify-center text-zinc-900 text-[10px]">
                    •
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Visual Analytics - Side by Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-zinc-900 pt-10">
        
        {/* Left Column: Vertical Bar Chart */}
        <div className="lg:col-span-2 flex flex-col h-full self-stretch pr-0 lg:pr-8 border-b lg:border-b-0 lg:border-r border-zinc-900 pb-10 lg:pb-0">
          <h4 className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-6">
            DAILY COMPLETION VOLUME
          </h4>
          <div className="flex-1 min-h-[220px] relative">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Right Column: Doughnut Consistency Chart */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full text-left mb-6">
            <h4 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
              MONTHLY CONSISTENCY RATE
            </h4>
          </div>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-4">
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            <div className="absolute text-center">
              <span className="text-3xl font-light font-mono text-[#6ee7b7] tracking-tighter">
                {stats.consistency}%
              </span>
              <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mt-1">
                CONSISTENCY
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-[10px] font-mono text-zinc-400 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#6ee7b7] inline-block"></span>
              <span>COMPLETED ({stats.totalCompleted})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-zinc-800 inline-block"></span>
              <span>REMAINING</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
