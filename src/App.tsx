/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GoalTodo, 
  HabitData, 
  DailyJournal, 
  PersonalExpense, 
  TimeframeType, 
  ExpenseCategory 
} from './types';
import { 
  INITIAL_GOALS, 
  INITIAL_HABITS, 
  INITIAL_JOURNAL, 
  INITIAL_EXPENSES, 
  INITIAL_SCRATCHPAD_TEXT 
} from './initialData';

import { 
  loadWorkspaceData, 
  saveGoal, 
  deleteGoal, 
  saveHabit, 
  deleteHabit, 
  saveJournal, 
  saveExpense, 
  deleteExpense, 
  saveScratchpad,
  isLocalModeEnabled,
  setLocalModeEnabled,
  syncCollectionRealtime,
  syncScratchpadRealtime,
  loadFromLocalStorage,
  purgeAllWorkspaceData
} from './firebase';

import AuthGate from './components/AuthGate';
import TodoHub from './components/TodoHub';
import HabitTracker from './components/HabitTracker';
import DailyJournalPanel from './components/DailyJournal';
import ExpenseLedger from './components/ExpenseLedger';
import Scratchpad from './components/Scratchpad';
import AEPicker from './components/AEPicker';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import CommandPalette from './components/CommandPalette';
import AdminDashboard from './components/AdminDashboard';
import { UserAccount } from './userRegistry';

import { 
  Database, 
  CloudOff, 
  User, 
  LogOut, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck,
  Info,
  Clock,
  Compass,
  FileCode,
  Sliders,
  Settings,
  X,
  Download,
  Upload,
  Palette,
  Sun,
  Moon,
  Trash2,
  CheckSquare,
  Activity,
  BookOpen,
  DollarSign,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Search,
  Trophy
} from 'lucide-react';

interface UserProfile {
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
}

export interface UITheme {
  id: string;
  name: string;
  accent: string;
  text: string;
  border: string;
  borderMuted: string;
  bgMuted: string;
  hoverBorder: string;
  shadowGlow: string;
}

export const THEMES: UITheme[] = [
  { 
    id: 'blue', 
    name: 'Cosmic Blue', 
    accent: '#3b82f6', 
    text: 'text-[#3b82f6]', 
    border: 'border-[#3b82f6]', 
    borderMuted: 'border-[#3b82f6]/20', 
    bgMuted: 'bg-[#3b82f6]/10', 
    hoverBorder: 'hover:border-[#3b82f6]',
    shadowGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]'
  },
  { 
    id: 'emerald', 
    name: 'Emerald Jade', 
    accent: '#10b981', 
    text: 'text-[#10b981]', 
    border: 'border-[#10b981]', 
    borderMuted: 'border-[#10b981]/20', 
    bgMuted: 'bg-[#10b981]/10', 
    hoverBorder: 'hover:border-[#10b981]',
    shadowGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
  },
  { 
    id: 'amber', 
    name: 'Nordic Amber', 
    accent: '#f59e0b', 
    text: 'text-[#f59e0b]', 
    border: 'border-[#f59e0b]', 
    borderMuted: 'border-[#f59e0b]/20', 
    bgMuted: 'bg-[#f59e0b]/10', 
    hoverBorder: 'hover:border-[#f59e0b]',
    shadowGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
  },
  { 
    id: 'rose', 
    name: 'Crimson Rose', 
    accent: '#ec4899', 
    text: 'text-[#ec4899]', 
    border: 'border-[#ec4899]', 
    borderMuted: 'border-[#ec4899]/20', 
    bgMuted: 'bg-[#ec4899]/10', 
    hoverBorder: 'hover:border-[#ec4899]',
    shadowGlow: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]'
  },
  { 
    id: 'violet', 
    name: 'Imperial Violet', 
    accent: '#8b5cf6', 
    text: 'text-[#8b5cf6]', 
    border: 'border-[#8b5cf6]', 
    borderMuted: 'border-[#8b5cf6]/20', 
    bgMuted: 'bg-[#8b5cf6]/10', 
    hoverBorder: 'hover:border-[#8b5cf6]',
    shadowGlow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]'
  },
  { 
    id: 'silver', 
    name: 'Platinum Silver', 
    accent: '#9ca3af', 
    text: 'text-[#9ca3af]', 
    border: 'border-[#9ca3af]', 
    borderMuted: 'border-[#9ca3af]/20', 
    bgMuted: 'bg-[#9ca3af]/10', 
    hoverBorder: 'hover:border-[#9ca3af]',
    shadowGlow: 'shadow-[0_0_15px_rgba(156,163,175,0.15)]'
  }
];

