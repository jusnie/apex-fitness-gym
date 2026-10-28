/**
 * Plan Store — Athletly V2
 *
 * Zustand store for weekly training plan state.
 * Reads from Supabase `plans` table (plan_data JSONB column).
 *
 * Backend schema (plans table):
 *   - plan_data: JSONB with { sessions, start_date, end_date, focus, name, ... }
 *   - Each session has: day, name, sport, intensity, description, duration_minutes, details
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import type { WeeklyPlan, DayPlan, PlannedSession } from '@/types/plan';

const TAG = 'PlanStore';

interface PlanState {
  readonly currentPlan: WeeklyPlan | null;
  readonly selectedDate: string;        // ISO date string
  readonly isLoading: boolean;
  readonly error: string | null;

  fetchPlan: (userId: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  refresh: () => Promise<void>;
  clear: () => void;
}

const GERMAN_DAY_NAMES = [
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
  'Freitag', 'Samstag', 'Sonntag',
] as const;

const ENGLISH_DAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
] as const;

/**
 * Normalize a day name to German (the app's display language).
 *
 * Tolerates case variants and short forms the agent produces:
 *   "Monday", "monday", "Mon", "Mo." -> "Montag"
 *   "Montag", "montag" -> "Montag"
 * Returns the input unchanged when nothing matches.
 */
function normalizeDay(day: string): string {
  if (!day) return day;
  const lc = day.trim().toLowerCase();

  // Exact lowercase match against English full names.
  const engIdx = ENGLISH_DAY_NAMES.findIndex((d) => d.toLowerCase() === lc);
  if (engIdx !== -1) return GERMAN_DAY_NAMES[engIdx];

  // Exact lowercase match against German full names.
  const germanIdx = GERMAN_DAY_NAMES.findIndex((d) => d.toLowerCase() === lc);
  if (germanIdx !== -1) return GERMAN_DAY_NAMES[germanIdx];

  // Short forms: "mon", "mo", "monday." etc - take first two letters.
  const prefix = lc.replace(/[^a-zäöüß]/g, '').slice(0, 2);
  const shortMap: Record<string, string> = {
    mo: 'Montag',
    di: 'Dienstag',
    tu: 'Dienstag',
    mi: 'Mittwoch',
    we: 'Mittwoch',
    do: 'Donnerstag',
    th: 'Donnerstag',
    fr: 'Freitag',
    sa: 'Samstag',
    so: 'Sonntag',
    su: 'Sonntag',
  };
  return shortMap[prefix] ?? day;
}

/**
 * Format a Date as YYYY-MM-DD using LOCAL time (not UTC).
 * Using toISOString() shifts dates back by 1 day in CET/CEST timezones.
 */
function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get the Monday of the week containing the given ISO date.
 */
function getMondayOfWeek(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return toLocalISO(new Date(d.getFullYear(), d.getMonth(), diff));
}

/**
 * Get the current Monday as an ISO date string (YYYY-MM-DD).
 */
function getCurrentMonday(): string {
  return getMondayOfWeek(toLocalISO(new Date()));
}

/**
 * Add N days to an ISO date string.
 */
function addDays(dateISO: string, n: number): string {
  const d = new Date(dateISO + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return toLocalISO(d);
}

/**
 * Coerce a plan_data dict into a flat sessions[] array, tolerating older
 * agent shapes. Mirrors the backend `_coerce_sessions` so the frontend
 * stays in sync with plans saved before the canonical schema landed.
 *
 * Canonical: plan_data.sessions = [{ day, sport, ... }]
 * Legacy:    plan_data.weekly_structure = { monday: {...}, friday: {...}, ... }
 */
const WEEKDAY_ORDER = [
  'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday', 'sunday',
] as const;

function coerceSessions(planData: Record<string, unknown>): Record<string, unknown>[] {
  const direct = planData.sessions;
  if (Array.isArray(direct) && direct.length > 0) {
    return direct as Record<string, unknown>[];
  }

  const weekly = planData.weekly_structure;
  if (weekly && typeof weekly === 'object' && !Array.isArray(weekly)) {
    const weeklyObj = weekly as Record<string, unknown>;
    const derived: Record<string, unknown>[] = [];

    const mapEntry = (day: string, entry: Record<string, unknown>) => {
      const duration = typeof entry.target_duration_min === 'number'
        ? entry.target_duration_min
        : typeof entry.duration_minutes === 'number'
          ? entry.duration_minutes
          : 0;
      derived.push({
        day,
        sport: entry.sport,
        name: entry.focus ?? entry.name,
        description: entry.notes ?? entry.description,
        duration_minutes: duration,
        intensity: entry.intensity,
      });
    };

    for (const day of WEEKDAY_ORDER) {
      const entry = weeklyObj[day];
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        mapEntry(day, entry as Record<string, unknown>);
      }
    }
    // Pick up any extra keys not in the canonical weekday list
    for (const [key, entry] of Object.entries(weeklyObj)) {
      if ((WEEKDAY_ORDER as readonly string[]).includes(key)) continue;
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        mapEntry(key, entry as Record<string, unknown>);
      }
    }
    return derived;
  }

  return [];
}

