/**
 * Service Detail Screen — Athletly V2
 *
 * Shows synced data for a connected service (Garmin, Apple Health, Health Connect).
 * Accessible by tapping a service card in the profile screen.
 * German text throughout.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Moon, Heart, Activity, Zap, Footprints, Flame, BarChart3, Database } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Card, Skeleton, EmptyState } from '@/components/ui';
import { Colors } from '@/lib/colors';
import { log } from '@/lib/logger';

const TAG = 'ServiceDetail';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyMetric {
  date: string;
  sleep_duration_minutes: number | null;
  sleep_score: number | null;
  sleep_deep_minutes: number | null;
  sleep_light_minutes: number | null;
  sleep_rem_minutes: number | null;
  sleep_awake_minutes: number | null;
  hrv_avg: number | null;
  resting_heart_rate: number | null;
  stress_avg: number | null;
  body_battery_high: number | null;
  body_battery_low: number | null;
  steps: number | null;
  active_calories: number | null;
  total_calories: number | null;
  recovery_score: number | null;
  vo2max: number | null;
  spo2_avg: number | null;
  respiration_avg: number | null;
  intensity_minutes: number | null;
  floors_climbed: number | null;
}

interface ActivityRow {
  id: string;
  sport: string;
  start_time: string;
  duration_seconds: number | null;
  distance_meters: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  calories: number | null;
  training_effect: number | null;
  vo2max_activity: number | null;
  avg_pace_min_km: number | null;
  elevation_gain_m: number | null;
  source: string | null;
}

interface HealthDataGroup {
  data_type: string;
  count: number;
}

interface HealthDataRecord {
  id: string;
  data_type: string;
  value: Record<string, unknown>;
  recorded_at: string;
  source: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERVICE_LABELS: Record<string, string> = {
  garmin: 'Garmin Connect',
  apple_health: 'Apple Health',
  health_connect: 'Health Connect',
};

/**
 * Map a provider key to the source value used in the activities table.
 * Garmin activities are stored with source = 'garmin',
 * Apple Health as 'apple_health', Health Connect as 'health_connect'.
 */
function getSourceFilter(provider: string): string {
  return provider;
}

/**
 * Format an ISO date string to a short German date label.
 * Example: "11. Mär 2026"
 */
