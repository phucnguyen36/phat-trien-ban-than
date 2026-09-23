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
  { id: 'g_w1', text: 'Read & summarize 1 chapter on design and creative systems', timeframe: 'weekly', completed: true, createdAt: Date.now() - 3600000 * 24 },
  { id: 'g_w2', text: 'Weekly performance review and cash flow re-balance', timeframe: 'weekly', completed: false, createdAt: Date.now() },
  
  // Monthly
  { id: 'g_m1', text: 'Deliver all scheduled video & design client milestones', timeframe: 'monthly', completed: false, createdAt: Date.now() - 3600000 * 48 },
  { id: 'g_m2', text: 'Optimize automated monthly savings and investments', timeframe: 'monthly', completed: true, createdAt: Date.now() }
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
    text: 'Peak flow state achieved! Polished UI with pristine spacing and exact typographic execution.',
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
  { id: 'exp1', date: '2026-07-11', amount: 120000, category: 'Eating', note: 'Breakfast & Coffee' },
  { id: 'exp2', date: '2026-07-12', amount: 350000, category: 'Entertainment', note: 'Live Concert & Gallery Admission' },
  { id: 'exp3', date: '2026-07-13', amount: 1500000, category: 'Study/Equipment', note: 'Design & Motion Masterclass' },
  { id: 'exp4', date: '2026-07-14', amount: 80000, category: 'Transport', note: 'Transit Pass Reload' },
  { id: 'exp5', date: '2026-07-15', amount: 210000, category: 'Eating', note: 'Groceries & Nutrition' }
];

export const INITIAL_SCRATCHPAD_TEXT = `# Focus & Strategic Notes

- Priority 1: Maintain 4-hour daily uninterrupted deep work sessions.
- Priority 2: Optimize personal cash flow and monthly expense allocations.
- Priority 3: Target 100km+ monthly outdoor cardio and fitness routine.

## Ideas & Quick References
- Clean architecture and minimal Swiss typography create maximum focus density.
- Schedule weekly review every Sunday evening to calibrate roadmap.`;
