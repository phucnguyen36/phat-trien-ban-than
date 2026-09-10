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
  importWorkspaceData,
  saveGoal, 
  deleteGoal, 
  saveHabit, 
  deleteHabit, 
  saveJournal, 
  deleteJournal,
  saveExpense, 
  deleteExpense, 
  saveScratchpad,
  isLocalModeEnabled,
  setLocalModeEnabled,
  syncCollectionRealtime,
  syncScratchpadRealtime,
  loadFromLocalStorage,
  resolveActiveUserId,
  purgeAllWorkspaceData
} from './firebase';

import AuthGate from './components/AuthGate';
import TodoHub from './components/TodoHub';
import HabitTracker from './components/HabitTracker';
import DailyJournalPanel from './components/DailyJournal';
import ExpenseLedger from './components/ExpenseLedger';
import DeepWorkTimer from './components/DeepWorkTimer';
import AEPicker from './components/AEPicker';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import CommandPalette from './components/CommandPalette';
import AdminDashboard from './components/AdminDashboard';
import { UserAccount, logoutUserSession } from './userRegistry';

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
  Trophy,
  Sparkles,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Mail
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
  // Synchronous User & Session Recovery for Instant 0ms Load
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const savedUser = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedUser = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        return !!(parsed && parsed.email);
      } catch (e) { return false; }
    }
    return false;
  });

  // Synchronous Local Data Pre-population (0ms Instant Render, Zero Data Loss on F5)
  const initialLocalData = useMemo(() => {
    const email = currentUser?.email;
    return loadFromLocalStorage(email);
  }, [currentUser]);

  // Core Data States
  const [goals, setGoals] = useState<GoalTodo[]>(() => {
    const saved = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    let email: string | undefined;
    if (saved) {
      try { email = JSON.parse(saved)?.email; } catch (e) {}
    }
    return loadFromLocalStorage(email).goals;
  });

  const [habits, setHabits] = useState<HabitData[]>(() => {
    const saved = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    let email: string | undefined;
    if (saved) {
      try { email = JSON.parse(saved)?.email; } catch (e) {}
    }
    return loadFromLocalStorage(email).habits;
  });

  const [journalEntries, setJournalEntries] = useState<DailyJournal[]>(() => {
    const saved = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    let email: string | undefined;
    if (saved) {
      try { email = JSON.parse(saved)?.email; } catch (e) {}
    }
    return loadFromLocalStorage(email).journal;
  });

  const [expenses, setExpenses] = useState<PersonalExpense[]>(() => {
    const saved = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    let email: string | undefined;
    if (saved) {
      try { email = JSON.parse(saved)?.email; } catch (e) {}
    }
    return loadFromLocalStorage(email).expenses;
  });

  const [scratchpadText, setScratchpadText] = useState<string>(() => {
    const saved = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    let email: string | undefined;
    if (saved) {
      try { email = JSON.parse(saved)?.email; } catch (e) {}
    }
    return loadFromLocalStorage(email).scratchpad;
  });

  // CONTINUOUS ZERO-DELAY LOCALSTORAGE AUTO-SAVE
  useEffect(() => {
    const uid = resolveActiveUserId(currentUser?.email);
    localStorage.setItem(`df_goals_todo_${uid}`, JSON.stringify(goals));
    localStorage.setItem('df_goals_todo', JSON.stringify(goals));
  }, [goals, currentUser]);

  useEffect(() => {
    const uid = resolveActiveUserId(currentUser?.email);
    localStorage.setItem(`df_habits_data_${uid}`, JSON.stringify(habits));
    localStorage.setItem('df_habits_data', JSON.stringify(habits));
  }, [habits, currentUser]);

  useEffect(() => {
    const uid = resolveActiveUserId(currentUser?.email);
    localStorage.setItem(`df_daily_journal_${uid}`, JSON.stringify(journalEntries));
    localStorage.setItem('df_daily_journal', JSON.stringify(journalEntries));
  }, [journalEntries, currentUser]);

  useEffect(() => {
    const uid = resolveActiveUserId(currentUser?.email);
    localStorage.setItem(`df_personal_expenses_${uid}`, JSON.stringify(expenses));
    localStorage.setItem('df_personal_expenses', JSON.stringify(expenses));
  }, [expenses, currentUser]);

  useEffect(() => {
    const uid = resolveActiveUserId(currentUser?.email);
    localStorage.setItem(`df_quick_scratchpad_${uid}`, scratchpadText);
    localStorage.setItem('df_quick_scratchpad', scratchpadText);
  }, [scratchpadText, currentUser]);

  // App settings state
  const [localOnlyMode, setLocalOnlyMode] = useState<boolean>(isLocalModeEnabled());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // A4 — Morning Priority Prompt: show once per day on first login
  const [showMorningPrompt, setShowMorningPrompt] = useState<boolean>(false);
  const [morningPriorities, setMorningPriorities] = useState<[string, string, string]>(['', '', '']);

  // A2 — Weekly Review panel open state
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState<boolean>(false);
  
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

  // C4 — Keyboard Shortcuts Modal & Hotkeys
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // D2 — Onboarding Wizard Modal State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showAdvancedPicker, setShowAdvancedPicker] = useState(false);

  // Global Keyboard Shortcuts (C4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
      } else if (e.key === 'j' || e.key === 'J') {
        scrollToSection('daily-journal');
      } else if (e.key === 'h' || e.key === 'H') {
        scrollToSection('habit-matrix');
      } else if (e.key === 'e' || e.key === 'E') {
        scrollToSection('expense-ledger');
      } else if (e.key === 'n' || e.key === 'N' || e.key === 't' || e.key === 'T') {
        scrollToSection('todo-hub');
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
      role: 'Creative Director & Designer',
      bio: 'Focus, clean aesthetics, and deliberate consistency.',
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

  // Load all Workspace Data for current active account
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeEmail = currentUser?.email;
      const data = await loadWorkspaceData(activeEmail);
      if (data.goals && data.goals.length > 0) setGoals(data.goals);
      if (data.habits && data.habits.length > 0) setHabits(data.habits);
      if (data.journal && data.journal.length > 0) setJournalEntries(data.journal);
      if (data.expenses && data.expenses.length > 0) setExpenses(data.expenses);
      if (data.scratchpad && data.scratchpad.length > 0) setScratchpadText(data.scratchpad);
    } catch (e) {
      console.error('Failed loading workspace data for active account', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // D3 — Export All Workspace Data to JSON file
  const handleExportAllData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      user: currentUser?.email,
      goals,
      habits,
      journalEntries,
      expenses,
      scratchpadText
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepFocus_Backup_${currentUser?.email?.split('@')[0]}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run initial fetch when user logs in or switches account
  useEffect(() => {
    if (isAuthenticated) {
      // Ensure Cloud Sync is active for authenticated user across all devices & apps
      setLocalModeEnabled(false);
      setLocalOnlyMode(false);
      loadData();

      // A4 — Morning Prompt: show once per calendar day
      const todayKey = `df_morning_prompt_shown_${new Date().toISOString().split('T')[0]}_${currentUser?.email}`;
      if (!sessionStorage.getItem(todayKey)) {
        setTimeout(() => setShowMorningPrompt(true), 1200);
        sessionStorage.setItem(todayKey, 'shown');
      }
    }
  }, [isAuthenticated, currentUser, loadData]);

  // Real-time snap subscriptions per active account (Active if localMode is false)
  useEffect(() => {
    if (!isAuthenticated || localOnlyMode) return;
    const activeEmail = currentUser?.email;

    try {
      const unsubGoals = syncCollectionRealtime('goals_todo', (data) => {
        if (Array.isArray(data) && data.length > 0) setGoals(data);
      }, activeEmail);
      const unsubHabits = syncCollectionRealtime('habits_data', (data) => {
        if (Array.isArray(data) && data.length > 0) setHabits(data);
      }, activeEmail);
      const unsubJournal = syncCollectionRealtime('daily_journal', (data) => {
        if (Array.isArray(data) && data.length > 0) setJournalEntries(data);
      }, activeEmail);
      const unsubExpenses = syncCollectionRealtime('personal_expenses', (data) => {
        if (Array.isArray(data) && data.length > 0) setExpenses(data);
      }, activeEmail);
      const unsubPad = syncScratchpadRealtime((text) => {
        if (text !== undefined && text.length > 0) setScratchpadText(text);
      }, activeEmail);

      return () => {
        unsubGoals();
        unsubHabits();
        unsubJournal();
        unsubExpenses();
        unsubPad();
      };
    } catch (error) {
      console.warn("Real-time listener registration failed. Falling back to account local updates.", error);
    }
  }, [isAuthenticated, currentUser, localOnlyMode]);

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
  const handleAddGoal = async (text: string, timeframe: TimeframeType, timeEstimate?: import('./types').TimeEstimate) => {
    const id = 'g_' + Math.random().toString(36).substring(2, 9);
    const newGoal: GoalTodo = {
      id,
      text,
      timeframe,
      completed: false,
      createdAt: Date.now(),
      ...(timeEstimate ? { timeEstimate } : {})
    };
    
    setGoals(prev => [...prev, newGoal]);
    await saveGoal(newGoal, currentUser?.email);
  };

  const handleToggleGoal = async (id: string, completed: boolean) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed } : g));
    const goal = goals.find(g => g.id === id);
    if (goal) {
      await saveGoal({ ...goal, completed }, currentUser?.email);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await deleteGoal(id, currentUser?.email);
  };

  const handleEditGoal = async (id: string, newText: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const match = goal.text.match(/^(\[[DWMY]:[^\]]+\]\s*)/);
    const prefix = match ? match[1] : '';
    const updatedGoal: GoalTodo = { ...goal, text: prefix + newText };

    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
    await saveGoal(updatedGoal, currentUser?.email);
  };

  const handleUpdateGoal = async (updatedGoal: GoalTodo) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    await saveGoal(updatedGoal, currentUser?.email);
  };

  const handleReorderGoals = (newGoals: GoalTodo[]) => {
    setGoals(newGoals);
  };

  // Morning Prompt: submit 3 priorities as daily tasks
  const handleMorningPromptSubmit = async () => {
    const filled = morningPriorities.filter(p => p.trim());
    for (const text of filled) {
      if (text.trim()) {
        await handleAddGoal(text.trim(), 'daily');
      }
    }
    setShowMorningPrompt(false);
    setMorningPriorities(['', '', '']);
  };

  // Handler: Habit operations
  const handleAddHabit = async (habitName: string, monthYear?: string) => {
    const currentMonthYearStr = new Date().toISOString().slice(0, 7);
    const activeMonthYear = monthYear || currentMonthYearStr;

    const id = 'h_' + Math.random().toString(36).substring(2, 9);
    const newHabit: HabitData = {
      id,
      monthYear: activeMonthYear,
      habitName,
      completedDays: []
    };

    setHabits(prev => [...prev, newHabit]);
    await saveHabit(newHabit, currentUser?.email);
  };

  const handleToggleHabitDay = async (id: string, day: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const completedDays = h.completedDays.includes(day)
          ? h.completedDays.filter(d => d !== day)
          : [...h.completedDays, day];
        
        const updated = { ...h, completedDays };
        saveHabit(updated, currentUser?.email);
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
        await deleteHabit(id, currentUser?.email);
      }
    );
  };

  const handleEditHabit = async (id: string, newName: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const updatedHabit: HabitData = { ...habit, habitName: newName };

    setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h));
    await saveHabit(updatedHabit, currentUser?.email);
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

    await saveJournal(updatedJournal, currentUser?.email);
  };

  const handleDeleteJournal = async (id: string) => {
    setJournalEntries(prev => prev.filter(j => j.id !== id));
    await deleteJournal(id, currentUser?.email);
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
    await saveExpense(newExpense, currentUser?.email);
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await deleteExpense(id, currentUser?.email);
  };

  // Handler: Scratchpad operations
  const handleSaveScratchpadText = async (text: string) => {
    setScratchpadText(text);
    await saveScratchpad(text, currentUser?.email);
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

              // Fast, instant LocalStorage update + parallel non-blocking Firestore sync
              const restored = await importWorkspaceData(backup, currentUser?.email);

              setGoals(restored.goals);
              setHabits(restored.habits);
              setJournalEntries(restored.journal);
              setExpenses(restored.expenses);
              if (restored.scratchpad) {
                setScratchpadText(restored.scratchpad);
              }

              showNotice(
                "RESTORATION SUCCESSFUL",
                "All workspace parameters, historical logs, and task structures were successfully restored from backup instantly."
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

  // Quick Seed Rich Demo Data (for user screenshots)
  const handleSeedDemoData = async () => {
    setIsLoading(true);
    const demoGoals: GoalTodo[] = [
      { id: 'g1', text: 'Complete visual polish and design system alignment', timeframe: 'daily', completed: true, createdAt: Date.now() - 86400000 * 3 },
      { id: 'g2', text: 'Review customer access links and active subscriptions', timeframe: 'daily', completed: true, createdAt: Date.now() - 86400000 * 2 },
      { id: 'g3', text: 'Review monthly cash flow and expense ledger', timeframe: 'daily', completed: true, createdAt: Date.now() - 86400000 },
      { id: 'g4', text: 'Conduct 30-minute mindfulness & focus session', timeframe: 'daily', completed: false, createdAt: Date.now() },
      { id: 'g5', text: 'Scale cloud storage sync infrastructure', timeframe: 'weekly', completed: true, createdAt: Date.now() - 86400000 * 5 },
      { id: 'g6', text: 'Audit monthly capital allocations', timeframe: 'weekly', completed: true, createdAt: Date.now() - 86400000 * 4 },
      { id: 'g7', text: 'Deliver 4K master project assets', timeframe: 'monthly', completed: true, createdAt: Date.now() - 86400000 * 10 },
      { id: 'g8', text: 'Onboard 3 new client accounts', timeframe: 'monthly', completed: false, createdAt: Date.now() - 86400000 * 8 },
      { id: 'g9', text: 'Build sustainable creative workflow routines', timeframe: 'yearly', completed: true, createdAt: Date.now() - 86400000 * 30 },
      { id: 'g10', text: 'Maintain consistent 100km monthly cardio routine', timeframe: 'yearly', completed: true, createdAt: Date.now() - 86400000 * 25 }
    ];

    const demoHabits: HabitData[] = [
      { id: 'h1', habitName: 'Morning Planning & Water', monthYear: '2026-07', completedDays: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24] },
      { id: 'h2', habitName: '2-Hour Deep Work Block', monthYear: '2026-07', completedDays: [1,2,3,4,5,7,8,9,10,11,12,14,15,16,17,18,19,21,22,23,24] },
      { id: 'h3', habitName: 'Cardio / Workout Session', monthYear: '2026-07', completedDays: [2,4,6,8,10,12,14,16,18,20,22,24] },
      { id: 'h4', habitName: 'Daily Journal & Reflection', monthYear: '2026-07', completedDays: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24] },
      { id: 'h5', habitName: 'Reading & Synthesis (30m)', monthYear: '2026-07', completedDays: [1,3,4,5,6,7,8,9,11,12,13,14,15,16,18,19,20,21,22,23,24] }
    ];

    const demoJournal: DailyJournal[] = [
      { id: '2026-07-24', energy: 5, text: 'Great focus session today. Completed the Swiss UI overhaul. System running smoothly.', updatedAt: Date.now() },
      { id: '2026-07-23', energy: 5, text: 'Strong client delivery turnaround. Clear communication and fast approvals.', updatedAt: Date.now() - 86400000 },
      { id: '2026-07-22', energy: 4, text: 'Financial ledger reconciled. Expenses and savings are balanced.', updatedAt: Date.now() - 86400000 * 2 },
      { id: '2026-07-21', energy: 4, text: 'Completed 2-hour uninterrupted deep work session.', updatedAt: Date.now() - 86400000 * 3 },
      { id: '2026-07-20', energy: 5, text: 'Solid productivity day. Clean workspace and organized notes.', updatedAt: Date.now() - 86400000 * 4 },
      { id: '2026-07-19', energy: 3, text: 'Sunday weekly review and reset. Set priorities for the coming week.', updatedAt: Date.now() - 86400000 * 5 },
      { id: '2026-07-18', energy: 4, text: 'Cardio session and reset. Good stamina throughout the day.', updatedAt: Date.now() - 86400000 * 6 }
    ];

    const demoExpenses: PersonalExpense[] = [
      { id: 'e1', date: '2026-07-24', amount: -180000, category: 'Eating', note: 'Team Lunch & Coffee' },
      { id: 'e2', date: '2026-07-23', amount: -1250000, category: 'Study/Equipment', note: 'Monitor Arm & Desk Setup' },
      { id: 'e3', date: '2026-07-22', amount: -350000, category: 'Transport', note: 'Transit Pass Reload' },
      { id: 'e4', date: '2026-07-20', amount: -450000, category: 'Entertainment', note: 'Books & Learning Subscriptions' },
      { id: 'e5', date: '2026-07-18', amount: -220000, category: 'Eating', note: 'Groceries & Nutrition' },
      { id: 'e6', date: '2026-07-15', amount: -890000, category: 'Study/Equipment', note: 'Cloud Server & Domain Hosting' }
    ];

    const demoScratchpad = `# Focus & Strategic Notes\n\n- Priority 1: Maintain 4-hour daily uninterrupted deep work sessions.\n- Priority 2: Optimize personal cash flow and monthly expense allocations.\n- Priority 3: Target 100km+ monthly outdoor cardio and fitness routine.\n\n## Ideas & Quick References\n- Clean architecture and minimal Swiss typography create maximum focus density.\n- Schedule weekly review every Sunday evening to calibrate roadmap.`;

    const activeEmail = currentUser?.email;
    localStorage.setItem(`df_goals_todo_${activeEmail}`, JSON.stringify(demoGoals));
    localStorage.setItem(`df_habits_data_${activeEmail}`, JSON.stringify(demoHabits));
    localStorage.setItem(`df_daily_journal_${activeEmail}`, JSON.stringify(demoJournal));
    localStorage.setItem(`df_personal_expenses_${activeEmail}`, JSON.stringify(demoExpenses));
    localStorage.setItem(`df_quick_scratchpad_${activeEmail}`, demoScratchpad);

    for (const g of demoGoals) await saveGoal(g, activeEmail);
    for (const h of demoHabits) await saveHabit(h, activeEmail);
    for (const j of demoJournal) await saveJournal(j, activeEmail);
    for (const e of demoExpenses) await saveExpense(e, activeEmail);
    await saveScratchpad(demoScratchpad, activeEmail);

    setGoals(demoGoals);
    setHabits(demoHabits);
    setJournalEntries(demoJournal);
    setExpenses(demoExpenses);
    setScratchpadText(demoScratchpad);

    setIsLoading(false);
    showNotice(
      "DEMO DATA POPULATED",
      "Rich sample data for Goals, Habits, Journals, Expenses, and Scratchpad has been loaded into your admin workspace!"
    );
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

  const handleLogout = () => {
    logoutUserSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
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
    <div className={`min-h-screen text-zinc-100 font-sans antialiased flex flex-col relative selection:bg-white/20 selection:text-white ${isLightMode ? 'light-mode' : ''}`}>
      
      {/* Film Grain Noise Overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Atmospheric Ambient Glow */}
      <div className="ambient-glow fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#1591DC]/12 via-[#1591DC]/3 to-transparent blur-[120px]" />
      </div>

      {/* 1. CLEAN STICKY HEADER (Thomas Nguyen & Swiss Studio Standard) */}
      <header className="sticky top-0 z-40 bg-[#0b0c10]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-[1240px] mx-auto w-full flex justify-between items-center gap-4">
          
          {/* Studio Avatar & Brand Mark */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveSection('overview')}>
            <img 
              src={profile.avatarUrl} 
              alt="Deep Focus" 
              className="w-8 h-8 rounded-full object-cover border border-[#1591DC] shadow-[0_0_12px_rgba(21,145,220,0.4)] group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
              }}
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-white leading-none">
                Deep Focus
              </span>
              <span className="text-xs text-[#9496a1] leading-none mt-1 font-sans flex items-center gap-1.5">
                <span>{currentUser ? currentUser.name : profile.name}</span>
                {currentUser?.role === 'admin' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1591DC]/15 text-[#1591DC] font-medium leading-none">
                    Admin
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#9496a1] tracking-tight">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'todo-hub', label: 'Tasks' },
              { id: 'habit-matrix', label: 'Habits' },
              { id: 'daily-journal', label: 'Journal' },
              { id: 'expense-ledger', label: 'Expenses' },
              ...(currentUser?.role === 'admin' ? [{ id: 'admin-portal', label: 'Admin' }] : [])
            ].map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`transition-colors relative py-1 ${
                    isActive ? 'text-white font-semibold' : 'hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1591DC] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            
            {/* Minimal Deep Work Timer (Pomodoro) */}
            <DeepWorkTimer isLightMode={isLightMode} />

            {/* Quick Command Search */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass-button-true text-xs text-[#9496a1] hover:text-white"
              title="Search (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="px-1.5 py-0.2 text-[9px] font-mono bg-white/10 rounded">⌘K</kbd>
            </button>

            {/* 1-Click Theme Switcher (Light / Dark Mode) */}
            <button
              onClick={() => setIsLightMode(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 glass-button-true text-xs font-mono transition-all"
              title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLightMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold text-[10px] tracking-wider uppercase text-zinc-900">LIGHT</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="font-bold text-[10px] tracking-wider uppercase text-zinc-300">DARK</span>
                </>
              )}
            </button>

            {/* Cloud Sync Status */}
            <button
              onClick={() => handleToggleLocalMode(!localOnlyMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 kuldeep-badge text-xs font-mono"
              title={localOnlyMode ? "Offline Mode (Click to enable Cloud Sync)" : "Cloud Sync Active (Click to switch to Offline Mode)"}
            >
              <span className={`w-2 h-2 rounded-full ${!localOnlyMode ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="text-[10px] uppercase font-bold tracking-wider">{!localOnlyMode ? 'Synced' : 'Local'}</span>
            </button>

            {/* Profile Settings */}
            <button
              onClick={() => {
                setTempProfile({ ...profile });
                setIsProfileModalOpen(true);
              }}
              className="p-2 text-[#9496a1] hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Edit Profile"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-[#9496a1] hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE PANELS */}
      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 py-8 z-10 transition-all duration-300">

        {/* Mobile Horizontal Quick Navigation Tabs */}
        {!isLoading && (
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-3 mb-8 scrollbar-none border-b border-zinc-900/40">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'todo-hub', label: 'Tasks', icon: CheckSquare },
              { id: 'habit-matrix', label: 'Habits', icon: Activity },
              { id: 'daily-journal', label: 'Journal', icon: BookOpen },
              { id: 'expense-ledger', label: 'Expenses', icon: DollarSign }
            ].map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-3 py-2 flex items-center gap-1.5 border shrink-0 text-xs font-medium transition-all rounded-full ${
                    isActive 
                      ? 'bg-[#1591DC] text-white font-semibold' 
                      : 'border-white/[0.08] bg-white/[0.03] text-[#9496a1] hover:text-white'
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
          
          {/* Re-open Sidebar Button for Desktop when collapsed */}
          {!isLoading && !isSidebarOpen && (
            <div className="hidden lg:flex flex-col shrink-0 sticky top-28 z-20">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 glass-panel-true border border-white/[0.08] hover:border-[#1591DC]/40 text-[#9496a1] hover:text-white rounded-2xl transition-all shadow-xl flex items-center gap-2.5 cursor-pointer group"
                title="Expand Navigation (Dashboard, Tasks...)"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#1591DC] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-white">Menu</span>
              </button>
            </div>
          )}

          {/* Left Sticky Navigation Panel for Desktop */}
          {!isLoading && isSidebarOpen && (
            <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-28 space-y-3 glass-panel-true p-5 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="text-xs font-semibold text-[#9496a1] tracking-tight block">
                  Navigation
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-[#9496a1] hover:text-white transition-colors"
                  title="Collapse Panel"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="space-y-1">
                {[
                  ...(currentUser?.role === 'admin' ? [{ id: 'admin-portal', label: 'Admin Portal', sub: 'Customer management', icon: ShieldCheck }] : []),
                  { id: 'overview', label: 'Overview', sub: 'Dashboard & stats', icon: LayoutDashboard },
                  { id: 'todo-hub', label: 'Tasks', sub: 'Roadmap & timeline', icon: CheckSquare },
                  { id: 'habit-matrix', label: 'Habits', sub: 'Consistency & streaks', icon: Activity },
                  { id: 'daily-journal', label: 'Journal', sub: 'Daily reflection', icon: BookOpen },
                  { id: 'expense-ledger', label: 'Expenses', sub: 'Cash flow & budget', icon: DollarSign }
                ].map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2.5 transition-all duration-200 flex items-center gap-3 border rounded-xl ${
                        isActive 
                          ? 'bg-[#1591DC]/15 border-[#1591DC]/30 text-white font-semibold shadow-sm' 
                          : 'border-transparent text-[#9496a1] hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1591DC]' : 'text-[#9496a1]'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-sans font-medium leading-tight">{section.label}</span>
                        <span className="text-[10px] font-sans font-normal text-[#9496a1] leading-tight mt-0.5 truncate">{section.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Streamlined Utility Controls */}
              <div className="pt-3 mt-2 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-center">
                <button
                  onClick={handleExportAllData}
                  className="py-2 px-2 glass-button-true text-[#ededf3] hover:text-white font-sans text-xs font-medium transition-all rounded-xl flex items-center justify-center gap-1.5"
                  title="Export Backup Data (JSON)"
                >
                  <Download className="w-3.5 h-3.5 text-[#1591DC]" />
                  <span>Backup</span>
                </button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    title="Import JSON Backup"
                  />
                  <button
                    type="button"
                    className="w-full py-2 px-2 glass-button-true text-[#ededf3] hover:text-white font-sans text-xs font-medium transition-all rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Import</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="py-2 px-2 glass-button-true text-[#ededf3] hover:text-white font-sans text-xs font-medium transition-all rounded-xl flex items-center justify-center gap-1.5"
                  title="Configure System Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-[#9496a1]" />
                  <span>Config</span>
                </button>

                <button
                  onClick={() => setIsShortcutsModalOpen(true)}
                  className="py-2 px-2 glass-button-true text-[#ededf3] hover:text-white font-sans text-xs font-medium transition-all rounded-xl flex items-center justify-center gap-1.5"
                  title="Keyboard Shortcuts Cheatsheet (?)"
                >
                  <Compass className="w-3.5 h-3.5 text-[#9496a1]" />
                  <span>Shortcuts</span>
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
              <div className="min-h-[650px] animate-fadeIn">
                
                {/* Module Admin: Master Admin Control Portal */}
                {currentUser?.role === 'admin' && activeSection === 'admin-portal' && (
                  <section id="admin-portal">
                    <AdminDashboard onNotice={showNotice} />
                  </section>
                )}

                {/* Module 0: Executive Command Center Overview */}
                {activeSection === 'overview' && (
                  <section id="overview">
                    <ExecutiveDashboard
                      goals={goals}
                      habits={habits}
                      journals={journalEntries}
                      expenses={expenses}
                      onNavigate={(sec) => {
                        if (sec === 'habits') setActiveSection('habit-matrix');
                        else if (sec === 'journal') setActiveSection('daily-journal');
                        else if (sec === 'expenses') setActiveSection('expense-ledger');
                        else setActiveSection(sec);
                      }}
                      onToggleGoal={handleToggleGoal}
                      onToggleHabitDay={handleToggleHabitDay}
                      onAddGoal={handleAddGoal}
                      onDeleteGoal={handleDeleteGoal}
                      onReorderGoals={handleReorderGoals}
                      activeTheme={activeTheme}
                    />
                  </section>
                )}

                {/* Module 1: Tactical Roadmap & To-Do Hub */}
                {activeSection === 'todo-hub' && (
                  <section id="todo-hub">
                    <TodoHub 
                      goals={goals}
                      onAddGoal={handleAddGoal}
                      onToggleGoal={handleToggleGoal}
                      onDeleteGoal={handleDeleteGoal}
                      onEditGoal={handleEditGoal}
                      onUpdateGoal={handleUpdateGoal}
                      onReorderGoals={handleReorderGoals}
                      onNavigate={(sec) => {
                        if (sec === 'habits') setActiveSection('habit-matrix');
                        else if (sec === 'journal') setActiveSection('daily-journal');
                        else if (sec === 'expenses') setActiveSection('expense-ledger');
                        else setActiveSection(sec);
                      }}
                      isLightMode={isLightMode}
                    />
                  </section>
                )}

                {/* Module 2: Self-Mastery Habit Matrix */}
                {activeSection === 'habit-matrix' && (
                  <section id="habit-matrix">
                    <HabitTracker
                      habits={habits}
                      goals={goals}
                      onAddHabit={handleAddHabit}
                      onToggleHabitDay={handleToggleHabitDay}
                      onDeleteHabit={handleDeleteHabit}
                      onEditHabit={handleEditHabit}
                      isLightMode={isLightMode}
                    />
                  </section>
                )}

                {/* Module 3: Daily Journal & Energy Flow */}
                {activeSection === 'daily-journal' && (
                  <section id="daily-journal">
                    <DailyJournalPanel
                      journalEntries={journalEntries}
                      onSaveJournal={handleSaveJournal}
                      onDeleteJournal={handleDeleteJournal}
                    />
                  </section>
                )}

                {/* Module 4: Personal Cash Burn-Rate Ledger */}
                {activeSection === 'expense-ledger' && (
                  <section id="expense-ledger">
                    <ExpenseLedger
                      expenses={expenses}
                      onAddExpense={handleAddExpense}
                      onDeleteExpense={handleDeleteExpense}
                      isLightMode={isLightMode}
                    />
                  </section>
                )}

              </div>
            )}
          </div>

        </div>

      {/* MINIMAL CLEAN STUDIO FOOTER (Thomas Nguyen Standard) */}
      <footer className="border-t border-white/[0.06] bg-[#0b0c10] py-8 px-6 md:px-12 mt-20 relative z-20">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#9496a1] font-sans">
            &copy; 2026 Thomas Nguyen. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            <a 
              href="https://x.com/thomaseditor_vn" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-[#12141a] border border-white/[0.08] text-[#9496a1] hover:text-[#1591DC] hover:border-[#1591DC]/50 transition-all flex items-center justify-center cursor-pointer"
              title="X / Twitter"
            >
              <Twitter size={14} />
            </a>

            <a 
              href="https://www.instagram.com/thomasvisualeditor/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-[#12141a] border border-white/[0.08] text-[#9496a1] hover:text-[#1591DC] hover:border-[#1591DC]/50 transition-all flex items-center justify-center cursor-pointer"
              title="Instagram"
            >
              <Instagram size={14} />
            </a>

            <a 
              href="https://www.facebook.com/profile.php?id=100063990921099" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-[#12141a] border border-white/[0.08] text-[#9496a1] hover:text-[#1591DC] hover:border-[#1591DC]/50 transition-all flex items-center justify-center cursor-pointer"
              title="Facebook"
            >
              <Facebook size={14} />
            </a>

            <a 
              href="https://www.linkedin.com/in/phucxuannguyen/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-[#12141a] border border-white/[0.08] text-[#9496a1] hover:text-[#1591DC] hover:border-[#1591DC]/50 transition-all flex items-center justify-center cursor-pointer"
              title="LinkedIn"
            >
              <Linkedin size={14} />
            </a>

            <a 
              href="mailto:thomasnguyen.editor@gmail.com" 
              className="w-8 h-8 rounded-full bg-[#12141a] border border-white/[0.08] text-[#9496a1] hover:text-[#1591DC] hover:border-[#1591DC]/50 transition-all flex items-center justify-center cursor-pointer"
              title="Email"
            >
              <Mail size={14} />
            </a>
          </div>
        </div>
      </footer>

      </main>

      {/* 3. PROFILE SETTINGS MODAL OVERLAY */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-true border border-white/[0.08] p-7 shadow-2xl relative rounded-2xl font-sans">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-5 top-5 text-[#9496a1] hover:text-white transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <h3 className="text-lg font-semibold text-white mb-1">
              Profile Settings
            </h3>
            <p className="text-xs text-[#9496a1] mb-6 border-b border-white/[0.08] pb-3 font-normal">
              Manage personal details and profile bio
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9496a1] font-medium">Display name</label>
                <input
                  type="text"
                  required
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="glass-input-true px-3 py-2 text-xs text-white focus:outline-none rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9496a1] font-medium">Role or title</label>
                <input
                  type="text"
                  required
                  value={tempProfile.role}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, role: e.target.value }))}
                  className="glass-input-true px-3 py-2 text-xs text-white focus:outline-none rounded-xl"
                />
              </div>

              {/* Avatar Image Upload & URL Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#9496a1] font-medium">Avatar image</label>
                <div className="flex items-center gap-4 glass-card-true p-3 rounded-xl">
                  <img
                    src={tempProfile.avatarUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border border-white/20 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setTempProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        title="Upload avatar image from computer"
                      />
                      <button
                        type="button"
                        className="w-full py-1.5 glass-button-true text-[#ededf3] hover:text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#1591DC]" />
                        <span>Upload Image</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={tempProfile.avatarUrl}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, avatarUrl: e.target.value }))}
                      placeholder="Or paste image URL..."
                      className="w-full glass-input-true px-2.5 py-1 text-[11px] text-[#ededf3] focus:outline-none rounded-lg truncate"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9496a1] font-medium">Bio</label>
                <textarea
                  required
                  value={tempProfile.bio}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="glass-input-true p-3 h-20 text-xs text-white focus:outline-none rounded-xl resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-2.5 glass-button-true text-[#9496a1] hover:text-white text-xs font-medium rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 btn-primary-cyan text-white text-xs font-semibold rounded-full transition-all"
                >
                  Save changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 4. SYSTEM SETTINGS & THEMES CONFIGURATION MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel-true border border-white/[0.08] p-7 shadow-2xl relative transition-all duration-300 max-h-[90vh] overflow-y-auto rounded-2xl scrollbar-none font-sans">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-5 top-5 text-[#9496a1] hover:text-white transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <h3 className="text-lg font-semibold text-white mb-1">
              Settings & Preferences
            </h3>
            <p className="text-xs text-[#9496a1] mb-6 border-b border-white/[0.08] pb-3">
              Theme mode, storage status, and workspace backup
            </p>

            {/* Section 0: Theme Mode (Light / Dark) */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-[#9496a1] mb-3 flex items-center gap-1.5">
                {isLightMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#1591DC]" />}
                <span>Theme Mode</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsLightMode(false);
                    document.documentElement.classList.remove('light-mode');
                    localStorage.setItem('df_is_light_mode', 'false');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all ${
                    !isLightMode 
                      ? 'bg-[#1591DC] text-white shadow-md font-semibold' 
                      : 'glass-button-true text-[#9496a1] hover:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode {!isLightMode && '✓'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLightMode(true);
                    document.documentElement.classList.add('light-mode');
                    localStorage.setItem('df_is_light_mode', 'true');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all ${
                    isLightMode 
                      ? 'bg-white text-zinc-900 shadow-md font-semibold' 
                      : 'glass-button-true text-[#9496a1] hover:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light Mode {isLightMode && '✓'}</span>
                </button>
              </div>
            </div>

            {/* Section 2: Storage Status & Import/Export */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-[#9496a1] mb-3 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#1591DC]" />
                <span>Data & Backup</span>
              </h4>

              <div className="glass-card-true p-4 mb-4 rounded-xl">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.08]">
                  <span className="text-xs text-[#9496a1] font-medium">Storage status</span>
                  <span className={`text-xs font-medium ${localOnlyMode ? 'text-zinc-400' : 'text-emerald-400'}`}>
                    {localOnlyMode ? 'Local only (Offline)' : 'Cloud Firestore (Syncing)'}
                  </span>
                </div>
                <p className="text-xs text-[#9496a1] leading-relaxed font-sans">
                  {localOnlyMode 
                    ? 'All workspace data is stored in your local browser storage.' 
                    : 'Data is synchronized across devices with Cloud Firestore.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 py-2.5 glass-button-true text-[#ededf3] hover:text-white text-xs font-medium rounded-xl transition-all"
                >
                  <Download className="w-4 h-4 text-[#1591DC]" />
                  <span>Export JSON</span>
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 glass-button-true text-[#ededf3] hover:text-white text-xs font-medium rounded-xl transition-all"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>

              {/* Wipe All Data Button */}
              <button
                type="button"
                onClick={handleClearAllData}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-medium rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset all workspace data</span>
              </button>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-2.5 glass-button-true text-zinc-300 hover:text-white font-mono text-xs uppercase rounded-xl transition-all font-bold"
              >
                CLOSE CONFIGURATION
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

      {/* A4 — MORNING PRIORITY PROMPT MODAL */}
      {showMorningPrompt && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md mx-4 glass-card-true border border-white/15 rounded-2xl p-7 shadow-2xl">
            <div className="flex items-center gap-3 mb-1">
              <Sun className="w-6 h-6 text-zinc-200 shrink-0" />
              <div>
                <h2 className="text-white font-semibold text-lg leading-tight">Good morning, {currentUser?.email?.split('@')[0] || 'Chief'}</h2>
                <p className="text-zinc-400 text-xs mt-0.5">What are your 3 most important tasks today?</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {([0, 1, 2] as const).map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={morningPriorities[i]}
                    onChange={(e) => setMorningPriorities(prev => {
                      const next = [prev[0], prev[1], prev[2]] as [string, string, string];
                      next[i] = e.target.value;
                      return next;
                    })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleMorningPromptSubmit(); }}
                    placeholder={['Most important task...', 'Second priority...', 'Third priority...'][i]}
                    className="flex-1 bg-zinc-900/60 border border-zinc-700/50 focus:border-amber-500/60 text-zinc-200 placeholder-zinc-600 rounded-lg px-3 py-2 text-sm outline-none transition-all"
                    autoFocus={i === 0}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowMorningPrompt(false)}
                className="flex-1 py-2 text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs font-mono uppercase tracking-widest transition-all"
              >
                Skip
              </button>
              <button
                onClick={handleMorningPromptSubmit}
                className="flex-[2] py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-mono uppercase tracking-widest font-bold transition-all"
              >
                Lock In & Start Day →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A2 — WEEKLY REVIEW FLOATING PANEL */}
      {isWeeklyReviewOpen && (
        <div className="fixed inset-0 z-[8900] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg mx-4 glass-card-true border border-white/15 rounded-2xl p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsWeeklyReviewOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-zinc-200 shrink-0" />
              <div>
                <h2 className="text-white font-semibold text-lg">Weekly Debrief</h2>
                <p className="text-zinc-400 text-xs">Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(() => {
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const weekGoals = goals.filter(g => g.createdAt >= weekAgo);
                const completedCount = weekGoals.filter(g => g.completed).length;
                const totalCount = weekGoals.length;
                const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const weekJournals = journalEntries.filter(j => j.updatedAt >= weekAgo);
                const avgEnergy = weekJournals.length > 0
                  ? (weekJournals.reduce((s, j) => s + j.energy, 0) / weekJournals.length).toFixed(1)
                  : '—';
                const today = new Date();
                const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                const thisMonthHabits = habits.filter(h => h.monthYear === monthKey);
                const daysInMonth = today.getDate();
                const habitAvg = thisMonthHabits.length > 0
                  ? Math.round((thisMonthHabits.reduce((s, h) => s + h.completedDays.filter(d => d <= daysInMonth).length, 0) / thisMonthHabits.length / daysInMonth) * 100)
                  : 0;
                return [
                  { label: 'Tasks Done', value: `${pct}%`, sub: `${completedCount}/${totalCount}`, color: 'text-emerald-400' },
                  { label: 'Avg Energy', value: avgEnergy, sub: `${weekJournals.length} logs`, color: 'text-amber-400' },
                  { label: 'Habit Rate', value: `${habitAvg}%`, sub: 'this month', color: 'text-violet-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                    <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                    <div className="text-zinc-300 text-[10px] font-semibold mt-1">{stat.label}</div>
                    <div className="text-zinc-600 text-[9px] mt-0.5">{stat.sub}</div>
                  </div>
                ));
              })()}
            </div>

            {/* 3 Reflection Questions */}
            <div className="space-y-4">
              {[
                { emoji: '🔑', q: 'What was your highest-leverage task this week?' },
                { emoji: '🚫', q: 'What wasted the most time? (Be honest)' },
                { emoji: '⚡', q: 'What is the #1 priority for next week?' },
              ].map((item, i) => (
                <div key={i}>
                  <label className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 mb-1.5">
                    <span>{item.emoji}</span> {item.q}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Write your honest answer..."
                    className="w-full bg-zinc-900/60 border border-zinc-700/50 focus:border-violet-500/60 text-zinc-200 placeholder-zinc-600 rounded-lg px-3 py-2 text-sm outline-none transition-all resize-none"
                    onChange={(e) => {
                      const key = `df_weekly_review_q${i}_${new Date().getFullYear()}_W${Math.ceil(new Date().getDate() / 7)}`;
                      localStorage.setItem(key, e.target.value);
                    }}
                    defaultValue={(() => {
                      const key = `df_weekly_review_q${i}_${new Date().getFullYear()}_W${Math.ceil(new Date().getDate() / 7)}`;
                      return localStorage.getItem(key) || '';
                    })()}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsWeeklyReviewOpen(false)}
              className="mt-5 w-full py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-400/50 text-violet-300 rounded-lg text-xs font-mono uppercase tracking-widest font-bold transition-all"
            >
              Save & Close Review
            </button>
          </div>
        </div>
      )}

      {/* C4 — KEYBOARD SHORTCUTS MODAL (?) */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md mx-4 glass-card-true border border-white/15 rounded-2xl p-7 shadow-2xl">
            <button
              onClick={() => setIsShortcutsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <Compass className="w-6 h-6 text-zinc-200 shrink-0" />
              <div>
                <h2 className="text-white font-semibold text-lg">Keyboard Shortcuts</h2>
                <p className="text-zinc-400 text-xs">Navigate Deep Focus OS with speed</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {[
                { key: 'Ctrl + K / Cmd + K', label: 'Command Palette Search' },
                { key: 'N / T', label: 'Jump to Tactical Roadmap (Tasks)' },
                { key: 'H', label: 'Jump to Habit Matrix' },
                { key: 'J', label: 'Jump to Energy Journal' },
                { key: 'E', label: 'Jump to Cash Flow Ledger' },
                { key: '?', label: 'Open this Shortcuts Modal' },
              ].map(s => (
                <div key={s.key} className="flex justify-between items-center p-2 rounded bg-zinc-900/60 border border-zinc-800">
                  <span className="text-zinc-300 font-sans">{s.label}</span>
                  <kbd className="px-2 py-0.5 text-[10px] bg-zinc-800 text-cyan-300 rounded border border-zinc-700 font-bold">{s.key}</kbd>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsShortcutsModalOpen(false)}
              className="mt-5 w-full py-2 glass-button-true text-zinc-200 hover:text-white rounded-lg text-xs font-mono uppercase font-bold"
            >
              Close Cheatsheet
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
