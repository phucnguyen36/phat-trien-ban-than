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

  // Habit XP (20 XP per completed day)
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

  let tierName = 'Khởi Đầu (Apprentice)';
  let tierColor = 'from-blue-500 to-cyan-400';

  if (currentLevel >= 20) {
    tierName = 'Huyền Thoại (Titan)';
    tierColor = 'from-amber-400 via-rose-500 to-purple-600';
  } else if (currentLevel >= 15) {
    tierName = 'Bậc Thầy (Architect)';
    tierColor = 'from-purple-500 to-indigo-500';
  } else if (currentLevel >= 10) {
    tierName = 'Kiến Tạo (Strategist)';
    tierColor = 'from-emerald-400 to-teal-600';
  } else if (currentLevel >= 5) {
    tierName = 'Bứt Phá (Achiever)';
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
  { quote: "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.", author: "Jim Rohn" },
  { quote: "Chúng ta là những gì chúng ta lặp đi lặp lại. Sự xuất sắc không phải là hành động, mà là thói quen.", author: "Aristotle" },
  { quote: "Thành công không phải là chìa khóa mở cửa hạnh phúc. Hạnh phúc mới là chìa khóa dẫn tới thành công.", author: "Albert Schweitzer" },
  { quote: "Tương lai phụ thuộc vào những gì bạn làm hôm nay.", author: "Mahatma Gandhi" },
  { quote: "Đừng chờ đợi cơ hội. Hãy tự tạo ra nó.", author: "George Bernard Shaw" },
  { quote: "Mô hình hoá và tối ưu hoá hệ thống tư duy là con đường nhanh nhất đến sự tự do.", author: "Product Architect" }
];
