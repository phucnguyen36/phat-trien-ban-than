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
  ChevronDown,
  GripVertical,
  Trophy,
  LayoutDashboard,
  SlidersHorizontal,
  Sun,
  Kanban,
  Search,
  Filter,
  ArrowUpDown,
  Flame,
  Layers
} from 'lucide-react';
import WeeklyReviewProtocol from './WeeklyReviewProtocol';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TodoHubProps {
  goals: GoalTodo[];
  onAddGoal: (text: string, timeframe: TimeframeType, timeEstimate?: TimeEstimate, priority?: PriorityLevel) => void;
  onToggleGoal: (id: string, completed: boolean) => void;
  onDeleteGoal: (id: string) => void;
  onEditGoal?: (id: string, newText: string) => void;
  onUpdateGoal?: (updatedGoal: GoalTodo) => void;
  onReorderGoals?: (reorderedGoals: GoalTodo[]) => void;
  onNavigate?: (section: string) => void;
  onStartFocus?: (goalId: string) => void;
  isLightMode?: boolean;
}

export default function TodoHub({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onEditGoal,
  onUpdateGoal,
  onReorderGoals,
  onNavigate,
  onStartFocus,
  isLightMode
}: TodoHubProps) {
  // Safe helper handlers
  const handleToggle = (id: string, completed: boolean) => {
    onToggleGoal(id, completed);
  };

  const handleDelete = (id: string) => {
    onDeleteGoal(id);
  };

  // Calculate current actual date for Today highlight and default selection
  const today = useMemo(() => new Date(), []);
  const todayDayStr = useMemo(() => String(today.getDate()).padStart(2, '0'), [today]);
  const todayMonthStr = useMemo(() => String(today.getMonth() + 1).padStart(2, '0'), [today]);
  const todayYearStr = useMemo(() => String(today.getFullYear()), [today]);
  const todayWeekStr = useMemo(() => `W${Math.ceil(today.getDate() / 7)}`, [today]);
  const todayCtxKey = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;

  // Strip context tag from display text (100% crash-safe)
  const getDisplayGoalText = (text?: string | null): string => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '');
  };

  // Extract date info from goal text tag: [D:YYYY-MM-DD], [W:...], [M:...], [Y:...]
  const getGoalDateInfo = (g: GoalTodo) => {
    const text = g.text || '';
    const match = text.match(/^\[([DWMY]):([^\]]+)\]/);
    const todayKey = todayCtxKey;

    if (!match) {
      return {
        type: g.timeframe || 'daily',
        key: g.timeframe === 'daily' ? todayKey : '',
        isToday: g.timeframe === 'daily',
        isOverdue: false,
        displayDate: g.timeframe === 'daily' ? 'Today' : ''
      };
    }
    const tagType = match[1];
    const tagKey = match[2];
    const isToday = tagType === 'D' && tagKey === todayKey;
    const isOverdue = tagType === 'D' && !g.completed && tagKey < todayKey;

    let displayDate = tagKey;
    if (tagType === 'D') {
      const parts = tagKey.split('-');
      if (parts.length === 3) {
        displayDate = isToday ? 'Today' : `${parts[2]}/${parts[1]}`;
      }
    }
    return { type: tagType, key: tagKey, isToday, isOverdue, displayDate };
  };

  // View mode toggle: Board vs Master Table View vs Grouped View vs Calendar Grid vs Weekly Review
  type ViewMode = 'board' | 'table' | 'grouped' | 'calendar' | 'review';
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [databaseSearchQuery, setDatabaseSearchQuery] = useState('');
  const [databaseStatusFilter, setDatabaseStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [databasePriorityFilter, setDatabasePriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [databaseContextFilter, setDatabaseContextFilter] = useState<string>('all');
  const [databaseTimeframeFilter, setDatabaseTimeframeFilter] = useState<'all' | 'today' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [dbDailyViewScope, setDbDailyViewScope] = useState<'today' | 'all'>('today');
  const [databaseSortBy, setDatabaseSortBy] = useState<
    'manual' | 'priority-desc' | 'priority-asc' | 'created-desc' | 'created-asc' | 'alpha-asc' | 'alpha-desc' | 'status' | 'estimate'
  >('manual');

  // Master Database Quick-Add Input State
  const [dbMasterAddTitle, setDbMasterAddTitle] = useState('');
  const [dbMasterAddTimeframe, setDbMasterAddTimeframe] = useState<TimeframeType>('daily');
  const [dbMasterAddPriority, setDbMasterAddPriority] = useState<PriorityLevel>('Medium');
  const [dbMasterAddEstimate, setDbMasterAddEstimate] = useState<TimeEstimate | undefined>(undefined);

  // Grouped View Collapsed Groups State
  const [dbCollapsedGroups, setDbCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroupCollapse = (id: string) => {
    setDbCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Launch Pomodoro Deep Work Focus on any goal
  const handleStartFocus = (goalId: string) => {
    if (onStartFocus) {
      onStartFocus(goalId);
    } else if (onNavigate) {
      onNavigate('pomodoro-station');
    }
  };

  // Handler for Master Quick Add
  const handleMasterQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = dbMasterAddTitle.trim();
    if (!clean) return;

    let fullText = clean;
    if (dbMasterAddTimeframe === 'daily') {
      fullText = `[D:${todayCtxKey}] ${clean}`;
    } else if (dbMasterAddTimeframe === 'weekly') {
      fullText = `[W:${todayYearStr}-${todayWeekStr}] ${clean}`;
    } else if (dbMasterAddTimeframe === 'monthly') {
      fullText = `[M:${todayYearStr}-${todayMonthStr}] ${clean}`;
    } else if (dbMasterAddTimeframe === 'yearly') {
      fullText = `[Y:${todayYearStr}] ${clean}`;
    }

    onAddGoal(fullText, dbMasterAddTimeframe, dbMasterAddEstimate, dbMasterAddPriority);
    setDbMasterAddTitle('');
  };

  // Database Drag & Drop State
  const [dbDraggedGoalId, setDbDraggedGoalId] = useState<string | null>(null);
  const [dbDragOverColumn, setDbDragOverColumn] = useState<TimeframeType | null>(null);
  const [dbDragOverTaskId, setDbDragOverTaskId] = useState<string | null>(null);

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

  // Today's daily tasks count vs total daily tasks count
  const todayDailyGoalsCount = useMemo(() => {
    return (goals || []).filter(g => {
      if (!g || g.timeframe !== 'daily') return false;
      const text = g.text || '';
      const match = text.match(/^\[D:([^\]]+)\]/);
      if (match) return match[1] === todayCtxKey;
      return true; // legacy untagged daily task is today
    }).length;
  }, [goals, todayCtxKey]);

  const allDailyGoalsCount = useMemo(() => {
    return (goals || []).filter(g => g && g.timeframe === 'daily').length;
  }, [goals]);

  // Unique context tags extracted from existing goals
  const availableContextTags = useMemo(() => {
    const tags = new Set<string>();
    (goals || []).forEach(g => {
      if (g && g.contextTag && g.contextTag.trim()) {
        tags.add(g.contextTag.trim());
      }
    });
    return Array.from(tags).sort();
  }, [goals]);

  // Safe filtered and sorted database goals
  const filteredDatabaseGoals = useMemo(() => {
    const list = (goals || []).filter(g => {
      if (!g) return false;

      // Search text query
      if (databaseSearchQuery.trim()) {
        const query = databaseSearchQuery.toLowerCase();
        const textMatch = (g.text || '').toLowerCase().includes(query);
        const notesMatch = (g.notes || '').toLowerCase().includes(query);
        const tagMatch = (g.contextTag || '').toLowerCase().includes(query);
        if (!textMatch && !notesMatch && !tagMatch) return false;
      }

      // Status filter
      if (databaseStatusFilter === 'active' && g.completed) return false;
      if (databaseStatusFilter === 'completed' && !g.completed) return false;

      // Priority filter
      if (databasePriorityFilter !== 'all' && (g.priority || 'Medium') !== databasePriorityFilter) return false;

      // Context Tag filter
      if (databaseContextFilter !== 'all' && (g.contextTag || '') !== databaseContextFilter) return false;

      // Timeframe filter (applied across both Table and Board view when selected)
      if (databaseTimeframeFilter !== 'all') {
        if (databaseTimeframeFilter === 'today') {
          const text = g.text || '';
          if (g.timeframe !== 'daily') return false;
          const match = text.match(/^\[D:([^\]]+)\]/);
          if (match) return match[1] === todayCtxKey;
          return true; // legacy untagged is today
        }
        const tf = g.timeframe || 'daily';
        if (tf !== databaseTimeframeFilter) return false;
      }

      return true;
    });

    const prioRank: Record<string, number> = {
      'The One Thing': 0,
      'High': 1,
      'Medium': 2,
      'Low': 3,
      'As and When': 4
    };

    const estRank: Record<string, number> = {
      '15m': 1,
      '30m': 2,
      '1h': 3,
      '2h': 4,
      'half-day': 5
    };

    return [...list].sort((a, b) => {
      switch (databaseSortBy) {
        case 'priority-desc': {
          const rankA = prioRank[a.priority || 'Medium'] ?? 2;
          const rankB = prioRank[b.priority || 'Medium'] ?? 2;
          if (rankA !== rankB) return rankA - rankB;
          return (b.createdAt || 0) - (a.createdAt || 0);
        }
        case 'priority-asc': {
          const rankA = prioRank[a.priority || 'Medium'] ?? 2;
          const rankB = prioRank[b.priority || 'Medium'] ?? 2;
          if (rankA !== rankB) return rankB - rankA;
          return (b.createdAt || 0) - (a.createdAt || 0);
        }
        case 'created-desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'created-asc':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'alpha-asc': {
          const textA = (a.text || '').replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '').toLowerCase();
          const textB = (b.text || '').replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '').toLowerCase();
          return textA.localeCompare(textB);
        }
        case 'alpha-desc': {
          const textA = (a.text || '').replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '').toLowerCase();
          const textB = (b.text || '').replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '').toLowerCase();
          return textB.localeCompare(textA);
        }
        case 'status': {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return 0;
        }
        case 'estimate': {
          const eA = estRank[a.timeEstimate || ''] ?? 99;
          const eB = estRank[b.timeEstimate || ''] ?? 99;
          return eA - eB;
        }
        case 'manual':
        default:
          return 0;
      }
    });
  }, [goals, databaseSearchQuery, databaseStatusFilter, databasePriorityFilter, databaseContextFilter, databaseTimeframeFilter, databaseSortBy]);

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

  // Time Estimate presets
  const TIME_ESTIMATES: { value: TimeEstimate; label: string; color: string }[] = [
    { value: '15m', label: '15m', color: 'text-zinc-400' },
    { value: '30m', label: '30m', color: 'text-zinc-400' },
    { value: '1h', label: '1h', color: 'text-zinc-400' },
    { value: '2h', label: '2h', color: 'text-zinc-400' },
    { value: 'half-day', label: '4h', color: 'text-zinc-400' },
  ];

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

    return (goals || []).filter(g => {
      if (!g) return false;
      const text = g.text || '';

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
    return (goals || []).filter(g => {
      if (!g || g.completed) return false;
      const text = g.text || '';
      if (g.timeframe === 'daily' && text.startsWith('[D:')) {
        const match = text.match(/^\[D:(\d{4}-\d{2}-\d{2})\]/);
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
      const cleanText = getDisplayGoalText(g.text);
      await onAddGoal(`[D:${todayCtxKey}] ${cleanText}`, g.timeframe);
      await onDeleteGoal(g.id);
    }
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
      color: 'text-zinc-200',
      bgAccent: 'bg-white/[0.04]',
      borderAccent: 'border-white/[0.08]',
      progressBar: 'bg-white/40'
    },
    {
      id: 'weekly',
      label: 'This Week',
      sublabel: 'Weekly Sprint',
      icon: Calendar,
      color: 'text-zinc-200',
      bgAccent: 'bg-white/[0.04]',
      borderAccent: 'border-white/[0.08]',
      progressBar: 'bg-white/40'
    },
    {
      id: 'monthly',
      label: 'This Month',
      sublabel: 'Monthly Objectives',
      icon: Target,
      color: 'text-zinc-200',
      bgAccent: 'bg-white/[0.04]',
      borderAccent: 'border-white/[0.08]',
      progressBar: 'bg-white/40'
    },
    {
      id: 'yearly',
      label: 'This Year',
      sublabel: 'Annual Vision',
      icon: Trophy,
      color: 'text-zinc-200',
      bgAccent: 'bg-white/[0.04]',
      borderAccent: 'border-white/[0.08]',
      progressBar: 'bg-white/40'
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

  const handleDbTaskDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dbDragOverTaskId !== id) {
      setDbDragOverTaskId(id);
    }
  };

  const handleDbTaskDragLeave = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    if (dbDragOverTaskId === id) {
      setDbDragOverTaskId(null);
    }
  };

  const handleDbDropOnTask = (e: React.DragEvent, targetGoalId: string, targetTimeframe: TimeframeType) => {
    e.preventDefault();
    e.stopPropagation();
    setDbDragOverTaskId(null);
    setDbDragOverColumn(null);
    const sourceId = e.dataTransfer.getData('text/plain') || dbDraggedGoalId;
    setDbDraggedGoalId(null);
    if (!sourceId) return;

    const sourceGoal = goals.find(g => g.id === sourceId);
    const targetGoal = goals.find(g => g.id === targetGoalId);
    if (!sourceGoal || !targetGoal) return;

    // Check if sourceGoal timeframe needs updating
    let updatedSource = { ...sourceGoal };
    if (sourceGoal.timeframe !== targetTimeframe) {
      const cleanText = getDisplayGoalText(sourceGoal.text);
      let tag = '';
      if (targetTimeframe === 'daily') tag = `[D:${todayYearStr}-${todayMonthStr}-${todayDayStr}] `;
      else if (targetTimeframe === 'weekly') tag = `[W:${todayYearStr}-${todayMonthStr}-${todayWeekStr}] `;
      else if (targetTimeframe === 'monthly') tag = `[M:${todayYearStr}-${todayMonthStr}] `;
      else if (targetTimeframe === 'yearly') tag = `[Y:${todayYearStr}] `;

      updatedSource = {
        ...sourceGoal,
        text: `${tag}${cleanText}`,
        timeframe: targetTimeframe
      };
      if (onUpdateGoal) {
        onUpdateGoal(updatedSource);
      }
    }

    if (sourceId === targetGoalId || !onReorderGoals) return;

    const sourceIndex = goals.findIndex(g => g.id === sourceId);
    const targetIndex = goals.findIndex(g => g.id === targetGoalId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newGoals = [...goals];
    newGoals.splice(sourceIndex, 1);
    const insertIndex = newGoals.findIndex(g => g.id === targetGoalId);
    newGoals.splice(insertIndex === -1 ? targetIndex : insertIndex, 0, updatedSource);
    onReorderGoals(newGoals);
  };

  const handleDbDropOnColumn = (e: React.DragEvent, targetTimeframe: TimeframeType) => {
    e.preventDefault();
    setDbDragOverColumn(null);
    setDbDragOverTaskId(null);
    const goalId = e.dataTransfer.getData('text/plain') || dbDraggedGoalId;
    setDbDraggedGoalId(null);
    if (!goalId) return;

    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;

    if (targetGoal.timeframe !== targetTimeframe) {
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

  return (
    <div id="todo-hub" className="p-5 sm:p-6 lg:p-7 glass-panel-true mb-12 border border-white/15 shadow-2xl">
      
      {/* Overdue / Incomplete Target Reminder Banner (Slim & Compact) */}
      {!isOverdueBannerDismissed && overdueIncompleteGoals.length > 0 && (
        <div className="mb-4 px-3.5 py-2 glass-card-true border border-rose-500/20 rounded-xl flex items-center justify-between gap-3 bg-rose-500/10 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="text-rose-200 font-medium">
              You have {overdueIncompleteGoals.length} overdue tasks from previous days
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRolloverOverdueGoals}
              className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/10 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Roll over to Today</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOverdueBannerDismissed(true)}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Module Title & Mode Switcher Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            {viewMode === 'board' ? 'Tasks & Roadmap' : viewMode === 'table' ? 'Task Database' : viewMode === 'grouped' ? 'Timeframe Groups' : viewMode === 'calendar' ? 'Calendar' : 'Review Protocol'}
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/[0.06] text-[#ededf3] tabular-nums border border-white/[0.08]">
            {goals.length}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center glass-pill-true p-1">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all rounded-full cursor-pointer ${
              viewMode === 'board'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#9496a1] hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all rounded-full cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#9496a1] hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all rounded-full cursor-pointer ${
              viewMode === 'grouped'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#9496a1] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grouped</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all rounded-full cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all rounded-full cursor-pointer ${
              viewMode === 'review'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#9496a1] hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-zinc-400" />
            <span>Review Protocol</span>
          </button>
        </div>
      </div>

      {/* Unified Action Bar & Filter Controls (Active in Board, Table, and Grouped views) */}
      {(viewMode === 'board' || viewMode === 'table' || viewMode === 'grouped') && (
        <div className="space-y-3 mb-6 animate-fadeIn font-sans">
          <div className="glass-panel-true p-3 md:p-3.5 rounded-2xl border border-white/10 space-y-2.5">
            {/* Row 1: Search + Quick Filter Dropdowns + Reset */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#9496a1] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={databaseSearchQuery}
                  onChange={(e) => setDatabaseSearchQuery(e.target.value)}
                  placeholder="Search tasks by title, #tag, notes..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-white/30 pl-9 pr-8 py-1.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-sans"
                />
                {databaseSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDatabaseSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Group: Status + Priority + Sort + Tags + Reset */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Segmented */}
                <div className="flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
                  {(['all', 'active', 'completed'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDatabaseStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        databaseStatusFilter === st
                          ? 'bg-white/20 text-white font-semibold shadow-sm'
                          : 'text-[#9496a1] hover:text-white'
                      }`}
                    >
                      {st === 'all' ? 'All' : st === 'active' ? 'Active' : 'Done'}
                    </button>
                  ))}
                </div>

                {/* Priority Select */}
                <div className="flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/[0.06]">
                  <Filter className="w-3 h-3 text-[#9496a1]" />
                  <select
                    value={databasePriorityFilter}
                    onChange={(e) => setDatabasePriorityFilter(e.target.value as any)}
                    className="bg-transparent text-[11px] text-[#ededf3] focus:outline-none cursor-pointer"
                    title="Filter by priority"
                  >
                    <option value="all" className="bg-[#12141a] text-white">All Priorities</option>
                    <option value="The One Thing" className="bg-[#12141a] text-rose-300">★ The One Thing</option>
                    <option value="High" className="bg-[#12141a] text-rose-300">High</option>
                    <option value="Medium" className="bg-[#12141a] text-zinc-300">Medium</option>
                    <option value="Low" className="bg-[#12141a] text-zinc-400">Low</option>
                  </select>
                </div>

                {/* Sort Select */}
                <div className="flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/[0.06]">
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  <select
                    value={databaseSortBy}
                    onChange={(e) => setDatabaseSortBy(e.target.value as any)}
                    className="bg-transparent text-[11px] text-[#ededf3] focus:outline-none cursor-pointer"
                    title="Sort tasks"
                  >
                    <option value="manual" className="bg-[#12141a] text-white">Manual Order</option>
                    <option value="priority-desc" className="bg-[#12141a] text-white">Priority: High → Low</option>
                    <option value="priority-asc" className="bg-[#12141a] text-white">Priority: Low → High</option>
                    <option value="created-desc" className="bg-[#12141a] text-white">Newest First</option>
                    <option value="created-asc" className="bg-[#12141a] text-white">Oldest First</option>
                    <option value="alpha-asc" className="bg-[#12141a] text-white">Name: A → Z</option>
                    <option value="estimate" className="bg-[#12141a] text-white">Time Estimate</option>
                  </select>
                </div>

                {/* Context Tag Select */}
                {availableContextTags.length > 0 && (
                  <div className="flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/[0.06]">
                    <Tag className="w-3 h-3 text-[#9496a1]" />
                    <select
                      value={databaseContextFilter}
                      onChange={(e) => setDatabaseContextFilter(e.target.value)}
                      className="bg-transparent text-[11px] text-[#ededf3] focus:outline-none cursor-pointer max-w-[90px] truncate"
                      title="Filter by tag"
                    >
                      <option value="all" className="bg-[#12141a] text-white">All Tags</option>
                      {availableContextTags.map(tag => (
                        <option key={tag} value={tag} className="bg-[#12141a] text-white">#{tag}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reset Filters */}
                {(databaseSearchQuery || databaseStatusFilter !== 'all' || databasePriorityFilter !== 'all' || databaseTimeframeFilter !== 'all' || databaseContextFilter !== 'all' || databaseSortBy !== 'manual') && (
                  <button
                    type="button"
                    onClick={() => {
                      setDatabaseSearchQuery('');
                      setDatabaseStatusFilter('all');
                      setDatabasePriorityFilter('all');
                      setDatabaseTimeframeFilter('all');
                      setDatabaseContextFilter('all');
                      setDatabaseSortBy('manual');
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] text-[#9496a1] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset all filters"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Timeframe Quick Tabs */}
            <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-white/[0.06] text-xs">
              {[
                { id: 'all', label: `All (${goals.length})` },
                { id: 'today', label: `Today (${todayDailyGoalsCount})` },
                { id: 'weekly', label: `This Week (${goals.filter(g => g.timeframe === 'weekly').length})` },
                { id: 'monthly', label: `This Month (${goals.filter(g => g.timeframe === 'monthly').length})` },
                { id: 'yearly', label: `This Year (${goals.filter(g => g.timeframe === 'yearly').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDatabaseTimeframeFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    databaseTimeframeFilter === f.id
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-[#9496a1] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Master Inline Quick-Add (Only for Table and Grouped view) */}
          {(viewMode === 'table' || viewMode === 'grouped') && (
            <form 
              onSubmit={handleMasterQuickAdd}
              className="glass-panel-true p-2.5 rounded-2xl border border-white/10 flex flex-wrap items-center gap-2 focus-within:border-white/25 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <div className="w-6 h-6 rounded-lg bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={dbMasterAddTitle}
                  onChange={(e) => setDbMasterAddTitle(e.target.value)}
                  placeholder="Quickly add a new task... (Press Enter)"
                  className="w-full bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  value={dbMasterAddTimeframe}
                  onChange={(e) => setDbMasterAddTimeframe(e.target.value as TimeframeType)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-[#ededf3] focus:outline-none cursor-pointer"
                  title="Timeframe"
                >
                  <option value="daily" className="bg-[#12141a] text-white">⚡ Today</option>
                  <option value="weekly" className="bg-[#12141a] text-white">📅 This Week</option>
                  <option value="monthly" className="bg-[#12141a] text-white">🎯 This Month</option>
                  <option value="yearly" className="bg-[#12141a] text-white">🏔️ This Year</option>
                </select>

                <select
                  value={dbMasterAddPriority}
                  onChange={(e) => setDbMasterAddPriority(e.target.value as PriorityLevel)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-[#ededf3] focus:outline-none cursor-pointer"
                  title="Priority"
                >
                  <option value="The One Thing" className="bg-[#12141a] text-rose-300">★ The One Thing</option>
                  <option value="High" className="bg-[#12141a] text-rose-300">High</option>
                  <option value="Medium" className="bg-[#12141a] text-zinc-300">Medium</option>
                  <option value="Low" className="bg-[#12141a] text-zinc-400">Low</option>
                </select>

                <select
                  value={dbMasterAddEstimate || ''}
                  onChange={(e) => setDbMasterAddEstimate(e.target.value ? (e.target.value as TimeEstimate) : undefined)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-[#ededf3] focus:outline-none cursor-pointer"
                  title="Estimated Time"
                >
                  <option value="" className="bg-[#12141a] text-zinc-400">Estimate (Optional)</option>
                  <option value="15m" className="bg-[#12141a] text-white">15 mins</option>
                  <option value="30m" className="bg-[#12141a] text-white">30 mins</option>
                  <option value="1h" className="bg-[#12141a] text-white">1 hour</option>
                  <option value="2h" className="bg-[#12141a] text-white">2 hours</option>
                  <option value="half-day" className="bg-[#12141a] text-white">Half day</option>
                </select>

                <button
                  type="submit"
                  disabled={!dbMasterAddTitle.trim()}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Main View Mode Rendering: Board vs Grouped vs Table vs Calendar vs Review */}
      {viewMode === 'board' ? (
            <div className={`grid gap-5 ${
              databaseTimeframeFilter !== 'all'
                ? 'grid-cols-1 max-w-2xl mx-auto'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            }`}>
              {DATABASE_COLUMNS.filter(col => {
                if (databaseTimeframeFilter === 'all') return true;
                if (databaseTimeframeFilter === 'today') return col.id === 'daily';
                return col.id === databaseTimeframeFilter;
              }).map(col => {
                const ColIcon = col.icon;
                const isDailyCol = col.id === 'daily';
                const isTodayOnly = isDailyCol && (dbDailyViewScope === 'today' || databaseTimeframeFilter === 'today') && databaseTimeframeFilter !== 'daily';

                const colGoals = filteredDatabaseGoals.filter(g => {
                  if (g.timeframe !== col.id) return false;
                  if (isTodayOnly) {
                    const info = getGoalDateInfo(g);
                    return info.isToday || !g.text?.startsWith('[D:');
                  }
                  return true;
                });
                const sortedColGoals = databaseSortBy === 'manual'
                  ? [...colGoals].sort((a, b) => {
                      if (a.completed !== b.completed) return a.completed ? 1 : -1;
                      return 0; // Keep user drag-and-drop manual priority order
                    })
                  : colGoals;

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
                        ? 'border-white/30 bg-white/[0.03] shadow-[0_0_25px_rgba(255,255,255,0.05)]' 
                        : 'border-white/[0.08] bg-[#0e1015] hover:border-white/[0.14]'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="p-4 border-b border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg ${col.bgAccent} border ${col.borderAccent} flex items-center justify-center`}>
                            <ColIcon className={`w-4 h-4 ${col.color}`} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                              <span>{isDailyCol ? (isTodayOnly ? 'Today' : 'Daily Tasks') : col.label}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#ededf3] tabular-nums font-semibold">
                                {totalCount}
                              </span>
                            </h4>
                            <p className="text-[10px] text-[#9496a1] font-normal">
                              {isDailyCol ? (isTodayOnly ? 'Daily Priorities (Today)' : `All Daily Tasks (${allDailyGoalsCount})`) : col.sublabel}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold tabular-nums text-white">
                            {rate}%
                          </span>
                          <span className="block text-[9px] text-[#9496a1] tabular-nums">
                            {completedCount}/{totalCount}
                          </span>
                        </div>
                      </div>

                      {/* Daily Column Today vs All Toggle */}
                      {isDailyCol && databaseTimeframeFilter === 'all' && (
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="inline-flex p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                            <button
                              type="button"
                              onClick={() => setDbDailyViewScope('today')}
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                                isTodayOnly
                                  ? 'bg-white text-black shadow-sm font-semibold'
                                  : 'text-[#9496a1] hover:text-white'
                              }`}
                            >
                              Today ({todayDailyGoalsCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setDbDailyViewScope('all')}
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                                !isTodayOnly
                                  ? 'bg-white text-black shadow-sm font-semibold'
                                  : 'text-[#9496a1] hover:text-white'
                              }`}
                            >
                              All Days ({allDailyGoalsCount})
                            </button>
                          </div>
                        </div>
                      )}

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
                            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/30 px-3 py-1.5 text-xs text-white placeholder-zinc-500 rounded-xl focus:outline-none transition-colors font-sans"
                          />
                          <button
                            type="submit"
                            className="p-1.5 bg-white text-black hover:bg-zinc-200 rounded-xl shrink-0 transition-transform active:scale-95 cursor-pointer font-semibold shadow-sm"
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
                                    ? 'bg-white text-black font-bold shadow-sm'
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
                          const isDragOver = dbDragOverTaskId === g.id;

                          return (
                            <div
                              key={g.id}
                              draggable={true}
                              onDragStart={(e) => handleDbDragStart(e, g.id)}
                              onDragOver={(e) => handleDbTaskDragOver(e, g.id)}
                              onDragLeave={(e) => handleDbTaskDragLeave(e, g.id)}
                              onDrop={(e) => handleDbDropOnTask(e, g.id, col.id)}
                              onClick={() => setActivePanelGoalId(g.id)}
                              className={`relative p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing group select-none ${
                                isDragOver 
                                  ? 'border-t-2 border-white/40 bg-white/[0.04]' 
                                  : ''
                              } ${
                                g.completed
                                  ? 'bg-white/[0.02] border-white/[0.04] opacity-50 hover:opacity-85'
                                  : 'bg-[#12141a] border-white/[0.08] hover:border-white/[0.18] hover:shadow-md'
                              }`}
                            >
                              {/* Hover Action Buttons */}
                              <div 
                                className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#14151c]/95 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/10 shadow-lg"
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

                              {/* Card Main: Grip + Checkbox + Title */}
                              <div className="flex items-start gap-2.5 w-full pr-1">
                                <div 
                                  className="mt-0.5 text-zinc-600 group-hover:text-zinc-400 shrink-0 cursor-grab active:cursor-grabbing" 
                                  title="Drag to reorder priority"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggle(g.id, !g.completed);
                                  }}
                                  className={`mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer ${
                                    g.completed ? 'text-zinc-300' : 'text-[#9496a1] hover:text-white'
                                  }`}
                                >
                                  {g.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <span className={`text-xs font-medium block leading-relaxed [text-wrap:pretty] [overflow-wrap:break-word] [word-break:normal] ${
                                    g.completed ? 'line-through text-[#9496a1]' : 'text-white'
                                  }`}>
                                    {cleanText}
                                  </span>
                                </div>
                              </div>

                              {/* Card Badges Row */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-white/[0.04] text-[10px]">
                                {/* Date Badge */}
                                {(() => {
                                  const dateInfo = getGoalDateInfo(g);
                                  if (!dateInfo.displayDate) return null;
                                  return (
                                    <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-medium ${
                                      dateInfo.isToday
                                        ? 'bg-sky-500/10 text-sky-200 border-sky-500/20 font-semibold'
                                        : dateInfo.isOverdue
                                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 font-medium'
                                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                                    }`}>
                                      {dateInfo.displayDate}
                                    </span>
                                  );
                                })()}

                                {/* Priority Badge */}
                                <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-semibold ${
                                  prio === 'The One Thing' || prio === 'High'
                                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                    : prio === 'Medium' 
                                      ? 'bg-white/[0.06] text-zinc-300 border-white/[0.1]'
                                      : 'bg-white/[0.02] text-zinc-500 border-white/[0.05]'
                                }`}>
                                  {prio}
                                </span>

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
                                      ? 'bg-white/[0.08] text-white border-white/20' 
                                      : 'bg-white/[0.04] text-[#9496a1] border-white/[0.08]'
                                  }`}>
                                    <ListChecks className="w-2.5 h-2.5" />
                                    <span>{subDone}/{subCount}</span>
                                  </span>
                                )}

                                {/* Context tag badge */}
                                {g.contextTag && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-white/[0.03] text-zinc-400 border border-white/[0.06] font-mono text-[9px]">
                                    #{g.contextTag}
                                  </span>
                                )}

                                {/* Notes & Focus action */}
                                <div className="flex items-center gap-1 ml-auto">
                                  {g.notes && (
                                    <span className="text-[#9496a1] flex items-center gap-0.5" title="Has notes">
                                      <FileText className="w-3 h-3" />
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartFocus(g.id);
                                    }}
                                    className="p-1 rounded hover:bg-white/[0.08] text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                    title="Start Pomodoro Focus on this task"
                                  >
                                    <Flame className="w-3 h-3" />
                                  </button>
                                </div>
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
          ) : viewMode === 'grouped' ? (
            /* Database Grouped View Mode: Clean Collapsible Timeframe Groups */
            <div className="space-y-4">
              {/* Collapsible Timeframe Groups */}
              {DATABASE_COLUMNS.filter(col => {
                if (databaseTimeframeFilter === 'all') return true;
                if (databaseTimeframeFilter === 'today') return col.id === 'daily';
                return col.id === databaseTimeframeFilter;
              }).map(col => {
                const isCollapsed = !!dbCollapsedGroups[col.id];
                const isDailyCol = col.id === 'daily';
                const isTodayOnly = isDailyCol && (dbDailyViewScope === 'today' || databaseTimeframeFilter === 'today') && databaseTimeframeFilter !== 'daily';
                const colGoals = filteredDatabaseGoals.filter(g => {
                  if (g.timeframe !== col.id) return false;
                  if (isTodayOnly) {
                    const info = getGoalDateInfo(g);
                    return info.isToday || !g.text?.startsWith('[D:');
                  }
                  return true;
                });
                const totalCount = colGoals.length;
                const completedCount = colGoals.filter(g => g.completed).length;
                const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const ColIcon = col.icon;

                return (
                  <div key={col.id} className="glass-panel-true border border-white/15 rounded-2xl overflow-hidden shadow-sm">
                    {/* Group Header Bar */}
                    <div 
                      onClick={() => toggleGroupCollapse(col.id)}
                      className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#9496a1]">
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                        <div className={`w-7 h-7 rounded-lg ${col.bgAccent} border ${col.borderAccent} flex items-center justify-center ${col.color}`}>
                          <ColIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white tracking-tight">{col.label}</span>
                          <span className="text-[11px] text-[#9496a1] hidden sm:inline">({col.sublabel})</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] text-[#ededf3] tabular-nums border border-white/[0.08]">
                            {completedCount}/{totalCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-white/[0.06] rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full ${col.progressBar} transition-all duration-300`} 
                            style={{ width: `${rate}%` }} 
                          />
                        </div>
                        <span className="text-xs font-mono text-[#9496a1] tabular-nums min-w-[36px] text-right">
                          {rate}%
                        </span>
                      </div>
                    </div>

                    {/* Group Table */}
                    {!isCollapsed && (
                      <div className="p-2 sm:p-3">
                        {colGoals.length === 0 ? (
                          <div className="py-6 text-center text-xs text-[#9496a1]">
                            No tasks in this section.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[760px] font-sans">
                              <thead>
                                <tr className="border-b border-white/[0.06] text-[11px] text-[#9496a1]">
                                  <th className="py-2 px-2 w-8 text-center"></th>
                                  <th className="py-2 px-3 w-12 text-center font-medium">Status</th>
                                  <th className="py-2 px-3 font-medium">Task Name</th>
                                  <th className="py-2 px-3 w-28 font-medium">Priority</th>
                                  <th className="py-2 px-3 w-24 font-medium">Time Est</th>
                                  <th className="py-2 px-3 w-20 font-medium">Sub-tasks</th>
                                  <th className="py-2 px-3 w-20 text-center font-medium">Focus</th>
                                  <th className="py-2 px-3 w-20 text-right font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.03] text-xs text-[#ededf3]">
                                {colGoals.map(g => {
                                  const cleanText = getDisplayGoalText(g.text);
                                  const subCount = g.subTasks ? g.subTasks.length : 0;
                                  const subDone = g.subTasks ? g.subTasks.filter(s => s.completed).length : 0;
                                  const estMeta = g.timeEstimate ? TIME_ESTIMATES.find(e => e.value === g.timeEstimate) : null;
                                  const prio = g.priority || 'Medium';
                                  const prioColor = prio === 'The One Thing' || prio === 'High'
                                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                    : prio === 'Medium'
                                      ? 'bg-white/[0.06] text-zinc-300 border-white/[0.1]'
                                      : 'bg-white/[0.02] text-zinc-500 border-white/[0.05]';

                                  return (
                                    <tr 
                                      key={g.id}
                                      onClick={() => setActivePanelGoalId(g.id)}
                                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer group select-none ${g.completed ? 'opacity-50' : ''}`}
                                    >
                                      <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                                        <div className="text-zinc-600 group-hover:text-zinc-400 flex justify-center">
                                          <GripVertical className="w-3.5 h-3.5" />
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => handleToggle(g.id, !g.completed)}
                                          className={`transition-transform active:scale-90 cursor-pointer ${g.completed ? 'text-zinc-300' : 'text-[#9496a1] hover:text-white'}`}
                                        >
                                          {g.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                        </button>
                                      </td>
                                      <td className="py-2.5 px-3 font-medium text-white">
                                        <span className={g.completed ? 'line-through text-[#9496a1]' : ''}>
                                          {cleanText}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${prioColor}`}>
                                          {prio}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-[11px] text-[#9496a1] tabular-nums">
                                        {estMeta ? estMeta.label : '-'}
                                      </td>
                                      <td className="py-2.5 px-3 text-[11px] text-[#9496a1] tabular-nums">
                                        {subCount > 0 ? (
                                          <span className={subDone === subCount ? 'text-white' : ''}>
                                            {subDone}/{subCount}
                                          </span>
                                        ) : '-'}
                                      </td>
                                      <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => handleStartFocus(g.id)}
                                          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm group/btn"
                                          title="Start Pomodoro Focus on this task"
                                        >
                                          <Flame className="w-3 h-3 text-zinc-400 group-hover/btn:text-white group-hover/btn:scale-110 transition-transform" />
                                          <span className="text-[10px] font-semibold">Focus</span>
                                        </button>
                                      </td>
                                      <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() => setActivePanelGoalId(g.id)}
                                            className="p-1 text-[#9496a1] hover:text-white glass-button-true rounded cursor-pointer"
                                            title="Task Details & Notes"
                                          >
                                            <SlidersHorizontal className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDelete(g.id)}
                                            className="p-1 text-[#9496a1] hover:text-rose-400 glass-button-true rounded cursor-pointer"
                                            title="Delete task"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'table' ? (
            /* Database Master Table View Mode (High Density, Linear/Notion Style) */
            <div className="glass-panel-true border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              {/* Master Spreadsheet Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[960px] font-sans">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-xs text-[#9496a1] bg-white/[0.02]">
                      <th className="py-2.5 px-2 w-8 text-center"></th>
                      <th className="py-2.5 px-3 w-14 text-center font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">Task Name</th>
                      <th className="py-2.5 px-3 w-28 font-medium">Timeframe</th>
                      <th className="py-2.5 px-3 w-28 font-medium">Priority</th>
                      <th className="py-2.5 px-3 w-24 font-medium">Time Est</th>
                      <th className="py-2.5 px-3 w-24 font-medium">Sub-tasks</th>
                      <th className="py-2.5 px-3 w-28 font-medium">Context Tag</th>
                      <th className="py-2.5 px-3 w-20 text-center font-medium">Focus</th>
                      <th className="py-2.5 px-3 w-24 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs text-[#ededf3]">
                    {filteredDatabaseGoals.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-[#9496a1] text-xs">
                          No tasks match the active filters. Use the quick-add bar above to add a new task.
                        </td>
                      </tr>
                    ) : (
                      filteredDatabaseGoals.map(g => {
                        const cleanText = getDisplayGoalText(g.text);
                        const subCount = g.subTasks ? g.subTasks.length : 0;
                        const subDone = g.subTasks ? g.subTasks.filter(s => s.completed).length : 0;
                        const estMeta = g.timeEstimate ? TIME_ESTIMATES.find(e => e.value === g.timeEstimate) : null;
                        const prio = g.priority || 'Medium';
                        const isDragOver = dbDragOverTaskId === g.id;
                        
                        const prioColor = prio === 'The One Thing' || prio === 'High' 
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          : prio === 'Medium' 
                            ? 'bg-white/[0.06] text-zinc-300 border-white/[0.1]'
                            : 'bg-white/[0.02] text-zinc-500 border-white/[0.05]';

                        return (
                          <tr 
                            key={g.id} 
                            draggable={true}
                            onDragStart={(e) => handleDbDragStart(e, g.id)}
                            onDragOver={(e) => handleDbTaskDragOver(e, g.id)}
                            onDragLeave={(e) => handleDbTaskDragLeave(e, g.id)}
                            onDrop={(e) => handleDbDropOnTask(e, g.id, g.timeframe)}
                            onClick={() => setActivePanelGoalId(g.id)}
                            className={`hover:bg-white/[0.03] transition-colors cursor-pointer group select-none ${
                              isDragOver ? 'border-t-2 border-white/40 bg-white/[0.04]' : ''
                            } ${g.completed ? 'opacity-50' : ''}`}
                          >
                            <td className="py-3 px-2 text-center" onClick={e => e.stopPropagation()}>
                              <div 
                                className="text-zinc-600 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing flex justify-center" 
                                title="Drag to reorder priority"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleToggle(g.id, !g.completed)}
                                className={`transition-transform active:scale-90 cursor-pointer ${g.completed ? 'text-zinc-300' : 'text-[#9496a1] hover:text-white'}`}
                              >
                                {g.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>
                            </td>

                            <td className="py-3 px-3 font-medium text-white">
                              <div className="flex items-center gap-2">
                                <span className={g.completed ? 'line-through text-[#9496a1]' : ''}>
                                  {cleanText}
                                </span>
                                {g.notes && (
                                  <FileText className="w-3 h-3 text-[#9496a1]" title="Has notes" />
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-[#ededf3] capitalize">
                                  {g.timeframe}
                                </span>
                                {(() => {
                                  const dateInfo = getGoalDateInfo(g);
                                  if (!dateInfo.displayDate) return null;
                                  return (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                                      dateInfo.isToday 
                                        ? 'bg-sky-500/10 text-sky-200 border-sky-500/20 font-semibold' 
                                        : dateInfo.isOverdue 
                                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' 
                                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                                    }`}>
                                      {dateInfo.displayDate}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${prioColor}`}>
                                {prio}
                              </span>
                            </td>

                            <td className="py-3 px-3 tabular-nums text-[11px] text-[#9496a1]">
                              {estMeta ? estMeta.label : '-'}
                            </td>

                            <td className="py-3 px-3 tabular-nums text-[11px] text-[#9496a1]">
                              {subCount > 0 ? (
                                <span className={`px-2 py-0.5 rounded-full ${subDone === subCount ? 'text-white bg-white/[0.08]' : 'text-[#9496a1]'}`}>
                                  {subDone}/{subCount}
                                </span>
                              ) : (
                                <span className="opacity-40">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-[#9496a1] text-xs">
                              {g.contextTag ? `#${g.contextTag}` : '-'}
                            </td>

                            <td className="py-3 px-2 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleStartFocus(g.id)}
                                className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm group/btn"
                                title="Start Pomodoro Focus on this task"
                              >
                                <Flame className="w-3.5 h-3.5 text-zinc-400 group-hover/btn:text-white group-hover/btn:scale-110 transition-transform" />
                                <span className="text-[10px] font-semibold">Focus</span>
                              </button>
                            </td>

                            <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
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
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 font-semibold shadow-sm text-xs flex items-center gap-1 shrink-0 rounded-xl cursor-pointer"
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
                      ? 'bg-white/[0.05] border-white/40 ring-2 ring-white/20'
                      : day.isToday
                        ? 'bg-white/[0.03] border-white/30 shadow-sm'
                        : isCurrentSelected
                          ? 'bg-white/[0.04] border-white/20'
                          : 'bg-[#0c0e14]/90 border-white/[0.06] hover:border-white/[0.14]'
                  }`}
                >
                  {/* Day Header Inside Cell */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center gap-1.5">
                      {day.isToday ? (
                        <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-mono font-bold text-xs shadow-md">
                          {day.dayNum}
                        </span>
                      ) : (
                        <span className={`font-mono text-xs font-semibold transition-colors ${
                          isCurrentSelected ? 'text-white' : 'text-zinc-400 group-hover/day:text-white'
                        }`}>
                          {day.dayNum}
                        </span>
                      )}

                      {day.total > 0 && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                          day.completed === day.total
                            ? 'bg-white/15 text-white font-semibold'
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
                      className="opacity-0 group-hover/day:opacity-100 p-1 rounded hover:bg-white/[0.08] text-[#9496a1] hover:text-white transition-all cursor-pointer"
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
                          className="w-full text-[11px] px-2 py-1 rounded-lg bg-black/60 border border-white/30 text-white focus:outline-none placeholder:text-zinc-500"
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
                              ? 'opacity-40 border-white/40 bg-white/[0.05] scale-95'
                              : g.completed
                                ? 'bg-white/[0.02] border-white/[0.04] opacity-60 hover:opacity-85'
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
                                <CheckSquare className="w-3.5 h-3.5 text-zinc-300" />
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
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/[0.05] text-zinc-300 flex items-center gap-0.5">
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
                      <div className="h-full bg-white/40 rounded-full" style={{ width: `${pct}%` }} />
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
                  <FileText className="w-4 h-4 text-zinc-300" />
                  <span className="text-xs font-semibold text-white">
                    Task details & sub-tasks
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanelGoalId(null)}
                  className="p-1.5 rounded-full hover:bg-white/[0.06] text-[#9496a1] hover:text-white transition-colors cursor-pointer"
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
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/30 px-3.5 py-2.5 text-base font-semibold text-white focus:outline-none rounded-xl transition-colors font-sans"
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
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      activePanelGoal.completed
                        ? 'bg-white/15 text-white border-white/20 font-semibold'
                        : 'bg-white/[0.04] text-[#ededf3] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    {activePanelGoal.completed ? <CheckSquare className="w-4 h-4 text-zinc-300" /> : <Square className="w-4 h-4 text-[#9496a1]" />}
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
                    <option value="The One Thing">★ The One Thing</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                    <option value="As and When">As and When</option>
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
                    <ListChecks className="w-4 h-4 text-zinc-300" />
                    <h4 className="text-xs font-semibold text-white">
                      Sub-tasks ({(activePanelGoal.subTasks || []).filter(s => s.completed).length}/{(activePanelGoal.subTasks || []).length})
                    </h4>
                  </div>
                  {(activePanelGoal.subTasks || []).length > 0 && (
                    <span className="text-xs font-medium text-white font-mono">
                      {Math.round(((activePanelGoal.subTasks || []).filter(s => s.completed).length / (activePanelGoal.subTasks || []).length) * 100)}% done
                    </span>
                  )}
                </div>

                {(activePanelGoal.subTasks || []).length > 0 && (
                  <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-white/50 transition-all duration-500" 
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
                          className="flex items-center gap-2.5 text-xs text-left min-w-0 flex-1 focus:outline-none cursor-pointer"
                        >
                          {sub.completed ? (
                            <CheckSquare className="w-4 h-4 text-zinc-300 shrink-0" />
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
                          className="text-[#9496a1] hover:text-red-400 p-1 transition-colors cursor-pointer"
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
                    className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold shrink-0 flex items-center gap-1 rounded-lg cursor-pointer shadow-sm"
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
                    <FileText className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Task notes</span>
                  </span>
                  <span className="text-[10px] text-[#9496a1]">Auto-saved</span>
                </div>
                <textarea
                  value={activePanelGoal.notes || ''}
                  onChange={(e) => handleUpdateNotes(activePanelGoal, e.target.value)}
                  placeholder="Write notes, links, or outlines for this task..."
                  rows={7}
                  className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-white/30 p-4 text-xs font-sans leading-relaxed text-[#ededf3] placeholder-zinc-600 focus:outline-none rounded-xl transition-colors resize-none"
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
