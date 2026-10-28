/**
 * StatGridWidget - Athletly V2
 *
 * Title plus a 2-column grid of stat cells. Each cell shows a small
 * uppercase label, the big value, an optional unit suffix, and an
 * optional icon at the top-right corner.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { StatGridProps, StatItem } from '@/types/widgets';
import { resolveIcon } from './iconResolver';
import { EditInChatButton } from './EditInChatButton';

interface StatGridWidgetExtra {
  readonly editHint?: string;
  readonly onEdit?: (draft: string) => void;
}

interface StatCellProps {
  readonly stat: StatItem;
}

function StatCell({ stat }: StatCellProps) {
  const Icon = resolveIcon(stat.icon);
  const hasIcon = Boolean(stat.icon);

  return (
    <View
      className="rounded-2xl p-3 mb-2"
      style={{ width: '49%', backgroundColor: Colors.surfaceNested }}
    >
      <View className="flex-row items-start justify-between">
        <Text
          className="text-text-muted text-[10px] font-semibold tracking-wider uppercase flex-1"
          numberOfLines={2}
        >
          {stat.label}
        </Text>
        {hasIcon ? (
          <Icon size={14} color={Colors.textMuted} strokeWidth={2} />
        ) : null}
      </View>
      <View className="flex-row items-baseline mt-2">
        <Text
          className="text-text-primary text-2xl font-bold"
          style={{ letterSpacing: -0.3 }}
        >
          {stat.value}
        </Text>
        {stat.unit ? (
          <Text className="text-text-muted text-sm ml-1">{stat.unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function StatGridWidget({
  title,
  stats,
  editHint,
  onEdit,
}: StatGridProps & StatGridWidgetExtra) {
  return (
    <Card>
      <Text className="text-text-primary text-base font-semibold mb-3">
        {title}
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {stats.map((stat, idx) => (
          <StatCell key={`${stat.label}-${idx}`} stat={stat} />
        ))}
      </View>
      <EditInChatButton
        hint={editHint}
        onEdit={onEdit}
        accessibilityLabel={`${title} im Chat anpassen`}
      />
    </Card>
  );
}

export default StatGridWidget;
