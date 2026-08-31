import React, { useMemo } from 'react';
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
  onToggleHabitDay
}: ExecutiveDashboardProps) {
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
    return goals.filter(g => !g.completed).slice(0, 5);
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

  // Focused schedule blocks for today
  const timeBlocks = [
    { time: '08:00', label: 'Morning Setup & Priority Alignment', status: 'done' },
    { time: '09:30', label: 'Deep Focus Execution Block 1', status: 'current' },
    { time: '13:30', label: 'System Review & Architecture', status: 'upcoming' },
    { time: '15:30', label: 'Deep Focus Execution Block 2', status: 'upcoming' },
    { time: '17:30', label: 'Physical Training & Reset', status: 'upcoming' },
    { time: '21:00', label: 'Daily Journal & Reflection', status: 'upcoming' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. HERO SECTION (THOMAS NGUYEN / SWISS STUDIO STANDARD) */}
      <div className="space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12141a] border border-white/[0.08] text-xs text-[#c3c3cc]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Focus Mode • All Systems Nominal</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-[1.15]">
          Every Great System Deserves Deep Focus.
        </h1>

        <p className="text-sm md:text-base text-[#9496a1] max-w-2xl font-normal leading-relaxed">
          Clear roadmaps, daily habit consistency, and disciplined cash flow tracking.
        </p>

        {/* 3 Metric Pillars (Thomas Nguyen Standard) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="kuldeep-card p-5 space-y-1">
            <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {completedGoalsCount}+
            </div>
            <div className="text-xs text-[#9496a1] font-medium">
              Objectives Completed ({overallProgressPercent}% velocity)
            </div>
          </div>

          <div className="kuldeep-card p-5 space-y-1">
            <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {habitCompletionPercent}%
            </div>
            <div className="text-xs text-[#9496a1] font-medium">
              Habit Consistency Score ({stats.activeHabitStreaks} active streaks)
            </div>
          </div>

          <div className="kuldeep-card p-5 space-y-1">
            <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              ${monthlyTotalSpent.toLocaleString('en-US')}
            </div>
            <div className="text-xs text-[#9496a1] font-medium">
              Monthly Cash Flow Managed
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Today's Schedule */}
        <div className="lg:col-span-5 kuldeep-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1591DC]" />
              <h2 className="text-sm font-semibold text-white">
                Today's Schedule
              </h2>
            </div>
            <span className="text-xs text-[#9496a1] font-mono">
              {todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Timeblocks */}
          <div className="space-y-2">
            {timeBlocks.map((block, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  block.status === 'current'
                    ? 'bg-[#1591DC]/10 border border-[#1591DC]/30 text-white font-medium shadow-sm'
                    : block.status === 'done'
                    ? 'bg-white/[0.02] border border-white/[0.04] text-[#9496a1] line-through'
                    : 'bg-[#0e1015] border border-white/[0.06] text-[#ededf3]'
                }`}
              >
                <span className="font-mono text-xs font-semibold text-[#9496a1] shrink-0 w-12">
                  {block.time}
                </span>
                <span className="text-xs flex-1 truncate">
                  {block.label}
                </span>
                {block.status === 'current' && (
                  <span className="w-2 h-2 rounded-full bg-[#1591DC] animate-ping shrink-0" />
                )}
                {block.status === 'done' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="p-3.5 rounded-xl bg-[#0e1015] border border-white/[0.06] flex items-start gap-3 mt-3">
            <Quote className="w-4 h-4 text-[#9496a1] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-[#ededf3] italic leading-relaxed">
                "{quoteObj.quote}"
              </p>
              <span className="text-[10px] text-[#9496a1] font-medium block">
                — {quoteObj.author}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Immediate Objectives & Habit Check-in */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Priority Tasks */}
          <div className="kuldeep-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#1591DC]" />
                <h3 className="text-sm font-semibold text-white">
                  Immediate Priority Tasks
                </h3>
              </div>
              <button
                onClick={() => onNavigate('todo-hub')}
                className="text-xs text-[#9496a1] hover:text-white flex items-center gap-1 transition-colors"
              >
                View All ({goals.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {pendingGoals.length === 0 ? (
              <div className="py-8 text-center text-[#9496a1] space-y-2">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400" />
                <p className="text-xs font-semibold text-white">All priority tasks completed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0e1015] border border-white/[0.06] transition-all group hover:border-white/[0.15]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleGoal(goal.id, !goal.completed)}
                        className="text-[#9496a1] hover:text-white transition-colors shrink-0"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#ededf3] block truncate group-hover:text-white transition-colors">
                          {goal.text}
                        </span>
                        <span className="text-[10px] text-[#9496a1] font-mono">
                          {goal.timeframe} {goal.priority ? `• ${goal.priority}` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleGoal(goal.id, !goal.completed)}
                      className="px-3 py-1 rounded-full text-[10px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[#ededf3] transition-all shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      Complete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Habits Check-in */}
          <div className="kuldeep-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Today's Habit Check-in (Day {todayDay})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('habits')}
                className="text-xs text-[#9496a1] hover:text-white flex items-center gap-1 transition-colors"
              >
                Manage ({habits.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="py-8 text-center text-[#9496a1]">
                <p className="text-xs font-medium">No habits configured yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {habits.map((habit) => {
                  const isDoneToday = habit.completedDays && habit.completedDays.includes(todayDay);
                  return (
                    <div
                      key={habit.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        isDoneToday
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-white'
                          : 'bg-[#0e1015] border border-white/[0.06] text-[#ededf3]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => onToggleHabitDay(habit.id, todayDay)}
                          className={`transition-transform active:scale-95 shrink-0 ${
                            isDoneToday ? 'text-emerald-400' : 'text-[#9496a1] hover:text-white'
                          }`}
                        >
                          {isDoneToday ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <div className="min-w-0">
                          <span className={`text-xs font-medium block truncate ${isDoneToday ? 'line-through opacity-75' : ''}`}>
                            {habit.habitName}
                          </span>
                          <span className="text-[10px] text-[#9496a1] font-mono">
                            {habit.completedDays ? habit.completedDays.length : 0} days recorded
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleHabitDay(habit.id, todayDay)}
                        className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${
                          isDoneToday 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[#ededf3]'
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

    </div>
  );
}