function formatDateDE(iso: string): string {
  const date = new Date(iso);
  const months = [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

/**
 * Format minutes into a readable German string.
 */
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}

/**
 * Format seconds into a readable German string.
 */
function formatSeconds(seconds: number): string {
  return formatMinutes(Math.round(seconds / 60));
}

/**
 * Get a date N days ago as YYYY-MM-DD.
 */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Data fetching hooks
// ---------------------------------------------------------------------------

function useDailyMetrics(userId: string | undefined, provider: string) {
  const [data, setData] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const since = daysAgo(14);
      const source = getSourceFilter(provider);
      log.debug(TAG, 'Fetching daily metrics', { source, since });

      const { data: rows, error } = await supabase
        .from('health_daily_metrics')
        .select(
          'date, sleep_duration_minutes, sleep_score, sleep_deep_minutes, sleep_light_minutes, sleep_rem_minutes, sleep_awake_minutes, hrv_avg, resting_heart_rate, stress_avg, body_battery_high, body_battery_low, steps, active_calories, total_calories, recovery_score, vo2max, spo2_avg, respiration_avg, intensity_minutes, floors_climbed',
        )
        .eq('user_id', userId)
        .eq('source', source)
        .gte('date', since)
        .order('date', { ascending: false });

      if (error) {
        log.error(TAG, 'Error fetching daily metrics', { message: error.message });
      } else {
        setData(rows ?? []);
      }
    } catch (err) {
      log.error(TAG, 'Failed to fetch daily metrics', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [userId, provider]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading };
}

function useActivities(userId: string | undefined, provider: string) {
  const [data, setData] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const since = daysAgo(30);
      const source = getSourceFilter(provider);
      log.debug(TAG, 'Fetching activities', { source, since });

      const { data: rows, error } = await supabase
        .from('activities')
        .select('id, sport, start_time, duration_seconds, distance_meters, avg_hr, max_hr, calories, training_effect, vo2max_activity, avg_pace_min_km, elevation_gain_m, source')
        .eq('user_id', userId)
        .eq('source', source)
        .gte('start_time', new Date(since).toISOString())
        .order('start_time', { ascending: false })
        .limit(50);

      if (error) {
        log.error(TAG, 'Error fetching activities', { message: error.message });
      } else {
        setData(rows ?? []);
      }
    } catch (err) {
      log.error(TAG, 'Failed to fetch activities', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [userId, provider]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading };
}

function useHealthDataGroups(userId: string | undefined, provider: string) {
  const [data, setData] = useState<HealthDataGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const isRawProvider = provider === 'apple_health' || provider === 'health_connect';

  const fetch = useCallback(async () => {
    if (!userId || !isRawProvider) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const since = daysAgo(7);
      log.debug(TAG, 'Fetching health data groups', { provider, since });

      // Supabase doesn't support GROUP BY directly, so we fetch data_type and count client-side
      const { data: rows, error } = await supabase
        .from('health_data')
        .select('data_type')
        .eq('user_id', userId)
        .eq('provider', provider)
        .gte('recorded_at', new Date(since).toISOString());

      if (error) {
        log.error(TAG, 'Error fetching health data', { message: error.message });
      } else {
        const counts: Record<string, number> = {};
        for (const row of rows ?? []) {
          counts[row.data_type] = (counts[row.data_type] ?? 0) + 1;
        }
        const groups = Object.entries(counts)
          .map(([data_type, count]) => ({ data_type, count }))
          .sort((a, b) => b.count - a.count);
        setData(groups);
      }
    } catch (err) {
      log.error(TAG, 'Failed to fetch health data groups', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [userId, provider, isRawProvider]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, isRawProvider };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      className="text-xs uppercase tracking-wider mb-2 mt-6 ml-1"
      style={{ color: Colors.textSecondary }}
    >
      {title}
    </Text>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View
      className="rounded-[14px] p-3 flex-1 min-w-[45%]"
      style={{ backgroundColor: Colors.surfaceNested }}
    >
      <Text className="text-xs font-medium" style={{ color: Colors.textSecondary }}>
        {label}
      </Text>
      <Text className="text-lg font-bold mt-1" style={{ color: Colors.textPrimary }}>
        {value}
      </Text>
      {sub ? (
        <Text className="text-[11px] mt-0.5" style={{ color: Colors.textMuted }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function DailyMetricsSection({ metrics }: { metrics: DailyMetric[] }) {
  if (metrics.length === 0) {
    return (
      <Card>
        <Text className="text-sm text-center py-4" style={{ color: Colors.textMuted }}>
          Keine Metriken in den letzten 14 Tagen
        </Text>
      </Card>
    );
  }

  // Show the most recent day's data prominently, then a compact list
  const latest = metrics[0];

  const cards: { label: string; value: string; sub: string }[] = [];

  if (latest.sleep_duration_minutes != null) {
    cards.push({
      label: 'Schlaf',
      value: formatMinutes(latest.sleep_duration_minutes),
      sub: latest.sleep_score != null ? `Score: ${latest.sleep_score}` : formatDateDE(latest.date),
    });
  }
  if (latest.hrv_avg != null) {
    cards.push({ label: 'HRV', value: `${latest.hrv_avg} ms`, sub: formatDateDE(latest.date) });
  }
  if (latest.resting_heart_rate != null) {
    cards.push({ label: 'Ruhe-HF', value: `${latest.resting_heart_rate} bpm`, sub: formatDateDE(latest.date) });
  }
  if (latest.stress_avg != null) {
    cards.push({ label: 'Stress', value: `${latest.stress_avg}`, sub: formatDateDE(latest.date) });
  }
  if (latest.body_battery_high != null) {
    const low = latest.body_battery_low ?? '–';
    cards.push({ label: 'Body Battery', value: `${latest.body_battery_high}`, sub: `Tief: ${low}` });
  }
  if (latest.steps != null) {
    cards.push({ label: 'Schritte', value: latest.steps.toLocaleString('de-DE'), sub: formatDateDE(latest.date) });
  }
  if (latest.active_calories != null) {
    cards.push({ label: 'Kalorien (aktiv)', value: `${latest.active_calories} kcal`, sub: formatDateDE(latest.date) });
  }
  if (latest.recovery_score != null) {
    cards.push({ label: 'Erholung', value: `${latest.recovery_score}%`, sub: formatDateDE(latest.date) });
  }
  if (latest.vo2max != null) {
    cards.push({ label: 'VO2max', value: `${latest.vo2max}`, sub: 'ml/kg/min' });
  }
  if (latest.spo2_avg != null) {
    cards.push({ label: 'SpO2', value: `${latest.spo2_avg}%`, sub: formatDateDE(latest.date) });
  }
  if (latest.respiration_avg != null) {
    cards.push({ label: 'Atmung', value: `${latest.respiration_avg}`, sub: 'Atemzüge/min' });
  }
  if (latest.intensity_minutes != null) {
    cards.push({ label: 'Intensitätsmin.', value: `${latest.intensity_minutes}`, sub: formatDateDE(latest.date) });
  }
  if (latest.floors_climbed != null) {
    cards.push({ label: 'Stockwerke', value: `${latest.floors_climbed}`, sub: formatDateDE(latest.date) });
  }
  if (latest.sleep_deep_minutes != null) {
    const light = latest.sleep_light_minutes ?? '–';
    const rem = latest.sleep_rem_minutes ?? '–';
    cards.push({ label: 'Schlafphasen', value: `${formatMinutes(latest.sleep_deep_minutes)} tief`, sub: `Leicht: ${light} / REM: ${rem} Min.` });
  }

  return (
    <Card>
      <Text className="text-sm font-semibold mb-3" style={{ color: Colors.textPrimary }}>
        Aktuell — {formatDateDE(latest.date)}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {cards.map((c) => (
          <MetricCard key={c.label} label={c.label} value={c.value} sub={c.sub} />
        ))}
      </View>

      {metrics.length > 1 && (
        <View className="mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: Colors.divider }}>
          <Text className="text-xs font-medium mb-2" style={{ color: Colors.textSecondary }}>
            Letzte {metrics.length} Tage
          </Text>
          {metrics.slice(1).map((m) => (
            <View key={m.date} className="flex-row justify-between py-1.5">
              <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                {formatDateDE(m.date)}
              </Text>
              <View className="flex-row gap-3">
                {m.steps != null && (
                  <Text className="text-xs" style={{ color: Colors.textPrimary }}>
                    {m.steps.toLocaleString('de-DE')} Schr.
                  </Text>
                )}
                {m.resting_heart_rate != null && (
                  <Text className="text-xs" style={{ color: Colors.textPrimary }}>
                    {m.resting_heart_rate} bpm
                  </Text>
                )}
                {m.sleep_duration_minutes != null && (
                  <Text className="text-xs" style={{ color: Colors.textPrimary }}>
                    {formatMinutes(m.sleep_duration_minutes)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function ActivitiesSection({ activities }: { activities: ActivityRow[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <Text className="text-sm text-center py-4" style={{ color: Colors.textMuted }}>
          Keine Aktivitäten in den letzten 30 Tagen
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      {activities.map((a, idx) => {
        const distanceKm = a.distance_meters != null ? a.distance_meters / 1000 : null;
        const isLast = idx === activities.length - 1;

        return (
          <View
            key={a.id}
            className="py-3"
            style={!isLast ? { borderBottomWidth: 1, borderBottomColor: Colors.divider } : undefined}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                {a.sport}
              </Text>
              <Text className="text-xs" style={{ color: Colors.textMuted }}>
                {formatDateDE(a.start_time)}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-3 mt-1">
              {a.duration_seconds != null && (
                <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                  {formatSeconds(a.duration_seconds)}
                </Text>
              )}
              {distanceKm != null && distanceKm > 0 && (
                <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                  {distanceKm.toFixed(1)} km
                </Text>
              )}
              {a.avg_hr != null && (
                <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                  {a.avg_hr} bpm
                </Text>
              )}
              {a.calories != null && (
                <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                  {a.calories} kcal
                </Text>
              )}
              {a.avg_pace_min_km != null && (
                <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                  {a.avg_pace_min_km.toFixed(1)} min/km
                </Text>
              )}
              {a.elevation_gain_m != null && (
                <Text className="text-xs" style={{ color: Colors.textSecondary }}>
                  ↑{a.elevation_gain_m.toFixed(0)} m
                </Text>
              )}
              {a.training_effect != null && (
                <Text className="text-xs" style={{ color: Colors.primary }}>
                  TE {a.training_effect.toFixed(1)}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

function RawDataRow({
  group,
  userId,
  provider,
  isLast,
}: {
  group: HealthDataGroup;
  userId: string;
  provider: string;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [records, setRecords] = useState<HealthDataRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecords = useCallback(async () => {
    if (records.length > 0) {
      setExpanded((prev) => !prev);
      return;
    }
    setLoading(true);
    try {
      const since = daysAgo(7);
      const { data: rows, error } = await supabase
        .from('health_data')
        .select('id, data_type, value, recorded_at, source')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('data_type', group.data_type)
        .gte('recorded_at', new Date(since).toISOString())
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (!error && rows) {
        setRecords(rows);
        setExpanded(true);
      }
    } catch (err) {
      log.error(TAG, 'Failed to load raw records', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [userId, provider, group.data_type, records.length]);

  const formatValue = (value: Record<string, unknown>): string => {
    if (value.quantity != null && value.unit) return `${value.quantity} ${value.unit}`;
    if (value.value != null) return String(value.value);
    const keys = Object.keys(value).filter((k) => !['startDate', 'endDate', 'metadata'].includes(k));
    if (keys.length <= 3) return keys.map((k) => `${k}: ${value[k]}`).join(', ');
    return `${keys.length} Felder`;
  };

  return (
    <View style={!isLast ? { borderBottomWidth: 1, borderBottomColor: Colors.divider } : undefined}>
      <Pressable
        onPress={loadRecords}
        className="flex-row justify-between items-center py-2.5"
      >
        <Text className="text-sm flex-1" style={{ color: Colors.textPrimary }}>
          {group.data_type}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.textMuted} />
        ) : (
          <Text className="text-sm font-medium" style={{ color: Colors.primary }}>
            {group.count} Einträge {expanded ? '▲' : '▼'}
          </Text>
        )}
      </Pressable>

      {expanded && records.length > 0 && (
        <ScrollView
          style={{ maxHeight: 240 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {records.map((r) => (
            <View
              key={r.id}
              className="pl-3 py-1.5 ml-2"
              style={{ borderLeftWidth: 2, borderLeftColor: Colors.divider }}
            >
              <Text className="text-[11px]" style={{ color: Colors.textMuted }}>
                {formatDateDE(r.recorded_at)}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: Colors.textSecondary }} numberOfLines={2}>
                {formatValue(r.value)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function RawDataSection({ groups, userId, provider }: { groups: HealthDataGroup[]; userId: string; provider: string }) {
  if (groups.length === 0) {
    return (
      <Card>
        <Text className="text-sm text-center py-4" style={{ color: Colors.textMuted }}>
          Keine Rohdaten in den letzten 7 Tagen
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      {groups.map((g, idx) => (
        <RawDataRow
          key={g.data_type}
          group={g}
          userId={userId}
          provider={provider}
          isLast={idx === groups.length - 1}
        />
      ))}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <View className="gap-3 mt-4">
      <Skeleton width="100%" height={120} borderRadius={16} />
      <Skeleton width="100%" height={80} borderRadius={16} />
      <Skeleton width="100%" height={80} borderRadius={16} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ServiceDetailScreen() {
  const { provider } = useLocalSearchParams<{ provider: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const serviceLabel = SERVICE_LABELS[provider ?? ''] ?? provider ?? 'Dienst';

  const metrics = useDailyMetrics(userId, provider ?? '');
  const activities = useActivities(userId, provider ?? '');
  const healthData = useHealthDataGroups(userId, provider ?? '');

  const isLoading = metrics.loading || activities.loading || healthData.loading;

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        <View className="px-4 pt-3 pb-5">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 rounded-full p-1"
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Zurück"
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1">
              <Text
                className="text-white text-xl font-bold"
                style={{ letterSpacing: -0.3 }}
              >
                {serviceLabel}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Tägliche Metriken */}
            <SectionTitle title="Tägliche Metriken" />
            <DailyMetricsSection metrics={metrics.data} />

            {/* Aktivitäten */}
            <SectionTitle title="Aktivitäten" />
            <ActivitiesSection activities={activities.data} />

            {/* Rohdaten — nur Apple Health / Health Connect */}
            {healthData.isRawProvider && (
              <>
                <SectionTitle title="Rohdaten (7 Tage)" />
                <RawDataSection groups={healthData.data} userId={userId ?? ''} provider={provider ?? ''} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
