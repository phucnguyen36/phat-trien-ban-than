import React, { useMemo, useState } from 'react';
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
  Quote,
  Clock,
  TrendingUp,
  Calendar,
  Layers,
  FileText,
  Target,
  Zap
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

  // Gamification Stats
  const stats = useMemo(() => {
    return calculateGamification(goals, habits, journals, expenses);
  }, [goals, habits, journals, expenses]);

  // Today's day number (1 to 31)
  const todayDate = useMemo(() => new Date(), []);
  const todayDay = todayDate.getDate();

  // Today's completed habits count
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

  // Pending Goals
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

  // Calculated Productivity Score (0 - 100)
  const productivityScore = useMemo(() => {
    const taskScore = goals.length > 0 ? (completedGoalsCount / goals.length) * 40 : 20;
    const habitScore = habits.length > 0 ? (todayHabitsDoneCount / habits.length) * 40 : 20;
    const recentJournal = journals.some(j => (Date.now() - j.updatedAt) < 2 * 86400000);
    const journalScore = recentJournal ? 20 : 5;
    return Math.min(100, Math.round(taskScore + habitScore + journalScore));
  }, [goals, completedGoalsCount, habits, todayHabitsDoneCount, journals]);

  // Time-block schedule slots simulation for today
  const timeBlocks = [
    { time: '07:30', label: 'Morning Deep State & Meditation', category: 'Mindset', status: 'done' },
    { time: '09:00', label: 'High-Impact Strategic Deep Work (Block 1)', category: 'Execution', status: 'current' },
    { time: '11:30', label: 'Systems Architecture & Product Review', category: 'Build', status: 'upcoming' },
    { time: '14:00', label: 'Deep Work Focus Block 2 & Refinement', category: 'Execution', status: 'upcoming' },
    { time: '17:00', label: 'Cardio Fitness / Strength & Bio-Reset', category: 'Health', status: 'upcoming' },
    { time: '21:00', label: 'Daily Journal & Performance Debrief', category: 'Review', status: 'upcoming' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. TOP HERO BANNER — SWISS EDITORIAL TYPOGRAPHY & TELEMETRY */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-mono tracking-widest uppercase font-bold glass-pill-true mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>EXECUTIVE COMMAND SYSTEM • V5.0</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase font-sans">
            Deep Focus
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm mt-1 max-w-xl font-normal leading-relaxed">
            High-leverage personal growth OS: Tactical Objectives, Habit Consistency, and Flow Telemetry.
          </p>
        </div>

        {/* Timeframe selector pills (Day / Week / Month / Year) */}
        <div className="flex items-center gap-1.5 glass-pill-true p-1.5 self-start md:self-auto">
          {(['day', 'week', 'month', 'year'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframeFilter(t)}
              className={`px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded-full transition-all font-bold ${
                timeframeFilter === t
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t === 'day' ? 'Day' : t === 'week' ? 'Week' : t === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. THREE-COLUMN ARCHITECTURAL WIDGET GRID (SWISS LUXURY SPEC) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Daily Flow Time-Block Matrix */}
        <div className="lg:col-span-5 glass-panel-true p-6 md:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-zinc-300" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                Daily Focus Schedule
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">
              {todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Timeblock Timeline */}
          <div className="space-y-3 font-sans">
            {timeBlocks.map((block, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-3.5 p-3 rounded-xl transition-all ${
                  block.status === 'current'
                    ? 'bg-white/15 border border-white/25 shadow-lg text-white font-semibold'
                    : block.status === 'done'
                    ? 'bg-white/[0.03] border border-white/5 text-zinc-400 line-through'
                    : 'glass-card-true text-zinc-200'
                }`}
              >
                <span className="font-mono text-xs font-bold text-zinc-400 shrink-0 w-12">
                  {block.time}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium block truncate">
                    {block.label}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                    {block.category}
                  </span>
                </div>
                {block.status === 'current' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                )}
                {block.status === 'done' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Daily Motivational Direct Quote */}
          <div className="p-4 rounded-xl glass-card-true border border-white/10 flex items-start gap-3 mt-4">
            <Quote className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                "{quoteObj.quote}"
              </p>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                — {quoteObj.author}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Column (4 Cols): Tactical Roadmaps & Telemetry Sparklines */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Progress Telemetry Card */}
          <div className="glass-panel-true p-6 md:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-300" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                  Execution Metrics
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {productivityScore}/100 SCORE
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-4xl font-black font-sans text-white tracking-tight">
                {overallProgressPercent}%
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-semibold">
                Overall Roadmap Velocity
              </span>
            </div>

            {/* Clean SVG Sparkline Chart */}
            <div className="py-2">
              <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
                <defs>
                  <linearGradient id="metricGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 45 Q 30 15, 60 35 T 120 20 T 160 40 T 200 10 L 200 60 L 0 60 Z"
                  fill="url(#metricGlow)"
                />
                <path
                  d="M 0 45 Q 30 15, 60 35 T 120 20 T 160 40 T 200 10"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="10" r="4" fill="#ffffff" />
              </svg>
            </div>

            {/* Sub-Pillar Breakdown */}
            <div className="space-y-3 pt-2 border-t border-white/10 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Tactical Objectives
                </span>
                <span className="font-mono font-bold text-white">
                  {completedGoalsCount}/{totalGoalsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  Daily Habits Consistency
                </span>
                <span className="font-mono font-bold text-white">
                  {habitCompletionPercent}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  Monthly Cash Outflow
                </span>
                <span className="font-mono font-bold text-white">
                  ${monthlyTotalSpent.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>

          {/* Gamification Level Status Card */}
          <div className="glass-panel-true p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 glass-button-true text-amber-300">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">LEVEL & TIER</span>
                  <span className="text-base font-black text-white uppercase">Level {stats.currentLevel} • {stats.tierName}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-300">
                {stats.progressPercent}%
              </span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>

        </div>

        {/* Right Column (3 Cols): Deep Focus Mode & Quick Access */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Deep Focus State Graphic Card */}
          <div className="glass-panel-true p-6 text-center space-y-4 relative overflow-hidden group">
            <div className="w-28 h-28 mx-auto relative flex items-center justify-center">
              {/* Minimalist Rotating Orbit Rings */}
              <div className="absolute inset-0 rounded-full border border-white/20 animate-spin" style={{ animationDuration: '24s' }} />
              <div className="absolute inset-2 rounded-full border border-dashed border-white/30 animate-spin" style={{ animationDuration: '16s', animationDirection: 'reverse' }} />
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Zap className="w-7 h-7 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Deep Work State
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {stats.activeHabitStreaks} active streak cycles recorded. Maintain rhythm.
              </p>
            </div>

            <button
              onClick={() => onNavigate('todo-hub')}
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-mono text-xs uppercase tracking-widest font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
            >
              <span>OPEN MATRIX</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Hub Navigation Shortcuts */}
          <div className="glass-panel-true p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold pb-2 border-b border-white/10">
              QUICK LAUNCH
            </span>
            <div className="space-y-1 pt-1">
              {[
                { label: 'Tactical Tasks Hub', id: 'todo-hub', icon: CheckSquare },
                { label: 'Habit Consistency', id: 'habits', icon: Activity },
                { label: 'Daily Reflection', id: 'journal', icon: BookOpen },
                { label: 'Burn-Rate Ledger', id: 'expenses', icon: DollarSign }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="w-full py-2 px-3 rounded-lg text-left text-xs font-sans text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors"
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

      </div>

      {/* 3. TACTICAL ACTION ITEMS & HABIT QUICK-CHECK ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Priority Objectives (7 Cols) */}
        <div className="lg:col-span-7 glass-panel-true p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                Immediate Action Objectives
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
            <div className="py-12 text-center text-zinc-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <p className="text-xs font-mono uppercase tracking-widest font-bold text-white">All tactical tasks completed!</p>
              <p className="text-xs text-zinc-500">Add new objectives in the Tactical Roadmap tab.</p>
            </div>
          ) : (
            <div className="space-y-2 font-sans">
              {pendingGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-3.5 rounded-xl glass-card-true transition-all group hover:border-white/20"
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

        {/* Daily Habits Quick Matrix (5 Cols) */}
        <div className="lg:col-span-5 glass-panel-true p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                Daily Habit Matrix (Day {todayDay})
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
            <div className="py-12 text-center text-zinc-400">
              <p className="text-xs font-mono uppercase tracking-widest font-bold">No habits registered yet.</p>
            </div>
          ) : (
            <div className="space-y-2 font-sans">
              {habits.map((habit) => {
                const isDoneToday = habit.completedDays && habit.completedDays.includes(todayDay);
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${
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
