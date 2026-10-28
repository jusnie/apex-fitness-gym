/**
 * MetricMiniCard — Athletly V2
 *
 * Compact card displaying a single health metric with icon, value, label, and optional trend.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/lib/colors';

type TrendDirection = 'up' | 'down' | 'stable';

interface MetricMiniCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  trend?: TrendDirection;
}

const TREND_CONFIG: Record<TrendDirection, { icon: LucideIcon; color: string }> = {
  up: { icon: TrendingUp, color: Colors.success },
  down: { icon: TrendingDown, color: Colors.error },
  stable: { icon: Minus, color: Colors.textMuted },
};

export function MetricMiniCard({ icon: Icon, value, label, trend }: MetricMiniCardProps) {
  const trendInfo = trend ? TREND_CONFIG[trend] : null;
  const TrendIcon = trendInfo?.icon;

  return (
    <Card variant="metric" className="flex-1">
      <Icon size={16} color={Colors.textMuted} strokeWidth={1.5} />
      <View className="flex-row items-center gap-1 mt-2">
        <Text className="text-text-primary text-lg font-bold">{value}</Text>
        {TrendIcon && (
          <TrendIcon size={12} color={trendInfo.color} strokeWidth={2} />
        )}
      </View>
      <Text className="text-text-secondary text-xs font-medium mt-0.5">
        {label}
      </Text>
    </Card>
  );
}

export default MetricMiniCard;
