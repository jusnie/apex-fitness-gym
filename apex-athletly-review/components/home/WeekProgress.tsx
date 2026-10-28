/**
 * WeekProgress — Athletly V2
 *
 * Shows weekly training progress:
 * "X von Y Einheiten" text + progress bar + day status dots.
 * Uses the days-based DayPlan array from the backend.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getSportColor } from '@/lib/sport-colors';
import { Colors } from '@/lib/colors';
import type { DayPlan } from '@/types/plan';

interface DayStatus {
  sport: string;
  hasSessions: boolean;
  isRestDay: boolean;
}

interface WeekProgressProps {
  days: readonly DayPlan[];
}

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;
const DOT_SIZE = 8;

function buildDayStatuses(days: readonly DayPlan[]): DayStatus[] {
  return DAY_LABELS.map((_, index) => {
    const dayPlan = days[index];
    if (!dayPlan || dayPlan.sessions.length === 0) {
      return { sport: 'rest', hasSessions: false, isRestDay: true };
    }
    return {
      sport: dayPlan.sessions[0].sport,
      hasSessions: true,
      isRestDay: false,
    };
  });
}

export function WeekProgress({ days }: WeekProgressProps) {
  const dayStatuses = useMemo(() => buildDayStatuses(days), [days]);
  const totalPlanned = useMemo(
    () => days.reduce((sum, d) => sum + d.sessions.length, 0),
    [days],
  );

  // TODO: track completed sessions once backend supports it
  const completedCount = 0;
  const progress = totalPlanned > 0 ? completedCount / totalPlanned : 0;

  return (
    <View className="mx-4">
      {/* Header */}
      <Text className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-2">
        Wochenfortschritt
      </Text>

      {/* Progress bar */}
      <ProgressBar progress={progress} color={Colors.primary} height={6} />

      {/* Stats text */}
      <Text className="text-text-secondary text-sm mt-2">
        {completedCount} von {totalPlanned} Einheiten
      </Text>

      {/* Day dots */}
      <View className="flex-row justify-between mt-3">
        {DAY_LABELS.map((label, index) => {
          const status = dayStatuses[index];
          const dotColor = status.isRestDay
            ? Colors.surfaceMuted
            : getSportColor(status.sport);

          return (
            <View key={label} className="items-center gap-1">
              <Text className="text-text-muted text-[10px] font-medium">
                {label}
              </Text>
              <View
                className="rounded-full"
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  backgroundColor: dotColor,
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default WeekProgress;
