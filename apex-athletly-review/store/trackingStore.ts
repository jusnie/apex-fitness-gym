/**
 * Tracking Store — Athletly V2
 *
 * Zustand store for activity tracking.
 * Fetches user sports from profiles table, saves activities to activities table.
 * Sports and body-part options come from the DB / agent config, NOT hardcoded.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import type {
  SportOption,
  BodyPartOption,
  QuickLogEntry,
  TrackedActivity,
  TrackingIntensity,
} from '@/types/tracking';

const TAG = 'TrackingStore';

// Fallback options when DB returns nothing — generic, not sport-specific
const FALLBACK_SPORTS: readonly SportOption[] = [
  { name: 'running', label: 'Laufen' },
  { name: 'cycling', label: 'Radfahren' },
  { name: 'gym', label: 'Gym' },
  { name: 'swimming', label: 'Schwimmen' },
] as const;

const FALLBACK_BODY_PARTS: readonly BodyPartOption[] = [
  { key: 'upper_body', label: 'Oberkoerper' },
  { key: 'lower_body', label: 'Unterkoerper' },
  { key: 'core', label: 'Core' },
  { key: 'full_body', label: 'Ganzkoerper' },
] as const;

// Gym-like sports that show body-part selection
const GYM_SPORTS = new Set(['gym', 'strength', 'krafttraining', 'weight_training']);

interface TrackingState {
  // Data from DB
  readonly sports: readonly SportOption[];
  readonly bodyParts: readonly BodyPartOption[];
  readonly recentActivities: readonly TrackedActivity[];

  // UI state
  readonly selectedSport: string | null;
  readonly selectedBodyParts: readonly string[];
  readonly durationMinutes: number;
  readonly intensity: TrackingIntensity;
  readonly notes: string;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly error: string | null;

  // Actions
  fetchSports: (userId: string) => Promise<void>;
  fetchBodyParts: (userId: string) => Promise<void>;
  fetchRecentActivities: (userId: string) => Promise<void>;
  selectSport: (sport: string | null) => void;
  toggleBodyPart: (part: string) => void;
  setDuration: (minutes: number) => void;
  setIntensity: (intensity: TrackingIntensity) => void;
  setNotes: (notes: string) => void;
  saveActivity: (userId: string) => Promise<boolean>;
  resetForm: () => void;
}

function isGymSport(sport: string): boolean {
  return GYM_SPORTS.has(sport.toLowerCase());
}

export { isGymSport };

export const useTrackingStore = create<TrackingState>((set, get) => ({
  sports: [],
  bodyParts: [],
  recentActivities: [],

  selectedSport: null,
  selectedBodyParts: [],
  durationMinutes: 30,
  intensity: 'moderate',
  notes: '',
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSports: async (userId) => {
    set({ isLoading: true, error: null });
    const endTimer = log.time(TAG, 'fetchSports');
    try {
      // Try profiles table first (JSONB sports array)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('sports, available_sports')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileErr) {
        console.warn('[trackingStore] profiles query failed, trying user_models:', profileErr.message);
      }

      // Parse sports from profile
      const rawSports: unknown[] =
        (profile?.sports as unknown[]) ??
        (profile?.available_sports as unknown[]) ??
        [];

      endTimer();
      if (rawSports.length > 0) {
        log.info(TAG, `Found ${rawSports.length} sports from profile`);
        const parsed: SportOption[] = rawSports.map((s) => {
          if (typeof s === 'string') {
            return { name: s.toLowerCase(), label: s };
          }
          if (typeof s === 'object' && s !== null && 'name' in s) {
            const obj = s as { name: string; label?: string };
            return { name: obj.name.toLowerCase(), label: obj.label ?? obj.name };
          }
          return { name: String(s).toLowerCase(), label: String(s) };
        });
        set({ sports: parsed, isLoading: false });
        return;
      }

      // Fallback: use generic defaults
      log.info(TAG, 'Using fallback sports');
      set({ sports: FALLBACK_SPORTS, isLoading: false });
    } catch (err) {
      endTimer();
      log.error(TAG, 'Failed to fetch sports', { error: String(err) });
      set({ sports: FALLBACK_SPORTS, isLoading: false, error: 'Sportarten konnten nicht geladen werden' });
    }
  },

  fetchBodyParts: async (userId) => {
    try {
      // Try to load body-part config from profiles.meta or agent config
      const { data: profile } = await supabase
        .from('profiles')
        .select('meta')
        .eq('user_id', userId)
        .maybeSingle();

      const meta = profile?.meta as Record<string, unknown> | null;
      const rawParts = meta?.body_parts as unknown[] | undefined;

      if (Array.isArray(rawParts) && rawParts.length > 0) {
        const parsed: BodyPartOption[] = rawParts.map((p) => {
          if (typeof p === 'string') {
            return { key: p.toLowerCase(), label: p };
          }
          if (typeof p === 'object' && p !== null && 'key' in p) {
            const obj = p as { key: string; label?: string };
            return { key: obj.key, label: obj.label ?? obj.key };
          }
          return { key: String(p).toLowerCase(), label: String(p) };
        });
        set({ bodyParts: parsed });
        return;
      }

      set({ bodyParts: FALLBACK_BODY_PARTS });
    } catch {
      set({ bodyParts: FALLBACK_BODY_PARTS });
    }
  },

  fetchRecentActivities: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id, sport, start_time, duration_seconds, source, raw_data, created_at')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[trackingStore] Error fetching recent activities:', error.message);
        return;
      }

      const activities: TrackedActivity[] = (data ?? []).map((row) => ({
        id: row.id,
        userId,
        sport: row.sport,
        startTime: row.start_time,
        durationSeconds: row.duration_seconds ?? 0,
        source: row.source ?? 'manual',
        notes: (row.raw_data as Record<string, unknown>)?.notes as string | undefined,
        bodyParts: (row.raw_data as Record<string, unknown>)?.body_parts as string[] | undefined,
        createdAt: row.created_at,
      }));

      set({ recentActivities: activities });
    } catch (err) {
      console.error('[trackingStore] Failed to fetch recent activities:', err);
    }
  },

  selectSport: (sport) => set({ selectedSport: sport, selectedBodyParts: [] }),

  toggleBodyPart: (part) => {
    const current = get().selectedBodyParts;
    const next = current.includes(part)
      ? current.filter((p) => p !== part)
      : [...current, part];
    set({ selectedBodyParts: next });
  },

  setDuration: (minutes) => set({ durationMinutes: Math.max(1, minutes) }),
  setIntensity: (intensity) => set({ intensity }),
  setNotes: (notes) => set({ notes }),

  saveActivity: async (userId) => {
    const { selectedSport, durationMinutes, intensity, notes, selectedBodyParts } = get();

    if (!selectedSport) {
      set({ error: 'Bitte waehle eine Sportart' });
      return false;
    }
    if (durationMinutes < 1) {
      set({ error: 'Dauer muss mindestens 1 Minute sein' });
      return false;
    }

    log.info(TAG, 'Saving activity', { sport: selectedSport, duration: durationMinutes, intensity });
    set({ isSaving: true, error: null });

    try {
      const now = new Date().toISOString();
      const rawData: Record<string, unknown> = {
        intensity,
        ...(notes ? { notes } : {}),
        ...(selectedBodyParts.length > 0 ? { body_parts: selectedBodyParts } : {}),
      };

      const { error } = await supabase.from('activities').insert({
        user_id: userId,
        sport: selectedSport,
        start_time: now,
        duration_seconds: durationMinutes * 60,
        source: 'manual',
        raw_data: rawData,
      });

      if (error) {
        log.error(TAG, 'Error saving activity', { message: error.message });
        set({ isSaving: false, error: 'Aktivitaet konnte nicht gespeichert werden' });
        return false;
      }

      log.info(TAG, 'Activity saved successfully');
      // Reset form and refresh recent
      set({
        isSaving: false,
        selectedSport: null,
        selectedBodyParts: [],
        durationMinutes: 30,
        intensity: 'moderate',
        notes: '',
      });

      // Refresh recent activities in background
      get().fetchRecentActivities(userId);

      return true;
    } catch (err) {
      console.error('[trackingStore] Failed to save activity:', err);
      set({ isSaving: false, error: 'Ein Fehler ist aufgetreten' });
      return false;
    }
  },

  resetForm: () =>
    set({
      selectedSport: null,
      selectedBodyParts: [],
      durationMinutes: 30,
      intensity: 'moderate',
      notes: '',
      error: null,
    }),
}));
