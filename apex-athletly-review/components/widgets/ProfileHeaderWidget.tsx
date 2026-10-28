/**
 * ProfileHeaderWidget - Athletly V2
 *
 * Hero header widget rendering the athlete's identity: avatar circle,
 * big name, optional subtitle, optional sport badge pills.
 * Intentionally has no edit button (the name is structural, edited via
 * other channels).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { ProfileHeaderProps } from '@/types/widgets';

function initial(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return '?';
  return trimmed[0].toUpperCase();
}

export function ProfileHeaderWidget({
  name,
  subtitle,
  sport_badges,
}: ProfileHeaderProps) {
  const displayName = name?.trim() || 'Athlet:in';
  const hasBadges = Array.isArray(sport_badges) && sport_badges.length > 0;

  return (
    <Card variant="hero">
      <View className="flex-row items-center">
        <View
          className="w-14 h-14 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: Colors.primaryLight }}
        >
          <Text
            className="text-2xl font-bold"
            style={{ color: Colors.primary }}
          >
            {initial(displayName)}
          </Text>
        </View>
        <View className="flex-1">
          <Text
            className="text-text-primary text-2xl font-bold"
            style={{ letterSpacing: -0.3 }}
            numberOfLines={2}
          >
            {displayName}
          </Text>
          {subtitle ? (
            <Text className="text-text-muted text-sm mt-0.5" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {hasBadges ? (
        <View className="flex-row flex-wrap mt-3 gap-2">
          {sport_badges!.map((badge, idx) => (
            <View
              key={`${badge}-${idx}`}
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: Colors.primaryUltraLight }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: Colors.primary }}
              >
                {badge}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export default ProfileHeaderWidget;
