/**
 * RecoveryGauge — Athletly V2
 *
 * Circular gauge displaying recovery score (0-100).
 * Color-coded: >=80 success, >=50 warning, <50 error.
 * Shows "--" with muted color when no data is available.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { CircularGauge } from '@/components/ui/CircularGauge';
import { Colors } from '@/lib/colors';

interface RecoveryGaugeProps {
  score: number | undefined;
}

const GAUGE_SIZE = 140;
const STROKE_WIDTH = 10;

function getScoreColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 50) return Colors.warning;
  return Colors.error;
}

export function RecoveryGauge({ score }: RecoveryGaugeProps) {
  const hasData = score !== undefined && score !== null;

  if (!hasData) {
    return (
      <View className="items-center py-2">
        <View
          className="items-center justify-center"
          style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
        >
          <CircularGauge
            value={0}
            size={GAUGE_SIZE}
            strokeWidth={STROKE_WIDTH}
            color={Colors.textMuted}
          />
          <View className="absolute items-center justify-center">
            <Text className="text-text-muted text-2xl font-bold">--</Text>
            <Text className="text-text-secondary text-xs font-medium mt-0.5">
              Recovery
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const color = getScoreColor(score);

  return (
    <View className="items-center py-2">
      <CircularGauge
        value={score}
        size={GAUGE_SIZE}
        strokeWidth={STROKE_WIDTH}
        color={color}
        label="Recovery"
      />
    </View>
  );
}

export default RecoveryGauge;
