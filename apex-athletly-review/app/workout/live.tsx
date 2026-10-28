/**
 * Live Workout Screen — Athletly V2
 *
 * Displays a running timer, sport info, intensity, and control buttons.
 * On stop, navigates to the summary screen with elapsed time.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Play, Pause, Square } from 'lucide-react-native';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

function formatTargetDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// --- Main Screen ---

export default function LiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId?: string;
    sport: string;
    sessionType: string;
    targetDuration: string;
    intensity: string;
    description?: string;
  }>();

  const sport = params.sport ?? 'Training';
  const sessionType = params.sessionType ?? '';
  const targetDuration = Number(params.targetDuration) || 0;
  const intensity = (params.intensity ?? 'moderate') as Intensity;
  const description = params.description ?? '';

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const SportIcon = getSportIcon(sport);
  const sportColor = getSportColor(sport);
  const intensityLabel = INTENSITY_LABELS[intensity] ?? intensity;

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleToggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    router.replace({
      pathname: '/workout/summary',
      params: {
        sport,
        sessionType,
        intensity,
        description,
        targetDuration: String(targetDuration),
        elapsedSeconds: String(elapsedSeconds),
      },
    });
  }, [router, sport, sessionType, intensity, description, targetDuration, elapsedSeconds]);

  const progressPercent =
    targetDuration > 0 ? Math.min(100, (elapsedSeconds / (targetDuration * 60)) * 100) : 0;

  return (
    <View className="flex-1 bg-background">
      <GradientHeader title="Workout" subtitle={sport} />

      <View className="flex-1 px-4 -mt-8">
        {/* Sport & Intensity Info */}
        <Card variant="standard" className="items-center py-6">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: `${sportColor}18` }}
          >
            <SportIcon size={32} color={sportColor} strokeWidth={1.8} />
          </View>

          <View className="flex-row items-center gap-2 mb-2">
            <Badge type="sport" sport={sport} label={sport} />
            <Badge type="intensity" intensity={intensity} label={intensityLabel} />
          </View>

          {description !== '' && (
            <Text
              className="text-sm text-center mt-1 px-4"
              style={{ color: Colors.textSecondary }}
            >
              {description}
            </Text>
          )}
        </Card>

        {/* Timer Display */}
        <Card variant="standard" className="items-center py-8 mt-4">
          <Text
            className="font-bold"
            style={{
              fontSize: 64,
              letterSpacing: -2,
              color: Colors.textPrimary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatTimer(elapsedSeconds)}
          </Text>

          {/* Progress toward target */}
          {targetDuration > 0 && (
            <View className="w-full px-6 mt-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-medium" style={{ color: Colors.textMuted }}>
                  Vergangen
                </Text>
                <Text className="text-xs font-medium" style={{ color: Colors.textMuted }}>
                  Ziel: {formatTargetDuration(targetDuration)}
                </Text>
              </View>
              <View
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: Colors.surfaceNested }}
              >
                <View
                  className="h-2 rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent >= 100 ? Colors.success : Colors.primary,
                  }}
                />
              </View>
            </View>
          )}
        </Card>

        {/* Controls */}
        <View className="flex-row items-center justify-center gap-6 mt-8">
          {/* Start / Pause */}
          <Pressable
            onPress={handleToggleTimer}
            className="w-20 h-20 rounded-full items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: isRunning ? Colors.warning : Colors.primary,
              opacity: pressed ? 0.8 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            })}
            accessibilityRole="button"
            accessibilityLabel={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? (
              <Pause size={32} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Play size={32} color="#FFFFFF" strokeWidth={2} />
            )}
          </Pressable>

          {/* Stop */}
          <Pressable
            onPress={handleStop}
            className="w-20 h-20 rounded-full items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: Colors.error,
              opacity: pressed ? 0.8 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            })}
            accessibilityRole="button"
            accessibilityLabel="Stopp"
          >
            <Square size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Button labels */}
        <View className="flex-row items-center justify-center gap-6 mt-2">
          <Text className="w-20 text-center text-xs font-medium" style={{ color: Colors.textMuted }}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
          <Text className="w-20 text-center text-xs font-medium" style={{ color: Colors.textMuted }}>
            Stopp
          </Text>
        </View>
      </View>
    </View>
  );
}
