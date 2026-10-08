/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { GoalTodo, TimeframeType, TimeEstimate, PriorityLevel } from '../types';
import { 
  GanttChart, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  Flame, 
  SlidersHorizontal, 
  Plus, 
  Search, 
  Check, 
  Clock, 
  Sparkles, 
  Target, 
  Sun, 
  Trophy, 
  Layers, 
  ArrowRight,
  GripVertical,
  MoveHorizontal
} from 'lucide-react';
import { SIGNATURE_ACCENT_COLOR } from '../utils/themeColors';

interface GanttRoadmapViewProps {
  goals: GoalTodo[];
  onToggleGoal: (id: string, completed: boolean) => void;
  onDeleteGoal: (id: string) => void;
  onStartFocus: (goalId: string) => void;
  onOpenDetails: (goalId: string) => void;
  onAddGoal?: (text: string, timeframe: TimeframeType, timeEstimate?: TimeEstimate, priority?: PriorityLevel) => void;
  onUpdateGoal?: (updatedGoal: GoalTodo) => void;
  searchQuery?: string;
  statusFilter?: 'all' | 'active' | 'completed';
  priorityFilter?: 'all' | PriorityLevel;
  timeframeFilter?: 'all' | 'today' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  isLightMode?: boolean;
  accentColor?: string;
}

type GanttZoom = '2weeks' | 'month' | 'quarter';

interface DragState {
  type: 'move' | 'resize-start' | 'resize-end';
  goalId: string;
  startX: number;
  originalOffsetIndex: number;
  originalSpanDays: number;
  originalStartDate: Date;
  originalEndDate: Date;
  hasMoved: boolean;
  currentDeltaDays: number;
}

