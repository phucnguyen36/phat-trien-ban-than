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
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'todo-hub', label: 'Tactical Roadmap (Todo Hub)', icon: CheckSquare },
    { id: 'habits', label: 'Habit Matrix (Habit Tracker)', icon: Activity },
    { id: 'journal', label: 'Energy Journal (Daily Journal)', icon: BookOpen },
    { id: 'expenses', label: 'Cash Flow Ledger (Expense Ledger)', icon: DollarSign },
    { id: 'scratchpad', label: 'Brain Scratchpad', icon: FileText },
    { id: 'ae-picker', label: 'Life Architecture (AE Picker)', icon: Compass }
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 px-4 animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[#020202] border border-zinc-800 rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-zinc-900 bg-[#050506]">
          <Search className="w-5 h-5 text-zinc-500 mr-3" />
          <input 
            type="text" 
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type to quick search features, goals, habits... (Ctrl + K)"
            className="w-full py-4 bg-transparent text-white font-mono placeholder-zinc-600 focus:outline-none text-sm md:text-base"
          />
          <button 
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white rounded-none hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results / Actions List */}
        <div className="p-3 overflow-y-auto space-y-4 text-zinc-300 text-sm font-mono">
          {/* Navigation Section */}
          <div>
            <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-1 block">
              QUICK NAVIGATION
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
                    className="w-full flex items-center justify-between p-2.5 rounded-none hover:bg-zinc-900 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-none bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-zinc-200 group-hover:text-white">{item.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-zinc-400 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goals Quick Search */}
          {query.trim().length > 0 && filteredGoals.length > 0 && (
            <div>
              <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-1 block">
                GOALS & TASKS
              </span>
              <div className="space-y-1">
                {filteredGoals.map(g => (
                  <div 
                    key={g.id}
                    onClick={() => {
                      onNavigate('todo-hub');
                      onClose();
                    }}
                    className="p-2.5 rounded-none hover:bg-zinc-900 cursor-pointer flex justify-between items-center"
                  >
                    <span className="truncate font-medium text-zinc-200">{g.text}</span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 px-2 py-0.5 rounded-none bg-zinc-900 border border-zinc-800">
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
              <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-1 block">
                HABITS
              </span>
              <div className="space-y-1">
                {filteredHabits.map(h => (
                  <div 
                    key={h.id}
                    onClick={() => {
                      onNavigate('habits');
                      onClose();
                    }}
                    className="p-2.5 rounded-none hover:bg-zinc-900 cursor-pointer flex justify-between items-center"
                  >
                    <span className="truncate font-medium text-zinc-200">{h.habitName}</span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 px-2 py-0.5 rounded-none bg-zinc-900 border border-zinc-800">
                      {h.completedDays ? h.completedDays.length : 0} Days Logged
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Settings Actions */}
          <div className="pt-2 border-t border-zinc-900">
            <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-1 block">
              QUICK PREFERENCES
            </span>
            <button
              onClick={() => {
                onToggleThemeMode();
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-none hover:bg-zinc-900 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-none bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <span className="font-medium text-zinc-200">
                  Switch to {isLightMode ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-[#050506] border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded-none bg-zinc-900 text-zinc-300 font-mono">ESC</kbd> to exit</span>
          <span>Quick trigger with <kbd className="px-1.5 py-0.5 rounded-none bg-zinc-900 text-zinc-300 font-mono">Ctrl + K</kbd></span>
        </div>
      </div>
    </div>
  );
}