export default function App() {
  // Authentication & Active User State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Core Data States
  const [goals, setGoals] = useState<GoalTodo[]>([]);
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [journalEntries, setJournalEntries] = useState<DailyJournal[]>([]);
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [scratchpadText, setScratchpadText] = useState<string>('');

  // App settings state
  const [localOnlyMode, setLocalOnlyMode] = useState<boolean>(isLocalModeEnabled());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Real-time Clock State (local time)
  const [currentTime, setCurrentTime] = useState<string>('');

  // Active Theme Selection State
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem('df_active_theme_id') || 'blue';
  });

  // Light/Dark mode state
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('df_is_light_mode') === 'true';
  });

  // Custom Accent Color
  const [customAccentColor, setCustomAccentColor] = useState<string>(() => {
    return localStorage.getItem('df_custom_accent_color') || '#3b82f6';
  });

  // Dynamic Theme Mapping
  const activeTheme = useMemo(() => {
    const baseTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];
    return {
      ...baseTheme,
      accent: customAccentColor,
      text: 'theme-text-accent',
      border: 'theme-border-accent',
      borderMuted: 'theme-border-accent-dim',
      bgMuted: 'theme-bg-accent-dim',
      hoverBorder: 'hover:theme-border-accent',
      shadowGlow: 'theme-glow'
    };
  }, [activeThemeId, customAccentColor]);

  // Active section scroll tracking
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Command Palette Open State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sidebar toggle state for full-width layout
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Settings Panel Open State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User Profile Settings State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('df_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return {
      name: 'Xuan Phuc',
      role: 'Master Product Architect',
      bio: 'Crafting high-impact systems, optimizing peak performance, and expanding financial autonomy.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>({ ...profile });

  // Update theme config in browser context
  useEffect(() => {
    const root = document.documentElement;
    if (isLightMode) {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }

    localStorage.setItem('df_active_theme_id', activeThemeId);
    localStorage.setItem('df_is_light_mode', String(isLightMode));
    localStorage.setItem('df_custom_accent_color', customAccentColor);

    root.style.setProperty('--theme-accent', customAccentColor);
    
    const hex = customAccentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    root.style.setProperty('--theme-accent-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--theme-color-primary', customAccentColor);
  }, [activeThemeId, isLightMode, customAccentColor]);

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll listener for section activation
  useEffect(() => {
    const sections = ['overview', 'todo-hub', 'habit-matrix', 'daily-journal', 'expense-ledger', 'scratchpad'];
    const handleScroll = () => {
      let current = 'overview';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Custom Confirm/Alert Overlay state
  const [customNotice, setCustomNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  // Time Ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' | ' + now.toLocaleDateString('en-US'));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show a custom modal notice
  const showNotice = (title: string, message: string, onConfirm?: () => void) => {
    setCustomNotice({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Seed default data if empty
  const initializeDefaultDataIfEmpty = async () => {
    const local = loadFromLocalStorage();
    let updated = false;

    if (local.goals.length === 0) {
      for (const g of INITIAL_GOALS) {
        await saveGoal(g);
      }
      updated = true;
    }
    if (local.habits.length === 0) {
      for (const h of INITIAL_HABITS) {
        await saveHabit(h);
      }
      updated = true;
    }
    if (local.journal.length === 0) {
      for (const j of INITIAL_JOURNAL) {
        await saveJournal(j);
      }
      updated = true;
    }
    if (local.expenses.length === 0) {
      for (const e of INITIAL_EXPENSES) {
        await saveExpense(e);
      }
      updated = true;
    }
    if (!localStorage.getItem('df_quick_scratchpad')) {
      await saveScratchpad(INITIAL_SCRATCHPAD_TEXT);
      updated = true;
    }

    if (updated) {
      const fresh = loadFromLocalStorage();
      setGoals(fresh.goals);
      setHabits(fresh.habits);
      setJournalEntries(fresh.journal);
      setExpenses(fresh.expenses);
      setScratchpadText(fresh.scratchpad);
    }
  };

  // Load all Workspace Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await initializeDefaultDataIfEmpty();

      const data = await loadWorkspaceData();
      setGoals(data.goals);
      setHabits(data.habits);
      setJournalEntries(data.journal);
      setExpenses(data.expenses);
      setScratchpadText(data.scratchpad);
    } catch (e) {
      console.error('Failed loading workspace data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run initial fetch on authenticated state
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Real-time snap subscriptions (Active if localMode is false)
  useEffect(() => {
    if (!isAuthenticated || localOnlyMode) return;

    try {
      const unsubGoals = syncCollectionRealtime('goals_todo', (data) => {
        if (data && data.length > 0) setGoals(data);
      });
      const unsubHabits = syncCollectionRealtime('habits_data', (data) => {
        if (data && data.length > 0) setHabits(data);
      });
      const unsubJournal = syncCollectionRealtime('daily_journal', (data) => {
        if (data && data.length > 0) setJournalEntries(data);
      });
      const unsubExpenses = syncCollectionRealtime('personal_expenses', (data) => {
        if (data && data.length > 0) setExpenses(data);
      });
      const unsubPad = syncScratchpadRealtime((text) => {
        if (text !== undefined) setScratchpadText(text);
      });

      return () => {
        unsubGoals();
        unsubHabits();
        unsubJournal();
        unsubExpenses();
        unsubPad();
      };
    } catch (error) {
      console.warn("Real-time listener registration failed. Falling back to poll/local updates.", error);
    }
  }, [isAuthenticated, localOnlyMode]);

  // Handler: Switch local mode
  const handleToggleLocalMode = (val: boolean) => {
    setLocalModeEnabled(val);
    setLocalOnlyMode(val);
    loadData();
    showNotice(
      "MODE SWITCH SUCCESSFUL",
      val 
        ? "Switched to PURE LOCAL MODE. All your workspace data will be stored securely in your browser's LocalStorage."
        : "CLOUD REAL-TIME activated. System is synchronizing online data via Cloud Firestore."
    );
  };

  // Handler: Goal operations
  const handleAddGoal = async (text: string, timeframe: TimeframeType) => {
    const id = 'g_' + Math.random().toString(36).substring(2, 9);
    const newGoal: GoalTodo = {
      id,
      text,
      timeframe,
      completed: false,
      createdAt: Date.now()
    };
    
    setGoals(prev => [...prev, newGoal]);
    await saveGoal(newGoal);
  };

  const handleToggleGoal = async (id: string, completed: boolean) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed } : g));
    const goal = goals.find(g => g.id === id);
    if (goal) {
      await saveGoal({ ...goal, completed });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await deleteGoal(id);
  };

  // Handler: Habit operations
  const handleAddHabit = async (habitName: string, monthYear: string = '2026-07') => {
    const id = 'h_' + Math.random().toString(36).substring(2, 9);
    const newHabit: HabitData = {
      id,
      monthYear,
      habitName,
      completedDays: []
    };

    setHabits(prev => [...prev, newHabit]);
    await saveHabit(newHabit);
  };

  const handleToggleHabitDay = async (id: string, day: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const completedDays = h.completedDays.includes(day)
          ? h.completedDays.filter(d => d !== day)
          : [...h.completedDays, day];
        
        const updated = { ...h, completedDays };
        saveHabit(updated);
        return updated;
      }
      return h;
    }));
  };

  const handleDeleteHabit = async (id: string) => {
    showNotice(
      "CONFIRM HABIT DELETION",
      "Are you sure you want to delete this habit? All check-in logs for this month will be permanently removed.",
      async () => {
        setHabits(prev => prev.filter(h => h.id !== id));
        await deleteHabit(id);
      }
    );
  };

  // Handler: Journal operations
  const handleSaveJournal = async (date: string, energy: number, text: string) => {
    const updatedJournal: DailyJournal = {
      id: date,
      energy,
      text,
      updatedAt: Date.now()
    };

    setJournalEntries(prev => {
      const index = prev.findIndex(j => j.id === date);
      if (index >= 0) {
        const next = [...prev];
        next[index] = updatedJournal;
        return next;
      }
      return [...prev, updatedJournal];
    });

    await saveJournal(updatedJournal);
  };

  // Handler: Expense operations
  const handleAddExpense = async (amount: number, category: ExpenseCategory, note: string, date: string) => {
    const id = 'exp_' + Math.random().toString(36).substring(2, 9);
    const newExpense: PersonalExpense = {
      id,
      date,
      amount,
      category,
      note
    };

    setExpenses(prev => [...prev, newExpense]);
    await saveExpense(newExpense);
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await deleteExpense(id);
  };

  // Handler: Scratchpad operations
  const handleSaveScratchpadText = async (text: string) => {
    setScratchpadText(text);
    await saveScratchpad(text);
  };

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(tempProfile);
    localStorage.setItem('df_user_profile', JSON.stringify(tempProfile));
    setIsProfileModalOpen(false);
    showNotice("PROFILE UPDATED", "Your personal profile settings have been updated successfully.");
  };

  // Export Entire Workspace Data to JSON Backup
  const handleExportData = () => {
    try {
      const backup = {
        version: '5.0',
        exportedAt: Date.now(),
        profile,
        activeThemeId,
        goals,
        habits,
        journalEntries,
        expenses,
        scratchpadText,
        localArchives: JSON.parse(localStorage.getItem('df_scratchpad_archive') || '[]')
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `deep_focus_os_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotice(
        "DATA EXPORT SUCCESSFUL",
        "All workspace configuration, profile settings, and task data have been packaged into a JSON file and downloaded."
      );
    } catch (error) {
      console.error('Failed to export data', error);
      showNotice("BACKUP ERROR", "Failed to export workspace backup. Please check system state.");
    }
  };

  // Import Entire Workspace Data from JSON Backup
  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawContent = event.target?.result as string;
        const backup = JSON.parse(rawContent);

        if (!backup || typeof backup !== 'object') {
          showNotice("FORMAT ERROR", "File does not contain a valid JSON object structure.");
          return;
        }

        const hasGoals = Array.isArray(backup.goals);
        const hasHabits = Array.isArray(backup.habits);
        const hasExpenses = Array.isArray(backup.expenses);
        const hasJournal = Array.isArray(backup.journalEntries);

        if (!hasGoals && !hasHabits && !hasExpenses && !hasJournal) {
          showNotice("STRUCTURE ERROR", "JSON file structure is not compatible with Deep Focus OS.");
          return;
        }

        showNotice(
          "CONFIRM FULL DATA RESTORATION",
          "This action will overwrite current data with the backup file. All progress will be synchronized immediately. Are you sure you want to continue?",
          async () => {
            setIsLoading(true);
            setIsSettingsOpen(false);
            try {
              if (backup.profile) {
                setProfile(backup.profile);
                localStorage.setItem('df_user_profile', JSON.stringify(backup.profile));
              }

              if (backup.activeThemeId) {
                setActiveThemeId(backup.activeThemeId);
              }

              if (Array.isArray(backup.localArchives)) {
                localStorage.setItem('df_scratchpad_archive', JSON.stringify(backup.localArchives));
              }

              if (hasGoals) {
                localStorage.setItem('df_goals_todo', JSON.stringify([]));
                for (const g of backup.goals) {
                  await saveGoal(g);
                }
                setGoals(backup.goals);
              }

              if (hasHabits) {
                localStorage.setItem('df_habits_data', JSON.stringify([]));
                for (const h of backup.habits) {
                  await saveHabit(h);
                }
                setHabits(backup.habits);
              }

              if (hasJournal) {
                localStorage.setItem('df_daily_journal', JSON.stringify([]));
                for (const j of backup.journalEntries) {
                  await saveJournal(j);
                }
                setJournalEntries(backup.journalEntries);
              }

              if (hasExpenses) {
                localStorage.setItem('df_personal_expenses', JSON.stringify([]));
                for (const exp of backup.expenses) {
                  await saveExpense(exp);
                }
                setExpenses(backup.expenses);
              }

              if (backup.scratchpadText !== undefined) {
                await saveScratchpad(backup.scratchpadText);
                setScratchpadText(backup.scratchpadText);
              }

              showNotice(
                "RESTORATION SUCCESSFUL",
                "All workspace parameters, historical logs, and task structures were successfully restored from backup."
              );
            } catch (err) {
              console.error('Failed to import backup data', err);
              showNotice("RESTORATION ERROR", "An error occurred during data sync and overwriting.");
            } finally {
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        console.error('Failed to parse file', err);
        showNotice("FILE READ ERROR", "The selected file is invalid or contains JSON syntax errors.");
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset Session
  const handleResetSession = () => {
    showNotice(
      "REINITIALIZE SYSTEM WORKSPACE",
      "This will clear local cache and reload default templates for Deep Focus OS. Are you sure you want to proceed?",
      async () => {
        localStorage.clear();
        sessionStorage.clear();
        setLocalModeEnabled(true);
        setLocalOnlyMode(true);
        window.location.reload();
      }
    );
  };

  // Purge/Clear All Data permanently (local + cloud)
  const handleClearAllData = () => {
    showNotice(
      "PERMANENTLY PURGE ALL WORKSPACE DATA",
      "WARNING: This will permanently purge all task roadmaps, journals, expenses, habits, and profile data from both local storage and cloud database. This process CANNOT be undone. Proceed?",
      async () => {
        setIsLoading(true);
        setIsSettingsOpen(false);
        try {
          await purgeAllWorkspaceData();
          showNotice(
            "WORKSPACE PURGED",
            "All workspace data has been cleared. The application will restart automatically.",
            () => {
              window.location.reload();
            }
          );
        } catch (err) {
          console.error("Purging failed", err);
          showNotice("SYSTEM ERROR", "An error occurred while clearing cloud memory.");
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  // Auth Gate screen before unlock
  if (!isAuthenticated) {
    return (
      <AuthGate 
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  return (
    <div className={`min-h-screen bg-black text-zinc-300 font-sans antialiased flex flex-col selection:bg-zinc-800 selection:text-white relative ${isLightMode ? 'light-mode' : ''}`}>
      
      {/* Dynamic Background Glow */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0 transition-all duration-700 blur-[120px]"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${customAccentColor} 0%, transparent 70%)`
        }}
      />

      {/* 1. TOP STATUS BAR HEADER */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900/80 px-6 md:px-12 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Brand & Live System Clock */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${activeTheme.text} ${activeTheme.shadowGlow} animate-pulse inline-block`} />
            <h1 className="text-sm font-mono tracking-widest text-zinc-100 uppercase font-bold">
              DEEP FOCUS OS <span className="text-[10px] text-zinc-600 font-normal">v5.0</span>
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-zinc-500 border-l border-zinc-900 pl-6 uppercase tracking-wider">
            <Clock className="w-3 h-3 text-zinc-600" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Cloud / Local Mode Selector Bar */}
        <div className="flex items-center bg-[#050506] border border-zinc-900 p-1">
          <button
            onClick={() => handleToggleLocalMode(false)}
            className={`px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase rounded-none transition-all flex items-center gap-1.5 focus:outline-none ${
              !localOnlyMode 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold' 
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${!localOnlyMode ? 'animate-spin' : ''}`} />
            CLOUD SYNC
          </button>
          <button
            onClick={() => handleToggleLocalMode(true)}
            className={`px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase rounded-none transition-all flex items-center gap-1.5 focus:outline-none ${
              localOnlyMode 
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/50' 
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <CloudOff className="w-3 h-3" />
            LOCAL ONLY
          </button>
        </div>

        {/* User Profile Card Triggers & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          
          {/* Quick Search Command Palette Trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 transition-all rounded-lg flex items-center gap-2 text-xs font-medium"
            title="Search or Jump to Section (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700">Ctrl K</kbd>
          </button>
          
          {/* Toggle Sidebar Panel (Desktop) */}
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className={`px-3 py-2 border border-zinc-900/80 hover:border-zinc-700 ${
              isSidebarOpen ? activeTheme.text : 'text-zinc-400'
            } transition-colors rounded-none hidden lg:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest bg-black/40`}
            title={isSidebarOpen ? "Collapse Navigation Panel" : "Expand Navigation Panel"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            <span>{isSidebarOpen ? "Hide Navigation" : "Show Navigation"}</span>
          </button>

          <button
            onClick={() => {
              setTempProfile({ ...profile });
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-3 group text-left focus:outline-none"
            title="Edit Profile Settings"
          >
            <img 
              src={profile.avatarUrl} 
              alt={profile.name} 
              className="w-8 h-8 rounded-full border border-zinc-800 group-hover:border-zinc-400 transition-colors"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-serif text-zinc-200 group-hover:text-zinc-100 transition-colors">
                {currentUser ? currentUser.name : profile.name}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                {currentUser?.role === 'admin' ? 'Master Admin' : profile.role}
              </span>
            </div>
          </button>

          {/* Settings Control Panel button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 border border-zinc-900 ${activeTheme.hoverBorder} ${activeTheme.text} transition-colors rounded-none`}
            title="OS Configuration & Theme Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem('df_os_active_user');
              sessionStorage.removeItem('df_os_unlocked');
              setIsAuthenticated(false);
              setCurrentUser(null);
            }}
            className="p-2 border border-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-red-400 transition-colors rounded-none"
            title="Sign Out / Lock Screen"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </header>

      {/* 2. MAIN WORKSPACE PANELS */}
      <main className="flex-1 w-full px-4 sm:px-8 md:px-12 py-8 z-10 transition-all duration-300">
        
        {/* INTRODUCTORY SYSTEM QUOTE STATUS */}
        <div className={`mb-10 border-l-2 ${activeTheme.border} pl-6 py-2`}>
          <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase block">
            CORE EXECUTIVE DIRECTIVE
          </span>
          <p className="text-sm font-light text-zinc-400 italic leading-relaxed mt-1">
            "{profile.bio}"
          </p>
        </div>

        {/* Mobile Horizontal Quick Navigation Tabs */}
        {!isLoading && (
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-3 mb-8 scrollbar-none border-b border-zinc-900/40">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'todo-hub', label: 'Tasks', icon: CheckSquare },
              { id: 'habit-matrix', label: 'Habits', icon: Activity },
              { id: 'daily-journal', label: 'Journal', icon: BookOpen },
              { id: 'expense-ledger', label: 'Expenses', icon: DollarSign },
              { id: 'scratchpad', label: 'Scratchpad', icon: FileText }
            ].map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-3 py-2 flex items-center gap-1.5 border shrink-0 text-[10px] font-mono uppercase tracking-widest transition-all ${
                    isActive 
                      ? `${activeTheme.border} ${activeTheme.bgMuted} ${activeTheme.text}` 
                      : 'border-zinc-900/60 bg-[#020202]/30 text-zinc-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          
          {/* Left Sticky Navigation Panel for Desktop */}
          {!isLoading && isSidebarOpen && (
            <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-28 space-y-3 bg-[#020202]/40 border border-zinc-900/80 p-5 backdrop-blur-md transition-all duration-300">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase block">
                  OS NAVIGATION PANEL
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors"
                  title="Collapse Panel"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="space-y-1.5">
                {[
                  ...(currentUser?.role === 'admin' ? [{ id: 'admin-portal', label: 'Admin Portal', sub: 'License & Users', icon: ShieldCheck }] : []),
                  { id: 'overview', label: 'Executive Overview', sub: 'Command Center & Stats', icon: LayoutDashboard },
                  { id: 'todo-hub', label: 'Tactical Roadmap', sub: 'To-Do & Timeline', icon: CheckSquare },
                  { id: 'habit-matrix', label: 'Habit Matrix', sub: 'Daily Consistency', icon: Activity },
                  { id: 'daily-journal', label: 'Energy Journal', sub: 'Daily Telemetry', icon: BookOpen },
                  { id: 'expense-ledger', label: 'Cash Flow Ledger', sub: 'Burn Rate & Budget', icon: DollarSign },
                  { id: 'scratchpad', label: 'Brain Scratchpad', sub: 'Unfiltered Notes', icon: FileText }
                ].map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left p-3 transition-all duration-200 flex items-center gap-3.5 border ${
                        isActive 
                          ? `${activeTheme.border} ${activeTheme.bgMuted} ${activeTheme.text} shadow-[0_0_10px_rgba(255,255,255,0.01)]` 
                          : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/20'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium leading-none">{section.label}</span>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-600 leading-none mt-1">{section.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Utility Quick Panel Controls */}
              <div className="pt-4 mt-2 border-t border-zinc-900/80 flex flex-col gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={`w-full py-2 bg-transparent border border-zinc-900 hover:border-zinc-800 ${activeTheme.text} font-mono text-[9px] uppercase tracking-widest text-center transition-all`}
                >
                  [ CONFIGURE OS ]
                </button>
                <button
                  onClick={handleClearAllData}
                  className="w-full py-2 bg-transparent border border-zinc-900 hover:border-red-950 text-red-500 hover:text-red-400 font-mono text-[9px] uppercase tracking-widest text-center transition-all"
                >
                  [ WIPE ALL DATA ]
                </button>
              </div>
            </aside>
          )}

          {/* Right Main Content Flow */}
          <div className="flex-1 min-w-0 w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-36 gap-4">
                <RefreshCw className={`w-8 h-8 ${activeTheme.text} animate-spin`} />
                <span className="font-mono text-xs text-zinc-600 uppercase tracking-widest animate-pulse">
                  Loading Deep Focus OS v5.0...
                </span>
              </div>
            ) : (
              <div className="space-y-12">
                
                {/* Module Admin: Master Admin Control Portal */}
                {currentUser?.role === 'admin' && (
                  <section id="admin-portal" className="scroll-mt-28">
                    <AdminDashboard onNotice={showNotice} />
                  </section>
                )}

                {/* Module 0: Executive Command Center Overview */}
                <section id="overview" className="scroll-mt-28">
                  <ExecutiveDashboard
                    goals={goals}
                    habits={habits}
                    journals={journalEntries}
                    expenses={expenses}
                    onNavigate={(sec) => {
                      if (sec === 'habits') scrollToSection('habit-matrix');
                      else if (sec === 'journal') scrollToSection('daily-journal');
                      else if (sec === 'expenses') scrollToSection('expense-ledger');
                      else scrollToSection(sec);
                    }}
                    onToggleGoal={handleToggleGoal}
                    onToggleHabitDay={handleToggleHabitDay}
                    activeTheme={activeTheme}
                  />
                </section>

                {/* Module 1: Tactical Roadmap & To-Do Hub */}
                <section id="todo-hub" className="scroll-mt-28">
                  <TodoHub 
                    goals={goals}
                    onAddGoal={handleAddGoal}
                    onToggleGoal={handleToggleGoal}
                    onDeleteGoal={handleDeleteGoal}
                    isLightMode={isLightMode}
                  />
                </section>

                {/* Module 2: Self-Mastery Habit Matrix */}
                <section id="habit-matrix" className="scroll-mt-28">
                  <HabitTracker
                    habits={habits}
                    onAddHabit={handleAddHabit}
                    onToggleHabitDay={handleToggleHabitDay}
                    onDeleteHabit={handleDeleteHabit}
                    isLightMode={isLightMode}
                  />
                </section>

                {/* Module 3: Daily Journal & Energy Flow */}
                <section id="daily-journal" className="scroll-mt-28">
                  <DailyJournalPanel
                    journalEntries={journalEntries}
                    onSaveJournal={handleSaveJournal}
                  />
                </section>

                {/* Module 4: Personal Cash Burn-Rate Ledger */}
                <section id="expense-ledger" className="scroll-mt-28">
                  <ExpenseLedger
                    expenses={expenses}
                    onAddExpense={handleAddExpense}
                    onDeleteExpense={handleDeleteExpense}
                    isLightMode={isLightMode}
                  />
                </section>

                {/* Module 5: Quick Scratchpad / Brain Dump */}
                <section id="scratchpad" className="scroll-mt-28">
                  <Scratchpad
                    initialText={scratchpadText}
                    isCloudConnected={!localOnlyMode}
                    onSaveText={handleSaveScratchpadText}
                  />
                </section>

              </div>
            )}
          </div>

        </div>

        {/* Reset system anchor */}
        <div className="mt-20 border-t border-zinc-950 pt-8 flex justify-between items-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          <span>DEEP FOCUS INTEGRATED OS v5.0</span>
          <button 
            onClick={handleResetSession}
            className="text-zinc-600 hover:text-red-500 transition-colors focus:outline-none"
          >
            [ RESET OS STATE ]
          </button>
        </div>

      </main>

      {/* 3. PROFILE SETTINGS MODAL OVERLAY */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#020202] border border-zinc-900 p-8 shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-6 top-6 text-zinc-600 hover:text-zinc-100 transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <h3 className="text-lg font-medium tracking-tight text-zinc-100 mb-1">
              Master Profile Settings
            </h3>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-950 pb-4">
              USER IDENTITY & MISSION STATEMENT
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase">DISPLAY NAME</label>
                <input
                  type="text"
                  required
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#050506] border border-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 rounded-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase">ROLE / TITLE</label>
                <input
                  type="text"
                  required
                  value={tempProfile.role}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, role: e.target.value }))}
                  className="bg-[#050506] border border-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 rounded-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase">AVATAR URL</label>
                <input
                  type="text"
                  required
                  value={tempProfile.avatarUrl}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, avatarUrl: e.target.value }))}
                  className="bg-[#050506] border border-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 rounded-none font-mono text-[10px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase">BIO / MISSION STATEMENT</label>
                <textarea
                  required
                  value={tempProfile.bio}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-[#050506] border border-zinc-900 p-3 h-24 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 rounded-none font-sans resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-2 border border-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase rounded-none transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 bg-transparent border border-zinc-800 ${activeTheme.hoverBorder} ${activeTheme.text} font-mono text-xs uppercase rounded-none transition-all`}
                >
                  SAVE PROFILE
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 4. SYSTEM SETTINGS & THEMES CONFIGURATION MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
          <div className={`w-full max-w-lg bg-[#020202] border ${activeTheme.border} p-8 shadow-2xl relative transition-all duration-300 max-h-[90vh] overflow-y-auto scrollbar-none`}>
            
            {/* Close Button */}
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-6 top-6 text-zinc-600 hover:text-zinc-100 transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <h3 className="text-lg font-medium tracking-tight text-zinc-100 mb-1">
              System Configuration & Theme Settings
            </h3>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-4">
              COLOR ACCENTS, THEME MODE & DATA MANAGEMENT
            </p>

            {/* Section 0: Theme Mode (Light / Dark) */}
            <div className="mb-6">
              <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                {isLightMode ? <Sun className="w-3.5 h-3.5 text-zinc-500" /> : <Moon className="w-3.5 h-3.5 text-zinc-500" />}
                THEME MODE
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsLightMode(false)}
                  className={`flex items-center justify-center gap-2 py-2.5 border transition-all duration-300 rounded-none text-xs font-mono uppercase ${
                    !isLightMode 
                      ? `${activeTheme.border} ${activeTheme.bgMuted} ${activeTheme.text}` 
                      : 'border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  DARK MODE
                </button>
                <button
                  type="button"
                  onClick={() => setIsLightMode(true)}
                  className={`flex items-center justify-center gap-2 py-2.5 border transition-all duration-300 rounded-none text-xs font-mono uppercase ${
                    isLightMode 
                      ? `${activeTheme.border} ${activeTheme.bgMuted} ${activeTheme.text}` 
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  LIGHT MODE
                </button>
              </div>
            </div>

            {/* Section 1: Color Themes Selection */}
            <div className="mb-6">
              <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-500" />
                ACCENT PRESETS
              </h4>
              
              <div className="grid grid-cols-2 gap-2.5">
                {THEMES.map((themeOption) => {
                  const isActive = themeOption.id === activeThemeId;
                  return (
                    <button
                      key={themeOption.id}
                      type="button"
                      onClick={() => {
                        setActiveThemeId(themeOption.id);
                        setCustomAccentColor(themeOption.accent);
                      }}
                      className={`flex items-center justify-between p-3 border transition-all duration-300 rounded-none text-left focus:outline-none ${
                        isActive 
                          ? `${themeOption.border} ${themeOption.bgMuted} shadow-[0_0_10px_rgba(255,255,255,0.03)]` 
                          : 'border-zinc-900 hover:border-zinc-800 bg-[#050506]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-zinc-200 truncate">
                          {themeOption.name}
                        </span>
                      </div>
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-black animate-pulse shrink-0 ml-2"
                        style={{ backgroundColor: themeOption.accent }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Custom Accent Color Picker - After Effects Style */}
              <div className="mt-4">
                <AEPicker 
                  currentColor={customAccentColor}
                  onChangeColor={(hex) => {
                    setActiveThemeId('custom');
                    setCustomAccentColor(hex);
                  }}
                />
              </div>
            </div>

            {/* Section 2: Storage Status & Import/Export */}
            <div className="mb-6">
              <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-500" />
                DATA PERSISTENCE & BACKUP
              </h4>

              <div className="bg-[#050506] border border-zinc-900 p-4 mb-4">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-950">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">STORAGE ARCHITECTURE</span>
                  <span className={`text-[9px] font-mono font-bold uppercase ${localOnlyMode ? 'text-zinc-400' : 'text-emerald-400 animate-pulse'}`}>
                    {localOnlyMode ? 'PURE LOCAL (OFFLINE)' : 'CLOUD FIRESTORE (CONNECTED)'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  {localOnlyMode 
                    ? 'All application telemetry is securely stored in your browser LocalStorage.' 
                    : 'Data is synchronized in real-time with Cloud Firestore for multi-device availability.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#050506] border border-zinc-900 hover:border-zinc-500 text-zinc-300 font-mono text-xs uppercase rounded-none transition-all"
                >
                  <Download className="w-4 h-4" />
                  EXPORT JSON
                </button>

                {/* Import Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    title="Restore JSON Backup"
                  />
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#050506] border border-zinc-900 hover:border-zinc-500 text-zinc-300 font-mono text-xs uppercase rounded-none transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    IMPORT JSON
                  </button>
                </div>
              </div>

              {/* Wipe All Data Button */}
              <button
                type="button"
                onClick={handleClearAllData}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-red-950/20 border border-red-900 hover:border-red-500 text-red-400 hover:text-red-300 font-mono text-xs uppercase rounded-none transition-all"
              >
                <Trash2 className="w-4 h-4" />
                PERMANENTLY WIPE ALL DATA
              </button>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-2.5 border border-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase rounded-none transition-all text-center"
              >
                CLOSE CONTROL PANEL
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. CUSTOM MODAL OVERLAYS (INSTEAD OF WINDOW.ALERT) */}
      {customNotice && customNotice.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#020202] border border-zinc-900 p-8 shadow-2xl text-center">
            
            <Info className="w-8 h-8 text-zinc-400 mx-auto mb-4" />

            <h4 className="text-base font-medium text-zinc-100 tracking-tight mb-2">
              {customNotice.title}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-8">
              {customNotice.message}
            </p>

            {customNotice.onConfirm ? (
              <div className="flex gap-4">
                <button
                  onClick={() => setCustomNotice(null)}
                  className="flex-1 py-2 border border-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 font-mono text-[10px] tracking-widest uppercase rounded-none transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (customNotice.onConfirm) customNotice.onConfirm();
                    setCustomNotice(null);
                  }}
                  className="flex-1 py-2 bg-transparent border border-red-900 hover:border-red-500 text-red-500 font-mono text-[10px] tracking-widest uppercase rounded-none transition-all"
                >
                  CONFIRM
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCustomNotice(null)}
                className="w-full py-2 bg-transparent border border-zinc-800 hover:border-zinc-500 text-zinc-200 font-mono text-xs tracking-widest uppercase rounded-none transition-all"
              >
                ACKNOWLEDGE
              </button>
            )}

          </div>
        </div>
      )}

      {/* 6. GLOBAL COMMAND PALETTE (CTRL + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(sec) => {
          if (sec === 'habits') scrollToSection('habit-matrix');
          else if (sec === 'journal') scrollToSection('daily-journal');
          else if (sec === 'expenses') scrollToSection('expense-ledger');
          else scrollToSection(sec);
        }}
        goals={goals}
        habits={habits}
        expenses={expenses}
        isLightMode={isLightMode}
        onToggleThemeMode={() => setIsLightMode(prev => !prev)}
      />

    </div>
  );
}
