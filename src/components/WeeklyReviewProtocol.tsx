/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { GoalTodo, TimeframeType } from '../types';
import { 
  Trophy, 
  Hourglass, 
  Target, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  Save, 
  Check, 
  TrendingUp 
} from 'lucide-react';

interface WeeklyReviewProtocolProps {
  goals: GoalTodo[];
  onAddGoal: (text: string, timeframe: TimeframeType) => void;
  isLightMode?: boolean;
}

interface ReviewEntry {
  periodType: 'weekly' | 'monthly';
  periodKey: string;
  biggestWin: string;
  timeWasters: string;
  topPriorityNext: string;
  updatedAt: number;
}

export const WeeklyReviewProtocol: React.FC<WeeklyReviewProtocolProps> = ({
  goals,
  onAddGoal,
  isLightMode
}) => {
  const [reviewType, setReviewType] = useState<'weekly' | 'monthly'>('weekly');
  
  // Calculate current week and month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  const currentWeekNum = Math.ceil(now.getDate() / 7);
  const currentWeekStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-W${currentWeekNum}`;

  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    reviewType === 'weekly' ? currentWeekStr : currentMonthStr
  );

  const handleSwitchType = (type: 'weekly' | 'monthly') => {
    setReviewType(type);
    setSelectedPeriod(type === 'weekly' ? currentWeekStr : currentMonthStr);
  };

  // Form State
  const [biggestWin, setBiggestWin] = useState('');
  const [timeWasters, setTimeWasters] = useState('');
  const [topPriorityNext, setTopPriorityNext] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [addedAsGoal, setAddedAsGoal] = useState(false);

  // Storage key
  const storageKey = `df_review_${reviewType}_${selectedPeriod}`;

  // Load saved review data when period changes
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setBiggestWin(parsed.biggestWin || '');
        setTimeWasters(parsed.timeWasters || '');
        setTopPriorityNext(parsed.topPriorityNext || '');
      } catch {
        setBiggestWin('');
        setTimeWasters('');
        setTopPriorityNext('');
      }
    } else {
      setBiggestWin('');
      setTimeWasters('');
      setTopPriorityNext('');
    }
    setIsSaved(false);
    setAddedAsGoal(false);
  }, [storageKey]);

  // Save review
  const handleSaveReview = () => {
    const entry: ReviewEntry = {
      periodType: reviewType,
      periodKey: selectedPeriod,
      biggestWin,
      timeWasters,
      topPriorityNext,
      updatedAt: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(entry));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Convert "#1 Goal" into an actual task
  const handleConvertGoal = () => {
    if (!topPriorityNext.trim()) return;
    const targetTimeframe: TimeframeType = reviewType === 'weekly' ? 'weekly' : 'monthly';
    onAddGoal(`🔥 ${topPriorityNext.trim()}`, targetTimeframe);
    setAddedAsGoal(true);
    setTimeout(() => setAddedAsGoal(false), 3000);
  };

  // Calculate statistics for the current period
  const stats = useMemo(() => {
    const timeframeFilter: TimeframeType = reviewType === 'weekly' ? 'weekly' : 'monthly';
    const periodGoals = goals.filter(g => g.timeframe === timeframeFilter);
    const total = periodGoals.length;
    const completed = periodGoals.filter(g => g.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [goals, reviewType]);

  // Generate period options (current and last 6 periods)
  const periodOptions = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (reviewType === 'weekly') {
      for (let i = 0; i < 6; i++) {
        const w = currentWeekNum - i;
        if (w > 0) {
          const key = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-W${w}`;
          list.push({ key, label: `Week W${w} (${currentMonthNum}/${currentYear})` });
        }
      }
    } else {
      for (let i = 0; i < 6; i++) {
        let m = currentMonthNum - i;
        let y = currentYear;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        const key = `${y}-${String(m).padStart(2, '0')}`;
        const monthName = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
        list.push({ key, label: `${monthName} ${y}` });
      }
    }
    return list;
  }, [reviewType, currentWeekNum, currentMonthNum, currentYear]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#1591DC]" />
            <span>{reviewType === 'weekly' ? 'Weekly Review Protocol' : 'Monthly Review Protocol'}</span>
          </h3>
          <p className="text-xs text-[#9496a1] mt-0.5">
            Audit your cycle execution, eliminate bottlenecks, and lock in your #1 next priority
          </p>
        </div>

        {/* Controls: Type Switcher & Period Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Week vs Month Switcher */}
          <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleSwitchType('weekly')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                reviewType === 'weekly'
                  ? 'bg-[#1591DC] text-white shadow-sm font-semibold'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              Weekly Review
            </button>
            <button
              type="button"
              onClick={() => handleSwitchType('monthly')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                reviewType === 'monthly'
                  ? 'bg-[#1591DC] text-white shadow-sm font-semibold'
                  : 'text-[#9496a1] hover:text-white'
              }`}
            >
              Monthly Review
            </button>
          </div>

          {/* Period Dropdown */}
          <div className="flex items-center gap-1.5 glass-card-true px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#1591DC]" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              {periodOptions.map(p => (
                <option key={p.key} value={p.key} className="bg-[#12141a] text-white">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Snapshot Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card-true p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[#9496a1] block mb-1">Period Targets</span>
            <span className="text-2xl font-bold tabular-nums text-white">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#9496a1]">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card-true p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[#9496a1] block mb-1">Completed</span>
            <span className="text-2xl font-bold tabular-nums text-emerald-400">{stats.completed}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card-true p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[#9496a1] block mb-1">Win Rate</span>
            <span className="text-2xl font-bold tabular-nums text-[#1591DC]">{stats.rate}%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#1591DC]/10 border border-[#1591DC]/20 flex items-center justify-center text-[#1591DC]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3 Core Questions Section */}
      <div className="space-y-5">
        
        {/* Question 1: Biggest Win */}
        <div className="glass-card-true p-5 rounded-2xl space-y-2 border border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <label className="text-xs font-semibold text-white">
              1. What was your biggest win {reviewType === 'weekly' ? 'this week' : 'this month'}?
            </label>
          </div>
          <p className="text-[11px] text-[#9496a1] pl-8">
            Highlight your key achievements, breakthrough milestones, or standout habits:
          </p>
          <div className="pl-8 pt-1">
            <textarea
              rows={3}
              value={biggestWin}
              onChange={(e) => setBiggestWin(e.target.value)}
              placeholder="e.g. Shipped 5 high-retention video edits, closed 2 enterprise clients, hit gym 4x..."
              className="w-full glass-input-true p-3 text-xs text-white rounded-xl resize-none focus:outline-none"
            />
          </div>
        </div>

        {/* Question 2: Time Wasters & Bottlenecks */}
        <div className="glass-card-true p-5 rounded-2xl space-y-2 border border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Hourglass className="w-3.5 h-3.5" />
            </div>
            <label className="text-xs font-semibold text-white">
              2. What wasted the most time or created bottlenecks?
            </label>
          </div>
          <p className="text-[11px] text-[#9496a1] pl-8">
            Identify distractions, operational frictions, or low-leverage activities:
          </p>
          <div className="pl-8 pt-1">
            <textarea
              rows={3}
              value={timeWasters}
              onChange={(e) => setTimeWasters(e.target.value)}
              placeholder="e.g. Aimless morning social media scrolling, unclear script outlines before shooting..."
              className="w-full glass-input-true p-3 text-xs text-white rounded-xl resize-none focus:outline-none"
            />
          </div>
        </div>

        {/* Question 3: The #1 Priority */}
        <div className="glass-card-true p-5 rounded-2xl space-y-2 border border-[#1591DC]/30 bg-[#1591DC]/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1591DC]/15 border border-[#1591DC]/30 flex items-center justify-center text-[#1591DC] shrink-0">
              <Target className="w-3.5 h-3.5" />
            </div>
            <label className="text-xs font-semibold text-white">
              3. What is your #1 priority {reviewType === 'weekly' ? 'next week' : 'next month'}?
            </label>
          </div>
          <p className="text-[11px] text-[#9496a1] pl-8">
            The One Thing: If you could accomplish only ONE high-impact goal that makes everything else easier, what is it?
          </p>
          <div className="pl-8 pt-1 space-y-3">
            <input
              type="text"
              value={topPriorityNext}
              onChange={(e) => setTopPriorityNext(e.target.value)}
              placeholder="e.g. Launch the creator coaching program landing page and open first 10 spots..."
              className="w-full glass-input-true px-3.5 py-2.5 text-xs text-white rounded-xl font-medium focus:outline-none"
            />
            {topPriorityNext.trim() && (
              <button
                type="button"
                onClick={handleConvertGoal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  addedAsGoal
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'glass-button-true text-[#1591DC] hover:text-white border-[#1591DC]/30'
                }`}
              >
                {addedAsGoal ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added to {reviewType === 'weekly' ? 'Weekly' : 'Monthly'} Tasks list!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Turn into {reviewType === 'weekly' ? 'Weekly Task' : 'Monthly Task'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
        <span className="text-xs text-[#9496a1]">
          Review logs are automatically saved per cycle.
        </span>

        <button
          type="button"
          onClick={handleSaveReview}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            isSaved 
              ? 'bg-emerald-500 text-black shadow-lg' 
              : 'btn-primary-cyan text-white'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Review saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save review</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WeeklyReviewProtocol;