/**
 * Transform a flat sessions array from the agent into day-grouped DayPlan[].
 *
 * Agent format:
 *   { day: "Montag", name: "Easy Run", sport: "running", intensity: "easy", ... }
 *
 * App format:
 *   { date: "2026-03-16", day_name: "Montag", sessions: [{ sport, ... }] }
 */
function transformSessionsToDays(
  sessions: readonly Record<string, unknown>[],
  startDate: string,
): readonly DayPlan[] {
  const weekStart = getMondayOfWeek(startDate);

  // Group sessions by day name (normalize English → German)
  const byDay = new Map<string, Record<string, unknown>[]>();
  for (const session of sessions) {
    const rawDay = typeof session.day === 'string' ? session.day : '';
    const dayName = normalizeDay(rawDay);
    const existing = byDay.get(dayName) ?? [];
    byDay.set(dayName, [...existing, session]);
  }

  // Build all 7 days of the week
  return GERMAN_DAY_NAMES.map((dayName, index): DayPlan => {
    const date = addDays(weekStart, index);
    const daySessions = byDay.get(dayName) ?? [];

    const isRestDay = daySessions.length === 0 ||
      (daySessions.length === 1 && daySessions[0].sport === 'rest');

    if (isRestDay) {
      const restSession = daySessions[0];
      return {
        date,
        day_name: dayName,
        sessions: [],
        rest_reason: typeof restSession?.description === 'string'
          ? restSession.description
          : 'Ruhetag',
      };
    }

    const mapped: PlannedSession[] = daySessions.map((s) => ({
      sport: typeof s.sport === 'string' ? s.sport : 'unknown',
      duration_minutes: typeof s.duration_minutes === 'number'
        ? s.duration_minutes
        : typeof s.total_duration_minutes === 'number'
          ? s.total_duration_minutes
          : 0,
      intensity: typeof s.intensity === 'string' ? s.intensity as PlannedSession['intensity'] : 'moderate',
      session_type: typeof s.name === 'string'
        ? s.name
        : typeof s.type === 'string'
          ? s.type
          : '',
      description: typeof s.description === 'string' ? s.description : '',
      details: typeof s.details === 'string'
        ? { notes: s.details }
        : typeof s.details === 'object' && s.details !== null
          ? s.details as PlannedSession['details']
          : typeof s.pace_zones === 'object' && s.pace_zones !== null
            ? s.pace_zones as PlannedSession['details']
            : Array.isArray(s.steps) && s.steps.length > 0
              ? { steps: s.steps } as PlannedSession['details']
              : undefined,
    }));

    return { date, day_name: dayName, sessions: mapped };
  });
}

export const usePlanStore = create<PlanState>((set, get) => ({
  currentPlan: null,
  selectedDate: toLocalISO(new Date()),
  isLoading: false,
  error: null,

  fetchPlan: async (userId) => {
    set({ isLoading: true, error: null });
    const endTimer = log.time(TAG, 'fetchPlan');

    try {
      const mondayDate = getCurrentMonday();
      log.debug(TAG, 'Fetching plan', { userId: userId.slice(0, 8), weekStart: mondayDate });

      // Fetch the most recent plan whose start_date falls within the current week.
      // plan_data->start_date is stored as ISO string within the JSONB.
      const { data, error } = await supabase
        .from('plans')
        .select('id, user_id, created_at, plan_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      endTimer();

      if (data) {
        const planData = data.plan_data as Record<string, unknown> ?? {};
        // Coerce so plans saved in the legacy weekly_structure shape still
        // populate the calendar. See coerceSessions() above.
        const sessions = coerceSessions(planData);
        const startDate = typeof planData.start_date === 'string'
          ? planData.start_date
          : typeof planData.week_start === 'string'
            ? planData.week_start
            : typeof planData.period_start === 'string'
              ? planData.period_start
              : mondayDate;

        const planWeekStart = getMondayOfWeek(startDate);

        log.info(TAG, 'Plan loaded', {
          sessions: sessions.length,
          startDate,
          planWeekStart,
        });

        const days = transformSessionsToDays(sessions, startDate);
        const focus = typeof planData.focus === 'string'
          ? planData.focus
          : typeof planData.weekly_summary === 'string'
            ? planData.weekly_summary
            : '';

        const plan: WeeklyPlan = {
          id: data.id,
          userId: data.user_id,
          weekStart: planWeekStart,
          days,
          coachMessage: focus,
          reasoning: '',
          createdAt: data.created_at,
          updatedAt: data.created_at,
        };
        set({ currentPlan: plan, isLoading: false });
      } else {
        log.info(TAG, 'No plan found');
        set({ currentPlan: null, isLoading: false });
      }
    } catch (err) {
      endTimer();
      const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
      log.error(TAG, 'Error fetching plan', { error: errMsg });
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Fehler beim Laden des Plans',
      });
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  refresh: async () => {
    const { currentPlan } = get();
    if (currentPlan?.userId) {
      await get().fetchPlan(currentPlan.userId);
    }
  },

  clear: () => set({ currentPlan: null, error: null }),
}));
