/**
 * ChecklistWidget - Athletly V2
 *
 * Title plus a list of items with status icons. Done items strike
 * through, in-progress items use a loader-ish icon in orange, open items
 * show an empty gray circle.
 */

import React from 'react';
import { View, Text } from 'react-native';
import {
  CheckCircle2,
  Circle,
  Loader,
  type LucideIcon,
} from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type {
  ChecklistProps,
  ChecklistItem,
  ChecklistItemStatus,
} from '@/types/widgets';
import { EditInChatButton } from './EditInChatButton';

interface ChecklistWidgetExtra {
  readonly editHint?: string;
  readonly onEdit?: (draft: string) => void;
}

interface StatusVisual {
  readonly Icon: LucideIcon;
  readonly color: string;
}

function statusVisual(status: ChecklistItemStatus): StatusVisual {
  switch (status) {
    case 'done':
      return { Icon: CheckCircle2, color: Colors.success };
    case 'in_progress':
      return { Icon: Loader, color: Colors.warning };
    case 'open':
    default:
      return { Icon: Circle, color: Colors.textMuted };
  }
}

interface RowProps {
  readonly item: ChecklistItem;
}

function ChecklistRow({ item }: RowProps) {
  const { Icon, color } = statusVisual(item.status);
  const isDone = item.status === 'done';
  const textStyle = isDone
    ? { textDecorationLine: 'line-through' as const, color: Colors.textMuted }
    : undefined;

  return (
    <View className="flex-row items-start mt-2">
      <View className="mt-0.5">
        <Icon size={16} color={color} strokeWidth={2} />
      </View>
      <Text
        className="text-text-primary text-sm leading-6 flex-1 ml-2"
        style={textStyle}
      >
        {item.text}
      </Text>
    </View>
  );
}

export function ChecklistWidget({
  title,
  items,
  editHint,
  onEdit,
}: ChecklistProps & ChecklistWidgetExtra) {
  return (
    <Card>
      <Text className="text-text-primary text-base font-semibold mb-1">
        {title}
      </Text>
      <View>
        {items.map((item, idx) => (
          <ChecklistRow key={`${item.text}-${idx}`} item={item} />
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

export default ChecklistWidget;
