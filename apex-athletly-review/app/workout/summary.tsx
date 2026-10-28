/**
 * Workout Summary Screen — Athletly V2
 *
 * Post-workout summary with stats, motivational message,
 * and navigation back to plan or coach.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, Activity, Flame, ArrowLeft, MessageCircle } from 'lucide-react-native';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/lib/colors';
import { getSportIcon } from '@/lib/sport-icons';
import { getSportColor } from '@/lib/sport-colors';
import type { Intensity } from '@/types/plan';

// --- Helpers ---

const INTENSITY_LABELS: Record<string, string> = {
  low: 'Leicht',
  moderate: 'Moderat',
  high: 'Intensiv',
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 1) return `${seconds}s`;
  if (minutes < 60) return `${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDurationValue(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 1) return String(seconds);
  return String(minutes);
}

function formatDurationUnit(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 1) return 'Sek';
  return 'Min';
}

const MOTIVATIONAL_MESSAGES = [
  'Starkes Training! Weiter so.',
  'Gut gemacht! Jede Einheit zaehlt.',
  'Stark geblieben! Dein Koerper dankt es dir.',
] as const;

// --- Main Screen ---

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sport: string;
    sessionType: string;
    intensity: string;
    description?: string;
    targetDuration: string;
    elapsedSeconds: string;
  }>();

  const sport = params.sport ?? 'Training';
  const sessionType = params.sessionType ?? '';
  const intensity = (params.intensity ?? 'moderate') as Intensity;
  const elapsedSeconds = Number(params.elapsedSeconds) || 0;
  const targetDuration = Number(params.targetDuration) || 0;

  const SportIcon = getSportIcon(sport);
  const sportColor = getSportColor(sport);
  const intensityLabel = INTENSITY_LABELS[intensity] ?? intensity;

  const motivationalMessage = useMemo(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
    [],
  );

  const handleBackToPlan = useCallback(() => {
    router.replace('/(tabs)/plan');
  }, [router]);

  const handleShareWithCoach = useCallback(() => {
    const durationText = formatDuration(elapsedSeconds);
    const prefillMessage = `Workout abgeschlossen: ${sport} (${sessionType}), Dauer: ${durationText}, Intensitaet: ${intensityLabel}. Wie war mein Training?`;

    router.replace({
      pathname: '/(tabs)/coach',
      params: { prefill: prefillMessage },
    });
  }, [router, sport, sessionType, elapsedSeconds, intensityLabel]);

  return (
    <View className="flex-1 bg-background">
      <GradientHeader title="Zusammenfassung" subtitle="Workout beendet" />

      <ScrollView
        className="flex-1 -mt-8"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8 px-4"
      >
        {/* Sport Info Header */}
        <Card variant="standard" className="items-center py-6 mb-4">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: `${sportColor}18` }}
          >
            <SportIcon size={32} color={sportColor} strokeWidth={1.8} />
          </View>
          <Text className="text-lg font-bold" style={{ color: Colors.textPrimary }}>
            {sport}
          </Text>
          <View className="flex-row items-center gap-2 mt-2">
            {sessionType !== '' && (
              <Badge type="sport" sport={sport} label={sessionType} />
            )}
            <Badge type="intensity" intensity={intensity} label={intensityLabel} />
          </View>
        </Card>

        {/* Stat Cards */}
        <View className="flex-row gap-3 mb-4">
          <StatCard
            icon={Clock}
            value={formatDurationValue(elapsedSeconds)}
            unit={formatDurationUnit(elapsedSeconds)}
            label="Dauer"
          />
          <StatCard
            icon={Activity}
            value={sport}
            label="Sport"
          />
          <StatCard
            icon={Flame}
            value={intensityLabel}
            label="Intensitaet"
          />
        </View>

        {/* Target comparison */}
        {targetDuration > 0 && (
          <Card variant="standard" className="mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                Zieldauer
              </Text>
              <Text className="text-sm font-medium" style={{ color: Colors.textPrimary }}>
                {targetDuration} Min
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                Tatsaechlich
              </Text>
              <Text className="text-sm font-bold" style={{ color: Colors.primary }}>
                {formatDuration(elapsedSeconds)}
              </Text>
            </View>
          </Card>
        )}

        {/* Motivational Message */}
        <Card variant="standard" className="items-center py-5 mb-4">
          <Text className="text-2xl mb-2">&#x1F4AA;</Text>
          <Text
            className="text-base font-semibold text-center"
            style={{ color: Colors.textPrimary }}
          >
            {motivationalMessage}
          </Text>
        </Card>

        {/* Action Buttons */}
        <View className="gap-3">
          <Button
            variant="primary"
            size="lg"
            label="Zurück zum Plan"
            icon={ArrowLeft}
            onPress={handleBackToPlan}
          />
          <Button
            variant="secondary"
            size="lg"
            label="Mit Coach teilen"
            icon={MessageCircle}
            onPress={handleShareWithCoach}
          />
        </View>
      </ScrollView>
    </View>
  );
}
