/**
 * identityFormat - Athletly V2
 *
 * Tiny formatting helpers used by the identity GenUI cards. Pure
 * TypeScript, no React / RN imports. Kept separate so the card files stay
 * compact and the formatters can be reused across cards.
 */

const GERMAN_MONTHS: readonly string[] = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse a YYYY-MM-DD string into a Date in local time, or null when the
 * input doesn't match. Avoids the Date(iso) UTC-vs-local pitfall.
 */
export function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const trimmed = iso.trim();
  const match = trimmed.match(ISO_DATE_RE);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Render an ISO date (or anything parseIsoDate accepts) as German long
 * form: "20. September 2026". Falls back to the original input when the
 * date is unparseable.
 */
export function formatGermanLongDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const date = parseIsoDate(input);
  if (!date) return input.trim();
  const day = date.getDate();
  const month = GERMAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

/**
 * Render an ISO date as short German form "DD.MM.YYYY". Falls back to
 * the input on unparseable strings.
 */
export function formatGermanShortDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const date = parseIsoDate(input);
  if (!date) return input.trim();
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

/**
 * "noch 130 Tage" / "heute" / "vorbei (vor 4 Tagen)" relative to today.
 */
export function formatRelativeDays(input: string | null | undefined): string | null {
  if (!input) return null;
  const date = parseIsoDate(input);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return 'heute';
  if (days < 0) {
    const past = Math.abs(days);
    return past === 1 ? 'vorbei (gestern)' : `vorbei (vor ${past} Tagen)`;
  }
  if (days === 1) return 'noch 1 Tag';
  return `noch ${days} Tage`;
}

/**
 * Trim leading zeros from a HH:MM:SS or HH:MM target time. "01:24:00"
 * becomes "1:24:00", "00:42:30" becomes "42:30". Returns null on empty.
 */
export function formatTargetTime(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3) return trimmed;
  if (parts.length === 3) {
    const h = Number(parts[0]);
    if (!Number.isFinite(h)) return trimmed;
    if (h === 0) {
      return `${parts[1]}:${parts[2]}`;
    }
    return `${h}:${parts[1]}:${parts[2]}`;
  }
  const m = Number(parts[0]);
  if (!Number.isFinite(m)) return trimmed;
  return `${m}:${parts[1]}`;
}

const PACE_RE = /pace\s*([0-9]{1,2}:[0-9]{2})\s*\/?\s*km/i;

/**
 * Extract "3:58/km" style pace hints out of free-form course text. Returns
 * null when no pace is mentioned.
 */
export function extractPace(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(PACE_RE);
  if (!match) return null;
  return `${match[1]}/km`;
}

/**
 * Detect ISO date strings like 2026-09-20 so the SmartSectionCard can
 * reformat them on the fly.
 */
export function looksLikeIsoDate(value: string): boolean {
  return ISO_DATE_RE.test(value.trim());
}
