import React, { useMemo } from 'react';
import { GoalTodo, HabitData, DailyJournal, PersonalExpense } from '../types';
import { calculateGamification } from '../gamification';
import { UITheme } from '../App';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  CheckSquare, 
  Activity, 
  Clock,
  TrendingUp,
  CreditCard
} from 'lucide-react';

interface ExecutiveDashboardProps {
  goals: GoalTodo[];
  habits: HabitData[];
  journals: DailyJournal[];
  expenses: PersonalExpense[];
  onNavigate: (section: string) => void;
  onToggleGoal: (id: string, completed: boolean) => void;
  onToggleHabitDay: (id: string, day: number) => void;
  activeTheme?: UITheme;
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

  // Real dynamic Daily Tasks from user data
  const todayDailyTasks = useMemo(() => {
    return goals.filter(g => g.timeframe === 'daily');
  }, [goals]);

  // Strategic longer-term objectives (Weekly / Monthly / Yearly)
  const strategicGoals = useMemo(() => {
    return goals.filter(g => g.timeframe !== 'daily' && !g.completed).slice(0, 5);
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

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* 1. CLEAN EXECUTIVE BRIEFING HEADER (ZERO AI SLOP) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#1591DC] font-semibold">
              DAILY EXECUTIVE BRIEFING
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] text-[#9496a1]">
              {todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Command Center Overview
          </h1>
          <p className="text-xs text-[#9496a1] mt-1 font-normal">
            Real-time execution across tasks, habit discipline, and capital flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('todo-hub')}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1591DC] hover:bg-[#1591DC]/90 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Manage Tasks</span>
          </button>
          <button
            onClick={() => onNavigate('habits')}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-[#1591DC]" />
            <span>Habit Matrix</span>
          </button>
        </div>
      </div>

      {/* 2. 3 METRIC PILLARS (CLEAN & OBJECTIVE DATA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Tasks */}
        <div className="kuldeep-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9496a1]">Tasks Executed</span>
            <CheckSquare className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
            {completedGoalsCount} <span className="text-sm font-normal text-[#9496a1]">/ {totalGoalsCount}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9496a1]">
            <span>Completion rate</span>
            <span className="font-mono font-semibold text-white">{overallProgressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-[#1591DC] rounded-full" style={{ width: `${overallProgressPercent}%` }} />
          </div>
        </div>

        {/* Metric 2: Habits */}
        <div className="kuldeep-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9496a1]">Today's Habits</span>
            <Activity className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
            {todayHabitsDoneCount} <span className="text-sm font-normal text-[#9496a1]">/ {habits.length}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9496a1]">
            <span>Discipline rate</span>
            <span className="font-mono font-semibold text-white">{habitCompletionPercent}%</span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-[#1591DC] rounded-full" style={{ width: `${habitCompletionPercent}%` }} />
          </div>
        </div>

        {/* Metric 3: Expenses */}
        <div className="kuldeep-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9496a1]">Monthly Outflow</span>
            <CreditCard className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
            ${monthlyTotalSpent.toLocaleString('en-US')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9496a1]">
            <span>Expenses recorded</span>
            <span className="font-mono font-semibold text-white">
              {expenses.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.amount < 0;
              }).length} items
            </span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-white/20 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 3. CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Today's Real Daily Tasks */}
        <div className="lg:col-span-5 kuldeep-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1591DC]" />
              <h2 className="text-sm font-semibold text-white">
                Today's Daily Tasks
              </h2>
            </div>
            <span className="text-xs text-[#9496a1] font-mono">
              {todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Real User Daily Tasks List */}
          {todayDailyTasks.length === 0 ? (
            <div className="py-8 text-center text-[#9496a1] space-y-3">
              <p className="text-xs font-normal">No daily tasks scheduled for today.</p>
              <button
                onClick={() => onNavigate('todo-hub')}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#1591DC]/15 text-[#1591DC] hover:bg-[#1591DC]/25 border border-[#1591DC]/30 transition-all inline-flex items-center gap-1.5"
              >
                + Add Daily Task in Tasks Hub
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {todayDailyTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
                    task.completed
                      ? 'bg-white/[0.02] border border-white/[0.04] text-[#9496a1]'
                      : 'bg-[#0e1015] border border-white/[0.06] hover:border-white/[0.15] text-[#ededf3]'
                  }`}
                >
                  <div className="flex items-center gap-3 pr-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleGoal(task.id, !task.completed)}
                      className={`transition-transform active:scale-95 shrink-0 ${
                        task.completed ? 'text-emerald-400' : 'text-[#9496a1] hover:text-white'
                      }`}
                    >
                      {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <span className={`text-xs font-medium block truncate ${task.completed ? 'line-through opacity-60' : 'text-white'}`}>
                        {task.text.replace(/^\[D:[^\]]+\]\s*/, '')}
                      </span>
                    </div>
                  </div>
                  
                  {task.timeEstimate && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.04] border border-white/[0.08] text-[#9496a1] shrink-0 font-sans">
                      {task.timeEstimate === 'half-day' ? '4h' : task.timeEstimate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (7 Cols): Strategic Objectives & Habit Check-in */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Strategic Objectives */}
          <div className="kuldeep-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#1591DC]" />
                <h3 className="text-sm font-semibold text-white">
                  Strategic Objectives (Weekly / Monthly)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('todo-hub')}
                className="text-xs text-[#9496a1] hover:text-white flex items-center gap-1 transition-colors"
              >
                View All ({goals.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {strategicGoals.length === 0 ? (
              <div className="py-8 text-center text-[#9496a1] space-y-2">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400" />
                <p className="text-xs font-semibold text-white">All strategic objectives completed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {strategicGoals.map((goal) => (
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
                          {goal.text.replace(/^\[(W|M|Y):[^\]]+\]\s*/, '')}
                        </span>
                        <span className="text-[10px] text-[#9496a1] font-sans uppercase">
                          {goal.timeframe}
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
                <Activity className="w-4 h-4 text-[#1591DC]" />
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
                          ? 'bg-[#1591DC]/10 border border-[#1591DC]/25 text-white'
                          : 'bg-[#0e1015] border border-white/[0.06] text-[#ededf3]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => onToggleHabitDay(habit.id, todayDay)}
                          className={`transition-transform active:scale-95 shrink-0 ${
                            isDoneToday ? 'text-[#1591DC]' : 'text-[#9496a1] hover:text-white'
                          }`}
                        >
                          {isDoneToday ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <div className="min-w-0">
                          <span className={`text-xs font-medium block truncate ${isDoneToday ? 'line-through opacity-75' : ''}`}>
                            {habit.habitName}
                          </span>
                          <span className="text-[11px] text-[#9496a1] font-sans font-normal">
                            {habit.completedDays ? habit.completedDays.length : 0} days recorded
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleHabitDay(habit.id, todayDay)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isDoneToday 
                            ? 'bg-[#1591DC]/20 text-[#38bdf8] border border-[#1591DC]/30' 
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