export default function GanttRoadmapView({
  goals,
  onToggleGoal,
  onDeleteGoal,
  onStartFocus,
  onOpenDetails,
  onAddGoal,
  onUpdateGoal,
  searchQuery = '',
  statusFilter = 'all',
  priorityFilter = 'all',
  timeframeFilter = 'all',
  isLightMode,
  accentColor = SIGNATURE_ACCENT_COLOR
}: GanttRoadmapViewProps) {
  // Zoom level state
  const [zoom, setZoom] = useState<GanttZoom>('2weeks');
  
  // Date anchor offset in days relative to today
  const [dayOffset, setDayOffset] = useState<number>(0);

  // Group collapse state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Interactive Drag & Resize State
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Helper to format date YYYY-MM-DD
  const formatDateKey = useCallback((date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Today reference
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today, formatDateKey]);

  // Anchor date based on offset
  const anchorDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [today, dayOffset]);

  // Strip context tag from display text
  const cleanGoalText = useCallback((text?: string | null): string => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '');
  }, []);

  // Timeline configuration according to zoom
  const timelineConfig = useMemo(() => {
    const days: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      dayName: string;
      monthName: string;
      year: number;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    let totalDays = 14;
    let startDate = new Date(anchorDate);

    if (zoom === '2weeks') {
      totalDays = 14;
      startDate.setDate(anchorDate.getDate() - 3); // 3 days in the past, 10 days in future
    } else if (zoom === 'month') {
      // Current month view
      startDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
      const lastDay = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
      totalDays = lastDay;
    } else if (zoom === 'quarter') {
      // 90 days / 12 weeks
      totalDays = 84;
      startDate.setDate(anchorDate.getDate() - 14);
    }

    const dayWidth = zoom === '2weeks' ? 54 : zoom === 'month' ? 36 : 28;

    for (let i = 0; i < totalDays; i++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + i);
      const dKey = formatDateKey(cur);
      const dayNum = cur.getDay(); // 0 is Sunday, 6 is Saturday
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      days.push({
        date: cur,
        dateKey: dKey,
        dayNumber: cur.getDate(),
        dayName: dayNames[dayNum],
        monthName: monthNames[cur.getMonth()],
        year: cur.getFullYear(),
        isToday: dKey === todayKey,
        isWeekend: dayNum === 0 || dayNum === 6
      });
    }

    return {
      days,
      dayWidth,
      totalWidth: days.length * dayWidth,
      startDate: days[0]?.date || new Date(),
      endDate: days[days.length - 1]?.date || new Date()
    };
  }, [anchorDate, zoom, todayKey, formatDateKey]);

  // Timeline date range header string
  const rangeHeaderString = useMemo(() => {
    if (timelineConfig.days.length === 0) return '';
    const first = timelineConfig.days[0];
    const last = timelineConfig.days[timelineConfig.days.length - 1];
    if (first.monthName === last.monthName && first.year === last.year) {
      return `${first.dayNumber} – ${last.dayNumber} ${first.monthName} ${first.year}`;
    }
    return `${first.dayNumber} ${first.monthName} – ${last.dayNumber} ${last.monthName} ${last.year}`;
  }, [timelineConfig]);

  // Filter tasks based on search & filters
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (!g) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = (g.text || '').toLowerCase().includes(q);
        const notesMatch = (g.notes || '').toLowerCase().includes(q);
        const tagMatch = (g.contextTag || '').toLowerCase().includes(q);
        if (!textMatch && !notesMatch && !tagMatch) return false;
      }

      // Status filter
      if (statusFilter === 'active' && g.completed) return false;
      if (statusFilter === 'completed' && !g.completed) return false;

      // Priority filter
      if (priorityFilter !== 'all' && (g.priority || 'Medium') !== priorityFilter) return false;

      // Timeframe filter
      if (timeframeFilter !== 'all') {
        if (timeframeFilter === 'today') {
          if (g.timeframe !== 'daily') return false;
          const match = (g.text || '').match(/^\[D:([^\]]+)\]/);
          if (match && match[1] !== todayKey) return false;
        } else if (g.timeframe !== timeframeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [goals, searchQuery, statusFilter, priorityFilter, timeframeFilter, todayKey]);

  // Compute Task Start Date, End Date, and Span in days
  const getTaskTimelineCoordinates = useCallback((goal: GoalTodo) => {
    const text = goal.text || '';
    let startDate = new Date(goal.createdAt || Date.now());
    let spanDays = 1;

    // Daily tag [D:YYYY-MM-DD]
    const dMatch = text.match(/^\[D:(\d{4}-\d{2}-\d{2})\]/);
    if (dMatch) {
      const parts = dMatch[1].split('-');
      startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      spanDays = goal.timeEstimate === '2h' || goal.timeEstimate === 'half-day' ? 2 : 1;
    } else if (goal.timeframe === 'daily') {
      startDate = new Date(today);
      spanDays = 1;
    } else if (goal.timeframe === 'weekly') {
      const base = goal.createdAt ? new Date(goal.createdAt) : new Date(today);
      const day = base.getDay();
      const diff = base.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(base.setDate(diff));
      spanDays = 7;
    } else if (goal.timeframe === 'monthly') {
      const base = goal.createdAt ? new Date(goal.createdAt) : new Date(today);
      startDate = new Date(base.getFullYear(), base.getMonth(), 1);
      spanDays = 30;
    } else if (goal.timeframe === 'yearly') {
      const base = goal.createdAt ? new Date(goal.createdAt) : new Date(today);
      startDate = new Date(base.getFullYear(), 0, 1);
      spanDays = 90;
    }

    // If task has explicit deadline, adjust span to reach deadline
    if (goal.deadline) {
      const deadParts = goal.deadline.split('-');
      if (deadParts.length === 3) {
        const deadDate = new Date(parseInt(deadParts[0]), parseInt(deadParts[1]) - 1, parseInt(deadParts[2]));
        const diffDays = Math.round((deadDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          spanDays = Math.min(diffDays + 1, 90);
        } else if (diffDays <= 0) {
          startDate = deadDate;
          spanDays = 1;
        }
      }
    }

    // Calculate offset from timeline start date
    const tlStart = timelineConfig.startDate;
    const diffFromTlStart = Math.round((startDate.getTime() - tlStart.getTime()) / (1000 * 60 * 60 * 24));

    return {
      startDate,
      spanDays: Math.max(1, spanDays),
      offsetIndex: diffFromTlStart
    };
  }, [today, timelineConfig.startDate]);

  // Window Listeners for Smooth Drag & Resize Interactivity
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / timelineConfig.dayWidth);
      const hasMoved = dragState.hasMoved || Math.abs(deltaX) > 4;

      setDragState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          hasMoved,
          currentDeltaDays: deltaDays
        };
      });
    };

    const handleMouseUp = () => {
      if (dragState.hasMoved && dragState.currentDeltaDays !== 0) {
        const targetGoal = goals.find(g => g.id === dragState.goalId);
        if (targetGoal) {
          const updatedGoal: GoalTodo = { ...targetGoal };

          if (dragState.type === 'resize-end') {
            // Dragging right edge extends / shortens deadline
            const newSpan = Math.max(1, dragState.originalSpanDays + dragState.currentDeltaDays);
            const newEnd = new Date(dragState.originalStartDate);
            newEnd.setDate(dragState.originalStartDate.getDate() + newSpan - 1);
            updatedGoal.deadline = formatDateKey(newEnd);
          } else if (dragState.type === 'resize-start') {
            // Dragging left edge shifts start date
            const newOffset = dragState.originalOffsetIndex + dragState.currentDeltaDays;
            const newStart = new Date(timelineConfig.startDate);
            newStart.setDate(timelineConfig.startDate.getDate() + newOffset);
            const startKey = formatDateKey(newStart);

            if (updatedGoal.timeframe === 'daily') {
              const clean = cleanGoalText(updatedGoal.text);
              updatedGoal.text = `[D:${startKey}] ${clean}`;
            }
            if (!updatedGoal.deadline) {
              updatedGoal.deadline = formatDateKey(dragState.originalEndDate);
            }
          } else if (dragState.type === 'move') {
            // Dragging whole bar shifts both start date and deadline
            const newOffset = dragState.originalOffsetIndex + dragState.currentDeltaDays;
            const newStart = new Date(timelineConfig.startDate);
            newStart.setDate(timelineConfig.startDate.getDate() + newOffset);
            const startKey = formatDateKey(newStart);

            const newEnd = new Date(newStart);
            newEnd.setDate(newStart.getDate() + dragState.originalSpanDays - 1);
            const deadKey = formatDateKey(newEnd);

            if (updatedGoal.timeframe === 'daily') {
              const clean = cleanGoalText(updatedGoal.text);
              updatedGoal.text = `[D:${startKey}] ${clean}`;
            }
            updatedGoal.deadline = deadKey;
          }

          if (onUpdateGoal) {
            onUpdateGoal(updatedGoal);
          }
        }
      } else if (!dragState.hasMoved && dragState.type === 'move') {
        // Plain click without movement opens details drawer
        onOpenDetails(dragState.goalId);
      }

      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, goals, onUpdateGoal, onOpenDetails, timelineConfig, cleanGoalText, formatDateKey]);

  // Handler to initiate drag or resize
  const handleStartDrag = (
    e: React.MouseEvent,
    goal: GoalTodo,
    type: 'move' | 'resize-start' | 'resize-end',
    coords: { startDate: Date; spanDays: number; offsetIndex: number }
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const endDate = new Date(coords.startDate);
    endDate.setDate(coords.startDate.getDate() + coords.spanDays - 1);

    setDragState({
      type,
      goalId: goal.id,
      startX: e.clientX,
      originalOffsetIndex: coords.offsetIndex,
      originalSpanDays: coords.spanDays,
      originalStartDate: coords.startDate,
      originalEndDate: endDate,
      hasMoved: false,
      currentDeltaDays: 0
    });
  };

  // 1-Click Cell Click to quickly set deadline or move
  const handleCellClick = (goal: GoalTodo, clickedDateKey: string) => {
    const coords = getTaskTimelineCoordinates(goal);
    const parts = clickedDateKey.split('-');
    const clickedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    const updatedGoal = { ...goal };
    if (clickedDate.getTime() >= coords.startDate.getTime()) {
      // Clicked date is after start date: set as new deadline
      updatedGoal.deadline = clickedDateKey;
    } else {
      // Clicked date is before start date: shift start date to clicked date
      if (goal.timeframe === 'daily') {
        const clean = cleanGoalText(goal.text);
        updatedGoal.text = `[D:${clickedDateKey}] ${clean}`;
      }
      const origEnd = new Date(coords.startDate);
      origEnd.setDate(coords.startDate.getDate() + coords.spanDays - 1);
      updatedGoal.deadline = formatDateKey(origEnd);
    }

    if (onUpdateGoal) {
      onUpdateGoal(updatedGoal);
    }
  };

  // Group goals by Timeframe for structured Swiss roadmap
  const GROUPS: Array<{
    id: TimeframeType;
    label: string;
    sublabel: string;
    icon: any;
    color: string;
    borderAccent: string;
    bgAccent: string;
  }> = [
    {
      id: 'daily',
      label: 'Daily Sprints',
      sublabel: 'Immediate Execution Deliverables',
      icon: Sun,
      color: 'text-zinc-200',
      borderAccent: 'border-white/[0.08]',
      bgAccent: 'bg-white/[0.04]'
    },
    {
      id: 'weekly',
      label: 'Weekly Goals',
      sublabel: '7-Day Sprints & Milestones',
      icon: Target,
      color: 'text-zinc-200',
      borderAccent: 'border-white/[0.08]',
      bgAccent: 'bg-white/[0.04]'
    },
    {
      id: 'monthly',
      label: 'Monthly Objectives',
      sublabel: 'Mid-term Strategic Deliverables',
      icon: Layers,
      color: 'text-zinc-200',
      borderAccent: 'border-white/[0.08]',
      bgAccent: 'bg-white/[0.04]'
    },
    {
      id: 'yearly',
      label: 'Annual Vision',
      sublabel: 'High-Level Strategic Outcomes',
      icon: Trophy,
      color: 'text-zinc-200',
      borderAccent: 'border-white/[0.08]',
      bgAccent: 'bg-white/[0.04]'
    }
  ];

  // Navigation handlers
  const handlePrev = () => {
    const shift = zoom === '2weeks' ? 7 : zoom === 'month' ? 14 : 30;
    setDayOffset(prev => prev - shift);
  };

  const handleNext = () => {
    const shift = zoom === '2weeks' ? 7 : zoom === 'month' ? 14 : 30;
    setDayOffset(prev => prev + shift);
  };

  const handleToday = () => {
    setDayOffset(0);
  };

  const timelineScrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4 animate-fadeIn font-sans select-none">
      
      {/* 1. GANTT CONTROL TOOLBAR */}
      <div className="glass-panel-true p-3.5 md:p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        
        {/* Left Toolbar: Period Navigator & Jump to Today */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-white px-2.5 min-w-[140px] text-center font-sans">
              {rangeHeaderString}
            </span>

            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              dayOffset === 0
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Today
          </button>

          {/* Quick Metrics Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <span className="text-zinc-500">Scheduled:</span>
            <span className="font-bold text-white tabular-nums">
              {filteredGoals.filter(g => g.completed).length}/{filteredGoals.length}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="font-semibold tabular-nums" style={{ color: accentColor }}>
              {filteredGoals.length > 0 ? Math.round((filteredGoals.filter(g => g.completed).length / filteredGoals.length) * 100) : 0}% on-track
            </span>
          </div>

          {/* Interactive Hint */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-zinc-400 pl-2">
            <MoveHorizontal className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span>Drag bar edges to resize deadline • Drag bar center to reschedule</span>
          </div>
        </div>

        {/* Right Toolbar: Zoom Switcher */}
        <div className="flex items-center justify-between md:justify-end gap-2">
          <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setZoom('2weeks')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                zoom === '2weeks'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              2 Weeks
            </button>
            <button
              type="button"
              onClick={() => setZoom('month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                zoom === 'month'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setZoom('quarter')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                zoom === 'quarter'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Quarter
            </button>
          </div>
        </div>

      </div>

      {/* 2. MAIN GANTT CANVAS (SPLIT VIEW: STICKY LEFT TASKS + SCROLLABLE RIGHT TIMELINE) */}
      <div className="glass-panel-true border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        
        <div className="flex flex-col">
          
          {/* TOP HEADER ROW: TASK DELIVERABLES (LEFT) + TIMELINE DATE GRID (RIGHT) */}
          <div className="flex border-b border-white/[0.08] bg-[#0c0e14] sticky top-0 z-30">
            
            {/* Left Header Title */}
            <div className="w-[320px] md:w-[380px] shrink-0 p-3.5 border-r border-white/[0.08] flex items-center justify-between bg-[#0e1015]">
              <div className="flex items-center gap-2">
                <GanttChart className="w-4 h-4 text-zinc-300" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Deliverables & Milestones
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 tabular-nums font-semibold">
                {filteredGoals.length} items
              </span>
            </div>

            {/* Right Header: Days Grid Header (Horizontally scrollable) */}
            <div 
              ref={timelineScrollContainerRef}
              className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar"
            >
              <div 
                className="flex"
                style={{ width: `${timelineConfig.totalWidth}px` }}
              >
                {timelineConfig.days.map(d => (
                  <div
                    key={d.dateKey}
                    style={{ 
                      width: `${timelineConfig.dayWidth}px`,
                      ...(d.isToday ? { borderBottomColor: accentColor } : {})
                    }}
                    className={`shrink-0 py-2.5 px-1 text-center border-r border-white/[0.04] flex flex-col items-center justify-center transition-colors ${
                      d.isToday 
                        ? 'bg-white/[0.06] border-b-2' 
                        : d.isWeekend 
                          ? 'bg-white/[0.01]' 
                          : ''
                    }`}
                  >
                    <span 
                      style={d.isToday ? { color: accentColor } : undefined}
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        d.isToday ? 'font-bold' : 'text-zinc-500'
                      }`}
                    >
                      {d.dayName}
                    </span>
                    <span 
                      style={d.isToday ? { backgroundColor: accentColor } : undefined}
                      className={`text-xs font-mono font-bold mt-0.5 ${
                        d.isToday 
                          ? 'w-6 h-6 rounded-full text-black flex items-center justify-center shadow-md' 
                          : 'text-zinc-300'
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 3. TIMELINE BODY ROWS GROUPED BY TIMEFRAME */}
          <div className="divide-y divide-white/[0.06]">
            {GROUPS.map(group => {
              const groupGoals = filteredGoals.filter(g => g.timeframe === group.id);
              const isCollapsed = !!collapsedGroups[group.id];
              const GroupIcon = group.icon;
              const completedCount = groupGoals.filter(g => g.completed).length;
              const totalCount = groupGoals.length;
              const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div key={group.id} className="group-wrapper">
                  
                  {/* Group Header Row */}
                  <div 
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.04] select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-zinc-500">
                        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                      <div className={`w-6 h-6 rounded-lg ${group.bgAccent} border ${group.borderAccent} flex items-center justify-center shrink-0`}>
                        <GroupIcon className="w-3.5 h-3.5 text-zinc-300" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-tight">
                        {group.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 hidden sm:inline">
                        ({group.sublabel})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] text-zinc-300 tabular-nums border border-white/[0.08]">
                        {completedCount}/{totalCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-20 bg-white/[0.06] rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div 
                          className="h-full transition-all duration-300" 
                          style={{ width: `${rate}%`, backgroundColor: accentColor }} 
                        />
                      </div>
                      <span className="text-xs font-mono text-zinc-400 tabular-nums min-w-[32px] text-right">
                        {rate}%
                      </span>
                    </div>
                  </div>

                  {/* Group Tasks Rows */}
                  {!isCollapsed && (
                    <div>
                      {groupGoals.length === 0 ? (
                        <div className="py-4 px-6 text-xs text-zinc-500 italic bg-black/20">
                          No tasks scheduled in {group.label}.
                        </div>
                      ) : (
                        groupGoals.map(goal => {
                          const cleanText = cleanGoalText(goal.text);
                          const coords = getTaskTimelineCoordinates(goal);
                          const prio = goal.priority || 'Medium';
                          const isHighPrio = prio === 'The One Thing' || prio === 'High';
                          const subDone = goal.subTasks ? goal.subTasks.filter(s => s.completed).length : 0;
                          const subTotal = goal.subTasks ? goal.subTasks.length : 0;
                          const subProgress = subTotal > 0 ? (subDone / subTotal) * 100 : goal.completed ? 100 : 0;

                          // Real-time geometry calculation when dragging or resizing
                          const isDraggingThis = dragState?.goalId === goal.id;
                          let effectiveOffset = coords.offsetIndex;
                          let effectiveSpan = coords.spanDays;

                          if (isDraggingThis && dragState) {
                            if (dragState.type === 'resize-end') {
                              effectiveSpan = Math.max(1, dragState.originalSpanDays + dragState.currentDeltaDays);
                            } else if (dragState.type === 'resize-start') {
                              effectiveOffset = dragState.originalOffsetIndex + dragState.currentDeltaDays;
                              effectiveSpan = Math.max(1, dragState.originalSpanDays - dragState.currentDeltaDays);
                            } else if (dragState.type === 'move') {
                              effectiveOffset = dragState.originalOffsetIndex + dragState.currentDeltaDays;
                            }
                          }

                          // Compute pixel bar geometry
                          const barLeft = effectiveOffset * timelineConfig.dayWidth;
                          const barWidth = Math.max(
                            timelineConfig.dayWidth * effectiveSpan - 6,
                            28
                          );

                          // Computed preview dates for tooltip
                          const previewStartDate = new Date(timelineConfig.startDate);
                          previewStartDate.setDate(timelineConfig.startDate.getDate() + effectiveOffset);
                          const previewEndDate = new Date(previewStartDate);
                          previewEndDate.setDate(previewStartDate.getDate() + effectiveSpan - 1);

                          return (
                            <div 
                              key={goal.id}
                              className="flex items-stretch border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group/row min-h-[46px]"
                            >
                              
                              {/* Left Task Info Cell (Fixed Sticky) */}
                              <div className="w-[320px] md:w-[380px] shrink-0 p-2.5 border-r border-white/[0.08] flex items-center justify-between gap-2 bg-[#0c0e14]/90 select-none">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {/* Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => onToggleGoal(goal.id, !goal.completed)}
                                    className={`cursor-pointer transition-transform active:scale-90 shrink-0 ${
                                      goal.completed ? 'text-zinc-400' : 'text-zinc-500 hover:text-white'
                                    }`}
                                  >
                                    {goal.completed ? (
                                      <CheckSquare className="w-4 h-4 text-zinc-300" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>

                                  {/* Task Title & Notes */}
                                  <div 
                                    onClick={() => onOpenDetails(goal.id)}
                                    className="min-w-0 flex-1 cursor-pointer"
                                  >
                                    <span className={`text-xs font-medium leading-snug block truncate ${
                                      goal.completed ? 'line-through text-zinc-500' : 'text-white group-hover/row:text-zinc-100'
                                    }`}>
                                      {cleanText}
                                    </span>
                                  </div>
                                </div>

                                {/* Right action buttons on row */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Priority Badge */}
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                    isHighPrio 
                                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' 
                                      : 'bg-white/[0.04] text-zinc-400'
                                  }`}>
                                    {prio === 'The One Thing' ? '★ 1-Thing' : prio}
                                  </span>

                                  {/* 1-Click Pomodoro Flow */}
                                  <button
                                    type="button"
                                    onClick={() => onStartFocus(goal.id)}
                                    className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                    title="Launch Deep Focus Flow on this task"
                                  >
                                    <Flame className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Open Details */}
                                  <button
                                    type="button"
                                    onClick={() => onOpenDetails(goal.id)}
                                    className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                                    title="Open task properties"
                                  >
                                    <SlidersHorizontal className="w-3 h-3" />
                                  </button>
                                </div>

                              </div>

                              {/* Right Timeline Grid Cell with Interactive Floating Gantt Bar */}
                              <div 
                                className="flex-1 overflow-x-hidden relative flex items-center"
                                style={{ width: `${timelineConfig.totalWidth}px` }}
                              >
                                
                                {/* Background Day Grid Lines (Interactive 1-Click to set date/deadline) */}
                                <div className="absolute inset-0 flex">
                                  {timelineConfig.days.map(d => (
                                    <div
                                      key={d.dateKey}
                                      onClick={() => handleCellClick(goal, d.dateKey)}
                                      style={{ width: `${timelineConfig.dayWidth}px` }}
                                      className={`shrink-0 h-full border-r border-white/[0.02] transition-colors cursor-pointer hover:bg-white/[0.04] ${
                                        d.isToday 
                                          ? 'bg-white/[0.03]' 
                                          : d.isWeekend 
                                            ? 'bg-white/[0.005]' 
                                            : ''
                                      }`}
                                      title={`Click to set schedule / deadline to ${d.dateKey}`}
                                    />
                                  ))}
                                </div>

                                {/* Today's Glowing Cyan Vertical Line Indicator */}
                                {(() => {
                                  const todayIdx = timelineConfig.days.findIndex(d => d.isToday);
                                  if (todayIdx === -1) return null;
                                  const todayLeft = todayIdx * timelineConfig.dayWidth + (timelineConfig.dayWidth / 2);
                                  return (
                                    <div 
                                      className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-10"
                                      style={{ 
                                        left: `${todayLeft}px`,
                                        backgroundColor: accentColor,
                                        boxShadow: `0 0 8px ${accentColor}cc`
                                      }}
                                    />
                                  );
                                })()}

                                {/* Floating Live Drag Tooltip */}
                                {isDraggingThis && dragState.hasMoved && (
                                  <div 
                                    className="absolute -top-7 z-50 px-2.5 py-1 rounded-lg bg-[#0e1015] border text-white text-[11px] font-mono shadow-2xl flex items-center gap-1.5 whitespace-nowrap pointer-events-none"
                                    style={{ 
                                      left: `${Math.max(4, barLeft)}px`,
                                      borderColor: accentColor
                                    }}
                                  >
                                    <Clock className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
                                    <span>
                                      {dragState.type === 'resize-end' ? 'Deadline: ' : dragState.type === 'resize-start' ? 'Start: ' : 'Move: '}
                                      {formatDateKey(previewStartDate)} → {formatDateKey(previewEndDate)}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                      dragState.currentDeltaDays > 0 ? 'bg-white/20 text-white' : dragState.currentDeltaDays < 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white'
                                    }`}>
                                      {dragState.currentDeltaDays > 0 ? `+${dragState.currentDeltaDays}d` : `${dragState.currentDeltaDays}d`}
                                    </span>
                                  </div>
                                )}

                                {/* The Interactive Gantt Bar */}
                                <div
                                  style={{
                                    left: `${Math.max(4, barLeft + 3)}px`,
                                    width: `${barWidth}px`,
                                    ...(isDraggingThis ? { borderColor: accentColor, boxShadow: `0 0 16px ${accentColor}66` } : {}),
                                    ...(!goal.completed && isHighPrio ? { borderColor: `${accentColor}80`, boxShadow: `0 0 12px ${accentColor}33` } : {})
                                  }}
                                  className={`absolute h-7 rounded-lg border transition-shadow flex items-center select-none z-20 group/bar ${
                                    isDraggingThis
                                      ? 'ring-2 ring-white/50 z-40'
                                      : ''
                                  } ${
                                    goal.completed
                                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                      : isHighPrio
                                        ? 'bg-white/[0.08] text-white hover:border-white/40'
                                        : 'bg-[#141720] border-white/15 text-zinc-200 hover:border-white/30'
                                  }`}
                                  title={`${cleanText} • Drag center to shift, drag edges to resize deadline`}
                                >
                                  {/* Left Resize Handle (Start Date) */}
                                  <div
                                    onMouseDown={(e) => handleStartDrag(e, goal, 'resize-start', coords)}
                                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 rounded-l-lg flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity z-30"
                                    title="Drag to change start date"
                                  >
                                    <div className="w-0.5 h-3 rounded-full bg-white/60" />
                                  </div>

                                  {/* Center Drag-to-Move Body */}
                                  <div
                                    onMouseDown={(e) => handleStartDrag(e, goal, 'move', coords)}
                                    className="flex-1 h-full cursor-grab active:cursor-grabbing flex items-center px-2 min-w-0 overflow-hidden relative"
                                  >
                                    {/* Inner Progress Fill (For Subtasks or Completion) */}
                                    {subProgress > 0 && !goal.completed && (
                                      <div 
                                        className="absolute left-0 top-0 bottom-0 bg-white/[0.08] rounded-l-lg pointer-events-none"
                                        style={{ width: `${subProgress}%` }}
                                      />
                                    )}

                                    {/* Bar Content */}
                                    <div className="relative z-10 flex items-center justify-between w-full min-w-0 gap-1.5">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {goal.completed ? (
                                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                        ) : isHighPrio ? (
                                          <span 
                                            className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" 
                                            style={{ backgroundColor: accentColor }}
                                          />
                                        ) : null}
                                        <span className="text-[11px] font-semibold truncate leading-none">
                                          {cleanText}
                                        </span>
                                      </div>

                                      {/* Subtasks or Estimate Indicator inside bar */}
                                      <div className="flex items-center gap-1 shrink-0 text-[10px] text-zinc-400 tabular-nums">
                                        {subTotal > 0 && (
                                          <span className="hidden sm:inline px-1 py-0.2 rounded bg-black/40 text-zinc-300">
                                            {subDone}/{subTotal}
                                          </span>
                                        )}
                                        {goal.timeEstimate && (
                                          <span className="hidden md:inline px-1 py-0.2 rounded bg-black/40 text-zinc-400">
                                            {goal.timeEstimate}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Resize Handle (Deadline Extension / Shortening) */}
                                  <div
                                    onMouseDown={(e) => handleStartDrag(e, goal, 'resize-end', coords)}
                                    className="absolute right-0 top-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-white/20 rounded-r-lg flex items-center justify-center opacity-40 group-hover/bar:opacity-100 transition-opacity z-30"
                                    title="Drag to extend or shorten deadline"
                                  >
                                    <div className="w-1 h-3.5 rounded-full bg-white/70 group-hover/bar:bg-white transition-colors shadow-sm" />
                                  </div>

                                </div>

                              </div>

                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* 4. GANTT FOOTER & TIMELINE LEGEND */}
      <div className="p-3.5 glass-panel-true rounded-2xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        
        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded border" 
              style={{
                backgroundColor: `${accentColor}cc`,
                borderColor: accentColor,
                boxShadow: `0 0 6px ${accentColor}80`
              }}
            />
            <span>High Priority / Critical Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-[#141720] border border-white/20" />
            <span>Standard Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-emerald-950/60 border border-emerald-500/40" />
            <span>Delivered / Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 6px ${accentColor}cc`
              }}
            />
            <span>Today's Marker Line</span>
          </div>
        </div>

        {/* Quick Navigation Hint */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="font-semibold text-zinc-400">Interaction:</span>
          <span>Drag right edge to change deadline • Drag bar to move • Click empty grid cell to set date</span>
        </div>

      </div>

    </div>
  );
}
