/**
 * StructuredProfileCard - Athletly V2
 *
 * Key-value list rendering the structured profile block (sport,
 * training days, fitness markers, goal). Read-only; the "Anpassen im
 * Chat" button at the bottom routes the user to the coach screen with
 * a draft message that they can edit before sending.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { IdentityStructured } from '@/types/identity';
import {
  formatSports,
  formatNumber,
  formatPace,
  formatGoal,
} from './structuredFormat';

interface StructuredProfileCardProps {
  readonly structured: IdentityStructured;
  readonly onEditPress: () => void;
}

interface RowProps {
  readonly label: string;
  readonly value: string;
  readonly isLast?: boolean;
}

function Row({ label, value, isLast = false }: RowProps) {
  const borderClass = isLast ? '' : 'border-b border-divider';
  return (
    <View className={`flex-row items-start justify-between py-3 ${borderClass}`}>
      <Text className="text-text-secondary text-sm flex-shrink-0 mr-3">
        {label}
      </Text>
      <Text className="text-text-primary text-sm flex-1 text-right" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function StructuredProfileCard({
  structured,
  onEditPress,
}: StructuredProfileCardProps) {
  const { sports, training_days_per_week, max_session_minutes, fitness, goal } =
    structured;

  return (
    <Card>
      <Text className="text-text-primary text-base font-semibold mb-1">
        Profil
      </Text>
      <Text className="text-text-muted text-xs mb-2">
        Strukturierte Eckdaten, die Athletly nutzt.
      </Text>

      <Row label="Sport" value={formatSports(sports)} />
      <Row
        label="Trainingstage / Woche"
        value={formatNumber(training_days_per_week, '')}
      />
      <Row
        label="Max. Session"
        value={formatNumber(max_session_minutes, ' min')}
      />
      <Row
        label="VO2max"
        value={formatNumber(fitness.vo2max_estimate, ' ml/kg/min')}
      />
      <Row
        label="Schwellenpace"
        value={formatPace(fitness.threshold_pace_min_km)}
      />
      <Row
        label="Wochenumfang"
        value={formatNumber(fitness.weekly_volume_km, ' km')}
      />
      <Row
        label="FTP"
        value={formatNumber(fitness.ftp_watts, ' W')}
      />
      <Row label="Ziel" value={formatGoal(goal)} isLast />

      <Pressable
        onPress={onEditPress}
        className="flex-row items-center justify-center mt-4 py-2.5 rounded-xl"
        style={({ pressed }) => ({
          backgroundColor: Colors.primaryUltraLight,
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel="Profil im Chat anpassen"
      >
        <MessageCircle size={16} color={Colors.primary} strokeWidth={2} />
        <Text className="text-primary text-sm font-medium ml-2">
          Anpassen im Chat
        </Text>
      </Pressable>
    </Card>
  );
}

export default StructuredProfileCard;
