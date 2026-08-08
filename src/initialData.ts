/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoalTodo, HabitData, DailyJournal, PersonalExpense } from './types';

export const INITIAL_GOALS: GoalTodo[] = [
  // Daily
  { id: 'g_d1', text: '15-Minute Morning Meditation & Diaphragmatic Breathing', timeframe: 'daily', completed: true, createdAt: Date.now() - 3600000 * 2 },
  { id: 'g_d2', text: 'Complete 4 Hours of High-Intensity Deep Work', timeframe: 'daily', completed: false, createdAt: Date.now() - 3600000 },
  { id: 'g_d3', text: '5km Outdoor Run or Resistance Training', timeframe: 'daily', completed: false, createdAt: Date.now() },
  
  // Weekly
  { id: 'g_w1', text: 'Read & Summarize 1 Book on Systems Thinking / Management', timeframe: 'weekly', completed: true, createdAt: Date.now() - 3600000 * 24 },
  { id: 'g_w2', text: 'Weekly Performance Review & Financial Cash Flow Re-balance', timeframe: 'weekly', completed: false, createdAt: Date.now() },
  
  // Monthly
  { id: 'g_m1', text: 'Achieve $5,000+ Revenue from High-Value Engineering Services', timeframe: 'monthly', completed: false, createdAt: Date.now() - 3600000 * 48 },
  { id: 'g_m2', text: 'Optimize Automated Personal Investment Protocols', timeframe: 'monthly', completed: true, createdAt: Date.now() }
];

const currentMonthYearStr = new Date().toISOString().slice(0, 7);

export const INITIAL_HABITS: HabitData[] = [
  {
    id: 'h1',
    monthYear: currentMonthYearStr,
    habitName: '15m Meditation',
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  {
    id: 'h2',
    monthYear: currentMonthYearStr,
    habitName: '4h Deep Work Focus',
    completedDays: [1, 2, 4, 5, 6, 7, 8]
  },
  {
    id: 'h3',
    monthYear: currentMonthYearStr,
    habitName: '30m Reading & Synthesis',
    completedDays: [1, 3, 4, 5, 7, 8]
  },
  {
    id: 'h4',
    monthYear: currentMonthYearStr,
    habitName: '5km Cardio / Fitness',
    completedDays: [2, 4, 6, 8]
  }
];

export const INITIAL_JOURNAL: DailyJournal[] = [
  {
    id: '2026-07-10',
    energy: 5,
    text: 'Highly productive focus session today. Completed the primary architecture layout and system flow. Grateful for clarity.',
    updatedAt: Date.now() - 3600000 * 24 * 6
  },
  {
    id: '2026-07-11',
    energy: 4,
    text: 'Sustained energy throughout the morning. Minor afternoon dip resolved swiftly after a 15-minute mindfulness reset.',
    updatedAt: Date.now() - 3600000 * 24 * 5
  },
  {
    id: '2026-07-12',
    energy: 3,
    text: 'Active recovery day. Recharged outdoors and refreshed creative stamina without heavy work load.',
    updatedAt: Date.now() - 3600000 * 24 * 4
  },
  {
    id: '2026-07-13',
    energy: 5,
    text: 'Peak flow state achieved! Polished UI v5.0 with pristine spacing and exact typographic execution.',
    updatedAt: Date.now() - 3600000 * 24 * 3
  },
  {
    id: '2026-07-14',
    energy: 4,
    text: 'Maintained strong Deep Work momentum. Healthy nutrition and early sleep routine.',
    updatedAt: Date.now() - 3600000 * 24 * 2
  },
  {
    id: '2026-07-15',
    energy: 4,
    text: 'Mid-week review completed smoothly. Strong mastery over daily habit execution brings immense confidence.',
    updatedAt: Date.now() - 3600000 * 24 * 1
  },
  {
    id: '2026-07-16',
    energy: 5,
    text: 'Woke up energized and clear-minded. Ready to execute high-impact strategic priorities today.',
    updatedAt: Date.now()
  }
];

export const INITIAL_EXPENSES: PersonalExpense[] = [
  { id: 'exp1', date: '2026-07-11', amount: 120000, category: 'Eating', note: 'Artisanal Breakfast & Cold Brew Coffee' },
  { id: 'exp2', date: '2026-07-12', amount: 350000, category: 'Entertainment', note: 'Evening Live Concert & Gallery Admission' },
  { id: 'exp3', date: '2026-07-13', amount: 1500000, category: 'Study/Equipment', note: 'Systems Architecture Masterclass Enrollment' },
  { id: 'exp4', date: '2026-07-14', amount: 80000, category: 'Transport', note: 'Transit & Metro Pass Reload' },
  { id: 'exp5', date: '2026-07-15', amount: 210000, category: 'Eating', note: 'Organic Fruit & High-Protein Fuel Supplies' }
];

export const INITIAL_SCRATCHPAD_TEXT = `== DEEP FOCUS INTEGRATED OS v5.0 ==
Architected for Peak Performance — Unwavering Discipline, Open Mindset.

[CORE 2026 STRATEGIC OBJECTIVES]
1. Master personal cash flow velocity and maintain sustainable financial autonomy.
2. Maintain strict 4-hour daily uninterrupted Deep Work execution.
3. Optimize cognitive and physical endurance, targeting 100km+ monthly cardio.

[CREATIVE INSIGHTS & BREAKTHROUGHS]
- Automate habit tracking telemetry and export monthly performance analytics in PDF.
- Draft minimal philosophy essay on workplace layout optimization and focus density.

[QUICK SCRATCHPAD NOTES]
- Re-allocate non-essential entertainment budget toward education and professional tool stack.
- Schedule Q3 strategic sync with lead advisor on Saturday morning.`;
