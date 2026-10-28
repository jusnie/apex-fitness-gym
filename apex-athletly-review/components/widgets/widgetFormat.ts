/**
 * widgetFormat - Athletly V2
 *
 * Tiny formatting helpers shared by widget components. Pure TS, no React
 * imports, so the widget files stay focused on layout.
 */

import { formatGermanLongDate } from '@/components/identity/identityFormat';

/**
 * Format a backend-supplied countdown_days value as German copy.
 *   0  -> "heute"
 *   1  -> "noch 1 Tag"
 *   N  -> "noch N Tagen" (N > 1)
 *  -1  -> "1 Tag überfällig"
 *  -N  -> "N Tage überfällig"
 */
export function formatCountdownDays(days: number | undefined): string | null {
  if (days === undefined || days === null || !Number.isFinite(days)) {
    return null;
  }
  if (days === 0) return 'heute';
  if (days > 0) {
    if (days === 1) return 'noch 1 Tag';
    return `noch ${days} Tagen`;
  }
  const past = Math.abs(days);
  if (past === 1) return '1 Tag überfällig';
  return `${past} Tage überfällig`;
}

/**
 * Format a date that may already be human-readable or may be an ISO
 * string. Prefer the German long form when parseable.
 */
export function formatWidgetDate(input: string | undefined): string | null {
  if (!input) return null;
  return formatGermanLongDate(input);
}
