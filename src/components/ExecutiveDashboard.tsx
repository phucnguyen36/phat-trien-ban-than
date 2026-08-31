import React, { useMemo, useState } from 'react';
import { GoalTodo, HabitData, DailyJournal, PersonalExpense } from '../types';
import { calculateGamification, DAILY_QUOTES } from '../gamification';
import { UITheme } from '../App';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  BookOpen, 
  DollarSign, 
  CheckSquare, 
  Activity, 
  Clock,
  TrendingUp,
  Zap,
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
  const [timeframeFilter, setTimeframeFilter] = useState<'day' | 'week' | 'month' | 'year'>('day');

  // Stats calculation
  const stats = useMemo(() => {
    return calculateGamification(goals, habits, journals, expenses);
  }, [goals, habits, journals, expenses]);

  // Today's date info
  const todayDate = useMemo(() => new Date(), []);
  const todayDay = todayDate.getDate();

  // Habits completed today
  const todayHabitsDoneCount = useMemo(() => {
    return habits.filter(h => h.completedDays && h.completedDays.includes(todayDay)).length;
  }, [habits, todayDay]);

  const habitCompletionPercent = habits.length > 0 
    ? Math.round((todayHabitsDoneCount / habits.length) * 100) 
    : 0;

  // Goals Breakdown
  const completedGoalsCount = useMemo(() => goals.filter(g => g.completed).length, [goals]);
  const totalGoalsCount = goals.length;
  const overallProgressPercent = totalGoalsCount > 0 
    ? Math.round((completedGoalsCount / totalGoalsCount) * 100) 
    : 0;

  // Immediate pending goals
  const pendingGoals = useMemo(() => {
    return goals.filter(g => !g.completed).slice(0, 6);
  }, [goals]);

  // Monthly Expenses Total
  const currentMonth = todayDate.getMonth();
  const currentYear = todayDate.getFullYear();
  const monthlyTotalSpent = useMemo(() => {
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.amount < 0;
      })
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  }, [expenses, currentMonth, currentYear]);

  // Daily Quote selection based on day of month
  const dailyQuoteIndex = todayDay % DAILY_QUOTES.length;
  const quoteObj = DAILY_QUOTES[dailyQuoteIndex];

  // Calculated Productivity Rate
  const productivityScore = useMemo(() => {
    const taskScore = goals.length > 0 ? (completedGoalsCount / goals.length) * 45 : 20;
    const habitScore = habits.length > 0 ? (todayHabitsDoneCount / habits.length) * 40 : 20;
    const recentJournal = journals.some(j => (Date.now() - j.updatedAt) < 2 * 86400000);
    const journalScore = recentJournal ? 15 : 5;
    return Math.min(100, Math.round(taskScore + habitScore + journalScore));
  }, [goals, completedGoalsCount, habits, todayHabitsDoneCount, journals]);

  // Focused schedule blocks for today
  const timeBlocks = [
    { time: '08:00', label: 'Morning Planning & Priorities', status: 'done' },
    { time: '09:30', label: 'Deep Focus Execution Block 1', status: 'current' },
    { time: '13:30', label: 'Review & Architecture Systems', status: 'upcoming' },
    { time: '15:30', label: 'Deep Focus Execution Block 2', status: 'upcoming' },
    { time: '17:30', label: 'Physical Training & Reset', status: 'upcoming' },
    { time: '21:00', label: 'Daily Review & Log', status: 'upcoming' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. TOP HEADER TITLE & TIMEFRAME SELECTOR (CLEAN SWISS TYPOGRAPHY, ZERO EYEBROWS) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
            Workspace Overview
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            {todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Timeframe selector pills */}
        <div className="flex items-center gap-1 glass-pill-true p-1 self-start md:self-auto">
          {(['day', 'week', 'month', 'year'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframeFilter(t)}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-full transition-all ${
                timeframeFilter === t
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t === 'day' ? 'Today' : t === 'week' ? 'Week' : t === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. THREE-COLUMN ARCHITECTURAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Daily Schedule */}
        <div className="lg:col-span-5 glass-panel-true p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Today's Schedule
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {timeBlocks.filter(b => b.status === 'done').length}/{timeBlocks.length} Blocks
            </span>
          </div>

          {/* Timeblock Timeline */}
          <div className="space-y-2.5 font-sans">
            {timeBlocks.map((block, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  block.status === 'current'
                    ? 'bg-white/15 border border-white/25 text-white font-medium shadow-sm'
                    : block.status === 'done'
                    ? 'bg-white/[0.02] border border-white/5 text-zinc-400 line-through'
                    : 'glass-card-true text-zinc-200'
                }`}
              >
                <span className="font-mono text-xs font-semibold text-zinc-400 shrink-0 w-12">
                  {block.time}
                </span>
                <span className="text-xs flex-1 truncate">
                  {block.label}
                </span>
                {block.status === 'current' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                )}
                {block.status === 'done' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Direct Author Quote */}
          <div className="p-3.5 rounded-xl glass-card-true border border-white/10 flex items-start gap-3 mt-3">
            <Quote className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                "{quoteObj.quote}"
              </p>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                — {quoteObj.author}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Column (4 Cols): Metrics & Progress */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Progress Card */}
          <div className="glass-panel-true p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Execution Metrics
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {productivityScore}% Score
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {overallProgressPercent}%
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Goals Completed
              </span>
            </div>

            {/* Clean SVG Line */}
            <div className="py-1">
              <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 50">
                <path
                  d="M 0 38 Q 30 12, 60 28 T 120 18 T 160 32 T 200 8"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="8" r="3.5" fill="#ffffff" />
              </svg>
            </div>

            {/* Details */}
            <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tasks Completed</span>
                <span className="font-mono font-bold text-white">
                  {completedGoalsCount} of {totalGoalsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Habit Consistency</span>
                <span className="font-mono font-bold text-white">
                  {habitCompletionPercent}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Monthly Expenses</span>
                <span className="font-mono font-bold text-white">
                  ${monthlyTotalSpent.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Streak Card */}
          <div className="glass-panel-true p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">CONSISTENCY</span>
                <span className="text-sm font-bold text-white">{stats.activeHabitStreaks} Active Habit Streaks</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('habits')}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Habits <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

        {/* Right Column (3 Cols): Navigation Shortcuts */}
        <div className="lg:col-span-3 glass-panel-true p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold pb-2 border-b border-white/10">
            QUICK ACCESS
          </span>
          <div className="space-y-1 pt-1">
            {[
              { label: 'Tasks & Roadmap', id: 'todo-hub', icon: CheckSquare },
              { label: 'Habit Tracker', id: 'habits', icon: Activity },
              { label: 'Daily Journal', id: 'journal', icon: BookOpen },
              { label: 'Cash Flow Ledger', id: 'expenses', icon: DollarSign }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="w-full py-2.5 px-3 rounded-lg text-left text-xs font-sans text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                    {item.label}
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. IMMEDIATE ACTION ITEMS & HABIT MATRIX ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pending Tasks (7 Cols) */}
        <div className="lg:col-span-7 glass-panel-true p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Pending Tasks
              </h3>
            </div>
            <button
              onClick={() => onNavigate('todo-hub')}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              View All ({goals.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingGoals.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 space-y-2">
              <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400" />
              <p className="text-xs font-mono uppercase tracking-wider font-bold text-white">All tasks completed</p>
            </div>
          ) : (
            <div className="space-y-2 font-sans">
              {pendingGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-3 rounded-xl glass-card-true transition-all group hover:border-white/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => onToggleGoal(goal.id, !goal.completed)}
                      className="text-zinc-500 hover:text-white transition-colors shrink-0"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-zinc-200 block truncate group-hover:text-white transition-colors">
                        {goal.text}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                        {goal.timeframe} {goal.priority ? `• ${goal.priority}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleGoal(goal.id, !goal.completed)}
                    className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider glass-button-true text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits Today (5 Cols) */}
        <div className="lg:col-span-5 glass-panel-true p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Habits for Today (Day {todayDay})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('habits')}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Manage ({habits.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="py-10 text-center text-zinc-400">
              <p className="text-xs font-mono uppercase tracking-wider font-bold">No habits registered</p>
            </div>
          ) : (
            <div className="space-y-2 font-sans">
              {habits.map((habit) => {
                const isDoneToday = habit.completedDays && habit.completedDays.includes(todayDay);
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isDoneToday
                        ? 'bg-white/15 border border-white/25 text-white'
                        : 'glass-card-true text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleHabitDay(habit.id, todayDay)}
                        className={`transition-transform active:scale-95 shrink-0 ${
                          isDoneToday ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        {isDoneToday ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <div className="min-w-0">
                        <span className={`text-xs font-medium block truncate ${isDoneToday ? 'line-through opacity-75' : ''}`}>
                          {habit.habitName}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                          {habit.completedDays ? habit.completedDays.length : 0} days logged
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleHabitDay(habit.id, todayDay)}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-colors font-bold ${
                        isDoneToday 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'glass-button-true text-zinc-300 hover:text-white'
                      }`}
                    >
                      {isDoneToday ? 'Done' : 'Check'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
