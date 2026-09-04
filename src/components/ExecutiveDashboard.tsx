import React, { useState, useMemo } from 'react';
import { GoalTodo, HabitData, DailyJournal, PersonalExpense, TimeframeType, TimeEstimate } from '../types';
import { calculateGamification } from '../gamification';
import { UITheme } from '../App';
import { 
  CheckSquare, 
  Square,
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Activity, 
  Clock, 
  CreditCard,
  Plus,
  Trash2,
  RotateCcw,
  Flame,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface ExecutiveDashboardProps {
  goals: GoalTodo[];
  habits: HabitData[];
  journals: DailyJournal[];
  expenses: PersonalExpense[];
  onNavigate: (section: string) => void;
  onToggleGoal: (id: string, completed: boolean) => void;
  onToggleHabitDay: (id: string, day: number) => void;
  onAddGoal?: (text: string, timeframe: TimeframeType, timeEstimate?: TimeEstimate) => void;
  onDeleteGoal?: (id: string) => void;
  activeTheme?: UITheme;
}

export default function ExecutiveDashboard({
  goals,
  habits,
  journals,
  expenses,
  onNavigate,
  onToggleGoal,
  onToggleHabitDay,
  onAddGoal,
  onDeleteGoal
}: ExecutiveDashboardProps) {
  // Today's date info
  const todayDate = useMemo(() => new Date(), []);
  const todayDay = todayDate.getDate();
  const todayYearStr = useMemo(() => String(todayDate.getFullYear()), [todayDate]);
  const todayMonthStr = useMemo(() => String(todayDate.getMonth() + 1).padStart(2, '0'), [todayDate]);
  const todayDayStr = useMemo(() => String(todayDate.getDate()).padStart(2, '0'), [todayDate]);
  const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;

  // Helper: Strip context tag [D:...], [W:...], etc.
  const getDisplayGoalText = (text: string): string => {
    return text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '');
  };

  // State: Quick add input inside Today's task card
  const [quickTaskText, setQuickTaskText] = useState('');
  const [quickEstimate, setQuickEstimate] = useState<TimeEstimate | ''>('');
  const [todayTaskFilter, setTodayTaskFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [strategicFilter, setStrategicFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');

  // 1. OVERDUE UNCOMPLETED TASKS from previous days
  const overdueTasks = useMemo(() => {
    return goals.filter(g => {
      if (g.completed) return false;
      if (g.timeframe !== 'daily') return false;
      const match = g.text.match(/^\[D:(\d{4}-\d{2}-\d{2})\]/);
      if (match && match[1] < todayCtxKey) return true;
      return false;
    });
  }, [goals, todayCtxKey]);

  // 2. REAL ACCURATE TODAY'S TASKS (ZERO GHOST TASKS)
  // Strictly matches today's date tag [D:todayCtxKey] or untagged pending tasks
  const todayDailyTasks = useMemo(() => {
    return goals.filter(g => {
      if (g.timeframe !== 'daily') return false;
      const match = g.text.match(/^\[D:(\d{4}-\d{2}-\d{2})\]/);
      if (match) {
        return match[1] === todayCtxKey;
      }
      if ((g as any).dateContext) {
        return (g as any).dateContext === todayCtxKey;
      }
      // Untagged tasks: only show if incomplete (never show untagged tasks finished in the past)
      return !g.completed;
    });
  }, [goals, todayCtxKey]);

  // Sorted today's tasks: Pending high-priority tasks FIRST, completed tasks neatly at the bottom
  const sortedTodayTasks = useMemo(() => {
    return [...todayDailyTasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const prioOrder: Record<string, number> = {
        'The One Thing': 0,
        'High': 1,
        'Medium': 2,
        'Low': 3,
        'As and When': 4
      };
      const aP = prioOrder[a.priority || 'Medium'] ?? 2;
      const bP = prioOrder[b.priority || 'Medium'] ?? 2;
      return aP - bP;
    });
  }, [todayDailyTasks]);

  const displayedTodayTasks = useMemo(() => {
    if (todayTaskFilter === 'active') return sortedTodayTasks.filter(t => !t.completed);
    if (todayTaskFilter === 'completed') return sortedTodayTasks.filter(t => t.completed);
    return sortedTodayTasks;
  }, [sortedTodayTasks, todayTaskFilter]);

  // Today's metrics
  const todayTotal = todayDailyTasks.length;
  const todayDone = todayDailyTasks.filter(g => g.completed).length;
  const todayPending = todayTotal - todayDone;
  const todayProgressPercent = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  // Habits metrics
  const todayHabitsDoneCount = useMemo(() => {
    return habits.filter(h => h.completedDays && h.completedDays.includes(todayDay)).length;
  }, [habits, todayDay]);

  const habitCompletionPercent = habits.length > 0 
    ? Math.round((todayHabitsDoneCount / habits.length) * 100) 
    : 0;

  // Sorted Habits: Uncompleted first for actionable focus!
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      const aDone = a.completedDays?.includes(todayDay) ? 1 : 0;
      const bDone = b.completedDays?.includes(todayDay) ? 1 : 0;
      return aDone - bDone;
    });
  }, [habits, todayDay]);

  // Strategic Objectives (Weekly / Monthly / Yearly)
  const strategicGoalsAll = useMemo(() => {
    return goals.filter(g => g.timeframe !== 'daily');
  }, [goals]);

  const filteredStrategicGoals = useMemo(() => {
    const list = strategicGoalsAll.filter(g => {
      if (strategicFilter === 'all') return true;
      return g.timeframe === strategicFilter;
    });
    // Incomplete first
    return [...list].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  }, [strategicGoalsAll, strategicFilter]);

  // Monthly Expenses
  const currentMonth = todayDate.getMonth();
  const currentYear = todayDate.getFullYear();
  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [expenses, currentMonth, currentYear]);

  const monthlyTotalSpent = useMemo(() => {
    return monthlyExpenses
      .filter(e => e.amount < 0 || e.amount > 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  }, [monthlyExpenses]);

  // Handler: Quick add task for today
  const handleQuickAddToday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskText.trim() || !onAddGoal) return;
    const tag = `[D:${todayCtxKey}] `;
    onAddGoal(`${tag}${quickTaskText.trim()}`, 'daily', quickEstimate || undefined);
    setQuickTaskText('');
    setQuickEstimate('');
  };

  // Handler: Rollover overdue tasks to today
  const handleRolloverAll = async () => {
    if (!onAddGoal || !onDeleteGoal) return;
    for (const t of overdueTasks) {
      const clean = getDisplayGoalText(t.text);
      await onAddGoal(`[D:${todayCtxKey}] ${clean}`, 'daily', t.timeEstimate);
      await onDeleteGoal(t.id);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* 1. CLEAN EXECUTIVE BRIEFING HEADER (ZERO AI SLOP) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#1591DC] font-semibold">
              DAILY EXECUTIVE BRIEFING
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] text-[#9496a1] font-mono">
              {todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Command Center Overview
          </h1>
          <p className="text-xs text-[#9496a1] mt-1 font-normal">
            Real-time execution across tasks, daily habits, and strategic roadmap.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('todo-hub')}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1591DC] hover:bg-[#1591DC]/90 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks Hub</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('habits')}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-[#1591DC]" />
            <span>Habit Matrix</span>
          </button>
        </div>
      </div>

      {/* 2. 3 METRIC PILLARS (100% ACCURATE & HONEST DATA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Today's Tasks Execution */}
        <div className="kuldeep-card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9496a1]">Today's Execution</span>
            <Clock className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
            {todayDone} <span className="text-sm font-normal text-[#9496a1]">/ {todayTotal} tasks</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9496a1]">
            <span>{todayPending === 0 && todayTotal > 0 ? 'All finished today' : `${todayPending} pending for today`}</span>
            <span className="font-mono font-semibold text-white">{todayProgressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-[#1591DC] rounded-full transition-all duration-500" style={{ width: `${todayProgressPercent}%` }} />
          </div>
        </div>

        {/* Metric 2: Habits Discipline */}
        <div className="kuldeep-card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9496a1]">Habit Discipline</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
            {todayHabitsDoneCount} <span className="text-sm font-normal text-[#9496a1]">/ {habits.length} check-ins</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9496a1]">
            <span>{habits.length - todayHabitsDoneCount} rituals remaining</span>
            <span className="font-mono font-semibold text-white">{habitCompletionPercent}%</span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${habitCompletionPercent}%` }} />
          </div>
        </div>

        {/* Metric 3: Monthly Expenses / Outflow */}
        <div className="kuldeep-card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9496a1]">Monthly Outflow</span>
            <CreditCard className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
            {monthlyTotalSpent > 0 ? `${monthlyTotalSpent.toLocaleString('vi-VN')} đ` : '0 đ'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9496a1]">
            <span>{monthlyExpenses.length} transactions recorded</span>
            <button 
              type="button" 
              onClick={() => onNavigate('expenses')} 
              className="text-[#1591DC] hover:underline cursor-pointer"
            >
              Ledger &rarr;
            </button>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-sky-400/40 rounded-full" style={{ width: monthlyExpenses.length > 0 ? '100%' : '0%' }} />
          </div>
        </div>
      </div>

      {/* 3. CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Today's Real Daily Tasks */}
        <div className="lg:col-span-5 kuldeep-card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1591DC]" />
              <h2 className="text-sm font-semibold text-white">
                Today's Daily Tasks
              </h2>
            </div>
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTodayTaskFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  todayTaskFilter === 'all' ? 'bg-[#1591DC] text-white' : 'text-[#9496a1] hover:text-white'
                }`}
              >
                All ({todayDailyTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setTodayTaskFilter('active')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  todayTaskFilter === 'active' ? 'bg-[#1591DC] text-white' : 'text-[#9496a1] hover:text-white'
                }`}
              >
                Active ({todayPending})
              </button>
            </div>
          </div>

          {/* Overdue Tasks Alert Banner */}
          {overdueTasks.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-200 truncate">
                  {overdueTasks.length} unfinished task(s) from earlier days
                </span>
              </div>
              {onAddGoal && onDeleteGoal && (
                <button
                  type="button"
                  onClick={handleRolloverAll}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Move all unfinished tasks to today"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rollover</span>
                </button>
              )}
            </div>
          )}

          {/* Quick-Add Form for Today */}
          {onAddGoal && (
            <form onSubmit={handleQuickAddToday} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickTaskText}
                  onChange={(e) => setQuickTaskText(e.target.value)}
                  placeholder="Add priority task for today..."
                  className="w-full glass-input-true px-3 py-2 text-xs text-white rounded-xl focus:outline-none placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!quickTaskText.trim()}
                  className="px-3 py-2 btn-primary-cyan text-xs font-semibold rounded-xl shrink-0 flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Estimate Pill Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#9496a1]">Est:</span>
                {(['15m', '30m', '1h', '2h', 'half-day'] as TimeEstimate[]).map((est) => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setQuickEstimate(quickEstimate === est ? '' : est)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors cursor-pointer ${
                      quickEstimate === est
                        ? 'bg-[#1591DC] text-white font-bold'
                        : 'bg-white/[0.03] text-[#9496a1] hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    {est === 'half-day' ? '4h' : est}
                  </button>
                ))}
              </div>
            </form>
          )}

          {/* Real User Daily Tasks List */}
          {displayedTodayTasks.length === 0 ? (
            <div className="py-8 text-center text-[#9496a1] space-y-2">
              <Clock className="w-6 h-6 mx-auto text-zinc-600" />
              <p className="text-xs font-normal">No tasks scheduled for today.</p>
              <p className="text-[11px] text-zinc-600">Type above to add your first priority.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {displayedTodayTasks.map((task) => (
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
                      className={`transition-transform active:scale-95 shrink-0 cursor-pointer ${
                        task.completed ? 'text-emerald-400' : 'text-[#9496a1] hover:text-white'
                      }`}
                    >
                      {task.completed ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <span className={`text-xs font-medium block truncate ${task.completed ? 'line-through opacity-60 text-[#9496a1]' : 'text-white'}`}>
                        {getDisplayGoalText(task.text)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.timeEstimate && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.04] border border-white/[0.08] text-[#9496a1] font-mono">
                        {task.timeEstimate === 'half-day' ? '4h' : task.timeEstimate}
                      </span>
                    )}

                    {onDeleteGoal && (
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#9496a1] hover:text-red-400 transition-opacity cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (7 Cols): Strategic Objectives & Habit Check-in */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Strategic Objectives (Weekly • Monthly • Yearly) */}
          <div className="kuldeep-card p-5 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#1591DC]" />
                <h3 className="text-sm font-semibold text-white">
                  Strategic Roadmap ({strategicGoalsAll.length})
                </h3>
              </div>

              {/* Timeframe Filter Pills */}
              <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
                {(['all', 'weekly', 'monthly', 'yearly'] as const).map(tf => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setStrategicFilter(tf)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                      strategicFilter === tf ? 'bg-white text-black font-semibold' : 'text-[#9496a1] hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {filteredStrategicGoals.length === 0 ? (
              <div className="py-8 text-center text-[#9496a1] space-y-2">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400" />
                <p className="text-xs font-semibold text-white">No strategic objectives for this scope.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {filteredStrategicGoals.slice(0, 6).map((goal) => (
                  <div
                    key={goal.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
                      goal.completed
                        ? 'bg-white/[0.02] border border-white/[0.04] opacity-60'
                        : 'bg-[#0e1015] border border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleGoal(goal.id, !goal.completed)}
                        className={`shrink-0 transition-colors cursor-pointer ${goal.completed ? 'text-emerald-400' : 'text-[#9496a1] hover:text-white'}`}
                      >
                        {goal.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                      <div className="min-w-0">
                        <span className={`text-xs font-medium block truncate ${goal.completed ? 'line-through text-[#9496a1]' : 'text-[#ededf3]'}`}>
                          {getDisplayGoalText(goal.text)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        goal.timeframe === 'weekly' 
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : goal.timeframe === 'monthly'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {goal.timeframe}
                      </span>

                      {onDeleteGoal && (
                        <button
                          type="button"
                          onClick={() => onDeleteGoal(goal.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#9496a1] hover:text-red-400 transition-opacity cursor-pointer"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Habits Check-in (Zero Duplicate Buttons & Pure Clean Toggle) */}
          <div className="kuldeep-card p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Today's Habit Check-in (Day {todayDay})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('habits')}
                className="text-xs text-[#9496a1] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                Manage ({habits.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="py-8 text-center text-[#9496a1]">
                <p className="text-xs font-medium">No habits configured yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {sortedHabits.map((habit) => {
                  const isDoneToday = habit.completedDays && habit.completedDays.includes(todayDay);
                  const streakCount = habit.completedDays ? habit.completedDays.length : 0;

                  return (
                    <div
                      key={habit.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        isDoneToday
                          ? 'bg-emerald-500/[0.06] border border-emerald-500/20'
                          : 'bg-[#0e1015] border border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate text-white">
                            {habit.habitName}
                          </span>
                          <span className="text-[10px] text-[#9496a1] font-mono flex items-center gap-1 mt-0.5">
                            <Flame className={`w-3 h-3 ${isDoneToday ? 'text-emerald-400' : 'text-zinc-500'}`} />
                            <span>{streakCount} days completed this month</span>
                          </span>
                        </div>
                      </div>

                      {/* Single, Sleek Interactive Toggle Button (Zero AI Slop Duplicate) */}
                      <button
                        type="button"
                        onClick={() => onToggleHabitDay(habit.id, todayDay)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isDoneToday 
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 shadow-sm' 
                            : 'bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white'
                        }`}
                      >
                        {isDoneToday ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Check</span>
                          </>
                        )}
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
