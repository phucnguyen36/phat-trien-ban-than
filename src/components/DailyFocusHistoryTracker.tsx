/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  usePomodoro, 
  FocusSessionRecord, 
  DailyFocusSummary,
  getLocalDateStr 
} from '../context/PomodoroContext';
import { 
  Calendar, 
  Clock, 
  Flame, 
  BarChart3, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  X, 
  History,
  Layers,
  Sparkles
} from 'lucide-react';
import { GoalTodo } from '../types';

interface DailyFocusHistoryTrackerProps {
  candidateTasks?: GoalTodo[];
}

export const DailyFocusHistoryTracker: React.FC<DailyFocusHistoryTrackerProps> = ({ candidateTasks = [] }) => {
  const {
    allSessions,
    todaySessions,
    dailyFocusSummaries,
    addFocusSession,
    deleteFocusSession
  } = usePomodoro();

  const [activeTab, setActiveTab] = useState<'byDate' | 'weekly' | 'today'>('byDate');
  const [expandedDate, setExpandedDate] = useState<string | null>(() => getLocalDateStr());
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Manual Log Form State
  const [manualDate, setManualDate] = useState<string>(() => getLocalDateStr());
  const [manualMinutes, setManualMinutes] = useState<number>(25);
  const [manualTaskTitle, setManualTaskTitle] = useState<string>('');
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customDurationInput, setCustomDurationInput] = useState<string>('25');

  // Key KPI metrics
  const totalFocusSessionsCount = useMemo(() => {
    return allSessions.filter(s => s.mode === 'focus').length;
  }, [allSessions]);

  const totalFocusMinutesAll = useMemo(() => {
    return allSessions
      .filter(s => s.mode === 'focus')
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [allSessions]);

  const activeDaysCount = useMemo(() => {
    const datesWithFocus = new Set(
      allSessions
        .filter(s => s.mode === 'focus')
        .map(s => s.dateStr || getLocalDateStr(new Date(s.timestamp)))
    );
    return datesWithFocus.size;
  }, [allSessions]);

  const dailyAverageSessions = useMemo(() => {
    if (activeDaysCount === 0) return '0.0';
    return (totalFocusSessionsCount / activeDaysCount).toFixed(1);
  }, [totalFocusSessionsCount, activeDaysCount]);

  // Focus Streak (consecutive days with at least 1 focus block ending today or yesterday)
  const currentStreakDays = useMemo(() => {
    const today = new Date();
    let streak = 0;
    
    // Check backwards day by day
    for (let i = 0; i < 60; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const ds = getLocalDateStr(d);
      const hasFocus = allSessions.some(
        s => s.mode === 'focus' && (s.dateStr === ds || getLocalDateStr(new Date(s.timestamp)) === ds)
      );
      if (hasFocus) {
        streak++;
      } else {
        // If today has 0 sessions yet, don't break streak if yesterday had focus
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  }, [allSessions]);

  // Weekly 7-day visual chart data
  const last7DaysChartData = useMemo(() => {
    const today = new Date();
    const list = [];
    const maxValRef = { max: 1 };

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const ds = getLocalDateStr(d);
      const daySessions = allSessions.filter(
        s => s.mode === 'focus' && (s.dateStr === ds || getLocalDateStr(new Date(s.timestamp)) === ds)
      );
      const count = daySessions.length;
      const minutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const dateNumber = d.getDate();
      const isToday = i === 0;

      if (count > maxValRef.max) maxValRef.max = count;

      list.push({
        dateStr: ds,
        dayLabel,
        dateNumber,
        count,
        minutes,
        isToday
      });
    }

    return { list, maxCount: Math.max(8, maxValRef.max) };
  }, [allSessions]);

  // Handlers
  const handleToggleExpandDate = (dateStr: string) => {
    setExpandedDate(prev => (prev === dateStr ? null : dateStr));
  };

  const handleSaveManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMinutes = isCustomDuration ? (parseInt(customDurationInput, 10) || 25) : manualMinutes;
    if (finalMinutes <= 0) return;

    addFocusSession({
      dateStr: manualDate,
      durationMinutes: finalMinutes,
      taskTitle: manualTaskTitle.trim() || 'Manual Deep Work Session',
      mode: 'focus'
    });

    // Reset & close
    setManualTaskTitle('');
    setIsManualModalOpen(false);
    setExpandedDate(manualDate);
  };

  const handleDeleteSession = (id: string) => {
    deleteFocusSession(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="glass-panel-true p-5 rounded-2xl border border-white/15 space-y-4 shadow-lg">
      
      {/* 1. HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1591DC]/15 border border-[#1591DC]/30 flex items-center justify-center text-[#1591DC]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Focus History & Logs
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1591DC]/20 text-[#1591DC] font-semibold">
                {totalFocusSessionsCount} Sessions
              </span>
            </div>
            <p className="text-[11px] text-[#9496a1]">
              Daily completed sessions & historical focus storage
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* View Tab Switcher */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.08] p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('byDate')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                activeTab === 'byDate'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              By Date
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weekly')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                activeTab === 'weekly'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              7-Day View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              Today
            </button>
          </div>

          {/* + Log Session Button */}
          <button
            type="button"
            onClick={() => setIsManualModalOpen(prev => !prev)}
            className="px-2.5 py-1 rounded-lg bg-[#1591DC]/20 hover:bg-[#1591DC]/30 text-[#1591DC] border border-[#1591DC]/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Manually log a focus block for any date"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Block</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT KPI STRIP */}
      <div className="grid grid-cols-4 gap-2 text-center bg-[#0e1015] p-2.5 rounded-xl border border-white/[0.06]">
        <div>
          <span className="text-[10px] text-[#9496a1] uppercase tracking-wider block font-medium">
            Total Blocks
          </span>
          <span className="text-sm font-bold text-white tabular-nums">
            {totalFocusSessionsCount}
          </span>
        </div>
        <div className="border-l border-white/[0.06]">
          <span className="text-[10px] text-[#9496a1] uppercase tracking-wider block font-medium">
            Total Hours
          </span>
          <span className="text-sm font-bold text-[#1591DC] tabular-nums">
            {(totalFocusMinutesAll / 60).toFixed(1)}h
          </span>
        </div>
        <div className="border-l border-white/[0.06]">
          <span className="text-[10px] text-[#9496a1] uppercase tracking-wider block font-medium">
            Daily Avg
          </span>
          <span className="text-sm font-bold text-white tabular-nums">
            {dailyAverageSessions}
          </span>
        </div>
        <div className="border-l border-white/[0.06]">
          <span className="text-[10px] text-[#9496a1] uppercase tracking-wider block font-medium flex items-center justify-center gap-0.5">
            <Flame className="w-2.5 h-2.5 text-amber-400" />
            <span>Streak</span>
          </span>
          <span className="text-sm font-bold text-amber-400 tabular-nums">
            {currentStreakDays}d
          </span>
        </div>
      </div>

      {/* 3. INLINE MANUAL LOG FORM (EXPANDABLE) */}
      {isManualModalOpen && (
        <form 
          onSubmit={handleSaveManualSession}
          className="p-3.5 rounded-xl bg-[#0e1015] border border-[#1591DC]/40 space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#1591DC]" />
              <span>Record Completed Focus Block</span>
            </span>
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="text-[#9496a1] hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Target Date */}
            <div>
              <label className="text-[10px] font-semibold text-[#9496a1] uppercase tracking-wider block mb-1">
                Date
              </label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#1591DC] focus:outline-none"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-[10px] font-semibold text-[#9496a1] uppercase tracking-wider block mb-1">
                Duration (Minutes)
              </label>
              <div className="flex items-center gap-1">
                {[
                  { label: '25m', mins: 25 },
                  { label: '50m', mins: 50 },
                  { label: '90m', mins: 90 }
                ].map(p => (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => {
                      setIsCustomDuration(false);
                      setManualMinutes(p.mins);
                    }}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      !isCustomDuration && manualMinutes === p.mins
                        ? 'bg-[#1591DC] text-white font-semibold'
                        : 'bg-white/[0.04] text-[#9496a1] hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomDuration(true)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isCustomDuration
                      ? 'bg-[#1591DC] text-white font-semibold'
                      : 'bg-white/[0.04] text-[#9496a1] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  Custom
                </button>
              </div>
              {isCustomDuration && (
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={customDurationInput}
                  onChange={(e) => setCustomDurationInput(e.target.value)}
                  className="w-full mt-1.5 bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white focus:border-[#1591DC] focus:outline-none"
                  placeholder="Minutes..."
                />
              )}
            </div>
          </div>

          {/* Task / Work Note */}
          <div>
            <label className="text-[10px] font-semibold text-[#9496a1] uppercase tracking-wider block mb-1">
              Task or Focus Topic
            </label>
            <input
              type="text"
              value={manualTaskTitle}
              onChange={(e) => setManualTaskTitle(e.target.value)}
              placeholder="e.g. Video motion delivery, Database refactoring..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#1591DC] focus:outline-none"
            />
            {candidateTasks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <span className="text-[10px] text-zinc-500">Pick from active tasks:</span>
                {candidateTasks.slice(0, 3).map(task => {
                  const cleanText = task.text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '');
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setManualTaskTitle(cleanText)}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-[#9496a1] hover:text-white truncate max-w-[160px] border border-white/[0.06]"
                    >
                      {cleanText}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[#9496a1] hover:text-white hover:bg-white/[0.04] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-cyan px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-md"
            >
              Save Focus Block
            </button>
          </div>
        </form>
      )}

      {/* 4. TAB CONTENT */}

      {/* TAB A: BY DATE (The Core requested daily storage view) */}
      {activeTab === 'byDate' && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {dailyFocusSummaries.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9496a1] border border-dashed border-white/[0.08] rounded-xl">
              No recorded focus sessions yet. Complete your first block to populate daily history.
            </div>
          ) : (
            dailyFocusSummaries.map(summary => {
              const isExpanded = expandedDate === summary.dateStr;
              const isToday = summary.dateStr === getLocalDateStr();
              const hasFocus = summary.totalSessions > 0;

              return (
                <div
                  key={summary.dateStr}
                  className={`rounded-xl border transition-all ${
                    isExpanded 
                      ? 'bg-[#0e1015] border-[#1591DC]/40 shadow-sm' 
                      : 'bg-[#0e1015]/60 hover:bg-[#0e1015] border-white/[0.06]'
                  }`}
                >
                  {/* Day Summary Row Header */}
                  <div
                    onClick={() => handleToggleExpandDate(summary.dateStr)}
                    className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        hasFocus ? 'bg-[#1591DC]' : 'bg-zinc-600'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${isToday ? 'text-white' : 'text-[#ededf3]'}`}>
                            {summary.displayDate}
                          </span>
                          {isToday && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1591DC]/20 text-[#1591DC] font-semibold uppercase tracking-wider">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#9496a1]">
                          {summary.sessions.length} total event{summary.sessions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Session Count Pill */}
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold tabular-nums ${
                        summary.totalSessions > 0
                          ? 'bg-[#1591DC]/15 text-[#1591DC] border border-[#1591DC]/30'
                          : 'bg-white/[0.04] text-zinc-500'
                      }`}>
                        {summary.totalSessions} {summary.totalSessions === 1 ? 'block' : 'blocks'}
                      </span>

                      {/* Total Duration */}
                      <span className="text-[11px] text-[#9496a1] tabular-nums font-medium min-w-[50px] text-right">
                        {Math.floor(summary.totalFocusMinutes / 60)}h {summary.totalFocusMinutes % 60}m
                      </span>

                      <ChevronDown className={`w-3.5 h-3.5 text-[#9496a1] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Session Records inside this Day */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] space-y-1.5 animate-fadeIn">
                      {summary.sessions.length === 0 ? (
                        <div className="text-[11px] text-zinc-500 py-2 text-center">
                          No focus sessions recorded on this date.
                        </div>
                      ) : (
                        summary.sessions.map(session => (
                          <div
                            key={session.id}
                            className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between gap-2 text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                session.mode === 'focus' ? 'bg-[#1591DC]' : 'bg-emerald-400'
                              }`} />
                              <span className="text-white truncate font-medium">
                                {session.taskTitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-[#9496a1] text-[11px] tabular-nums">
                              <span className="font-semibold text-zinc-300">
                                {session.durationMinutes}m
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>

                              {/* Delete Session Action */}
                              {confirmDeleteId === session.id ? (
                                <div className="flex items-center gap-1 pl-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="p-0.5 rounded text-rose-400 hover:text-rose-300"
                                    title="Confirm delete"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="p-0.5 rounded text-zinc-500 hover:text-white"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(session.id)}
                                  className="text-zinc-600 hover:text-rose-400 transition-colors p-0.5"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB B: WEEKLY 7-DAY VISUAL OVERVIEW */}
      {activeTab === 'weekly' && (
        <div className="space-y-3 bg-[#0e1015] p-3.5 rounded-xl border border-white/[0.06] animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-[#9496a1]">
            <span className="font-semibold text-white">Last 7 Days Focus Distribution</span>
            <span className="tabular-nums">Max {last7DaysChartData.maxCount} blocks/day</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-4 pb-1">
            {last7DaysChartData.list.map(day => {
              const heightPct = Math.max(8, Math.round((day.count / last7DaysChartData.maxCount) * 100));
              return (
                <div 
                  key={day.dateStr}
                  onClick={() => {
                    setExpandedDate(day.dateStr);
                    setActiveTab('byDate');
                  }}
                  className="flex flex-col items-center justify-end h-full gap-1 cursor-pointer group"
                  title={`${day.dateStr}: ${day.count} blocks (${day.minutes} mins)`}
                >
                  <span className="text-[10px] text-[#9496a1] group-hover:text-white tabular-nums font-semibold">
                    {day.count > 0 ? day.count : ''}
                  </span>
                  
                  {/* Bar */}
                  <div className="w-full bg-white/[0.04] rounded-t-md h-full flex items-end overflow-hidden p-0.5">
                    <div 
                      className={`w-full rounded-t transition-all duration-500 ${
                        day.count === 0 
                          ? 'bg-zinc-800' 
                          : day.isToday
                            ? 'bg-[#1591DC] shadow-[0_0_10px_rgba(21,145,220,0.5)]' 
                            : 'bg-[#1591DC]/70 group-hover:bg-[#1591DC]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="text-center">
                    <span className={`text-[10px] block font-bold leading-none ${
                      day.isToday ? 'text-[#1591DC]' : 'text-zinc-400'
                    }`}>
                      {day.dayLabel}
                    </span>
                    <span className="text-[9px] text-zinc-500 tabular-nums">
                      {day.dateNumber}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-zinc-500 text-center pt-1 border-t border-white/[0.04]">
            Click any column to jump to that day's session breakdown
          </div>
        </div>
      )}

      {/* TAB C: TODAY'S TIMELINE */}
      {activeTab === 'today' && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 animate-fadeIn">
          {todaySessions.length === 0 ? (
            <div className="text-xs text-[#9496a1] py-8 text-center border border-dashed border-white/[0.06] rounded-xl">
              No sessions logged yet today. Start the timer to complete your first focus session!
            </div>
          ) : (
            todaySessions.map(session => (
              <div
                key={session.id}
                className="p-2.5 rounded-xl bg-[#0e1015] border border-white/[0.06] flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    session.mode === 'focus' ? 'bg-[#1591DC]' : 'bg-emerald-400'
                  }`} />
                  <span className="text-white font-medium truncate">
                    {session.taskTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[#9496a1] tabular-nums text-[11px]">
                  <span className="text-zinc-200 font-semibold">{session.durationMinutes}m</span>
                  <span>•</span>
                  <span>
                    {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-zinc-600 hover:text-rose-400 transition-colors ml-1 p-0.5"
                    title="Delete session"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default DailyFocusHistoryTracker;
