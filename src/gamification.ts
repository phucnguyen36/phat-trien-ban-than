import { GoalTodo, HabitData, DailyJournal, PersonalExpense } from './types';

export interface GamificationStats {
  totalXP: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  tierName: string;
  tierColor: string;
  badgesCount: number;
  totalCompletedTasks: number;
  activeHabitStreaks: number;
  totalJournalEntries: number;
}

export function calculateGamification(
  goals: GoalTodo[],
  habits: HabitData[],
  journals: DailyJournal[],
  expenses: PersonalExpense[]
): GamificationStats {
  // Task XP (50 XP per completed task)
  const completedTasks = goals.filter(g => g.completed);
  const taskXP = completedTasks.length * 50;

  // Habit XP (25 XP per completed day)
  let habitXP = 0;
  let activeHabitStreaks = 0;
  habits.forEach(h => {
    const daysCount = h.completedDays ? h.completedDays.length : 0;
    habitXP += (daysCount * 25);
    if (daysCount > 0) activeHabitStreaks++;
  });

  // Journal XP (30 XP per journal entry)
  const journalXP = journals.length * 30;

  // Expense logging XP (10 XP per transaction entry)
  const expenseXP = expenses.length * 10;

  const totalXP = taskXP + habitXP + journalXP + expenseXP;

  // Level logic: 250 XP per level
  const levelCost = 250;
  const currentLevel = Math.max(1, Math.floor(totalXP / levelCost) + 1);
  const xpInCurrentLevel = totalXP % levelCost;
  const xpNeededForNextLevel = levelCost;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / levelCost) * 100));

  let tierName = 'Apprentice';
  let tierColor = 'from-blue-500 to-cyan-400';

  if (currentLevel >= 20) {
    tierName = 'Titan';
    tierColor = 'from-amber-400 via-rose-500 to-purple-600';
  } else if (currentLevel >= 15) {
    tierName = 'Architect';
    tierColor = 'from-purple-500 to-indigo-500';
  } else if (currentLevel >= 10) {
    tierName = 'Strategist';
    tierColor = 'from-emerald-400 to-teal-600';
  } else if (currentLevel >= 5) {
    tierName = 'Achiever';
    tierColor = 'from-blue-500 to-indigo-600';
  }

  // Calculate Badges unlocked
  let badgesCount = 1;
  if (completedTasks.length >= 5) badgesCount++;
  if (completedTasks.length >= 20) badgesCount++;
  if (activeHabitStreaks >= 3) badgesCount++;
  if (journals.length >= 7) badgesCount++;
  if (expenses.length >= 10) badgesCount++;
  if (currentLevel >= 5) badgesCount++;
  if (currentLevel >= 10) badgesCount++;

  return {
    totalXP,
    currentLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercent,
    tierName,
    tierColor,
    badgesCount,
    totalCompletedTasks: completedTasks.length,
    activeHabitStreaks,
    totalJournalEntries: journals.length
  };
}

export const DAILY_QUOTES = [
  { quote: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { quote: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { quote: "Don't wait for opportunity. Create it.", author: "George Bernard Shaw" },
  { quote: "Modeling and optimizing your mental system is the fastest path to autonomy.", author: "Product Architect" }
];
