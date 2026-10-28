/**
 * HeroGoalWidget - Athletly V2
 *
 * Hero rendering of the athlete's current goal: event headline, target
 * date with countdown, target time with pace, optional course
 * description, optional source footer, and the standard edit button.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Target, Calendar, Clock, MapPin } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { HeroGoalProps } from '@/types/widgets';
import { EditInChatButton } from './EditInChatButton';
import { formatCountdownDays, formatWidgetDate } from './widgetFormat';

interface HeroGoalWidgetExtra {
  readonly editHint?: string;
  readonly onEdit?: (draft: string) => void;
}

export function HeroGoalWidget({
  event,
  target_date,
  countdown_days,
  target_time,
  pace,
  course_description,
  source,
  editHint,
  onEdit,
}: HeroGoalProps & HeroGoalWidgetExtra) {
  const dateLong = formatWidgetDate(target_date);
  const countdown = formatCountdownDays(countdown_days);

  return (
    <Card>
      <View className="flex-row items-center mb-2">
        <Target size={14} color={Colors.primary} strokeWidth={2.5} />
        <Text
          className="text-xs font-semibold ml-1.5 tracking-wider"
          style={{ color: Colors.primary }}
        >
          ZIEL
        </Text>
      </View>

      <Text
        className="text-text-primary text-2xl font-semibold"
        style={{ letterSpacing: -0.3 }}
      >
        {event}
      </Text>

      {dateLong ? (
        <View className="flex-row items-start mt-4">
          <View className="mt-0.5">
            <Calendar size={18} color={Colors.primary} strokeWidth={2} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-text-primary text-base font-medium">
              {dateLong}
            </Text>
            {countdown ? (
              <Text className="text-text-muted text-xs mt-0.5">
                {countdown}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {target_time ? (
        <View className="flex-row items-start mt-3">
          <View className="mt-1">
            <Clock size={18} color={Colors.primary} strokeWidth={2} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-text-primary text-xl font-semibold">
              {target_time}
            </Text>
            {pace ? (
              <Text className="text-text-muted text-xs mt-0.5">
                Pace {pace}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {course_description ? (
        <View className="mt-4">
          <View className="flex-row items-center mb-2">
            <MapPin size={12} color={Colors.textMuted} strokeWidth={2.5} />
            <Text className="text-text-muted text-xs font-semibold ml-1.5 tracking-wider">
              STRECKE
            </Text>
          </View>
          <Text className="text-text-secondary text-sm leading-6 italic">
            {course_description}
          </Text>
        </View>
      ) : null}

      {source ? (
        <Text className="text-text-muted text-[11px] mt-4">
          Quelle: {source}
        </Text>
      ) : null}

      <EditInChatButton
        hint={editHint}
        onEdit={onEdit}
        accessibilityLabel="Ziel im Chat anpassen"
      />
    </Card>
  );
}

export default HeroGoalWidget;
