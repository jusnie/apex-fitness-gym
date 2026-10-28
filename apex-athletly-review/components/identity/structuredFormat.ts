/**
 * Formatting helpers for the structured profile block.
 *
 * Kept separate so the StructuredProfileCard component file stays small
 * and the pure formatting is easy to unit test independently of React.
 */

import type { IdentityGoal } from '@/types/identity';

const SPORT_LABELS: Readonly<Record<string, string>> = {
  running: 'Laufen',
  cycling: 'Radfahren',
  swimming: 'Schwimmen',
  triathlon: 'Triathlon',
  strength: 'Krafttraining',
  hiking: 'Wandern',
  walking: 'Gehen',
  yoga: 'Yoga',
  rowing: 'Rudern',
  hiit: 'HIIT',
};

const NOT_KNOWN = 'Noch nicht bekannt';

export function formatSports(sports: readonly string[]): string {
  if (sports.length === 0) {
    return 'Noch keine Sportart hinterlegt';
  }
  return sports.map((s) => SPORT_LABELS[s] ?? s).join(', ');
}

export function formatNumber(value: number | null, suffix: string): string {
  if (value === null || Number.isNaN(value)) {
    return NOT_KNOWN;
  }
  return `${value}${suffix}`;
}

/**
 * Convert a decimal pace (min/km) into a mm:ss min/km string. 4.1 -> 4:06.
 */
export function formatPace(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return NOT_KNOWN;
  }
  const minutes = Math.floor(value);
  const seconds = Math.round((value - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')} min/km`;
}

function formatGoalDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

export function formatGoal(goal: IdentityGoal): string {
  if (!goal.event && !goal.target_date && !goal.target_time) {
    return 'Noch kein Ziel definiert';
  }
  const parts: string[] = [];
  if (goal.event) parts.push(goal.event);
  const formattedDate = formatGoalDate(goal.target_date);
  if (formattedDate) parts.push(formattedDate);
  if (goal.target_time) parts.push(`Ziel ${goal.target_time}`);
  return parts.join(' • ');
}
