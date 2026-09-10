/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GoalTodo, TimeframeType, TimeEstimate, PriorityLevel } from '../types';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  Calendar as CalendarIcon, 
  Sliders, 
  LayoutGrid, 
  CalendarDays,
  Check,
  Play,
  Pause,
  Repeat,
  Clock,
  BarChart3,
  Zap,
  Key,
  Ban,
  Target,
  AlertCircle,
  RefreshCw,
  X,
  Pencil,
  Table,
  PanelRightOpen,
  FileText,
  ListChecks,
  Tag,
  Flag,
  Calendar,
  Maximize2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Trophy,
  LayoutDashboard,
  SlidersHorizontal,
  Sun,
  Kanban,
  Search
} from 'lucide-react';
import WeeklyReviewProtocol from './WeeklyReviewProtocol';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TodoHubProps {
  goals: GoalTodo[];
  onAddGoal: (text: string, timeframe: TimeframeType, timeEstimate?: TimeEstimate) => void;
  onToggleGoal: (id: string, completed: boolean) => void;
  onDeleteGoal: (id: string) => void;
  onEditGoal?: (id: string, newText: string) => void;
  onUpdateGoal?: (updatedGoal: GoalTodo) => void;
  onNavigate?: (section: string) => void;
  isLightMode?: boolean;
}

