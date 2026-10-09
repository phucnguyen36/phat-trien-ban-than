/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoalTodo, TimeframeType } from '../types';

/**
 * Returns standard ISO 8601 week number (1 - 53)
 */
export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Returns the ISO week-numbering year
 */
export function getISOWeekYear(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  return date.getUTCFullYear();
}

/**
 * Returns standard Week Key: "YYYY-Www", e.g. "2026-W41"
 */
export function getWeekKey(d: Date): string {
  const year = getISOWeekYear(d);
  const week = String(getISOWeekNumber(d)).padStart(2, '0');
  return `${year}-W${week}`;
}

/**
 * Returns standard Month Key: "YYYY-MM", e.g. "2026-10"
 */
export function getMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns standard Day Key: "YYYY-MM-DD", e.g. "2026-10-09"
 */
export function getDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns standard Year Key: "YYYY", e.g. "2026"
 */
export function getYearKey(d: Date): string {
  return String(d.getFullYear());
}

/**
 * Returns the Monday and Sunday of an ISO week
 */
export function getISOWeekDateRange(year: number, week: number): { start: Date; end: Date; label: string } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  const targetMonday = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000);
  const targetSunday = new Date(targetMonday.getTime() + 6 * 86400000);

  const mStart = targetMonday.getUTCMonth() + 1;
  const dStart = targetMonday.getUTCDate();
  const mEnd = targetSunday.getUTCMonth() + 1;
  const dEnd = targetSunday.getUTCDate();

  const label = mStart === mEnd
    ? `${dStart} - ${dEnd}/${mEnd}`
    : `${dStart}/${mStart} - ${dEnd}/${mEnd}`;

  return { start: targetMonday, end: targetSunday, label };
}

/**
 * Human-readable month label: "Thg 10, 2026" or "Oct 2026"
 */
