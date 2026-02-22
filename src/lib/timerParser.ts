/**
 * Timer Parser — Auto-suggest cooking durations from step text (Sprint 25)
 *
 * Parses recipe step text to detect time references and convert to seconds.
 * Supports: "about 8 minutes", "for 15 min", "simmer 20 minutes",
 *           "bake for 1 hour", "rest 30 seconds", "1 hour 30 minutes",
 *           "8-10 minutes" (uses lower bound).
 *
 * Source: Roadmap V1.6 Epic 5, Design Specification V1.6 — Cooking Mode Timer
 */

export interface TimerSuggestion {
  /** Duration in seconds */
  seconds: number;
  /** Human-readable label (e.g., "8 min", "1 hr 30 min") */
  label: string;
  /** The raw matched text from the step */
  matchedText: string;
}

/**
 * Unit keywords mapped to their value in seconds.
 */
const UNIT_MAP: Record<string, number> = {
  // seconds
  second: 1,
  seconds: 1,
  sec: 1,
  secs: 1,
  s: 1,
  // minutes
  minute: 60,
  minutes: 60,
  min: 60,
  mins: 60,
  m: 60,
  // hours
  hour: 3600,
  hours: 3600,
  hr: 3600,
  hrs: 3600,
  h: 3600,
};

/**
 * Regex for matching compound times like "1 hour 30 minutes" or "1 hr and 30 min".
 * Captures: (number) (hour-unit) [and]? (number) (minute-unit)
 */
const COMPOUND_REGEX =
  /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*(?:and\s+)?(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m(?:in)?)\b/i;

/**
 * Regex for matching range times like "8-10 minutes" or "8 to 10 min".
 * Uses the lower bound.
 */
const RANGE_REGEX =
  /(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|m|hours?|hrs?|h|seconds?|secs?|sec|s)\b/i;

/**
 * Regex for matching simple times like "15 minutes", "about 8 min", "for 1 hour".
 * Allows optional prefixes: about, approximately, around, roughly, for, ~.
 */
const SIMPLE_REGEX =
  /(?:(?:about|approximately|around|roughly|for|~)\s+)?(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|m|hours?|hrs?|h|seconds?|secs?|sec|s)\b/i;

/**
 * Normalize a unit string to its value in seconds.
 * Returns null if unit is not recognized.
 */
function unitToSeconds(unit: string): number | null {
  const lower = unit.toLowerCase();
  // Handle single-char units carefully — "m" can conflict with meter but in cooking context = minutes
  return UNIT_MAP[lower] ?? null;
}

/**
 * Format seconds into a human-readable label.
 */
export function formatTimerLabel(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 sec';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds} sec`);

  return parts.join(' ') || '0 sec';
}

/**
 * Parse a recipe step string to detect timer duration.
 * Returns a TimerSuggestion if a time reference is found, null otherwise.
 *
 * Priority: compound > range > simple
 */
export function parseTimerFromStep(stepText: string): TimerSuggestion | null {
  if (!stepText || typeof stepText !== 'string') return null;

  // 1. Try compound match: "1 hour 30 minutes"
  const compoundMatch = stepText.match(COMPOUND_REGEX);
  if (compoundMatch) {
    const hours = parseFloat(compoundMatch[1]);
    const minutes = parseFloat(compoundMatch[2]);
    const totalSeconds = Math.round(hours * 3600 + minutes * 60);
    if (totalSeconds > 0) {
      return {
        seconds: totalSeconds,
        label: formatTimerLabel(totalSeconds),
        matchedText: compoundMatch[0],
      };
    }
  }

  // 2. Try range match: "8-10 minutes" → use lower bound
  const rangeMatch = stepText.match(RANGE_REGEX);
  if (rangeMatch) {
    const lowerBound = parseFloat(rangeMatch[1]);
    const unitStr = rangeMatch[3];
    const multiplier = unitToSeconds(unitStr);
    if (multiplier !== null && lowerBound > 0) {
      const totalSeconds = Math.round(lowerBound * multiplier);
      return {
        seconds: totalSeconds,
        label: formatTimerLabel(totalSeconds),
        matchedText: rangeMatch[0],
      };
    }
  }

  // 3. Try simple match: "15 minutes", "about 8 min"
  const simpleMatch = stepText.match(SIMPLE_REGEX);
  if (simpleMatch) {
    const value = parseFloat(simpleMatch[1]);
    const unitStr = simpleMatch[2];
    const multiplier = unitToSeconds(unitStr);
    if (multiplier !== null && value > 0) {
      const totalSeconds = Math.round(value * multiplier);
      return {
        seconds: totalSeconds,
        label: formatTimerLabel(totalSeconds),
        matchedText: simpleMatch[0],
      };
    }
  }

  return null;
}
