/**
 * Plan Screen — Athletly V2
 *
 * Weekly training plan view with week navigation, day selector strip,
 * session cards, rest day indicator, and weekly summary.
 * Design spec section 7.2.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react-native';
import { usePlanStore } from '@/store/planStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/lib/colors';
import { log } from '@/lib/logger';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { WeekStrip } from '@/components/plan/WeekStrip';
import { SessionCard } from '@/components/plan/SessionCard';
import { RestDayCard } from '@/components/plan/RestDayCard';
import { WeeklySummary } from '@/components/plan/WeeklySummary';
import { ProductBar } from '@/components/plan/ProductBar';
import type { DayPlan, PlannedSession } from '@/types/plan';

const TAG = 'PlanScreen';

// --- Date Utilities ---

const GERMAN_MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
] as const;

const GERMAN_DAYS = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
  'Donnerstag', 'Freitag', 'Samstag',
] as const;

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMondayForOffset(weekOffset: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff + weekOffset * 7);
  return toLocalISO(monday);
}

function getCalendarWeek(dateISO: string): number {
  const d = new Date(dateISO + 'T12:00:00');
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function formatWeekRange(mondayISO: string): string {
  const monday = new Date(mondayISO + 'T12:00:00');
  const sunday = new Date(mondayISO + 'T12:00:00');
  sunday.setDate(sunday.getDate() + 6);
  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const startMonth = GERMAN_MONTHS[monday.getMonth()];
  const endMonth = GERMAN_MONTHS[sunday.getMonth()];
  if (monday.getMonth() === sunday.getMonth()) {
    return `${startDay}. - ${endDay}. ${startMonth}`;
  }
  return `${startDay}. ${startMonth} - ${endDay}. ${endMonth}`;
}

function formatDayHeader(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00');
  const dayName = GERMAN_DAYS[d.getDay()];
  const dayNum = d.getDate();
  const month = GERMAN_MONTHS[d.getMonth()];
  return `${dayName}, ${dayNum}. ${month}`;
}

function getTodayISO(): string {
  return toLocalISO(new Date());
}

// --- Loading Skeleton ---

function PlanSkeleton() {
  return (
    <View className="px-4 pt-4 gap-4">
      <View className="flex-row justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`skel-day-${i}`} width={44} height={64} borderRadius={12} />
        ))}
      </View>
      <Skeleton width="100%" height={160} borderRadius={16} />
      <Skeleton width="100%" height={120} borderRadius={16} />
    </View>
  );
}

// --- Main Screen ---

export default function PlanScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { currentPlan, isLoading, selectedDate, setSelectedDate, fetchPlan } = usePlanStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const weekStart = useMemo(() => getMondayForOffset(weekOffset), [weekOffset]);
  const calendarWeek = useMemo(() => getCalendarWeek(weekStart), [weekStart]);
  const weekRange = useMemo(() => formatWeekRange(weekStart), [weekStart]);
  const isCurrentWeek = weekOffset === 0;

  useEffect(() => {
    log.info(TAG, 'Screen mounted');
    return () => log.info(TAG, 'Screen unmounted');
  }, []);

  // Fetch plan on mount
  useEffect(() => {
    if (user?.id) {
      log.info(TAG, 'Fetching plan');
      fetchPlan(user.id);
    }
  }, [user?.id, fetchPlan]);

  // Check if plan matches the displayed week
  const planMatchesWeek = currentPlan?.weekStart === weekStart;

  const daysForWeek: readonly DayPlan[] = useMemo(() => {
    if (!planMatchesWeek || !currentPlan) return [];
    return currentPlan.days;
  }, [planMatchesWeek, currentPlan]);

  const selectedDay: DayPlan | undefined = useMemo(
    () => daysForWeek.find((d) => d.date === selectedDate),
    [daysForWeek, selectedDate],
  );

  const sessionsForDay: readonly PlannedSession[] = selectedDay?.sessions ?? [];

  const handlePreviousWeek = useCallback(() => {
    setWeekOffset((prev) => prev - 1);
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekOffset((prev) => prev + 1);
  }, []);

  const handleGoToToday = useCallback(() => {
    setWeekOffset(0);
    setSelectedDate(getTodayISO());
  }, [setSelectedDate]);

  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    await fetchPlan(user.id);
    setIsRefreshing(false);
  }, [user?.id, fetchPlan]);

  const handleNavigateToCoach = useCallback(() => {
    router.push('/(tabs)/coach');
  }, [router]);

  const handleQuickAction = useCallback(
    (_action: string, message: string) => {
      router.push({ pathname: '/(tabs)/coach', params: { prefill: message } });
    },
    [router],
  );

  return (
    <View className="flex-1 bg-background">
      <GradientHeader title="Trainingsplan" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >

        {/* Week Navigation */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Button variant="icon" size="sm" icon={ChevronLeft} onPress={handlePreviousWeek} />
          <View className="items-center">
            <Text className="text-text-primary text-sm font-semibold">
              {weekRange}
            </Text>
            <Text className="text-text-muted text-xs mt-0.5">
              KW {calendarWeek}
            </Text>
          </View>
          <Button variant="icon" size="sm" icon={ChevronRight} onPress={handleNextWeek} />
        </View>

        {/* "Heute" button when navigated away from current week */}
        {!isCurrentWeek && (
          <View className="items-center pb-2">
            <Button variant="ghost" size="sm" label="Heute" onPress={handleGoToToday} />
          </View>
        )}

        {/* Loading State */}
        {isLoading ? (
          <PlanSkeleton />
        ) : !currentPlan ? (
          /* Empty / No Plan State */
          <EmptyState
            icon={CalendarDays}
            title="Noch kein Trainingsplan"
            description="Dein Coach erstellt einen individuellen Plan basierend auf deinen Zielen und Daten."
            actionLabel="Plan erstellen"
            onAction={handleNavigateToCoach}
          />
        ) : (
          /* Plan Content */
          <View className="px-4">
            {/* Week Strip */}
            <WeekStrip
              weekStart={weekStart}
              days={daysForWeek as DayPlan[]}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Day Header */}
            <Text className="text-text-secondary text-sm font-medium mt-4 mb-3">
              {formatDayHeader(selectedDate)}
            </Text>

            {/* Day Content */}
            {!planMatchesWeek ? (
              <View className="items-center py-8">
                <Text className="text-text-muted text-sm">
                  Kein Plan für diese Woche
                </Text>
              </View>
            ) : sessionsForDay.length === 0 ? (
              <RestDayCard
                message={selectedDay?.rest_reason}
                agentTip={selectedDay?.agentTip}
              />
            ) : (
              sessionsForDay.map((session, index) => (
                <View key={`${selectedDate}-${session.sport}-${index}`}>
                  <SessionCard
                    session={session}
                    onQuickAction={handleQuickAction}
                    onStart={() =>
                      router.push({
                        pathname: '/workout/live',
                        params: {
                          sessionId: session.id ?? '',
                          sport: session.sport,
                          sessionType: session.session_type,
                          targetDuration: String(session.duration_minutes),
                          intensity: session.intensity,
                          description: session.description,
                        },
                      })
                    }
                  />
                  {session.id ? (
                    <ProductBar sessionId={session.id} />
                  ) : null}
                </View>
              ))
            )}

            {/* Weekly Summary */}
            {planMatchesWeek && (
              <View className="mt-4">
                <WeeklySummary plan={currentPlan} />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
