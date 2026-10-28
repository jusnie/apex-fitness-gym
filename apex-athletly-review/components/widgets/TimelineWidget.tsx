/**
 * TimelineWidget - Athletly V2
 *
 * Vertical timeline with a left-side line and per-item status dots.
 * Each item renders a status dot, an optional date pill, the label, and
 * an optional description.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type {
  TimelineProps,
  TimelineItem,
  TimelineItemStatus,
} from '@/types/widgets';
import { EditInChatButton } from './EditInChatButton';
import { formatWidgetDate } from './widgetFormat';

interface TimelineWidgetExtra {
  readonly editHint?: string;
  readonly onEdit?: (draft: string) => void;
}

const STATUS_COLOR: Readonly<Record<TimelineItemStatus, string>> = {
  done: Colors.success,
  pending: Colors.warning,
  failed: Colors.error,
  neutral: Colors.textMuted,
};

function statusColor(status: TimelineItemStatus | undefined): string {
  if (!status) return Colors.textMuted;
  return STATUS_COLOR[status] ?? Colors.textMuted;
}

interface RowProps {
  readonly item: TimelineItem;
  readonly isLast: boolean;
}

function TimelineRow({ item, isLast }: RowProps) {
  const color = statusColor(item.status);
  const dateLabel = formatWidgetDate(item.date);

  return (
    <View className="flex-row">
      <View className="items-center mr-3" style={{ width: 16 }}>
        <View
          className="w-3 h-3 rounded-full mt-1"
          style={{ backgroundColor: color }}
        />
        {!isLast ? (
          <View
            className="flex-1 mt-1"
            style={{ width: 2, backgroundColor: Colors.divider }}
          />
        ) : null}
      </View>
      <View className="flex-1 pb-4">
        {dateLabel ? (
          <View
            className="self-start rounded-md px-2 py-0.5 mb-1"
            style={{ backgroundColor: Colors.surfaceNested }}
          >
            <Text className="text-text-muted text-[11px] font-medium">
              {dateLabel}
            </Text>
          </View>
        ) : null}
        <Text className="text-text-primary text-sm font-medium">
          {item.label}
        </Text>
        {item.description ? (
          <Text className="text-text-muted text-xs mt-0.5 leading-5">
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function TimelineWidget({
  title,
  items,
  editHint,
  onEdit,
}: TimelineProps & TimelineWidgetExtra) {
  return (
    <Card>
      <Text className="text-text-primary text-base font-semibold mb-3">
        {title}
      </Text>
      <View>
        {items.map((item, idx) => (
          <TimelineRow
            key={`${item.label}-${idx}`}
            item={item}
            isLast={idx === items.length - 1}
          />
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

export default TimelineWidget;
