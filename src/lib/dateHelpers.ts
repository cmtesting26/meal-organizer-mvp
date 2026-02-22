/**
 * Date Utility Helpers
 *
 * Provides date formatting, parsing, and recency calculation
 * utilities for the Fork and Spoon app.
 *
 * @module dateHelpers
 */

import { format, formatDistanceToNow, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, parseISO, isValid } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

/**
 * Get date-fns locale from language code
 */
function getLocale(lang?: string): typeof enUS {
  if (lang?.startsWith('de')) return de;
  return enUS;
}

/**
 * Format a schedule day header.
 * EN: "Monday, Feb 17th"
 * DE: "Montag, 17. Feb"
 *
 * Sprint 16 — S16-08
 */
export function formatScheduleDay(dateStr: string, lang?: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'Invalid date';
  const locale = getLocale(lang);

  if (lang?.startsWith('de')) {
    // German: "Montag, 17. Feb"
    return format(date, 'EEEE, d. MMM', { locale });
  }
  // English: "Monday, Feb 17th"
  return format(date, 'EEEE, MMM do', { locale });
}

/**
 * Format a date string for display (e.g., "Feb 11, 2026")
 */
export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'Invalid date';
  return format(date, 'MMM d, yyyy');
}

/**
 * Format a date as short display (e.g., "Mon 2/11")
 */
export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'Invalid date';
  return format(date, 'EEE M/d');
}

/**
 * Format a date as day name (e.g., "Monday")
 */
export function formatDayName(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'Invalid date';
  return format(date, 'EEEE');
}

/**
 * Format a date as month/day (e.g., "2/11")
 */
export function formatMonthDay(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'Invalid date';
  return format(date, 'M/d');
}

/**
 * Get a human-readable recency string (e.g., "3 days ago", "2 weeks ago")
 */
export function getRecencyText(dateStr?: string): string {
  if (!dateStr) return 'Never cooked';
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'Never cooked';
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Determine recency category for color coding.
 * - 'fresh': cooked within last 7 days (green)
 * - 'recent': cooked within last 14 days (yellow)
 * - 'stale': cooked more than 14 days ago (red)
 * - 'never': never cooked (gray)
 */
export function getRecencyCategory(dateStr?: string): 'fresh' | 'recent' | 'stale' | 'never' {
  if (!dateStr) return 'never';
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 'fresh';
  if (diffDays <= 14) return 'recent';
  return 'stale';
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get ISO date string for a Date object (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 }); // Sunday
}

/**
 * Get all days in a week starting from a given date
 */
export function getWeekDays(weekStartDate: Date): Date[] {
  const weekEnd = getWeekEnd(weekStartDate);
  return eachDayOfInterval({ start: weekStartDate, end: weekEnd });
}

/**
 * Move to next week from a given start date
 */
export function getNextWeekStart(currentWeekStart: Date): Date {
  return addWeeks(currentWeekStart, 1);
}

/**
 * Move to previous week from a given start date
 */
export function getPrevWeekStart(currentWeekStart: Date): Date {
  return addWeeks(currentWeekStart, -1);
}

/**
 * Format week range for display (e.g., "Feb 10 - 16, 2026")
 */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = getWeekEnd(weekStart);
  const startMonth = format(weekStart, 'MMM');
  const endMonth = format(weekEnd, 'MMM');

  if (startMonth === endMonth) {
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
  }
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
}
