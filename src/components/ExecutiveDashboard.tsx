import React, { useMemo } from 'react';
import { GoalTodo, HabitData, DailyJournal, PersonalExpense } from '../types';
import { calculateGamification, DAILY_QUOTES } from '../gamification';
import { UITheme } from '../App';
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  BookOpen, 
  DollarSign, 
  CheckSquare, 
  Activity, 
  Sparkles,
  Quote
} from 'lucide-react';

interface ExecutiveDashboardProps {
  goals: GoalTodo[];
  habits: HabitData[];
  journals: DailyJournal[];
  expenses: PersonalExpense[];
  onNavigate: (section: string) => void;
  onToggleGoal: (id: string, completed: boolean) => void;
  onToggleHabitDay: (id: string, day: number) => void;
  activeTheme: UITheme;
}

export default function ExecutiveDashboard({
  goals,
  habits,
  journals,
  expenses,
  onNavigate,
  onToggleGoal,
  onToggleHabitDay,
  activeTheme
}: ExecutiveDashboardProps) {
  // Gamification Stats
  const stats = useMemo(() => {
    return calculateGamification(goals, habits, journals, expenses);
  }, [goals, habits, journals, expenses]);

  // Today's day number (1 to 31)
  const todayDay = useMemo(() => new Date().getDate(), []);

  // Today's completed habits count
  const todayHabitsDoneCount = useMemo(() => {
    return habits.filter(h => h.completedDays && h.completedDays.includes(todayDay)).length;
  }, [habits, todayDay]);

  const habitCompletionPercent = habits.length > 0 
    ? Math.round((todayHabitsDoneCount / habits.length) * 100) 
    : 0;

  // Pending Goals
  const pendingGoals = useMemo(() => {
    return goals.filter(g => !g.completed).slice(0, 5);
  }, [goals]);

  // Monthly Expenses Total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyTotalSpent = useMemo(() => {
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.amount < 0;
      })
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  }, [expenses, currentMonth, currentYear]);

  // Daily Quote selection based on day of month
  const dailyQuoteIndex = new Date().getDate() % DAILY_QUOTES.length;
  const quoteObj = DAILY_QUOTES[dailyQuoteIndex];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Glass Panel - True Glassmorphism */}
      <div className="relative overflow-hidden glass-panel-true p-6 md:p-8 text-zinc-100">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 text-[11px] uppercase tracking-widest font-bold glass-pill-true text-pink-300">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-pink-400" />
              EXECUTIVE COMMAND CENTER
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white uppercase">
              Progress & Energy Telemetry
            </h1>
            <p className="text-zinc-300 text-xs md:text-sm max-w-xl font-normal leading-relaxed">
              Integrated Personal Growth System: Task Management, Habit Mastery, and Peak Performance.
            </p>
          </div>

          {/* Level Badge Glass Card */}
          <div className="glass-card-true p-5 flex flex-col gap-3 min-w-[270px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 glass-button-true text-amber-300">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-300 uppercase tracking-widest block font-medium">CURRENT LEVEL</span>
                  <span className="text-lg font-extrabold text-white">Level {stats.currentLevel}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 glass-pill-true text-purple-200">
                  {stats.tierName}
                </span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-zinc-200">
                <span>{stats.xpInCurrentLevel} / {stats.xpNeededForNextLevel} XP</span>
                <span>{stats.progressPercent}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(236,72,153,0.8)]"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-zinc-300 pt-2 border-t border-white/10">
              <span>TOTAL XP: <strong className="text-white font-extrabold">{stats.totalXP}</strong></span>
              <span>BADGES: <strong className="text-purple-300 font-extrabold">{stats.badgesCount} Unlocked</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Quick Stats Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Habit Stat */}
        <div 
          onClick={() => onNavigate('habits')}
          className="group cursor-pointer glass-panel-interactive-true p-6 space-y-3"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-300">TODAY'S HABITS</span>
            <div className="p-2 glass-button-true text-pink-300">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{todayHabitsDoneCount}/{habits.length}</span>
            <span className="text-xs font-bold text-pink-300">{habitCompletionPercent}% DONE</span>
          </div>
          <p className="text-[11px] text-zinc-300 flex items-center justify-between uppercase tracking-wider pt-2 border-t border-white/10">
            <span>{stats.activeHabitStreaks} ACTIVE STREAKS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
          </p>
        </div>

        {/* Goals Stat */}
        <div 
          onClick={() => onNavigate('todo-hub')}
          className="group cursor-pointer glass-panel-interactive-true p-6 space-y-3"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-300">TASKS & GOALS</span>
            <div className="p-2 glass-button-true text-purple-300">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{goals.length - pendingGoals.length}/{goals.length}</span>
            <span className="text-xs font-bold text-zinc-300">COMPLETED</span>
          </div>
          <p className="text-[11px] text-zinc-300 flex items-center justify-between uppercase tracking-wider pt-2 border-t border-white/10">
            <span>{pendingGoals.length} PENDING TASKS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
          </p>
        </div>

        {/* Expenses Stat */}
        <div 
          onClick={() => onNavigate('expenses')}
          className="group cursor-pointer glass-panel-interactive-true p-6 space-y-3"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-300">MONTHLY CASH FLOW</span>
            <div className="p-2 glass-button-true text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              ${monthlyTotalSpent.toLocaleString('en-US')}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 flex items-center justify-between uppercase tracking-wider pt-2 border-t border-white/10">
            <span>MONTHLY EXPENSES</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
          </p>
        </div>

        {/* Journal Stat */}
        <div 
          onClick={() => onNavigate('journal')}
          className="group cursor-pointer glass-panel-interactive-true p-6 space-y-3"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-300">DAILY JOURNAL</span>
            <div className="p-2 glass-button-true text-cyan-300">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{journals.length}</span>
            <span className="text-xs font-bold text-cyan-300">ENTRIES</span>
          </div>
          <p className="text-[11px] text-zinc-300 flex items-center justify-between uppercase tracking-wider pt-2 border-t border-white/10">
            <span>LOG JOURNAL TODAY</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
          </p>
        </div>
      </div>

      {/* Main Content Split: Priority Tasks & Today's Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Today's Priorities */}
        <div className="lg:col-span-7 glass-panel-true p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-purple-300" />
              <h2 className="text-sm uppercase tracking-wider text-white font-extrabold">Priority Tasks</h2>
            </div>
            <button 
              onClick={() => onNavigate('todo-hub')}
              className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              View All ({goals.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingGoals.length === 0 ? (
            <div className="text-center py-10 text-zinc-300 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="text-xs uppercase tracking-wider font-bold text-white">Outstanding! No pending priority tasks.</p>
              <p className="text-xs text-zinc-300">All high-priority goals are completed.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingGoals.map(goal => (
                <div 
                  key={goal.id}
                  className="flex items-center justify-between p-3.5 glass-card-true transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => onToggleGoal(goal.id, !goal.completed)}
                      className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <div className="truncate">
                      <span className="text-xs font-medium text-zinc-100 block truncate group-hover:text-white transition-colors">
                        {goal.text}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                        {goal.timeframe}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onToggleGoal(goal.id, !goal.completed)}
                    className="text-[10px] uppercase tracking-widest px-3 py-1 glass-button-true text-white transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    Mark Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Daily Habits Quick Check */}
        <div className="lg:col-span-5 glass-panel-true p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-pink-400" />
              <h2 className="text-sm uppercase tracking-wider text-white font-extrabold">Today's Habits (Day {todayDay})</h2>
            </div>
            <button 
              onClick={() => onNavigate('habits')}
              className="text-xs font-bold text-pink-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              Manage ({habits.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-10 text-zinc-300">
              <p className="text-xs font-bold uppercase tracking-wider">No habits created yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {habits.map(habit => {
                const isDoneToday = habit.completedDays && habit.completedDays.includes(todayDay);
                return (
                  <div 
                    key={habit.id}
                    className={`flex items-center justify-between p-3.5 glass-card-true transition-all ${
                      isDoneToday ? 'bg-white/20 border-white/30 text-white' : 'text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onToggleHabitDay(habit.id, todayDay)}
                        className={`p-0.5 transition-transform active:scale-95 ${
                          isDoneToday ? 'text-pink-300' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isDoneToday ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <div>
                        <span className={`text-xs font-semibold block ${isDoneToday ? 'line-through opacity-80' : ''}`}>
                          {habit.habitName}
                        </span>
                        <span className="text-[10px] text-zinc-300 font-medium uppercase tracking-wider">
                          Logged {habit.completedDays ? habit.completedDays.length : 0} days
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleHabitDay(habit.id, todayDay)}
                      className={`text-[10px] uppercase tracking-widest px-3 py-1 glass-button-true font-bold transition-colors ${
                        isDoneToday ? 'bg-white/30 text-white border-white/40' : 'text-zinc-200'
                      }`}
                    >
                      {isDoneToday ? 'Done' : 'Check-in'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quote Banner */}
      <div className="glass-panel-true p-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
        <div className="p-3 glass-button-true text-pink-300 flex-shrink-0">
          <Quote className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs md:text-sm text-zinc-200 italic font-medium">
            "{quoteObj.quote}"
          </p>
          <span className="text-[11px] uppercase tracking-widest text-pink-300 font-extrabold block">
            — {quoteObj.author}
          </span>
        </div>
      </div>
    </div>
  );
}
