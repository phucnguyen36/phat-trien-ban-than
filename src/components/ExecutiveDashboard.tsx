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

  // Pending Goals (sorted by priority or timeframe)
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
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner - Leveling & XP */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute -right-10 -bottom-10 opacity-10 blur-xl pointer-events-none w-72 h-72 rounded-full bg-blue-500"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Executive Command Center
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
              Cập Nhật Tiến Độ & Năng Lượng
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-xl">
              Hệ thống phát triển bản thân toàn diện: Quản trị mục tiêu, rèn luyện thói quen và tối ưu hóa hiệu suất mỗi ngày.
            </p>
          </div>

          {/* Level Badge Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-xl p-4 md:p-5 flex flex-col gap-3 min-w-[260px] shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stats.tierColor} text-white shadow-md`}>
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 block">Cấp Độ Hiện Tại</span>
                  <span className="text-lg font-bold text-white">Level {stats.currentLevel}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  {stats.tierName}
                </span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>{stats.xpInCurrentLevel} / {stats.xpNeededForNextLevel} XP</span>
                <span>{stats.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-white/10">
              <span>Tổng XP: <strong className="text-white">{stats.totalXP}</strong></span>
              <span>Danh hiệu: <strong className="text-amber-300">{stats.badgesCount} Badges</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Habit Stat */}
        <div 
          onClick={() => onNavigate('habits')}
          className="group cursor-pointer rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 hover:border-blue-500/50 transition-all duration-300 shadow-md hover:shadow-blue-500/10"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thói Quên Hôm Nay</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{todayHabitsDoneCount}/{habits.length}</span>
            <span className="text-xs font-semibold text-emerald-400">{habitCompletionPercent}% hoàn thành</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>{stats.activeHabitStreaks} thói quen đang rèn luyện</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Goals Stat */}
        <div 
          onClick={() => onNavigate('todo-hub')}
          className="group cursor-pointer rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 hover:border-emerald-500/50 transition-all duration-300 shadow-md hover:shadow-emerald-500/10"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Công Việc & Mục Tiêu</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{goals.length - pendingGoals.length}/{goals.length}</span>
            <span className="text-xs font-semibold text-slate-400">Đã xong</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Còn {pendingGoals.length} mục tiêu cần thực hiện</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Expenses Stat */}
        <div 
          onClick={() => onNavigate('expenses')}
          className="group cursor-pointer rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 hover:border-amber-500/50 transition-all duration-300 shadow-md hover:shadow-amber-500/10"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tài Chính Tháng Này</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {monthlyTotalSpent.toLocaleString('vi-VN')} ₫
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Tổng chi tiêu trong tháng</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Journal Stat */}
        <div 
          onClick={() => onNavigate('journal')}
          className="group cursor-pointer rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 hover:border-purple-500/50 transition-all duration-300 shadow-md hover:shadow-purple-500/10"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nhật Ký & Suy Tưởng</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{journals.length}</span>
            <span className="text-xs font-semibold text-purple-300">Bài đã ghi</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Viết nhật ký hôm nay</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </div>

      {/* Main Content Split: Priority Tasks & Today's Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Today's Priorities */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Nhiệm Vụ Cần Xử Lý</h2>
            </div>
            <button 
              onClick={() => onNavigate('todo-hub')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              Xem tất cả ({goals.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingGoals.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
              <p className="font-semibold text-slate-200">Tuyệt vời! Không có nhiệm vụ tồn đọng.</p>
              <p className="text-xs text-slate-500">Tất cả mục tiêu ưu tiên đã được hoàn thành.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingGoals.map(goal => (
                <div 
                  key={goal.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => onToggleGoal(goal.id, !goal.completed)}
                      className="text-slate-500 hover:text-emerald-400 transition-colors flex-shrink-0"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <div className="truncate">
                      <span className="text-sm font-semibold text-slate-200 block truncate group-hover:text-white transition-colors">
                        {goal.text}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-blue-300 border border-slate-700">
                          {goal.timeframe}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onToggleGoal(goal.id, !goal.completed)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    Hoàn thành
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Daily Habits Quick Check */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Thói Quên Hôm Nay (Ngày {todayDay})</h2>
            </div>
            <button 
              onClick={() => onNavigate('habits')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              Quản lý ({habits.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm">Chưa có thói quen nào được tạo.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {habits.map(habit => {
                const isDoneToday = habit.completedDays && habit.completedDays.includes(todayDay);
                return (
                  <div 
                    key={habit.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isDoneToday 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onToggleHabitDay(habit.id, todayDay)}
                        className={`p-1 rounded-lg transition-transform active:scale-95 ${
                          isDoneToday ? 'text-emerald-400' : 'text-slate-500 hover:text-amber-400'
                        }`}
                      >
                        {isDoneToday ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <div>
                        <span className={`text-sm font-semibold block ${isDoneToday ? 'line-through opacity-80' : ''}`}>
                          {habit.habitName}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          Đã thực hiện {habit.completedDays ? habit.completedDays.length : 0} ngày
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleHabitDay(habit.id, todayDay)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        isDoneToday 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isDoneToday ? 'Đã xong' : 'Check-in'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quote Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950 p-6 border border-indigo-500/20 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
        <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
          <Quote className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm md:text-base font-medium text-slate-200 italic">
            "{quoteObj.quote}"
          </p>
          <span className="text-xs text-indigo-400 font-semibold block">
            — {quoteObj.author}
          </span>
        </div>
      </div>
    </div>
  );
}
