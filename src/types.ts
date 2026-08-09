/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TimeframeType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type TimeEstimate = '15m' | '30m' | '1h' | '2h' | 'half-day';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface GoalTodo {
  id: string;
  text: string;
  timeframe: TimeframeType;
  completed: boolean;
  createdAt: number;
  timeEstimate?: TimeEstimate; // A1 — Time Estimate
  habitLink?: string;           // A3 — Goal-Habit Link (habitId)
  isTop3?: boolean;             // A4 — Morning 3-Priority capture
  isRecurring?: boolean;        // C2 — Recurring task flag
  elapsedSeconds?: number;      // B2 — Time tracker spent seconds
  notes?: string;               // Notion-style rich task notes
  subTasks?: SubTask[];         // Sub-tasks checklist
  priority?: 'The One Thing' | 'High' | 'Medium' | 'Low' | 'As and When';
  contextTag?: string;          // Context tags e.g. "Productivity", "Editing"
  deadline?: string;            // Target deadline YYYY-MM-DD
}

export interface HabitData {
  id: string;
  monthYear: string; // YYYY-MM
  habitName: string;
  completedDays: number[]; // Array of days, e.g., [1, 5, 12]
  linkedGoalId?: string;   // A3 — Goal-Habit Link
}

export interface DailyJournal {
  id: string; // Date format YYYY-MM-DD
  energy: number; // 1-5
  text: string;
  updatedAt: number;
}

export type ExpenseCategory = 'Eating' | 'Transport' | 'Study/Equipment' | 'Entertainment' | 'Others';

export interface PersonalExpense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: ExpenseCategory;
  note: string;
}

export interface QuickScratchpad {
  id: string; // 'single_doc'
  text: string;
  lastUpdated: number;
}

export interface ScratchpadNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface WeeklyReview {
  id: string;        // ISO week e.g. "2026-W32"
  weekLabel: string; // "Aug 5 – Aug 11"
  completionPct: number;  // % goals completed
  topTask: string;
  timeWaste: string;
  energyAvg: number;
  journalCount: number;
  habitAvg: number;
  createdAt: number;
}
