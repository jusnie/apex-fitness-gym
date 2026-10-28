/**
 * WeeklySummary — Summary card at bottom of plan view
 *
 * Shows sport distribution, total stats, and coach message.
 * Reads from the new days-based WeeklyPlan structure.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/lib/colors';
import { getSportColor } from '@/lib/sport-colors';
import type { WeeklyPlan, PlannedSession } from '@/types/plan';

interface WeeklySummaryProps {
  plan: WeeklyPlan;
}

const SPORT_LABELS: Record<string, string> = {
  running: 'Laufen',
  cycling: 'Radfahren',
  swimming: 'Schwimmen',
  gym: 'Gym',
  strength: 'Kraft',
  yoga: 'Yoga',
  hiking: 'Wandern',
};

function getSportLabel(sport: string): string {
  return SPORT_LABELS[sport.toLowerCase()] ?? sport;
}

function formatTotalDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Flatten all sessions from the days array.
 */
function getAllSessions(plan: WeeklyPlan): readonly PlannedSession[] {
  return plan.days.flatMap((day) => day.sessions);
}

function buildSportDistribution(plan: WeeklyPlan): Array<{ sport: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const session of getAllSessions(plan)) {
    const key = session.sport.toLowerCase();
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([sport, count]) => ({ sport, count }))
    .sort((a, b) => b.count - a.count);
}

export function WeeklySummary({ plan }: WeeklySummaryProps) {
  const allSessions = useMemo(() => getAllSessions(plan), [plan]);
  const distribution = useMemo(() => buildSportDistribution(plan), [plan]);
  const totalSessions = allSessions.length;
  const totalDuration = allSessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

  return (
    <Card variant="standard" className="mb-4">
      <Text className="text-text-primary text-lg font-semibold mb-3">
        Wochenuebersicht
      </Text>

      {/* Sport distribution */}
      <View className="gap-2 mb-3">
        {distribution.map(({ sport, count }) => (
          <View key={sport} className="flex-row items-center gap-2">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getSportColor(sport) }}
            />
            <Text className="text-text-secondary text-sm flex-1">
              {getSportLabel(sport)}
            </Text>
            <Text className="text-text-muted text-sm">
              {count}x
            </Text>
          </View>
        ))}
      </View>

      {/* Total stats */}
      <View className="border-t border-divider pt-3 mb-3">
        <Text className="text-text-primary text-sm font-medium">
          {totalSessions} Einheiten · {formatTotalDuration(totalDuration)}
        </Text>
      </View>

      {/* Coach message */}
      {plan.coachMessage ? (
        <View className="rounded-lg p-3" style={{ backgroundColor: '#F5F6F8' }}>
          <View className="flex-row items-start gap-2">
            <MessageCircle size={14} color={Colors.textMuted} strokeWidth={2} />
            <Text className="text-text-secondary text-sm italic flex-1 leading-5">
              {plan.coachMessage}
            </Text>
          </View>

          {/* Expandable reasoning */}
          {plan.reasoning ? (
            <ReasoningSection reasoning={plan.reasoning} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function ReasoningSection({ reasoning }: { reasoning: string }) {
  const [expanded, setExpanded] = useState(false);
  const ChevronIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <View className="mt-2 border-t border-divider pt-2">
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        className="flex-row items-center gap-1"
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Begründung einklappen' : 'Begründung ausklappen'}
      >
        <Text className="text-text-muted text-xs font-medium">
          Begründung
        </Text>
        <ChevronIcon size={12} color={Colors.textMuted} strokeWidth={2} />
      </Pressable>

      {expanded ? (
        <Text className="text-text-muted text-xs mt-1.5 leading-4">
          {reasoning}
        </Text>
      ) : null}
    </View>
  );
}

export default WeeklySummary;