export default function TodoHub({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onEditGoal,
  onUpdateGoal,
  onNavigate,
  isLightMode
}: TodoHubProps) {
  // Safe helper handlers
  const handleToggle = (id: string, completed: boolean) => {
    onToggleGoal(id, completed);
  };

  const handleDelete = (id: string) => {
    onDeleteGoal(id);
  };

  // View mode toggle: Multi-column view vs Notion Table View vs Calendar Grid view vs Weekly/Monthly Review Dashboard
  const [viewMode, setViewMode] = useState<'columns' | 'table' | 'calendar' | 'review'>('columns');

  // Database View State: Board (Columns) vs Table View
  const [databaseSubView, setDatabaseSubView] = useState<'board' | 'table'>('board');
  const [databaseSearchQuery, setDatabaseSearchQuery] = useState('');
  const [databaseStatusFilter, setDatabaseStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [databasePriorityFilter, setDatabasePriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [tableTimeframeFilter, setTableTimeframeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Database Drag & Drop State
  const [dbDraggedGoalId, setDbDraggedGoalId] = useState<string | null>(null);
  const [dbDragOverColumn, setDbDragOverColumn] = useState<TimeframeType | null>(null);

  // Database Inline Quick Add per column
  const [dbQuickAddInputs, setDbQuickAddInputs] = useState<Record<TimeframeType, string>>({
    daily: '',
    weekly: '',
    monthly: '',
    yearly: ''
  });
  const [dbQuickAddEstimates, setDbQuickAddEstimates] = useState<Record<TimeframeType, string>>({
    daily: '',
    weekly: '',
    monthly: '',
    yearly: ''
  });

  const filteredDatabaseGoals = useMemo(() => {
    return goals.filter(g => {
      // Search text query
      if (databaseSearchQuery.trim()) {
        const query = databaseSearchQuery.toLowerCase();
        const textMatch = g.text.toLowerCase().includes(query);
        const notesMatch = (g.notes || '').toLowerCase().includes(query);
        const tagMatch = (g.contextTag || '').toLowerCase().includes(query);
        if (!textMatch && !notesMatch && !tagMatch) return false;
      }

      // Status filter
      if (databaseStatusFilter === 'active' && g.completed) return false;
      if (databaseStatusFilter === 'completed' && !g.completed) return false;

      // Priority filter
      if (databasePriorityFilter !== 'all' && (g.priority || 'Medium') !== databasePriorityFilter) return false;

      // Table timeframe filter (only active in table mode)
      if (databaseSubView === 'table' && tableTimeframeFilter !== 'all' && g.timeframe !== tableTimeframeFilter) {
        return false;
      }

      return true;
    });
  }, [goals, databaseSearchQuery, databaseStatusFilter, databasePriorityFilter, databaseSubView, tableTimeframeFilter]);

  const databaseGoals = filteredDatabaseGoals;

  // Notion Side Panel State
  const [activePanelGoalId, setActivePanelGoalId] = useState<string | null>(null);
  const activePanelGoal = useMemo(() => goals.find(g => g.id === activePanelGoalId) || null, [goals, activePanelGoalId]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

  // Sub-task handlers
  const handleAddSubTask = (goal: GoalTodo, title: string) => {
    if (!title.trim() || !onUpdateGoal) return;
    const newSub = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      completed: false
    };
    const updatedSubTasks = [...(goal.subTasks || []), newSub];
    onUpdateGoal({ ...goal, subTasks: updatedSubTasks });
    setNewSubTaskTitle('');
  };

  const handleToggleSubTask = (goal: GoalTodo, subTaskId: string) => {
    if (!onUpdateGoal) return;
    const updatedSubTasks = (goal.subTasks || []).map(s => 
      s.id === subTaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdateGoal({ ...goal, subTasks: updatedSubTasks });
  };

  const handleDeleteSubTask = (goal: GoalTodo, subTaskId: string) => {
    if (!onUpdateGoal) return;
    const updatedSubTasks = (goal.subTasks || []).filter(s => s.id !== subTaskId);
    onUpdateGoal({ ...goal, subTasks: updatedSubTasks });
  };

  const handleUpdateNotes = (goal: GoalTodo, notes: string) => {
    if (onUpdateGoal) {
      onUpdateGoal({ ...goal, notes });
    }
  };

  const handleUpdateProperty = (goal: GoalTodo, key: keyof GoalTodo, value: any) => {
    if (onUpdateGoal) {
      onUpdateGoal({ ...goal, [key]: value });
    }
  };

  // Calculate current actual date for Today highlight and default selection
  const today = useMemo(() => new Date(), []);
  const todayDayStr = useMemo(() => String(today.getDate()).padStart(2, '0'), [today]);
  const todayMonthStr = useMemo(() => String(today.getMonth() + 1).padStart(2, '0'), [today]);
  const todayYearStr = useMemo(() => String(today.getFullYear()), [today]);
  const todayWeekStr = useMemo(() => `W${Math.ceil(today.getDate() / 7)}`, [today]);

  const [selectedYear, setSelectedYear] = useState(todayYearStr);
  const [selectedMonth, setSelectedMonth] = useState(todayMonthStr);
  const [selectedWeek, setSelectedWeek] = useState(todayWeekStr);
  const [selectedDay, setSelectedDay] = useState(todayDayStr);

  const isTodayActive = useMemo(() => {
    return selectedDay === todayDayStr && selectedMonth === todayMonthStr && selectedYear === todayYearStr;
  }, [selectedDay, selectedMonth, selectedYear, todayDayStr, todayMonthStr, todayYearStr]);

  const weekRangeStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diffToMon));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    return `${fmt(mon)} – ${fmt(sun)}`;
  }, []);

  const monthNameStr = useMemo(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const idx = parseInt(selectedMonth) - 1;
    return months[idx] || months[today.getMonth()];
  }, [selectedMonth, today]);

  // Filters for Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<TimeframeType, boolean>>({
    daily: true,
    weekly: true,
    monthly: true,
    yearly: true
  });

  // Individual column Quick-add input states
  const [inputs, setInputs] = useState<Record<TimeframeType, string>>({
    daily: '',
    weekly: '',
    monthly: '',
    yearly: ''
  });

  // Time Estimate presets per column
  const TIME_ESTIMATES: { value: TimeEstimate; label: string; color: string }[] = [
    { value: '15m', label: '15m', color: 'text-emerald-400' },
    { value: '30m', label: '30m', color: 'text-emerald-400' },
    { value: '1h', label: '1h', color: 'text-sky-400' },
    { value: '2h', label: '2h', color: 'text-sky-400' },
    { value: 'half-day', label: '4h', color: 'text-amber-400' },
  ];
  const [estimates, setEstimates] = useState<Record<TimeframeType, TimeEstimate | ''>>({ daily: '', weekly: '', monthly: '', yearly: '' });

  // B2 — Live Stopwatch Timer State
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<Record<string, number>>({});

  // Timer Tick Effect
  React.useEffect(() => {
    if (!activeTimerId) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => ({
        ...prev,
        [activeTimerId]: (prev[activeTimerId] || 0) + 1
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimerId]);

  // C2 — Recurring Tasks State (in-memory toggle)
  const [recurringTasks, setRecurringTasks] = useState<Record<string, boolean>>({});
  const toggleRecurring = (id: string) => {
    setRecurringTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Inline Editing Goal State
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState('');

  const handleStartEditGoal = (goal: GoalTodo) => {
    setEditingGoalId(goal.id);
    setEditingGoalText(getDisplayGoalText(goal.text));
  };

  const handleSaveEditGoal = (id: string) => {
    if (editingGoalText.trim() && onEditGoal) {
      onEditGoal(id, editingGoalText.trim());
    }
    setEditingGoalId(null);
  };

  // Calendar Quick-Add Input state
  const [calendarInputText, setCalendarInputText] = useState('');

  // Column Toggle Handler
  const toggleColumnVisibility = (tf: TimeframeType) => {
    setVisibleColumns(prev => ({ ...prev, [tf]: !prev[tf] }));
  };

  // Context Key Formatting
  const getContextKey = (timeframe: TimeframeType): string => {
    if (timeframe === 'daily') return `${selectedYear}-${selectedMonth}-${selectedDay}`;
    if (timeframe === 'weekly') return `${selectedYear}-${selectedMonth}-${selectedWeek}`;
    if (timeframe === 'monthly') return `${selectedYear}-${selectedMonth}`;
    if (timeframe === 'yearly') return `${selectedYear}`;
    return '';
  };

  // Filtered goals by Context
  const filteredGoals = useMemo(() => {
    const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;
    const activeCtxKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;

    return goals.filter(g => {
      const text = g.text;

      if (g.timeframe === 'daily') {
        if (text.startsWith(`[D:${activeCtxKey}]`)) return true;
        if (!text.startsWith('[D:') && activeCtxKey === todayCtxKey) return true;
        return false;
      }

      if (g.timeframe === 'weekly') {
        const ctxKey = `${selectedYear}-${selectedMonth}-${selectedWeek}`;
        const todayWeekKey = `${todayYearStr}-${todayMonthStr}-${todayWeekStr}`;
        if (text.startsWith(`[W:${ctxKey}]`)) return true;
        if (!text.startsWith('[W:') && ctxKey === todayWeekKey) return true;
        return false;
      }

      if (g.timeframe === 'monthly') {
        const ctxKey = `${selectedYear}-${selectedMonth}`;
        const todayMonthKey = `${todayYearStr}-${todayMonthStr}`;
        if (text.startsWith(`[M:${ctxKey}]`)) return true;
        if (!text.startsWith('[M:') && ctxKey === todayMonthKey) return true;
        return false;
      }

      if (g.timeframe === 'yearly') {
        const ctxKey = `${selectedYear}`;
        if (text.startsWith(`[Y:${ctxKey}]`)) return true;
        if (!text.startsWith('[Y:')) return true;
        return false;
      }

      return true;
    });
  }, [goals, selectedYear, selectedMonth, selectedWeek, selectedDay, todayYearStr, todayMonthStr, todayDayStr, todayWeekStr]);

  // Overdue / Incomplete Goals Reminder Logic
  const overdueIncompleteGoals = useMemo(() => {
    const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;
    return goals.filter(g => {
      if (g.completed) return false;
      if (g.timeframe === 'daily' && g.text.startsWith('[D:')) {
        const match = g.text.match(/^\[D:(\d{4}-\d{2}-\d{2})\]/);
        if (match && match[1] < todayCtxKey) return true;
      }
      return false;
    });
  }, [goals, todayYearStr, todayMonthStr, todayDayStr]);

  const [isOverdueBannerDismissed, setIsOverdueBannerDismissed] = useState(false);

  // Rollover all overdue tasks to today
  const handleRolloverOverdueGoals = async () => {
    const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;
    for (const g of overdueIncompleteGoals) {
      const cleanText = g.text.replace(/^\[D:\d{4}-\d{2}-\d{2}\]\s*/, '');
      await onAddGoal(`[D:${todayCtxKey}] ${cleanText}`, g.timeframe);
      await onDeleteGoal(g.id);
    }
  };

  // Strip context tag from display text
  const getDisplayGoalText = (text: string): string => {
    return text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '');
  };

  // Submit Goal
  const handleAdd = (e: React.FormEvent, timeframe: TimeframeType) => {
    e.preventDefault();
    const val = inputs[timeframe].trim();
    if (!val) return;

    const ctxKey = getContextKey(timeframe);
    let tag = '';
    if (timeframe === 'daily') tag = `[D:${ctxKey}] `;
    if (timeframe === 'weekly') tag = `[W:${ctxKey}] `;
    if (timeframe === 'monthly') tag = `[M:${ctxKey}] `;
    if (timeframe === 'yearly') tag = `[Y:${ctxKey}] `;

    const est = estimates[timeframe] || undefined;
    onAddGoal(`${tag}${val}`, timeframe, est as TimeEstimate | undefined);
    setInputs(prev => ({ ...prev, [timeframe]: '' }));
    setEstimates(prev => ({ ...prev, [timeframe]: '' }));
  };

  // Calendar Add Goal
  const handleCalendarAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarInputText.trim()) return;

    const ctxKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    const tag = `[D:${ctxKey}] `;
    onAddGoal(`${tag}${calendarInputText.trim()}`, 'daily');
    setCalendarInputText('');
  };

  // Calculate Win Rates
  const stats = useMemo(() => {
    const timeframes: TimeframeType[] = ['daily', 'weekly', 'monthly', 'yearly'];
    const result: Record<TimeframeType, { total: number; completed: number; rate: number }> = {
      daily: { total: 0, completed: 0, rate: 0 },
      weekly: { total: 0, completed: 0, rate: 0 },
      monthly: { total: 0, completed: 0, rate: 0 },
      yearly: { total: 0, completed: 0, rate: 0 },
    };

    timeframes.forEach(tf => {
      const scopeGoals = filteredGoals.filter(g => g.timeframe === tf);
      const total = scopeGoals.length;
      const completed = scopeGoals.filter(g => g.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      result[tf] = { total, completed, rate };
    });

    return result;
  }, [filteredGoals]);

  // Calendar Grid Data Setup
  const calendarDays = useMemo(() => {
    const y = parseInt(selectedYear);
    const m = parseInt(selectedMonth);
    if (isNaN(y) || isNaN(m)) return { totalDays: 31, startDayOfWeek: 0, daysArray: [] };

    const totalDays = new Date(y, m, 0).getDate();
    const startDayOfWeek = new Date(y, m - 1, 1).getDay();
    const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;

    const daysArray = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dayStr = String(dayNum).padStart(2, '0');
      const ctxKey = `${selectedYear}-${selectedMonth}-${dayStr}`;

      const dayGoals = goals.filter(g => {
        if (g.timeframe !== 'daily') return false;
        if (g.text.startsWith(`[D:${ctxKey}]`)) return true;
        if (!g.text.startsWith('[D:') && ctxKey === todayCtxKey) return true;
        return false;
      });

      const total = dayGoals.length;
      const completed = dayGoals.filter(g => g.completed).length;

      return {
        dayNum,
        dayStr,
        ctxKey,
        dayGoals,
        total,
        completed,
        isToday: dayStr === todayDayStr && selectedMonth === todayMonthStr && selectedYear === todayYearStr,
        isSelected: dayStr === selectedDay
      };
    });

    return { totalDays, startDayOfWeek, daysArray };
  }, [selectedYear, selectedMonth, goals, todayDayStr, todayMonthStr, todayYearStr, selectedDay]);

  // Calendar Drag and Drop State (Notion Style)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);

  // Quick inline add state per day cell
  const [quickAddDayKey, setQuickAddDayKey] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState('');

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDateKey !== dateKey) {
      setDragOverDateKey(dateKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, dateKey: string) => {
    if (dragOverDateKey === dateKey) {
      setDragOverDateKey(null);
    }
  };

  const handleDropOnDay = (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault();
    setDragOverDateKey(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;

    const targetGoal = goals.find(g => g.id === taskId);
    if (!targetGoal) return;

    const cleanText = getDisplayGoalText(targetGoal.text);
    const updatedText = `[D:${targetDateKey}] ${cleanText}`;

    if (onUpdateGoal) {
      onUpdateGoal({
        ...targetGoal,
        text: updatedText,
        timeframe: 'daily'
      });
    } else if (onEditGoal) {
      onEditGoal(targetGoal.id, updatedText);
    }
  };

  const handlePrevMonth = () => {
    let m = parseInt(selectedMonth) - 1;
    let y = parseInt(selectedYear);
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  const handleNextMonth = () => {
    let m = parseInt(selectedMonth) + 1;
    let y = parseInt(selectedYear);
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  const handleGoToToday = () => {
    setSelectedYear(todayYearStr);
    setSelectedMonth(todayMonthStr);
    setSelectedDay(todayDayStr);
    setSelectedWeek(todayWeekStr);
  };

  // Database Columns Definition (Today, This Week, This Month, This Year)
  const DATABASE_COLUMNS: Array<{
    id: TimeframeType;
    label: string;
    sublabel: string;
    icon: any;
    color: string;
    bgAccent: string;
    borderAccent: string;
    progressBar: string;
  }> = [
    {
      id: 'daily',
      label: 'Today',
      sublabel: 'Daily Priorities',
      icon: Sun,
      color: 'text-emerald-400',
      bgAccent: 'bg-emerald-500/10',
      borderAccent: 'border-emerald-500/30',
      progressBar: 'bg-emerald-400'
    },
    {
      id: 'weekly',
      label: 'This Week',
      sublabel: 'Weekly Sprint',
      icon: Calendar,
      color: 'text-sky-400',
      bgAccent: 'bg-sky-500/10',
      borderAccent: 'border-sky-500/30',
      progressBar: 'bg-sky-400'
    },
    {
      id: 'monthly',
      label: 'This Month',
      sublabel: 'Monthly Objectives',
      icon: Target,
      color: 'text-purple-400',
      bgAccent: 'bg-purple-500/10',
      borderAccent: 'border-purple-500/30',
      progressBar: 'bg-purple-400'
    },
    {
      id: 'yearly',
      label: 'This Year',
      sublabel: 'Annual Vision',
      icon: Trophy,
      color: 'text-amber-400',
      bgAccent: 'bg-amber-500/10',
      borderAccent: 'border-amber-500/30',
      progressBar: 'bg-amber-400'
    }
  ];

  const handleDbDragStart = (e: React.DragEvent, goalId: string) => {
    e.dataTransfer.setData('text/plain', goalId);
    e.dataTransfer.effectAllowed = 'move';
    setDbDraggedGoalId(goalId);
  };

  const handleDbDragOver = (e: React.DragEvent, colId: TimeframeType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dbDragOverColumn !== colId) {
      setDbDragOverColumn(colId);
    }
  };

  const handleDbDragLeave = (e: React.DragEvent, colId: TimeframeType) => {
    if (dbDragOverColumn === colId) {
      setDbDragOverColumn(null);
    }
  };

  const handleDbDropOnColumn = (e: React.DragEvent, targetTimeframe: TimeframeType) => {
    e.preventDefault();
    setDbDragOverColumn(null);
    const goalId = e.dataTransfer.getData('text/plain') || dbDraggedGoalId;
    setDbDraggedGoalId(null);
    if (!goalId) return;

    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;

    const cleanText = getDisplayGoalText(targetGoal.text);
    let tag = '';
    if (targetTimeframe === 'daily') tag = `[D:${todayYearStr}-${todayMonthStr}-${todayDayStr}] `;
    else if (targetTimeframe === 'weekly') tag = `[W:${todayYearStr}-${todayMonthStr}-${todayWeekStr}] `;
    else if (targetTimeframe === 'monthly') tag = `[M:${todayYearStr}-${todayMonthStr}] `;
    else if (targetTimeframe === 'yearly') tag = `[Y:${todayYearStr}] `;

    const updatedGoal: GoalTodo = {
      ...targetGoal,
      text: `${tag}${cleanText}`,
      timeframe: targetTimeframe
    };

    if (onUpdateGoal) {
      onUpdateGoal(updatedGoal);
    } else if (onEditGoal) {
      onEditGoal(targetGoal.id, updatedGoal.text);
    }
  };

  const handleDbQuickAdd = (e: React.FormEvent, timeframe: TimeframeType) => {
    e.preventDefault();
    const text = (dbQuickAddInputs[timeframe] || '').trim();
    if (!text) return;

    let tag = '';
    if (timeframe === 'daily') tag = `[D:${todayYearStr}-${todayMonthStr}-${todayDayStr}] `;
    else if (timeframe === 'weekly') tag = `[W:${todayYearStr}-${todayMonthStr}-${todayWeekStr}] `;
    else if (timeframe === 'monthly') tag = `[M:${todayYearStr}-${todayMonthStr}] `;
    else if (timeframe === 'yearly') tag = `[Y:${todayYearStr}] `;

    const est = dbQuickAddEstimates[timeframe] || undefined;
    onAddGoal(`${tag}${text}`, timeframe, est as TimeEstimate | undefined);

    setDbQuickAddInputs(prev => ({ ...prev, [timeframe]: '' }));
    setDbQuickAddEstimates(prev => ({ ...prev, [timeframe]: '' }));
  };

  const renderColumn = (
    timeframe: TimeframeType, 
    label: string, 
    accentClass: string, 
    glowClass: string,
    barColor: string,
    activeContextDisplay: string
  ) => {
    const list = filteredGoals.filter(g => g.timeframe === timeframe);
    const { rate } = stats[timeframe];
    const isThisDailyAndToday = timeframe === 'daily' && isTodayActive;

    return (
      <div className={`flex flex-col justify-between p-6 md:p-7 min-h-[460px] w-full border transition-all duration-300 glass-panel-true ${
        isThisDailyAndToday ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : ''
      }`}>
        
        <div>
          {/* Column Header */}
          <div className="flex justify-between items-baseline mb-3">
            <h3 className="text-base font-bold tracking-tight text-white flex items-baseline gap-1.5 font-sans">
              <span>{label} Tasks</span>
              {isThisDailyAndToday && (
                <span className="ml-1.5 px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 font-medium">Today</span>
              )}
            </h3>
            <span className={`text-xs font-mono font-bold ${isThisDailyAndToday ? 'text-emerald-400' : 'text-[#9496a1]'}`}>
              {rate}% done
            </span>
          </div>

          {/* Dynamic Context Tag */}
          <div className="text-xs text-[#9496a1] mb-2 flex items-center gap-1.5 font-normal">
            <CalendarIcon className="w-3.5 h-3.5 text-[#1591DC]" />
            <span>{activeContextDisplay}</span>
          </div>

          {timeframe === 'weekly' && (
            <div className="text-[10px] text-zinc-400 font-mono mb-4 uppercase tracking-wider">
              {weekRangeStr}
            </div>
          )}

          {/* Progress Bar Line */}
          <div className="h-1 w-full bg-black/40 rounded-full mb-6 overflow-hidden border border-white/10">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
              style={{ width: `${rate}%` }}
            />
          </div>

          {/* Quick Add Form */}
          <form onSubmit={(e) => handleAdd(e, timeframe)} className="mb-6 space-y-2 w-full">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputs[timeframe]}
                onChange={(e) => setInputs(prev => ({ ...prev, [timeframe]: e.target.value }))}
                placeholder={`Add task for ${label.toLowerCase()}...`}
                className="w-full glass-input-true px-3 py-2 text-xs text-white placeholder-zinc-500 font-sans rounded-xl focus:outline-none"
              />
              <button 
                type="submit"
                className="p-2 btn-primary-cyan text-white transition-all flex-shrink-0 rounded-xl"
                title="Add Task"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Clean Time Estimate Pill Selector */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-[#9496a1] font-sans font-medium mr-1">Time:</span>
              {TIME_ESTIMATES.map(({ value, label: lbl }) => {
                const isSelected = estimates[timeframe] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEstimates(prev => ({ ...prev, [timeframe]: isSelected ? '' : value }))}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium transition-all ${
                      isSelected
                        ? 'bg-[#1591DC] text-white font-semibold shadow-sm'
                        : 'bg-white/[0.03] border border-white/[0.08] text-[#9496a1] hover:text-white hover:border-white/20'
                    }`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </form>

          {/* To-Do Items List */}
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {list.length === 0 ? (
              <div className="text-xs text-[#9496a1] py-8 text-center glass-card-true font-medium rounded-xl">
                No tasks set
              </div>
            ) : (
              list.map(g => {
                const estMeta = g.timeEstimate ? TIME_ESTIMATES.find(e => e.value === g.timeEstimate) : null;
                const isTimerRunning = activeTimerId === g.id;
                const secs = timerSeconds[g.id] || 0;
                const mins = Math.floor(secs / 60);
                const remainingSecs = secs % 60;
                const timeStr = `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
                const isRec = recurringTasks[g.id] || g.isRecurring;

                return (
                  <div 
                    key={g.id} 
                    className={`group flex items-start gap-2.5 p-3 glass-card-true transition-all rounded-xl relative ${
                      isTimerRunning ? 'border-amber-500/50 bg-amber-500/10' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleGoal(g.id, !g.completed)}
                      className="mt-0.5 text-[#9496a1] hover:text-white transition-colors focus:outline-none shrink-0"
                    >
                      {g.completed ? (
                        <CheckSquare className={`w-4 h-4 ${accentClass}`} />
                      ) : (
                        <Square className="w-4 h-4 text-[#9496a1]" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0 pr-1">
                      {editingGoalId === g.id ? (
                        <div className="flex items-center gap-1 my-0.5">
                          <input
                            type="text"
                            value={editingGoalText}
                            onChange={(e) => setEditingGoalText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditGoal(g.id);
                              if (e.key === 'Escape') setEditingGoalId(null);
                            }}
                            className="w-full glass-input-true px-2 py-1 text-xs text-white rounded"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditGoal(g.id)}
                            className="p-1 text-emerald-400 text-xs font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGoalId(null)}
                            className="p-1 text-[#9496a1] hover:text-white text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEditGoal(g)}
                          className={`text-xs break-words leading-relaxed transition-all duration-300 font-medium block cursor-pointer select-text ${
                            g.completed ? 'text-[#9496a1] line-through' : 'text-[#ededf3]'
                          }`}
                          title="Double-click to edit goal"
                        >
                          {getDisplayGoalText(g.text)}
                        </span>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {/* Time Estimate Badge */}
                        {estMeta && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#9496a1] bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                            <Clock className="w-2.5 h-2.5 text-[#1591DC]" />
                            <span>{estMeta.label}</span>
                          </span>
                        )}
                        {/* B2 — Live Timer Badge */}
                        {secs > 0 && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-medium ${isTimerRunning ? 'text-amber-400 animate-pulse' : 'text-[#9496a1]'}`}>
                            <Clock className="w-3 h-3" /> {timeStr}
                          </span>
                        )}
                        {/* C2 — Recurring Badge */}
                        {isRec && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-sans font-medium text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded">
                            Auto-Reset
                          </span>
                        )}
                        {/* Sub-tasks Badge */}
                        {g.subTasks && g.subTasks.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-sans font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            <ListChecks className="w-3 h-3" /> {g.subTasks.filter(s => s.completed).length}/{g.subTasks.length}
                          </span>
                        )}
                        {/* Notes Indicator Badge */}
                        {g.notes && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-sans font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                            <FileText className="w-3 h-3" /> Note
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Subtle on hover, never squishing text */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Notion Side Panel Open Button */}
                      <button
                        type="button"
                        onClick={() => setActivePanelGoalId(g.id)}
                        className="p-1 rounded text-[#9496a1] hover:text-[#1591DC] transition-colors"
                        title="Open Details & Sub-tasks"
                      >
                        <PanelRightOpen className="w-3.5 h-3.5" />
                      </button>
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEditGoal(g)}
                        className="p-1 rounded text-[#9496a1] hover:text-white transition-colors"
                        title="Edit Task"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Stopwatch Button */}
                      <button
                        type="button"
                        onClick={() => setActiveTimerId(isTimerRunning ? null : g.id)}
                        className={`p-1 rounded transition-colors ${
                          isTimerRunning 
                            ? 'text-amber-400 bg-amber-500/20' 
                            : 'text-[#9496a1] hover:text-amber-300'
                        }`}
                        title={isTimerRunning ? 'Pause Stopwatch' : 'Start Timer'}
                      >
                        {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(g.id)}
                        className="text-[#9496a1] hover:text-rose-400 transition-colors focus:outline-none p-1"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="todo-hub" className="p-6 md:p-8 glass-panel-true mb-12 border border-white/15 shadow-2xl">
      
      {/* Overdue / Incomplete Target Reminder Banner */}
      {!isOverdueBannerDismissed && overdueIncompleteGoals.length > 0 && (
        <div className="mb-6 p-4 glass-card-true border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-500/5 animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-amber-300">
                Incomplete tasks reminder ({overdueIncompleteGoals.length} pending)
              </h4>
              <p className="text-[#9496a1] text-xs mt-0.5">
                You have {overdueIncompleteGoals.length} incomplete daily task{overdueIncompleteGoals.length > 1 ? 's' : ''} from previous days.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRolloverOverdueGoals}
              className="px-3 py-1.5 glass-button-true text-amber-300 hover:text-amber-200 text-xs font-medium flex items-center gap-1.5 rounded-full"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rollover to today</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOverdueBannerDismissed(true)}
              className="p-1.5 text-[#9496a1] hover:text-white transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Module Title & Mode Switcher Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans">
              Tasks & Roadmap
            </h2>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-[#9496a1] hover:text-white hover:border-[#1591DC]/40 transition-all cursor-pointer"
                title="Open Executive Dashboard Overview"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#1591DC]" />
                <span>Executive Dashboard</span>
              </button>
            )}
          </div>
          <p className="text-xs text-[#9496a1] mt-0.5">
            Scope: Daily • Weekly • Monthly • Yearly
          </p>
        </div>

        {/* View Mode Switcher + Context Control */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* View Mode Toggle Switch */}
          <div className="flex items-center glass-pill-true p-1">
            <button
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-full ${
                viewMode === 'columns'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-full ${
                viewMode === 'table'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Database</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-full ${
                viewMode === 'calendar'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('review')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-full ${
                viewMode === 'review'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#1591DC]" />
              <span>Review Protocol</span>
            </button>
          </div>

          {/* Date Context Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 glass-pill-true p-1.5">
            {/* Year */}
            <div className="flex items-center gap-1 glass-card-true px-2.5 py-1">
              <span className="text-[10px] text-[#9496a1] font-medium">Year:</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              >
                {['2025', '2026', '2027', '2028'].map(y => <option key={y} value={y} className="bg-[#12141a] text-white">{y}</option>)}
              </select>
            </div>

            {/* Month */}
            <div className="flex items-center gap-1 glass-card-true px-2.5 py-1">
              <span className="text-[10px] text-[#9496a1] font-medium">Month:</span>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m} className="bg-[#12141a] text-white">{m}</option>
                ))}
              </select>
            </div>

            {/* Week */}
            <div className="flex items-center gap-1 glass-card-true px-2.5 py-1">
              <span className="text-[10px] text-[#9496a1] font-medium">Week:</span>
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              >
                {['W1', 'W2', 'W3', 'W4', 'W5'].map(w => <option key={w} value={w} className="bg-[#12141a] text-white">{w.replace('W', 'Week ')}</option>)}
              </select>
            </div>

            {/* Day */}
            <div className={`flex items-center gap-1 glass-card-true px-2.5 py-1 transition-colors ${
              isTodayActive ? 'bg-emerald-500/20 border-emerald-400/50' : ''
            }`}>
              <span className="text-[10px] text-[#9496a1] font-medium">Day:</span>
              <select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              >
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                  <option key={d} value={d} className="bg-[#12141a] text-white">{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Mode Rendering */}
      {viewMode === 'columns' ? (
        <>
          {/* Columns Visibility Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-3 glass-card-true">
            <span className="text-xs text-[#9496a1] font-medium">
              Visible columns:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleColumnVisibility('daily')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  visibleColumns.daily 
                    ? 'bg-white/10 text-white font-medium border border-white/20' 
                    : 'opacity-40 text-[#9496a1]'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => toggleColumnVisibility('weekly')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  visibleColumns.weekly 
                    ? 'bg-white/10 text-white font-medium border border-white/20' 
                    : 'opacity-40 text-[#9496a1]'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => toggleColumnVisibility('monthly')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  visibleColumns.monthly 
                    ? 'bg-white/10 text-white font-medium border border-white/20' 
                    : 'opacity-40 text-[#9496a1]'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => toggleColumnVisibility('yearly')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  visibleColumns.yearly 
                    ? 'bg-white/10 text-white font-medium border border-white/20' 
                    : 'opacity-40 text-[#9496a1]'
                }`}
              >
                Year
              </button>
            </div>
          </div>

          {/* Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleColumns.daily && renderColumn('daily', 'Day', 'text-sky-300', 'glow-sky', 'bg-sky-400', `${selectedYear}-${selectedMonth}-${selectedDay}`)}
            {visibleColumns.weekly && renderColumn('weekly', 'Week', 'text-purple-300', 'glow-purple', 'bg-purple-400', `${selectedYear}-${selectedMonth}-${selectedWeek}`)}
            {visibleColumns.monthly && renderColumn('monthly', 'Month', 'text-amber-300', 'glow-amber', 'bg-amber-400', `${selectedYear}-${selectedMonth}`)}
            {visibleColumns.yearly && renderColumn('yearly', 'Year', 'text-emerald-300', 'glow-emerald', 'bg-emerald-400', `${selectedYear}`)}
          </div>
        </>
      ) : viewMode === 'table' ? (
        /* Notion Database View Mode: Multi-column Board (Today, This Week, This Month, This Year) + Table Toggle */
        <div className="space-y-6 animate-fadeIn font-sans">
          
          {/* Database Master Header & Controls */}
          <div className="glass-panel-true p-4 md:p-5 rounded-2xl border border-white/15 space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              
              {/* Left: Title & Quick Stats */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#1591DC]/10 border border-[#1591DC]/20 flex items-center justify-center text-[#1591DC]">
                  <Kanban className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Tasks Database
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] text-[#ededf3] tabular-nums border border-white/[0.08]">
                      {goals.length} total
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#9496a1]">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="tabular-nums">{goals.filter(g => !g.completed).length} active</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <span className="tabular-nums">{goals.filter(g => g.completed).length} done</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Search, Filters & View Toggle */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                
                {/* Search Input */}
                <div className="relative flex-1 sm:w-56 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-[#9496a1] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={databaseSearchQuery}
                    onChange={(e) => setDatabaseSearchQuery(e.target.value)}
                    placeholder="Search database..."
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#1591DC] pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                  {databaseSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDatabaseSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
                  {(['all', 'active', 'completed'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDatabaseStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                        databaseStatusFilter === st
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-[#9496a1] hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-1 bg-white/[0.03] px-2.5 py-1 rounded-xl border border-white/[0.06]">
                  <Filter className="w-3 h-3 text-[#9496a1]" />
                  <select
                    value={databasePriorityFilter}
                    onChange={(e) => setDatabasePriorityFilter(e.target.value as any)}
                    className="bg-transparent text-xs text-[#ededf3] focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="all" className="bg-[#12141a] text-white">All Priorities</option>
                    <option value="The One Thing" className="bg-[#12141a] text-amber-300">★ The One Thing</option>
                    <option value="High" className="bg-[#12141a] text-rose-300">High Priority</option>
                    <option value="Medium" className="bg-[#12141a] text-sky-300">Medium Priority</option>
                    <option value="Low" className="bg-[#12141a] text-zinc-400">Low Priority</option>
                  </select>
                </div>

                {/* SubView Mode Toggle: Board Columns vs Spreadsheet Table */}
                <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setDatabaseSubView('board')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      databaseSubView === 'board'
                        ? 'bg-[#1591DC] text-white font-semibold shadow-sm'
                        : 'text-[#9496a1] hover:text-white'
                    }`}
                    title="Columns Board View"
                  >
                    <Kanban className="w-3 h-3" />
                    <span>Columns</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatabaseSubView('table')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      databaseSubView === 'table'
                        ? 'bg-[#1591DC] text-white font-semibold shadow-sm'
                        : 'text-[#9496a1] hover:text-white'
                    }`}
                    title="Table View"
                  >
                    <Table className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Database Board View: 4 Columns (Today, This Week, This Month, This Year) */}
          {databaseSubView === 'board' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {DATABASE_COLUMNS.map(col => {
                const colGoals = filteredDatabaseGoals.filter(g => g.timeframe === col.id);
                const sortedColGoals = [...colGoals].sort((a, b) => {
                  if (a.completed !== b.completed) return a.completed ? 1 : -1;
                  const prioRank: Record<string, number> = { 'The One Thing': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'As and When': 4 };
                  const rankA = prioRank[a.priority || 'Medium'] ?? 2;
                  const rankB = prioRank[b.priority || 'Medium'] ?? 2;
                  return rankA - rankB;
                });

                const totalCount = colGoals.length;
                const completedCount = colGoals.filter(g => g.completed).length;
                const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const isDragOver = dbDragOverColumn === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDbDragOver(e, col.id)}
                    onDragLeave={(e) => handleDbDragLeave(e, col.id)}
                    onDrop={(e) => handleDbDropOnColumn(e, col.id)}
                    className={`flex flex-col rounded-2xl transition-all duration-200 border ${
                      isDragOver 
                        ? 'border-[#1591DC] bg-[#1591DC]/[0.05] shadow-[0_0_25px_rgba(21,145,220,0.15)]' 
                        : 'border-white/[0.08] bg-[#0e1015] hover:border-white/[0.14]'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="p-4 border-b border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg ${col.bgAccent} border ${col.borderAccent} flex items-center justify-center`}>
                            <col.icon className={`w-4 h-4 ${col.color}`} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                              <span>{col.label}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#ededf3] tabular-nums font-semibold">
                                {totalCount}
                              </span>
                            </h4>
                            <p className="text-[10px] text-[#9496a1] font-normal">{col.sublabel}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-xs font-bold tabular-nums ${col.color}`}>
                            {rate}%
                          </span>
                          <span className="block text-[9px] text-[#9496a1] tabular-nums">
                            {completedCount}/{totalCount}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${col.progressBar}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>

                      {/* Quick Add Form */}
                      <form onSubmit={(e) => handleDbQuickAdd(e, col.id)} className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={dbQuickAddInputs[col.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDbQuickAddInputs(prev => ({ ...prev, [col.id]: val }));
                            }}
                            placeholder={`+ Add task for ${col.label.toLowerCase()}...`}
                            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#1591DC] px-3 py-1.5 text-xs text-white placeholder-zinc-500 rounded-xl focus:outline-none transition-colors"
                          />
                          <button
                            type="submit"
                            className="p-1.5 btn-primary-cyan text-white rounded-xl shrink-0 transition-transform active:scale-95 cursor-pointer"
                            title="Add task"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick Time Estimate Badges */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                          {(['15m', '30m', '1h', '2h', 'half-day'] as TimeEstimate[]).map((est) => {
                            const isSelected = dbQuickAddEstimates[col.id] === est;
                            const lbl = est === 'half-day' ? '4h' : est;
                            return (
                              <button
                                key={est}
                                type="button"
                                onClick={() => {
                                  setDbQuickAddEstimates(prev => ({
                                    ...prev,
                                    [col.id]: isSelected ? '' : est
                                  }));
                                }}
                                className={`px-1.5 py-0.5 rounded-full text-[9px] tabular-nums font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#1591DC] text-white font-bold shadow-sm'
                                    : 'bg-white/[0.02] border border-white/[0.06] text-[#9496a1] hover:text-white'
                                }`}
                              >
                                {lbl}
                              </button>
                            );
                          })}
                        </div>
                      </form>
                    </div>

                    {/* Task Cards Container */}
                    <div className="p-3 flex-1 overflow-y-auto max-h-[580px] space-y-2">
                      {sortedColGoals.length === 0 ? (
                        <div className="py-12 px-3 text-center rounded-xl border border-dashed border-white/[0.08] text-[#9496a1] space-y-1">
                          <p className="text-xs font-medium">No tasks in {col.label}</p>
                          <p className="text-[10px] text-zinc-500">Drop tasks here or add above</p>
                        </div>
                      ) : (
                        sortedColGoals.map(g => {
                          const cleanText = getDisplayGoalText(g.text);
                          const subCount = g.subTasks ? g.subTasks.length : 0;
                          const subDone = g.subTasks ? g.subTasks.filter(s => s.completed).length : 0;
                          const estMeta = g.timeEstimate ? TIME_ESTIMATES.find(e => e.value === g.timeEstimate) : null;
                          const prio = g.priority || 'Medium';

                          return (
                            <div
                              key={g.id}
                              draggable={true}
                              onDragStart={(e) => handleDbDragStart(e, g.id)}
                              onClick={() => setActivePanelGoalId(g.id)}
                              className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing group select-none ${
                                g.completed
                                  ? 'bg-white/[0.02] border-white/[0.04] opacity-50 hover:opacity-85'
                                  : 'bg-[#12141a] border-white/[0.08] hover:border-white/[0.18] hover:shadow-md'
                              }`}
                            >
                              {/* Card Main: Checkbox + Title + Hover Actions */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggle(g.id, !g.completed);
                                    }}
                                    className={`mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer ${
                                      g.completed ? 'text-emerald-400' : 'text-[#9496a1] hover:text-white'
                                    }`}
                                  >
                                    {g.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                  </button>

                                  <div className="min-w-0 flex-1">
                                    <span className={`text-xs font-medium block leading-snug break-words ${
                                      g.completed ? 'line-through text-[#9496a1]' : 'text-white'
                                    }`}>
                                      {cleanText}
                                    </span>
                                  </div>
                                </div>

                                {/* Hover Action Buttons */}
                                <div 
                                  className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setActivePanelGoalId(g.id)}
                                    className="p-1 text-[#9496a1] hover:text-white hover:bg-white/[0.08] rounded transition-colors cursor-pointer"
                                    title="Open Details & Sub-tasks"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(g.id)}
                                    className="p-1 text-[#9496a1] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                    title="Delete task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Card Badges Row */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-white/[0.04] text-[10px]">
                                {/* Priority Badge */}
                                {prio === 'The One Thing' && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5" />
                                    <span>The One Thing</span>
                                  </span>
                                )}
                                {prio === 'High' && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium">
                                    High
                                  </span>
                                )}
                                {prio === 'Medium' && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                                    Medium
                                  </span>
                                )}
                                {prio === 'Low' && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06] font-medium">
                                    Low
                                  </span>
                                )}

                                {/* Time Estimate Badge */}
                                {estMeta && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#9496a1] tabular-nums font-medium flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-[#9496a1]" />
                                    <span>{estMeta.label}</span>
                                  </span>
                                )}

                                {/* Subtask Progress */}
                                {subCount > 0 && (
                                  <span className={`px-1.5 py-0.5 rounded-full border flex items-center gap-1 font-medium tabular-nums ${
                                    subDone === subCount 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                                      : 'bg-white/[0.04] text-[#9496a1] border-white/[0.08]'
                                  }`}>
                                    <ListChecks className="w-2.5 h-2.5" />
                                    <span>{subDone}/{subCount}</span>
                                  </span>
                                )}

                                {/* Notes indicator */}
                                {g.notes && (
                                  <span className="text-[#9496a1] flex items-center gap-0.5 ml-auto" title="Has notes">
                                    <FileText className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Database Table View Mode */
            <div className="glass-panel-true border border-white/15 p-4 rounded-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-[#1591DC]" />
                  <span className="text-sm font-semibold text-white">
                    Spreadsheet Table ({filteredDatabaseGoals.length})
                  </span>
                </div>
                
                {/* Timeframe Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 glass-pill-true p-1">
                  {[
                    { id: 'all', label: `All (${goals.length})` },
                    { id: 'daily', label: `Daily (${goals.filter(g => g.timeframe === 'daily').length})` },
                    { id: 'weekly', label: `Weekly (${goals.filter(g => g.timeframe === 'weekly').length})` },
                    { id: 'monthly', label: `Monthly (${goals.filter(g => g.timeframe === 'monthly').length})` },
                    { id: 'yearly', label: `Yearly (${goals.filter(g => g.timeframe === 'yearly').length})` }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTableTimeframeFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        tableTimeframeFilter === f.id
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-[#9496a1] hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px] font-sans">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-xs text-[#9496a1] bg-white/[0.02]">
                      <th className="py-2.5 px-3 w-16 text-center font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">Task Name</th>
                      <th className="py-2.5 px-3 w-28 font-medium">Timeframe</th>
                      <th className="py-2.5 px-3 w-28 font-medium">Sub-tasks</th>
                      <th className="py-2.5 px-3 w-24 font-medium">Time Est</th>
                      <th className="py-2.5 px-3 w-32 font-medium">Priority</th>
                      <th className="py-2.5 px-3 w-32 font-medium">Context Tag</th>
                      <th className="py-2.5 px-3 w-32 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs text-[#ededf3]">
                    {filteredDatabaseGoals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-[#9496a1] text-xs">
                          No tasks in active view. Add a new task above.
                        </td>
                      </tr>
                    ) : (
                      filteredDatabaseGoals.map(g => {
                        const subCount = g.subTasks ? g.subTasks.length : 0;
                        const subDone = g.subTasks ? g.subTasks.filter(s => s.completed).length : 0;
                        const estMeta = g.timeEstimate ? TIME_ESTIMATES.find(e => e.value === g.timeEstimate) : null;
                        const prio = g.priority || 'Medium';
                        
                        const prioColor = prio === 'The One Thing' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : prio === 'High' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : prio === 'Medium' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700';

                        return (
                          <tr 
                            key={g.id} 
                            onClick={() => setActivePanelGoalId(g.id)}
                            className={`hover:bg-white/[0.03] transition-colors cursor-pointer group ${g.completed ? 'opacity-50' : ''}`}
                          >
                            <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleToggle(g.id, !g.completed)}
                                className={`transition-transform active:scale-90 cursor-pointer ${g.completed ? 'text-emerald-400' : 'text-[#9496a1] hover:text-white'}`}
                              >
                                {g.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>
                            </td>

                            <td className="py-3 px-3 font-medium text-white">
                              <div className="flex items-center gap-2">
                                <span className={g.completed ? 'line-through text-[#9496a1]' : ''}>
                                  {g.text}
                                </span>
                                {g.timeEstimate && estMeta && (
                                  <span className="text-[10px] text-[#9496a1] flex items-center gap-1 tabular-nums">
                                    <Clock className="w-3 h-3 text-[#9496a1]" />
                                    {estMeta.label}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-[#ededf3]">
                                {g.timeframe}
                              </span>
                            </td>

                            <td className="py-3 px-3 tabular-nums text-[11px] text-[#9496a1]">
                              {subCount > 0 ? (
                                <span className={`px-2 py-0.5 rounded-full ${subDone === subCount ? 'text-emerald-400 bg-emerald-500/10' : 'text-[#9496a1]'}`}>
                                  {subDone}/{subCount}
                                </span>
                              ) : (
                                <span className="opacity-40">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3 tabular-nums text-[11px] text-[#9496a1]">
                              {estMeta ? estMeta.label : '-'}
                            </td>

                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${prioColor}`}>
                                {prio}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-[#9496a1] text-xs">
                              {g.contextTag || '-'}
                            </td>

                            <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActivePanelGoalId(g.id)}
                                  className="p-1 text-[#9496a1] hover:text-white glass-button-true rounded cursor-pointer"
                                  title="Task Details & Sub-tasks"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(g.id)}
                                  className="p-1 text-[#9496a1] hover:text-rose-400 glass-button-true rounded cursor-pointer"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      ) : viewMode === 'calendar' ? (
        /* Notion-Style Drag-and-Drop Calendar View Mode */
        <div className="space-y-4 animate-fadeIn font-sans">
          {/* Calendar Navigation & Quick Add Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 glass-card-true rounded-2xl border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-[#9496a1] hover:text-white hover:bg-white/[0.08] transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-white px-2 min-w-[140px] text-center font-sans">
                  {monthNameStr} {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-[#9496a1] hover:text-white hover:bg-white/[0.08] transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleGoToToday}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-[#ededf3] border border-white/[0.08] hover:border-white/20 transition-all shadow-sm"
              >
                Today
              </button>

              <span className="hidden lg:inline-flex text-[11px] text-[#9496a1] items-center gap-1">
                <span>Drag tasks between days to reschedule</span>
              </span>
            </div>

            {/* Quick Add Bar */}
            <form onSubmit={handleCalendarAdd} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={calendarInputText}
                onChange={(e) => setCalendarInputText(e.target.value)}
                placeholder={`Add task for ${monthNameStr} ${selectedDay}...`}
                className="w-full md:w-64 glass-input-true px-3 py-2 text-xs text-white rounded-xl focus:outline-none placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="px-4 py-2 btn-primary-cyan text-xs font-semibold flex items-center gap-1 shrink-0 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* 7-Day Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-[#9496a1] tracking-wider">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Notion-Style Grid with Vertically Stacked Cards */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: calendarDays.startDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[140px] md:min-h-[160px] rounded-2xl bg-white/[0.01] border border-white/[0.03]"
              />
            ))}

            {calendarDays.daysArray.map(day => {
              const isDragTarget = dragOverDateKey === day.ctxKey;
              const isCurrentSelected = day.dayStr === selectedDay;

              return (
                <div
                  key={day.dayStr}
                  onDragOver={(e) => handleDragOver(e, day.ctxKey)}
                  onDragLeave={(e) => handleDragLeave(e, day.ctxKey)}
                  onDrop={(e) => handleDropOnDay(e, day.ctxKey)}
                  onClick={() => setSelectedDay(day.dayStr)}
                  className={`min-h-[140px] md:min-h-[160px] p-2 md:p-2.5 rounded-2xl border transition-all flex flex-col justify-between group/day relative ${
                    isDragTarget
                      ? 'bg-[#1591DC]/15 border-[#1591DC] ring-2 ring-[#1591DC]/50 shadow-[0_0_20px_rgba(21,145,220,0.25)]'
                      : day.isToday
                        ? 'bg-[#10141f] border-[#1591DC]/40 shadow-sm'
                        : isCurrentSelected
                          ? 'bg-white/[0.04] border-white/20'
                          : 'bg-[#0c0e14]/90 border-white/[0.06] hover:border-white/[0.14]'
                  }`}
                >
                  {/* Day Header Inside Cell */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center gap-1.5">
                      {day.isToday ? (
                        <span className="w-6 h-6 rounded-full bg-[#1591DC] text-white flex items-center justify-center font-mono font-bold text-xs shadow-md">
                          {day.dayNum}
                        </span>
                      ) : (
                        <span className={`font-mono text-xs font-semibold transition-colors ${
                          isCurrentSelected ? 'text-[#38bdf8]' : 'text-zinc-400 group-hover/day:text-white'
                        }`}>
                          {day.dayNum}
                        </span>
                      )}

                      {day.total > 0 && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                          day.completed === day.total
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/[0.06] text-[#9496a1]'
                        }`}>
                          {day.completed}/{day.total}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickAddDayKey(quickAddDayKey === day.ctxKey ? null : day.ctxKey);
                        setQuickAddText('');
                      }}
                      className="opacity-0 group-hover/day:opacity-100 p-1 rounded hover:bg-white/[0.08] text-[#9496a1] hover:text-white transition-all"
                      title="Add task to this day"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Vertically Stacked Cards Inside Cell */}
                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[160px] pr-0.5 custom-scrollbar">
                    {/* Inline Quick Add Input */}
                    {quickAddDayKey === day.ctxKey && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (quickAddText.trim()) {
                            onAddGoal(`[D:${day.ctxKey}] ${quickAddText.trim()}`, 'daily');
                            setQuickAddText('');
                            setQuickAddDayKey(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mb-1"
                      >
                        <input
                          autoFocus
                          type="text"
                          value={quickAddText}
                          onChange={(e) => setQuickAddText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setQuickAddDayKey(null);
                          }}
                          placeholder="Task title..."
                          className="w-full text-[11px] px-2 py-1 rounded-lg bg-black/60 border border-[#1591DC] text-white focus:outline-none placeholder:text-zinc-500"
                          onBlur={() => {
                            if (!quickAddText.trim()) setQuickAddDayKey(null);
                          }}
                        />
                      </form>
                    )}

                    {/* Draggable Task Cards */}
                    {day.dayGoals.map((g) => {
                      const isDragged = draggedTaskId === g.id;

                      return (
                        <div
                          key={g.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, g.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePanelGoalId(g.id);
                          }}
                          className={`group/card p-1.5 rounded-lg border text-left cursor-grab active:cursor-grabbing transition-all select-none flex flex-col gap-1 ${
                            isDragged
                              ? 'opacity-40 border-[#1591DC] bg-[#1591DC]/10 scale-95'
                              : g.completed
                                ? 'bg-emerald-500/[0.04] border-emerald-500/20 opacity-70 hover:opacity-100 hover:bg-emerald-500/[0.08]'
                                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/20 shadow-sm'
                          }`}
                          title="Click to view details, drag to move to another day"
                        >
                          <div className="flex items-start gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleGoal(g.id, !g.completed);
                              }}
                              className="mt-0.5 text-[#9496a1] hover:text-white transition-colors shrink-0"
                            >
                              {g.completed ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 group-hover/card:text-white" />
                              )}
                            </button>

                            <span
                              className={`text-[11px] font-medium leading-snug line-clamp-2 flex-1 ${
                                g.completed ? 'line-through text-[#9496a1]' : 'text-zinc-200'
                              }`}
                            >
                              {getDisplayGoalText(g.text)}
                            </span>

                            <GripVertical className="w-3 h-3 text-[#9496a1]/40 group-hover/card:text-[#9496a1] shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                          </div>

                          {/* Extra badges: Estimate & Subtasks */}
                          {(g.timeEstimate || (g.subTasks && g.subTasks.length > 0)) && (
                            <div className="flex items-center gap-1.5 pl-5">
                              {g.timeEstimate && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/[0.05] text-[#9496a1]">
                                  {g.timeEstimate}
                                </span>
                              )}
                              {g.subTasks && g.subTasks.length > 0 && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-0.5">
                                  <ListChecks className="w-2.5 h-2.5" />
                                  {g.subTasks.filter(s => s.completed).length}/{g.subTasks.length}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {day.dayGoals.length === 0 && quickAddDayKey !== day.ctxKey && (
                      <div className="flex-1 flex items-center justify-center min-h-[50px] opacity-0 group-hover/day:opacity-40 transition-opacity">
                        <span className="text-[10px] text-zinc-500 italic">Drop task here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'review' ? (
        /* Weekly & Monthly Review Protocol View Mode */
        <div className="space-y-6 animate-fadeIn font-sans">
          {/* Real Execution Progress Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {(() => {
              const dailyCount = goals.filter(g => g.timeframe === 'daily').length;
              const dailyDone = goals.filter(g => g.timeframe === 'daily' && g.completed).length;
              const weeklyCount = goals.filter(g => g.timeframe === 'weekly').length;
              const weeklyDone = goals.filter(g => g.timeframe === 'weekly' && g.completed).length;
              const monthlyCount = goals.filter(g => g.timeframe === 'monthly').length;
              const monthlyDone = goals.filter(g => g.timeframe === 'monthly' && g.completed).length;

              const metrics = [
                { label: 'Daily Tasks', done: dailyDone, total: dailyCount },
                { label: 'Weekly Goals', done: weeklyDone, total: weeklyCount },
                { label: 'Monthly Objectives', done: monthlyDone, total: monthlyCount },
              ];

              return metrics.map(s => {
                const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <div key={s.label} className="p-4 rounded-xl bg-[#0e1015] border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#9496a1]">{s.label}</span>
                      <span className="text-xs tabular-nums font-bold text-white">{pct}%</span>
                    </div>
                    <div className="text-xl font-bold tabular-nums text-white tracking-tight">
                      {s.done} <span className="text-xs font-normal text-[#9496a1]">/ {s.total} completed</span>
                    </div>
                    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1591DC] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Interactive Weekly & Monthly Review Protocol */}
          <div className="p-6 rounded-2xl bg-[#0e1015] border border-white/[0.06]">
            <WeeklyReviewProtocol
              goals={goals}
              onAddGoal={onAddGoal}
              isLightMode={isLightMode}
            />
          </div>
        </div>
      ) : null}

      {/* Notion Task Detail Side Panel Drawer Overlay */}
      {activePanelGoal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="flex-1" onClick={() => setActivePanelGoalId(null)} />

          <div className="w-full max-w-xl bg-[#0e1017] border-l border-white/[0.08] h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-2xl relative font-sans">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1591DC]" />
                  <span className="text-xs font-semibold text-white">
                    Task details & sub-tasks
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanelGoalId(null)}
                  className="p-1.5 rounded-full hover:bg-white/[0.06] text-[#9496a1] hover:text-white transition-colors"
                  title="Close Side Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task Title Input */}
              <div className="mb-6">
                <label className="text-xs text-[#9496a1] font-medium block mb-1.5">
                  Task title
                </label>
                <input
                  type="text"
                  value={getDisplayGoalText(activePanelGoal.text)}
                  onChange={(e) => {
                    const match = activePanelGoal.text.match(/^(\[[DWMY]:[^\]]+\]\s*)/);
                    const prefix = match ? match[1] : '';
                    handleUpdateProperty(activePanelGoal, 'text', prefix + e.target.value);
                  }}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#1591DC] px-3.5 py-2.5 text-base font-semibold text-white focus:outline-none rounded-xl transition-colors"
                  placeholder="Enter task title..."
                />
              </div>

              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8 p-4 glass-card-true rounded-xl">
                <div>
                  <span className="text-xs text-[#9496a1] font-medium block mb-1.5">Status</span>
                  <button
                    type="button"
                    onClick={() => onToggleGoal(activePanelGoal.id, !activePanelGoal.completed)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border transition-all ${
                      activePanelGoal.completed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/[0.04] text-[#ededf3] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    {activePanelGoal.completed ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-[#9496a1]" />}
                    <span>{activePanelGoal.completed ? 'Completed' : 'In progress'}</span>
                  </button>
                </div>

                <div>
                  <span className="text-xs text-[#9496a1] font-medium block mb-1.5">Timeframe</span>
                  <select
                    value={activePanelGoal.timeframe}
                    onChange={(e) => handleUpdateProperty(activePanelGoal, 'timeframe', e.target.value as TimeframeType)}
                    className="w-full bg-[#12141a] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-[#9496a1] font-medium block mb-1.5">Priority</span>
                  <select
                    value={activePanelGoal.priority || 'Medium'}
                    onChange={(e) => handleUpdateProperty(activePanelGoal, 'priority', e.target.value)}
                    className="w-full bg-[#12141a] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="The One Thing">🔥 The One Thing</option>
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🔵 Medium Priority</option>
                    <option value="Low">⚪ Low Priority</option>
                    <option value="As and When">⏳ As and When</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-[#9496a1] font-medium block mb-1.5">Estimated time</span>
                  <select
                    value={activePanelGoal.timeEstimate || ''}
                    onChange={(e) => handleUpdateProperty(activePanelGoal, 'timeEstimate', e.target.value || undefined)}
                    className="w-full bg-[#12141a] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="">No estimate</option>
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="2h">2 Hours</option>
                    <option value="half-day">Half Day</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-[#9496a1] font-medium block mb-1.5">Context tag</span>
                  <input
                    type="text"
                    value={activePanelGoal.contextTag || ''}
                    onChange={(e) => handleUpdateProperty(activePanelGoal, 'contextTag', e.target.value)}
                    placeholder="e.g. Design, Video..."
                    className="w-full bg-[#12141a] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-xs text-[#9496a1] font-medium block mb-1.5">Deadline</span>
                  <input
                    type="date"
                    value={activePanelGoal.deadline || ''}
                    onChange={(e) => handleUpdateProperty(activePanelGoal, 'deadline', e.target.value)}
                    className="w-full bg-[#12141a] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Sub-tasks Module */}
              <div className="mb-8 p-5 glass-panel-true border border-white/[0.08] rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-white">
                      Sub-tasks ({(activePanelGoal.subTasks || []).filter(s => s.completed).length}/{(activePanelGoal.subTasks || []).length})
                    </h4>
                  </div>
                  {(activePanelGoal.subTasks || []).length > 0 && (
                    <span className="text-xs font-medium text-emerald-400 font-mono">
                      {Math.round(((activePanelGoal.subTasks || []).filter(s => s.completed).length / (activePanelGoal.subTasks || []).length) * 100)}% done
                    </span>
                  )}
                </div>

                {(activePanelGoal.subTasks || []).length > 0 && (
                  <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-500" 
                      style={{ width: `${Math.round(((activePanelGoal.subTasks || []).filter(s => s.completed).length / (activePanelGoal.subTasks || []).length) * 100)}%` }} 
                    />
                  </div>
                )}

                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                  {(activePanelGoal.subTasks || []).length === 0 ? (
                    <p className="text-xs text-[#9496a1] py-2 text-center">
                      No sub-tasks yet. Add actionable steps below.
                    </p>
                  ) : (
                    (activePanelGoal.subTasks || []).map(sub => (
                      <div 
                        key={sub.id} 
                        className="flex items-center justify-between gap-3 p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-white/[0.1] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleSubTask(activePanelGoal, sub.id)}
                          className="flex items-center gap-2.5 text-xs text-left min-w-0 flex-1 focus:outline-none"
                        >
                          {sub.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#9496a1] shrink-0" />
                          )}
                          <span className={sub.completed ? 'line-through text-[#9496a1]' : 'text-[#ededf3] font-medium'}>
                            {sub.title}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubTask(activePanelGoal, sub.id)}
                          className="text-[#9496a1] hover:text-red-400 p-1 transition-colors"
                          title="Delete sub-task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddSubTask(activePanelGoal, newSubTaskTitle);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    placeholder="Add actionable sub-task..."
                    className="w-full glass-input-true px-3 py-1.5 text-xs text-white placeholder-zinc-500 font-sans rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 btn-primary-cyan text-white text-xs font-semibold shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Task Notes */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#9496a1] font-medium flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#1591DC]" />
                    <span>Task notes</span>
                  </span>
                  <span className="text-[10px] text-[#9496a1]">Auto-saved</span>
                </div>
                <textarea
                  value={activePanelGoal.notes || ''}
                  onChange={(e) => handleUpdateNotes(activePanelGoal, e.target.value)}
                  placeholder="Write notes, links, or outlines for this task..."
                  rows={7}
                  className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-[#1591DC] p-4 text-xs font-sans leading-relaxed text-[#ededf3] placeholder-zinc-600 focus:outline-none rounded-xl transition-colors resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex justify-between items-center text-xs">
              <span className="text-[10px] text-[#9496a1]">
                Created: {activePanelGoal.createdAt && !isNaN(new Date(activePanelGoal.createdAt).getTime()) ? new Date(activePanelGoal.createdAt).toLocaleDateString() : 'Active'}
              </span>
              <button
                type="button"
                onClick={() => {
                  onDeleteGoal(activePanelGoal.id);
                  setActivePanelGoalId(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete task</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
