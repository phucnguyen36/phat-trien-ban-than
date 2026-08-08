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
  deleteJournal,
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
  Trophy,
  Sparkles
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

  // Load all Workspace Data for current active account
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeEmail = currentUser?.email;
      const data = await loadWorkspaceData(activeEmail);
      setGoals(data.goals);
      setHabits(data.habits);
      setJournalEntries(data.journal);
      setExpenses(data.expenses);
      setScratchpadText(data.scratchpad);
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
        if (data) setGoals(data);
      }, activeEmail);
      const unsubHabits = syncCollectionRealtime('habits_data', (data) => {
        if (data) setHabits(data);
      }, activeEmail);
      const unsubJournal = syncCollectionRealtime('daily_journal', (data) => {
        if (data) setJournalEntries(data);
      }, activeEmail);
      const unsubExpenses = syncCollectionRealtime('personal_expenses', (data) => {
        if (data) setExpenses(data);
      }, activeEmail);
      const unsubPad = syncScratchpadRealtime((text) => {
        if (text !== undefined) setScratchpadText(text);
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

  // A4 — Morning Prompt: submit 3 priorities as daily tasks
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

  // Quick Seed Rich Demo Data (for user screenshots)
  const handleSeedDemoData = async () => {
    setIsLoading(true);
    const demoGoals: GoalTodo[] = [
      { id: 'g1', text: '[D:2026-07-24] Execute Dark Frosted Glassmorphism UI Overhaul', timeframe: 'daily', completed: true, createdAt: Date.now() - 86400000 * 3 },
      { id: 'g2', text: '[D:2026-07-24] Finalize Executive Growth Telemetry Presentation', timeframe: 'daily', completed: true, createdAt: Date.now() - 86400000 * 2 },
      { id: 'g3', text: '[D:2026-07-24] Review Q3 Strategic Financial Allocation & Cashflow', timeframe: 'daily', completed: true, createdAt: Date.now() - 86400000 },
      { id: 'g4', text: '[D:2026-07-24] Conduct 30-min Meditative Peak Focus Session', timeframe: 'daily', completed: false, createdAt: Date.now() },
      { id: 'g5', text: '[W:2026-07-W3] Scale System Ingress Infrastructure to 10k Licenses', timeframe: 'weekly', completed: true, createdAt: Date.now() - 86400000 * 5 },
      { id: 'g6', text: '[W:2026-07-W3] Audit Personal Asset Portfolio & Capital Ledger', timeframe: 'weekly', completed: true, createdAt: Date.now() - 86400000 * 4 },
      { id: 'g7', text: '[M:2026-07] Launch Deep Focus OS v5.0 Master Product Ingress', timeframe: 'monthly', completed: true, createdAt: Date.now() - 86400000 * 10 },
      { id: 'g8', text: '[M:2026-07] Expand International Client License Distribution Network', timeframe: 'monthly', completed: false, createdAt: Date.now() - 86400000 * 8 },
      { id: 'g9', text: '[Y:2026] Achieve 100% Personal Autonomy & Systems Mastery', timeframe: 'yearly', completed: true, createdAt: Date.now() - 86400000 * 30 },
      { id: 'g10', text: '[Y:2026] Build High-Impact AI Automation Funnels', timeframe: 'yearly', completed: true, createdAt: Date.now() - 86400000 * 25 }
    ];

    const demoHabits: HabitData[] = [
      { id: 'h1', habitName: '5:30 AM Peak Protocol & Hydration', monthYear: '2026-07', completedDays: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24] },
      { id: 'h2', habitName: '2-Hour Uninterrupted Deep Work Block', monthYear: '2026-07', completedDays: [1,2,3,4,5,7,8,9,10,11,12,14,15,16,17,18,19,21,22,23,24] },
      { id: 'h3', habitName: 'Zone-2 Physical Cardio / Gym Session', monthYear: '2026-07', completedDays: [2,4,6,8,10,12,14,16,18,20,22,24] },
      { id: 'h4', habitName: 'Daily Journal & Energy Telemetry Log', monthYear: '2026-07', completedDays: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24] },
      { id: 'h5', habitName: 'Zero Processed Sugar & High Protein Diet', monthYear: '2026-07', completedDays: [1,3,4,5,6,7,8,9,11,12,13,14,15,16,18,19,20,21,22,23,24] }
    ];

    const demoJournal: DailyJournal[] = [
      { id: '2026-07-24', energy: 5, text: 'Peak clarity today. Completed the Dark Frosted Glassmorphism UI overhaul. Systems are running smoothly.', updatedAt: Date.now() },
      { id: '2026-07-23', energy: 5, text: 'Great progress on product funnel and commercial licensing. High focus velocity throughout the afternoon.', updatedAt: Date.now() - 86400000 },
      { id: '2026-07-22', energy: 4, text: 'Solid strategic planning session. Financial cashflow ledger audited and optimized.', updatedAt: Date.now() - 86400000 * 2 },
      { id: '2026-07-21', energy: 4, text: 'Consistent execution on habit streaks. 2-hour deep work block completed uninterrupted.', updatedAt: Date.now() - 86400000 * 3 },
      { id: '2026-07-20', energy: 5, text: 'High energy output. Expanded commercial license architecture for client deployments.', updatedAt: Date.now() - 86400000 * 4 },
      { id: '2026-07-19', energy: 3, text: 'Sunday reflection and strategic roadmap review. Refueled for upcoming high-intensity week.', updatedAt: Date.now() - 86400000 * 5 },
      { id: '2026-07-18', energy: 4, text: 'Cardio session and mental reset. Re-calibrated weekly priorities.', updatedAt: Date.now() - 86400000 * 6 }
    ];

    const demoExpenses: PersonalExpense[] = [
      { id: 'e1', date: '2026-07-24', amount: -180000, category: 'Eating', note: 'Executive Team Lunch' },
      { id: 'e2', date: '2026-07-23', amount: -1250000, category: 'Study/Equipment', note: 'High-Performance Monitor Arm & Ergonomic Gear' },
      { id: 'e3', date: '2026-07-22', amount: -350000, category: 'Transport', note: 'Fuel & Commute Service' },
      { id: 'e4', date: '2026-07-20', amount: -450000, category: 'Entertainment', note: 'Books & Audible Subscription' },
      { id: 'e5', date: '2026-07-18', amount: -220000, category: 'Eating', note: 'Nutrition & Organic Groceries' },
      { id: 'e6', date: '2026-07-15', amount: -890000, category: 'Study/Equipment', note: 'Cloud Server Ingress Hosting Fee' }
    ];

    const demoScratchpad = `# EXECUTIVE STRATEGY & BREAKTHROUGH SYSTEM\n\n1. CORE PRINCIPLE: Simplicity + High Visual Elegance (Dark Frosted Glassmorphism).\n2. COMMERCIAL DISTRIBUTION:\n   - License Tier Standard ($49 Lifetime)\n   - License Tier VIP Coaching ($149 System Integration)\n3. DAILY FOCUS PROTOCOL:\n   - Block 1 (08:00 - 11:00): Core Systems Architecture & Product Code\n   - Block 2 (13:00 - 15:30): Growth Funnels & Marketing Ingress\n   - Block 3 (16:30 - 18:00): Physical Training & Reflection Telemetry`;

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
      
      {/* Vercel Aesthetic Dark Gradient Mesh + Noise Overlay + Ambient Glow Streaks */}
      <div className="glass-background-mesh">
        <div className="noise-overlay" />
        <div className="glow-streak-top" />
        <div className="glow-streak-bottom" />
      </div>

      {/* 1. TOP STATUS BAR HEADER (True Glassmorphism Ultra-Sleek) */}
      <header className="sticky top-0 z-40 bg-white/[0.06] backdrop-blur-2xl border-b border-white/15 px-4 md:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-3 shadow-2xl">
        
        {/* Brand & Live System Clock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 glass-pill-true px-3.5 py-1 text-zinc-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse inline-block" />
            <h1 className="text-xs font-mono tracking-widest uppercase font-extrabold text-white">
              DEEP FOCUS OS <span className="text-[9px] text-zinc-400 font-normal">v5.0</span>
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-zinc-300 glass-pill-true px-3 py-1 uppercase tracking-wider font-semibold">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Cloud / Local Mode Selector Bar */}
        <div className="flex items-center glass-pill-true p-1">
          <button
            onClick={() => handleToggleLocalMode(false)}
            className={`px-3 py-1 font-mono text-[9px] tracking-widest uppercase rounded-full transition-all flex items-center gap-1.5 focus:outline-none font-bold ${
              !localOnlyMode 
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${!localOnlyMode ? 'animate-spin' : ''}`} />
            CLOUD SYNC
          </button>
          <button
            onClick={() => handleToggleLocalMode(true)}
            className={`px-3 py-1 font-mono text-[9px] tracking-widest uppercase rounded-full transition-all flex items-center gap-1.5 focus:outline-none font-bold ${
              localOnlyMode 
                ? 'bg-white/20 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CloudOff className="w-3 h-3" />
            LOCAL ONLY
          </button>
        </div>

        {/* User Profile Card Triggers & Navigation Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* Quick Search Command Palette Trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="px-3 py-1.5 glass-button-true text-zinc-200 hover:text-white transition-all rounded-full flex items-center gap-2 text-xs font-semibold"
            title="Search or Jump to Section (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono glass-pill-true text-zinc-300">Ctrl K</kbd>
          </button>



          {/* Toggle Sidebar Panel (Desktop) */}
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className={`px-3 py-1.5 glass-button-true text-zinc-200 hover:text-white transition-colors rounded-full hidden lg:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest font-semibold`}
            title={isSidebarOpen ? "Collapse Navigation Panel" : "Expand Navigation Panel"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            <span>{isSidebarOpen ? "Hide Nav" : "Show Nav"}</span>
          </button>

          {/* User Profile Card */}
          <button
            onClick={() => {
              setTempProfile({ ...profile });
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-2.5 glass-card-true px-3 py-1 rounded-full group text-left focus:outline-none"
            title="Edit Profile Settings"
          >
            <img 
              src={profile.avatarUrl} 
              alt={profile.name} 
              className="w-7 h-7 rounded-full border border-white/20 group-hover:border-white/50 transition-colors"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-white group-hover:text-cyan-200 transition-colors">
                {currentUser ? currentUser.name : profile.name}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                {currentUser?.role === 'admin' ? 'Master Admin' : profile.role}
              </span>
            </div>
          </button>

          {/* Settings Control Panel button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 glass-button-true text-zinc-300 hover:text-white transition-colors rounded-full"
            title="OS Configuration & Theme Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Sign Out / Lock Screen button */}
          <button
            onClick={() => {
              sessionStorage.removeItem('df_os_active_user');
              sessionStorage.removeItem('df_os_unlocked');
              setIsAuthenticated(false);
              setCurrentUser(null);
            }}
            className="p-2 glass-button-true text-zinc-400 hover:text-red-400 transition-colors rounded-full"
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
                  onClick={() => setActiveSection(section.id)}
                  className={`px-3 py-2 flex items-center gap-1.5 border shrink-0 text-[10px] font-mono uppercase tracking-widest transition-all rounded-full ${
                    isActive 
                      ? `${activeTheme.border} ${activeTheme.bgMuted} ${activeTheme.text} font-bold` 
                      : 'border-white/10 bg-black/20 text-zinc-400 hover:text-white'
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
            <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-28 space-y-3 glass-panel-true p-5 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[9px] font-mono text-zinc-300 tracking-widest uppercase block font-bold">
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
                  ...(currentUser?.role === 'admin' ? [{ id: 'admin-portal', label: 'Admin Portal', sub: 'License & customer management', icon: ShieldCheck }] : []),
                  { id: 'overview', label: 'Executive Overview', sub: 'Command center & performance stats', icon: LayoutDashboard },
                  { id: 'todo-hub', label: 'Tactical Roadmap', sub: 'Tasks, timeline & review dashboard', icon: CheckSquare },
                  { id: 'habit-matrix', label: 'Habit Matrix', sub: 'Daily consistency & streaks', icon: Activity },
                  { id: 'daily-journal', label: 'Energy Journal', sub: 'Daily energy & reflection logs', icon: BookOpen },
                  { id: 'expense-ledger', label: 'Cash Flow Ledger', sub: 'Burn rate & budget', icon: DollarSign },
                  { id: 'scratchpad', label: 'Brain Scratchpad', sub: 'Ideas & quick notes', icon: FileText }
                ].map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-3 transition-all duration-200 flex items-center gap-3.5 border rounded-xl ${
                        isActive 
                          ? `${activeTheme.border} ${activeTheme.bgMuted} text-white shadow-md font-semibold` 
                          : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? activeTheme.text : 'text-zinc-400'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-sans font-semibold leading-tight text-zinc-100">{section.label}</span>
                        <span className="text-[10px] font-sans font-normal text-zinc-400 leading-tight mt-1 truncate">{section.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Streamlined Utility Controls (Tối giản khu vực panel) */}
              <div className="pt-3 mt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-center">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="py-2 px-2.5 glass-button-true text-zinc-300 hover:text-white font-sans text-[11px] font-semibold transition-all rounded-xl flex items-center justify-center gap-1.5"
                  title="Configure System Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Config</span>
                </button>
                <button
                  onClick={handleExportAllData}
                  className="py-2 px-2.5 glass-button-true text-zinc-300 hover:text-white font-sans text-[11px] font-semibold transition-all rounded-xl flex items-center justify-center gap-1.5"
                  title="Export Backup Data (JSON)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Backup</span>
                </button>
                <button
                  onClick={() => setIsShortcutsModalOpen(true)}
                  className="py-2 px-2.5 glass-button-true text-zinc-300 hover:text-white font-sans text-[11px] font-semibold transition-all rounded-xl flex items-center justify-center gap-1.5"
                  title="Keyboard Shortcuts Cheatsheet (?)"
                >
                  <span>⌨️</span>
                  <span>Shortcuts</span>
                </button>
                <button
                  onClick={handleClearAllData}
                  className="py-2 px-2.5 glass-button-true text-red-400 hover:text-red-300 font-sans text-[11px] font-semibold transition-all rounded-xl flex items-center justify-center gap-1.5 border-red-500/20"
                  title="Reset Workspace Data"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset</span>
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

                {/* Module 5: Quick Scratchpad / Brain Dump */}
                {activeSection === 'scratchpad' && (
                  <section id="scratchpad">
                    <Scratchpad
                      initialText={scratchpadText}
                      isCloudConnected={!localOnlyMode}
                      onSaveText={handleSaveScratchpadText}
                    />
                  </section>
                )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-true border border-white/15 p-7 shadow-2xl relative rounded-2xl">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <h3 className="text-lg font-bold tracking-tight text-white mb-1">
              Master Profile Settings
            </h3>
            <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-4 font-bold">
              USER IDENTITY & MISSION STATEMENT
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">DISPLAY NAME</label>
                <input
                  type="text"
                  required
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="glass-input-true px-3 py-2.5 text-xs text-white focus:outline-none rounded-xl font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">ROLE / TITLE</label>
                <input
                  type="text"
                  required
                  value={tempProfile.role}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, role: e.target.value }))}
                  className="glass-input-true px-3 py-2.5 text-xs text-white focus:outline-none rounded-xl font-sans"
                />
              </div>

              {/* Avatar Image Upload & URL Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">AVATAR IMAGE</label>
                <div className="flex items-center gap-4 glass-card-true p-3 rounded-xl border border-white/10">
                  <img
                    src={tempProfile.avatarUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-full object-cover border-2 border-white/20 shadow-md shrink-0"
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
                        className="w-full py-2 glass-button-true text-cyan-300 hover:text-cyan-100 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 border border-cyan-500/30"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image File</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={tempProfile.avatarUrl}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, avatarUrl: e.target.value }))}
                      placeholder="Or paste image URL..."
                      className="w-full glass-input-true px-2.5 py-1.5 text-[10px] text-white focus:outline-none rounded-lg font-mono truncate"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">BIO / MISSION STATEMENT</label>
                <textarea
                  required
                  value={tempProfile.bio}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="glass-input-true p-3 h-24 text-xs text-white focus:outline-none rounded-xl font-sans resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-2.5 border border-white/10 hover:border-white/25 text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-widest rounded-xl transition-all font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 glass-button-true text-cyan-300 hover:text-cyan-100 font-mono text-xs uppercase tracking-widest rounded-xl transition-all font-bold border border-cyan-500/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel-true border border-white/15 p-7 shadow-2xl relative transition-all duration-300 max-h-[90vh] overflow-y-auto rounded-2xl scrollbar-none">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <h3 className="text-lg font-bold tracking-tight text-white mb-1">
              System Configuration Settings
            </h3>
            <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-4 font-bold">
              THEME MODE & DATA MANAGEMENT
            </p>

            {/* Section 0: Theme Mode (Light / Dark) */}
            <div className="mb-6">
              <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-bold">
                {isLightMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-violet-400" />}
                THEME MODE (LIGHT / DARK)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsLightMode(false);
                    document.documentElement.classList.remove('light-mode');
                    localStorage.setItem('df_is_light_mode', 'false');
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-mono uppercase font-bold transition-all border ${
                    !isLightMode 
                      ? 'bg-white text-black border-white shadow-lg font-black' 
                      : 'glass-button-true text-zinc-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>DARK MODE {!isLightMode && '✓'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLightMode(true);
                    document.documentElement.classList.add('light-mode');
                    localStorage.setItem('df_is_light_mode', 'true');
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-mono uppercase font-bold transition-all border ${
                    isLightMode 
                      ? 'bg-white text-black border-white shadow-lg font-black' 
                      : 'glass-button-true text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>LIGHT MODE {isLightMode && '✓'}</span>
                </button>
              </div>
            </div>

            {/* Section 2: Storage Status & Import/Export */}
            <div className="mb-6">
              <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-bold">
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                DATA PERSISTENCE & BACKUP
              </h4>

              <div className="glass-card-true p-4 mb-4 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">STORAGE ARCHITECTURE</span>
                  <span className={`text-[9px] font-mono font-bold uppercase ${localOnlyMode ? 'text-zinc-400' : 'text-emerald-400 animate-pulse'}`}>
                    {localOnlyMode ? 'PURE LOCAL (OFFLINE)' : 'CLOUD FIRESTORE (CONNECTED)'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 leading-relaxed font-sans">
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
                  className="flex items-center justify-center gap-2 py-2.5 glass-button-true text-zinc-200 hover:text-white font-mono text-xs uppercase rounded-xl transition-all font-bold"
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 glass-button-true text-zinc-200 hover:text-white font-mono text-xs uppercase rounded-xl transition-all font-bold"
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
                className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-red-950/30 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-200 font-mono text-xs uppercase rounded-xl transition-all font-bold"
              >
                <Trash2 className="w-4 h-4" />
                PERMANENTLY WIPE ALL DATA
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