export function formatMonthDisplay(monthKey: string): string {
  const parts = monthKey.split('-');
  if (parts.length < 2) return monthKey;
  const y = parts[0];
  const m = parseInt(parts[1], 10);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[m - 1] || m} ${y}`;
}

export interface GoalPeriodInfo {
  timeframe: TimeframeType;
  key: string;              // Normalized period key
  isCurrent: boolean;       // Belongs to current day / week / month / year
  isPast: boolean;          // Belongs to past period
  isFuture: boolean;        // Belongs to future period
  displayTag: string;       // Formatted badge label
  rawTag: string;           // Exact matched tag string or generated tag
  cleanText: string;        // Text with tag stripped
}

/**
 * Parses any goal's timeframe and date key, handling legacy tags, deadlines, and createdAt.
 */
export function parseGoalPeriod(g: GoalTodo, referenceDate: Date = new Date()): GoalPeriodInfo {
  const text = g.text || '';
  const timeframe = g.timeframe || 'daily';
  const cleanText = text.replace(/^\[(D|W|M|Y):[^\]]+\]\s*/, '');

  const currentDay = getDayKey(referenceDate);
  const currentWeek = getWeekKey(referenceDate);
  const currentMonth = getMonthKey(referenceDate);
  const currentYear = getYearKey(referenceDate);

  const match = text.match(/^\[([DWMY]):([^\]]+)\]/);

  if (match) {
    const tagType = match[1];
    const tagVal = match[2].trim();

    if (tagType === 'D') {
      const isCurrent = tagVal === currentDay;
      const isPast = tagVal < currentDay;
      const isFuture = tagVal > currentDay;
      const parts = tagVal.split('-');
      const displayTag = isCurrent ? 'Today' : parts.length === 3 ? `${parts[2]}/${parts[1]}` : tagVal;
      return {
        timeframe: 'daily',
        key: tagVal,
        isCurrent,
        isPast,
        isFuture,
        displayTag,
        rawTag: `[D:${tagVal}]`,
        cleanText
      };
    }

    if (tagType === 'W') {
      // Normalize week key: could be "2026-W41" or legacy "2026-10-W2"
      let normalizedKey = tagVal;
      if (/^\d{4}-W\d{1,2}$/.test(tagVal)) {
        const [y, w] = tagVal.split('-W');
        normalizedKey = `${y}-W${w.padStart(2, '0')}`;
      } else if (/^\d{4}-\d{2}-W\d+$/.test(tagVal)) {
        // Legacy Year-Month-Week format: convert to estimated ISO week using createdAt if available
        if (g.createdAt) {
          normalizedKey = getWeekKey(new Date(g.createdAt));
        } else {
          normalizedKey = currentWeek;
        }
      }

      const isCurrent = normalizedKey === currentWeek;
      const isPast = normalizedKey < currentWeek;
      const isFuture = normalizedKey > currentWeek;

      // Extract week number for display
      const wMatch = normalizedKey.match(/-W(\d+)/);
      const wNum = wMatch ? parseInt(wMatch[1], 10) : 0;
      const yNum = parseInt(normalizedKey.slice(0, 4), 10) || referenceDate.getFullYear();
      let displayTag = isCurrent ? 'This Week' : `Week ${wNum}`;
      if (wNum > 0) {
        const range = getISOWeekDateRange(yNum, wNum);
        displayTag = isCurrent ? `This Week (${range.label})` : `W${wNum} (${range.label})`;
      }

      return {
        timeframe: 'weekly',
        key: normalizedKey,
        isCurrent,
        isPast,
        isFuture,
        displayTag,
        rawTag: `[W:${normalizedKey}]`,
        cleanText
      };
    }

    if (tagType === 'M') {
      const isCurrent = tagVal === currentMonth;
      const isPast = tagVal < currentMonth;
      const isFuture = tagVal > currentMonth;
      const displayTag = isCurrent ? 'This Month' : formatMonthDisplay(tagVal);

      return {
        timeframe: 'monthly',
        key: tagVal,
        isCurrent,
        isPast,
        isFuture,
        displayTag,
        rawTag: `[M:${tagVal}]`,
        cleanText
      };
    }

    if (tagType === 'Y') {
      const isCurrent = tagVal === currentYear;
      const isPast = tagVal < currentYear;
      const isFuture = tagVal > currentYear;

      return {
        timeframe: 'yearly',
        key: tagVal,
        isCurrent,
        isPast,
        isFuture,
        displayTag: isCurrent ? 'This Year' : tagVal,
        rawTag: `[Y:${tagVal}]`,
        cleanText
      };
    }
  }

  // Fallback for goals WITHOUT a tag in text
  // Determine effective date from deadline or createdAt
  let effectiveDate = referenceDate;
  if (g.deadline) {
    const parsed = new Date(g.deadline);
    if (!isNaN(parsed.getTime())) effectiveDate = parsed;
  } else if (g.createdAt) {
    const parsed = new Date(g.createdAt);
    if (!isNaN(parsed.getTime())) effectiveDate = parsed;
  }

  if (timeframe === 'daily') {
    // Untagged daily tasks: if incomplete, treat as current today; if completed, treat by createdAt
    const key = g.completed ? getDayKey(effectiveDate) : currentDay;
    const isCurrent = key === currentDay;
    const isPast = key < currentDay;
    return {
      timeframe: 'daily',
      key,
      isCurrent,
      isPast,
      isFuture: key > currentDay,
      displayTag: isCurrent ? 'Today' : 'Daily',
      rawTag: `[D:${key}]`,
      cleanText
    };
  }

  if (timeframe === 'weekly') {
    // Untagged weekly: determine by effectiveDate
    const key = getWeekKey(effectiveDate);
    const isCurrent = key === currentWeek;
    const isPast = key < currentWeek;
    const wMatch = key.match(/-W(\d+)/);
    const wNum = wMatch ? parseInt(wMatch[1], 10) : 0;
    const yNum = parseInt(key.slice(0, 4), 10) || referenceDate.getFullYear();
    const range = wNum > 0 ? getISOWeekDateRange(yNum, wNum) : null;
    const displayTag = isCurrent ? (range ? `This Week (${range.label})` : 'This Week') : `W${wNum}`;

    return {
      timeframe: 'weekly',
      key,
      isCurrent,
      isPast,
      isFuture: key > currentWeek,
      displayTag,
      rawTag: `[W:${key}]`,
      cleanText
    };
  }

  if (timeframe === 'monthly') {
    const key = getMonthKey(effectiveDate);
    const isCurrent = key === currentMonth;
    const isPast = key < currentMonth;

    return {
      timeframe: 'monthly',
      key,
      isCurrent,
      isPast,
      isFuture: key > currentMonth,
      displayTag: isCurrent ? 'This Month' : formatMonthDisplay(key),
      rawTag: `[M:${key}]`,
      cleanText
    };
  }

  // Yearly fallback
  const key = getYearKey(effectiveDate);
  const isCurrent = key === currentYear;
  return {
    timeframe: 'yearly',
    key,
    isCurrent,
    isPast: key < currentYear,
    isFuture: key > currentYear,
    displayTag: isCurrent ? 'This Year' : key,
    rawTag: `[Y:${key}]`,
    cleanText
  };
}
