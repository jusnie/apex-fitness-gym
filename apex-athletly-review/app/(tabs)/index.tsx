/**
 * Today Screen — Athletly V2
 *
 * Daily dashboard: greeting, recovery gauge, hero workout card,
 * metric mini cards, and week progress.
 * Design spec section 7.1.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Moon, Heart, Activity } from 'lucide-react-native';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { useAuthStore } from '@/store/authStore';
import { usePlanStore } from '@/store/planStore';
import { useHealthStore } from '@/store/healthStore';
import { Skeleton, EmptyState } from '@/components/ui';
import { RecoveryGauge } from '@/components/home/RecoveryGauge';
import { HeroWorkoutCard } from '@/components/home/HeroWorkoutCard';
import { MetricMiniCard } from '@/components/home/MetricMiniCard';
import { WeekProgress } from '@/components/home/WeekProgress';
import { ProductBar } from '@/components/plan/ProductBar';
import { Colors } from '@/lib/colors';
import { log } from '@/lib/logger';

const TAG = 'TodayScreen';

/**
 * Get a German greeting based on current hour.
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

/**
 * Format today's date in German (e.g. "Mittwoch, 5. März").
 */
function formatGermanDate(): string {
  const days = [
    'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
    'Donnerstag', 'Freitag', 'Samstag',
  ];
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()}. ${months[now.getMonth()]}`;
}

/**
 * Get today's ISO date string (YYYY-MM-DD) in local timezone.
 */
function getTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatSleepMinutes(minutes: number | undefined): string {
  if (minutes === undefined) return '--';
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

function formatHRV(hrv: number | undefined): string {
  if (hrv === undefined) return '--';
  return `${Math.round(hrv)}ms`;
}

function formatStress(stress: number | undefined): string {
  if (stress === undefined) return '--';
  return `${Math.round(stress)}`;
}

export default function TodayScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { currentPlan, isLoading: planLoading, fetchPlan } = usePlanStore();
  const { metrics, isLoading: healthLoading, fetchMetrics } = useHealthStore();

  const isLoading = planLoading || healthLoading;

  useEffect(() => {
    log.info(TAG, 'Screen mounted', { userId: user?.id?.slice(0, 8) });
    return () => log.info(TAG, 'Screen unmounted');
  }, [user?.id]);

  // Fetch data on mount
  useEffect(() => {
    if (user?.id) {
      log.info(TAG, 'Fetching plan + metrics');
      fetchPlan(user.id);
      fetchMetrics(user.id);
    }
  }, [user?.id, fetchPlan, fetchMetrics]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    log.info(TAG, 'Pull-to-refresh');
    const endTimer = log.time(TAG, 'refresh');
    await Promise.all([fetchPlan(user.id), fetchMetrics(user.id)]);
    endTimer();
  }, [user?.id, fetchPlan, fetchMetrics]);

  // Find today's session from the days array
  const todayISO = getTodayISO();
  const todayDay = useMemo(
    () => currentPlan?.days.find((d) => d.date === todayISO) ?? null,
    [currentPlan?.days, todayISO],
  );
  const todaySession = todayDay?.sessions[0] ?? null;

  const isRestDay = currentPlan !== null && (todayDay === null || todayDay.sessions.length === 0);
  const hasNoplan = !planLoading && currentPlan === null;

  // Navigate to coach tab
  const navigateToCoach = useCallback(() => {
    router.push('/(tabs)/coach');
  }, [router]);

  // Greeting
  const greeting = getGreeting();
  const dateString = formatGermanDate();
  const userName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? '';

  return (
    <View className="flex-1 bg-background">
      <GradientHeader
        title={`${greeting}${userName ? `, ${userName}` : ''}`}
        subtitle={dateString}
        rightContent={
          !isLoading && !hasNoplan && metrics?.recoveryScore !== undefined
            ? <RecoveryGauge score={metrics.recoveryScore} />
            : undefined
        }
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >

        {/* Loading state */}
        {isLoading && <LoadingSkeleton />}

        {/* No plan state */}
        {!isLoading && hasNoplan && (
          <View className="mt-8">
            <EmptyState
              icon={Calendar}
              title="Noch kein Trainingsplan"
              description="Frag deinen Coach nach einem personalisierten Trainingsplan."
              actionLabel="Coach fragen"
              onAction={navigateToCoach}
            />
          </View>
        )}

        {/* Has plan / data state */}
        {!isLoading && !hasNoplan && (
          <>
            {/* 2. Metric Mini Cards */}
            <View className="flex-row gap-3 px-4 mt-4">
              <MetricMiniCard
                icon={Moon}
                value={formatSleepMinutes(metrics?.sleepDurationMinutes)}
                label="Schlaf"
              />
              <MetricMiniCard
                icon={Heart}
                value={formatHRV(metrics?.hrvAvg)}
                label="HRV"
              />
              <MetricMiniCard
                icon={Activity}
                value={formatStress(metrics?.stressAvg)}
                label="Stress"
              />
            </View>

            {/* 4. Section Header + Hero Workout Card */}
            <View className="px-4 mt-6 mb-3">
              <Text className="text-text-primary text-lg font-semibold">
                Heutiges Training
              </Text>
            </View>
            <HeroWorkoutCard
              session={todaySession}
              isRestDay={isRestDay}
              onAskCoach={navigateToCoach}
            />

            {/* 4b. Product Recommendations */}
            {currentPlan && (
              <View className="px-4 mt-4">
                <ProductBar planId={currentPlan.id} />
              </View>
            )}

            {/* 5. Week Progress */}
            {currentPlan && (
              <View className="mt-6">
                <WeekProgress
                  days={currentPlan.days}
                />
              </View>
            )}

            {/* Bottom padding for tab bar */}
            <View className="h-8" />
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Loading skeleton layout matching the Today screen structure.
 */
function LoadingSkeleton() {
  return (
    <View className="px-4 mt-6 gap-4">
      {/* Recovery gauge skeleton */}
      <View className="items-center">
        <Skeleton width={140} height={140} borderRadius={70} />
      </View>

      {/* Metric cards skeleton */}
      <View className="flex-row gap-3">
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton width="100%" height={80} borderRadius={16} />
      </View>

      {/* Hero card skeleton */}
      <Skeleton width="100%" height={200} borderRadius={16} />

      {/* Progress skeleton */}
      <Skeleton width="100%" height={60} borderRadius={12} />
    </View>
  );
}
