import React, { useState, useEffect } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  CheckSquare, 
  Activity, 
  BookOpen, 
  DollarSign, 
  FileText, 
  Compass, 
  X, 
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { GoalTodo, HabitData, PersonalExpense } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  goals: GoalTodo[];
  habits: HabitData[];
  expenses: PersonalExpense[];
  isLightMode: boolean;
  onToggleThemeMode: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  goals,
  habits,
  expenses,
  isLightMode,
  onToggleThemeMode
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const NAV_ITEMS = [
    { id: 'overview', label: 'Tổng Quan (Executive Dashboard)', icon: LayoutDashboard },
    { id: 'todo-hub', label: 'Mục Tiêu & Công Việc (Todo Hub)', icon: CheckSquare },
    { id: 'habits', label: 'Rèn Luyện Thói Quên (Habit Tracker)', icon: Activity },
    { id: 'journal', label: 'Nhật Ký & Suy Tưởng (Daily Journal)', icon: BookOpen },
    { id: 'expenses', label: 'Quản Lý Tài Chính (Expense Ledger)', icon: DollarSign },
    { id: 'scratchpad', label: 'Ghi Chú Nhanh (Scratchpad)', icon: FileText },
    { id: 'ae-picker', label: 'Kiến Trúc Cuộc Sống (AE Picker)', icon: Compass }
  ];

  const filteredNav = NAV_ITEMS.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredGoals = goals.filter(g => 
    g.text.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredHabits = habits.filter(h => 
    h.habitName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 px-4 animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input 
            type="text" 
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Gõ để tìm nhanh tính năng, mục tiêu, thói quen... (Ctrl + K)"
            className="w-full py-4 bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm md:text-base"
          />
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results / Actions List */}
        <div className="p-3 overflow-y-auto space-y-4 text-slate-300 text-sm">
          {/* Navigation Section */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1 block">
              Điều Hướng Nhanh
            </span>
            <div className="space-y-1">
              {filteredNav.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors text-slate-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-white">{item.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-blue-400 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goals Quick Search */}
          {query.trim().length > 0 && filteredGoals.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1 block">
                Mục Tiêu & Công Việc
              </span>
              <div className="space-y-1">
                {filteredGoals.map(g => (
                  <div 
                    key={g.id}
                    onClick={() => {
                      onNavigate('todo-hub');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer flex justify-between items-center"
                  >
                    <span className="truncate font-medium text-slate-200">{g.text}</span>
                    <span className="text-xs text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                      {g.timeframe}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habits Quick Search */}
          {query.trim().length > 0 && filteredHabits.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1 block">
                Thói Quên
              </span>
              <div className="space-y-1">
                {filteredHabits.map(h => (
                  <div 
                    key={h.id}
                    onClick={() => {
                      onNavigate('habits');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer flex justify-between items-center"
                  >
                    <span className="truncate font-medium text-slate-200">{h.habitName}</span>
                    <span className="text-xs text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {h.completedDays ? h.completedDays.length : 0} ngày
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Settings Actions */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1 block">
              Tùy Chỉnh Nhanh
            </span>
            <button
              onClick={() => {
                onToggleThemeMode();
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                  {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <span className="font-medium text-slate-200">
                  Chuyển Sang Chế Độ {isLightMode ? 'Tối (Dark Mode)' : 'Sáng (Light Mode)'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Dùng phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">ESC</kbd> để thoát</span>
          <span>Bật nhanh bằng <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Ctrl + K</kbd></span>
        </div>
      </div>
    </div>
  );
}
