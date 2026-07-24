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
      {/* Header Glass Banner - Glassmorphism System */}
      <div className="relative overflow-hidden rounded-none glass-panel p-6 md:p-8 text-zinc-100">
        {/* Glass Ambient Background Radial Glow */}
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 pointer-events-none opacity-20 blur-3xl transition-all duration-700"
          style={{ background: activeTheme.accent }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[10px] font-mono tracking-widest uppercase font-bold glass-pill ${activeTheme.text}`}>
              <Sparkles className="w-3 h-3 animate-pulse" />
              EXECUTIVE COMMAND CENTER
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
              Progress & Energy Telemetry
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm max-w-xl font-sans leading-relaxed">
              Integrated Personal Growth System: Task Management, Habit Mastery, and Peak Performance.
            </p>
          </div>

          {/* Level Badge Glass Card */}
          <div className="glass-card rounded-none p-4 md:p-5 flex flex-col gap-3 min-w-[270px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-none glass-button ${activeTheme.text}`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">CURRENT LEVEL</span>
                  <span className="text-base font-bold font-mono text-white">Level {stats.currentLevel}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-none glass-pill ${activeTheme.text}`}>
                  {stats.tierName}
                </span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                <span>{stats.xpInCurrentLevel} / {stats.xpNeededForNextLevel} XP</span>
                <span>{stats.progressPercent}%</span>
              </div>
              <div className="w-full bg-black/60 rounded-none h-1.5 overflow-hidden border border-white/10">
                <div 
                  className={`h-full rounded-none transition-all duration-500`}
                  style={{ 
                    width: `${stats.progressPercent}%`,
                    backgroundColor: activeTheme.accent,
                    boxShadow: `0 0 12px ${activeTheme.accent}`
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/10">
              <span>TOTAL XP: <strong className="text-white">{stats.totalXP}</strong></span>
              <span>BADGES: <strong className={activeTheme.text}>{stats.badgesCount} Unlocked</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Quick Stats Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Habit Stat */}
        <div 
          onClick={() => onNavigate('habits')}
          className="group cursor-pointer rounded-none glass-panel-interactive p-5 space-y-3"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">TODAY'S HABITS</span>
            <div className={`p-1.5 rounded-none glass-button ${activeTheme.text}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{todayHabitsDoneCount}/{habits.length}</span>
            <span className={`text-xs font-mono font-semibold ${activeTheme.text}`}>{habitCompletionPercent}% DONE</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-400 flex items-center justify-between uppercase tracking-wider pt-1 border-t border-white/5">
            <span>{stats.activeHabitStreaks} ACTIVE STREAKS</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-300" />
          </p>
        </div>

        {/* Goals Stat */}
        <div 
          onClick={() => onNavigate('todo-hub')}
          className="group cursor-pointer rounded-none glass-panel-interactive p-5 space-y-3"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">TASKS & GOALS</span>
            <div className={`p-1.5 rounded-none glass-button ${activeTheme.text}`}>
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{goals.length - pendingGoals.length}/{goals.length}</span>
            <span className="text-xs font-mono font-semibold text-zinc-400">COMPLETED</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-400 flex items-center justify-between uppercase tracking-wider pt-1 border-t border-white/5">
            <span>{pendingGoals.length} PENDING TASKS</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-300" />
          </p>
        </div>

        {/* Expenses Stat */}
        <div 
          onClick={() => onNavigate('expenses')}
          className="group cursor-pointer rounded-none glass-panel-interactive p-5 space-y-3"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">MONTHLY CASH FLOW</span>
            <div className={`p-1.5 rounded-none glass-button ${activeTheme.text}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-white">
              ${monthlyTotalSpent.toLocaleString('en-US')}
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-400 flex items-center justify-between uppercase tracking-wider pt-1 border-t border-white/5">
            <span>MONTHLY EXPENSES</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-300" />
          </p>
        </div>

        {/* Journal Stat */}
        <div 
          onClick={() => onNavigate('journal')}
          className="group cursor-pointer rounded-none glass-panel-interactive p-5 space-y-3"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">DAILY JOURNAL</span>
            <div className={`p-1.5 rounded-none glass-button ${activeTheme.text}`}>
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{journals.length}</span>
            <span className={`text-xs font-mono font-semibold ${activeTheme.text}`}>ENTRIES</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-400 flex items-center justify-between uppercase tracking-wider pt-1 border-t border-white/5">
            <span>LOG JOURNAL TODAY</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-300" />
          </p>
        </div>
      </div>

      {/* Main Content Split: Priority Tasks & Today's Habits (Glass Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Today's Priorities */}
        <div className="lg:col-span-7 glass-panel rounded-none p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className={`w-4 h-4 ${activeTheme.text}`} />
              <h2 className="text-sm font-mono uppercase tracking-wider text-white font-bold">Priority Tasks</h2>
            </div>
            <button 
              onClick={() => onNavigate('todo-hub')}
              className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${activeTheme.text} flex items-center gap-1 transition-colors`}
            >
              View All ({goals.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingGoals.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 space-y-2">
              <CheckCircle2 className={`w-10 h-10 mx-auto opacity-80 ${activeTheme.text}`} />
              <p className="font-mono text-xs uppercase tracking-wider text-zinc-200">Outstanding! No pending priority tasks.</p>
              <p className="text-xs text-zinc-500">All high-priority goals are completed.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingGoals.map(goal => (
                <div 
                  key={goal.id}
                  className="flex items-center justify-between p-3 rounded-none glass-card glass-card-hover transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => onToggleGoal(goal.id, !goal.completed)}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <div className="truncate">
                      <span className="text-xs font-sans text-zinc-200 block truncate group-hover:text-white transition-colors">
                        {goal.text}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">
                        {goal.timeframe}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onToggleGoal(goal.id, !goal.completed)}
                    className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-none glass-button text-zinc-200 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    Mark Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Daily Habits Quick Check */}
        <div className="lg:col-span-5 glass-panel rounded-none p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${activeTheme.text}`} />
              <h2 className="text-sm font-mono uppercase tracking-wider text-white font-bold">Today's Habits (Day {todayDay})</h2>
            </div>
            <button 
              onClick={() => onNavigate('habits')}
              className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${activeTheme.text} flex items-center gap-1 transition-colors`}
            >
              Manage ({habits.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <p className="text-xs font-mono uppercase tracking-wider">No habits created yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.map(habit => {
                const isDoneToday = habit.completedDays && habit.completedDays.includes(todayDay);
                return (
                  <div 
                    key={habit.id}
                    className={`flex items-center justify-between p-3 rounded-none glass-card transition-all ${
                      isDoneToday ? 'bg-white/[0.08] border-white/20 text-white' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onToggleHabitDay(habit.id, todayDay)}
                        className={`p-0.5 transition-transform active:scale-95 ${
                          isDoneToday ? activeTheme.text : 'text-zinc-500 hover:text-zinc-200'
                        }`}
                      >
                        {isDoneToday ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <div>
                        <span className={`text-xs font-sans block ${isDoneToday ? 'line-through opacity-70' : ''}`}>
                          {habit.habitName}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                          Logged {habit.completedDays ? habit.completedDays.length : 0} days
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleHabitDay(habit.id, todayDay)}
                      className={`text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-none font-medium glass-button transition-colors ${
                        isDoneToday ? `${activeTheme.text} border-white/30` : 'text-zinc-300'
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

      {/* Quote Banner - Glass Banner */}
      <div className="rounded-none glass-panel p-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
        <div className={`p-2.5 rounded-none glass-button ${activeTheme.text} flex-shrink-0`}>
          <Quote className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs md:text-sm font-sans text-zinc-200 italic">
            "{quoteObj.quote}"
          </p>
          <span className={`text-[10px] font-mono uppercase tracking-widest ${activeTheme.text} font-semibold block`}>
            — {quoteObj.author}
          </span>
        </div>
      </div>
    </div>
  );
}
