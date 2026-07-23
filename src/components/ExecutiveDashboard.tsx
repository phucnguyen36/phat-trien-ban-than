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
      {/* Header Banner - Leveling & XP */}
      <div className="relative overflow-hidden rounded-none bg-[#020202]/60 backdrop-blur-md border border-zinc-900 p-6 md:p-8 text-zinc-100 shadow-none">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none text-[10px] font-mono tracking-widest uppercase font-bold bg-zinc-900 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              EXECUTIVE COMMAND CENTER
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-zinc-100 font-mono uppercase">
              Cập Nhật Tiến Độ & Năng Lượng
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm max-w-xl font-sans leading-relaxed">
              Hệ thống phát triển bản thân toàn diện: Quản trị mục tiêu, rèn luyện thói quen và tối ưu hóa hiệu suất mỗi ngày.
            </p>
          </div>

          {/* Level Badge Card - Squared subtle edges */}
          <div className="bg-[#050506] border border-zinc-900 rounded-none p-4 md:p-5 flex flex-col gap-3 min-w-[260px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-none bg-zinc-900 border border-zinc-800 text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Cấp Độ Hiện Tại</span>
                  <span className="text-base font-bold font-mono text-zinc-100">Level {stats.currentLevel}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded-none bg-amber-400/10 border border-amber-400/30">
                  {stats.tierName}
                </span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>{stats.xpInCurrentLevel} / {stats.xpNeededForNextLevel} XP</span>
                <span>{stats.progressPercent}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-none h-1.5 overflow-hidden border border-zinc-800">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 h-full rounded-none transition-all duration-500"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-900">
              <span>Tổng XP: <strong className="text-zinc-200">{stats.totalXP}</strong></span>
              <span>Danh hiệu: <strong className="text-amber-400">{stats.badgesCount} Badges</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Quick Stats Cards - Squared & Consistent Fonts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Habit Stat */}
        <div 
          onClick={() => onNavigate('habits')}
          className="group cursor-pointer rounded-none bg-[#020202]/40 backdrop-blur-md border border-zinc-900 p-5 hover:border-zinc-700 transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">THÓI QUÊN HÔM NAY</span>
            <div className="p-1.5 rounded-none bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{todayHabitsDoneCount}/{habits.length}</span>
            <span className="text-xs font-mono font-semibold text-emerald-400">{habitCompletionPercent}% xong</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center justify-between uppercase tracking-wider">
            <span>{stats.activeHabitStreaks} THÓI QUÊN RÈN LUYỆN</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-400" />
          </p>
        </div>

        {/* Goals Stat */}
        <div 
          onClick={() => onNavigate('todo-hub')}
          className="group cursor-pointer rounded-none bg-[#020202]/40 backdrop-blur-md border border-zinc-900 p-5 hover:border-zinc-700 transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">CÔNG VIỆC & MỤC TIÊU</span>
            <div className="p-1.5 rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{goals.length - pendingGoals.length}/{goals.length}</span>
            <span className="text-xs font-mono font-semibold text-zinc-400">ĐÃ XONG</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center justify-between uppercase tracking-wider">
            <span>CÒN {pendingGoals.length} MỤC TIÊU TỒN ĐỌNG</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-400" />
          </p>
        </div>

        {/* Expenses Stat */}
        <div 
          onClick={() => onNavigate('expenses')}
          className="group cursor-pointer rounded-none bg-[#020202]/40 backdrop-blur-md border border-zinc-900 p-5 hover:border-zinc-700 transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">TÀI CHÍNH THÁNG NÀY</span>
            <div className="p-1.5 rounded-none bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-zinc-100">
              {monthlyTotalSpent.toLocaleString('vi-VN')} ₫
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center justify-between uppercase tracking-wider">
            <span>CHI TIÊU THÁNG HIỆN TẠI</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-400" />
          </p>
        </div>

        {/* Journal Stat */}
        <div 
          onClick={() => onNavigate('journal')}
          className="group cursor-pointer rounded-none bg-[#020202]/40 backdrop-blur-md border border-zinc-900 p-5 hover:border-zinc-700 transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">NHẬT KÝ & SUY TƯỞNG</span>
            <div className="p-1.5 rounded-none bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{journals.length}</span>
            <span className="text-xs font-mono font-semibold text-purple-300">BÀI ĐÃ GHI</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center justify-between uppercase tracking-wider">
            <span>VIẾT NHẬT KÝ HÔM NAY</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-zinc-400" />
          </p>
        </div>
      </div>

      {/* Main Content Split: Priority Tasks & Today's Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Today's Priorities */}
        <div className="lg:col-span-7 bg-[#020202]/40 backdrop-blur-md border border-zinc-900 rounded-none p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-100 font-bold">Nhiệm Vụ Cần Xử Lý</h2>
            </div>
            <button 
              onClick={() => onNavigate('todo-hub')}
              className="text-[10px] font-mono uppercase tracking-widest font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              Xem tất cả ({goals.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingGoals.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
              <p className="font-mono text-xs uppercase tracking-wider text-zinc-300">Tuyệt vời! Không có nhiệm vụ tồn đọng.</p>
              <p className="text-xs text-zinc-600">Tất cả mục tiêu ưu tiên đã được hoàn thành.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingGoals.map(goal => (
                <div 
                  key={goal.id}
                  className="flex items-center justify-between p-3 rounded-none bg-[#050506] border border-zinc-900 hover:border-zinc-800 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => onToggleGoal(goal.id, !goal.completed)}
                      className="text-zinc-600 hover:text-emerald-400 transition-colors flex-shrink-0"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <div className="truncate">
                      <span className="text-xs font-sans text-zinc-200 block truncate group-hover:text-white transition-colors">
                        {goal.text}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                        {goal.timeframe}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onToggleGoal(goal.id, !goal.completed)}
                    className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-none bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/80 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    Hoàn thành
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Daily Habits Quick Check */}
        <div className="lg:col-span-5 bg-[#020202]/40 backdrop-blur-md border border-zinc-900 rounded-none p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-100 font-bold">Thói Quên Hôm Nay (Ngày {todayDay})</h2>
            </div>
            <button 
              onClick={() => onNavigate('habits')}
              className="text-[10px] font-mono uppercase tracking-widest font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              Quản lý ({habits.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              <p className="text-xs font-mono uppercase tracking-wider">Chưa có thói quen nào được tạo.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.map(habit => {
                const isDoneToday = habit.completedDays && habit.completedDays.includes(todayDay);
                return (
                  <div 
                    key={habit.id}
                    className={`flex items-center justify-between p-3 rounded-none border transition-all ${
                      isDoneToday 
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                        : 'bg-[#050506] border-zinc-900 text-zinc-300 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onToggleHabitDay(habit.id, todayDay)}
                        className={`p-0.5 transition-transform active:scale-95 ${
                          isDoneToday ? 'text-emerald-400' : 'text-zinc-600 hover:text-amber-400'
                        }`}
                      >
                        {isDoneToday ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <div>
                        <span className={`text-xs font-sans block ${isDoneToday ? 'line-through opacity-70' : ''}`}>
                          {habit.habitName}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                          Đã thực hiện {habit.completedDays ? habit.completedDays.length : 0} ngày
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleHabitDay(habit.id, todayDay)}
                      className={`text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-none font-medium transition-colors ${
                        isDoneToday 
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
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
      <div className="rounded-none bg-[#050506] p-5 border border-zinc-900 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
        <div className="p-2.5 rounded-none bg-zinc-900 text-indigo-400 border border-zinc-800 flex-shrink-0">
          <Quote className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs md:text-sm font-sans text-zinc-300 italic">
            "{quoteObj.quote}"
          </p>
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-semibold block">
            — {quoteObj.author}
          </span>
        </div>
      </div>
    </div>
  );
}
