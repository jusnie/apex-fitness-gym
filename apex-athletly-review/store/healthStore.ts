/**
 * Health Store — Athletly V2
 *
 * Zustand store for health metrics, trends, and connected services.
 * Fetches from Supabase health_daily_metrics and provider_tokens tables.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import type { HealthMetrics, HealthTrend, ConnectedService } from '@/types/health';

const TAG = 'HealthStore';

interface HealthState {
  metrics: HealthMetrics | null;
  trends: HealthTrend[];
  connectedServices: ConnectedService[];
  isLoading: boolean;

  fetchMetrics: (userId: string) => Promise<void>;
  fetchConnectedServices: (userId: string) => Promise<void>;
  isAppleHealthConnected: () => boolean;
  clear: () => void;
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  metrics: null,
  trends: [],
  connectedServices: [],
  isLoading: false,

  fetchMetrics: async (userId) => {
    set({ isLoading: true });
    const endTimer = log.time(TAG, 'fetchMetrics');

    try {
      const today = getToday();
      log.debug(TAG, 'Fetching metrics', { date: today });

      const { data, error } = await supabase
        .from('health_daily_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      endTimer();
      if (error) {
        log.error(TAG, 'Error fetching metrics', { message: error.message, code: error.code });
        set({ isLoading: false });
        return;
      }

      if (data) {
        log.info(TAG, 'Metrics loaded', { recovery: data.recovery_score, sleep: data.sleep_duration_minutes });
        const metrics: HealthMetrics = {
          date: data.date,
          sleepDurationMinutes: data.sleep_duration_minutes ?? undefined,
          sleepScore: data.sleep_score ?? undefined,
          restingHeartRate: data.resting_heart_rate ?? undefined,
          hrvAvg: data.hrv_avg ?? undefined,
          steps: data.steps ?? undefined,
          activeCalories: data.active_calories ?? undefined,
          totalCalories: data.total_calories ?? undefined,
          recoveryScore: data.recovery_score ?? undefined,
          stressAvg: data.stress_avg ?? undefined,
          bodyBatteryHigh: data.body_battery_high ?? undefined,
          bodyBatteryLow: data.body_battery_low ?? undefined,
        };
        set({ metrics, isLoading: false });
      } else {
        log.info(TAG, 'No metrics for today');
        set({ metrics: null, isLoading: false });
      }
    } catch (err) {
      endTimer();
      log.error(TAG, 'Failed to fetch metrics', { error: String(err) });
      set({ isLoading: false });
    }
  },

  fetchConnectedServices: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('provider_tokens')
        .select('provider, updated_at')
        .eq('user_id', userId);

      if (error) {
        console.error('[healthStore] Error fetching connected services:', error.message);
        return;
      }

      const services: ConnectedService[] = (data || []).map((row) => ({
        provider: row.provider,
        connected: true,
        lastSync: row.updated_at || undefined,
      }));

      set({ connectedServices: services });
    } catch (err) {
      console.error('[healthStore] Failed to fetch connected services:', err);
    }
  },

  isAppleHealthConnected: (): boolean => {
    const services = get().connectedServices;
    return services.some((s: ConnectedService) => s.provider === 'apple_health' && s.connected);
  },

  clear: () => set({ metrics: null, trends: [], connectedServices: [] }),
}));
