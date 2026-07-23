/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TimeframeType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface GoalTodo {
  id: string;
  text: string;
  timeframe: TimeframeType;
  completed: boolean;
  createdAt: number;
}

export interface HabitData {
  id: string;
  monthYear: string; // YYYY-MM
  habitName: string;
  completedDays: number[]; // Array of days, e.g., [1, 5, 12]
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

