/**
 * ChipListWidget - Athletly V2
 *
 * Title plus a flex-wrap row of colored chips with optional icons.
 * Color comes from the LLM-supplied chip color; unknown colors fall back
 * to gray.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import type {
  ChipListProps,
  Chip,
  ChipColor,
} from '@/types/widgets';
import { resolveIcon } from './iconResolver';
import { EditInChatButton } from './EditInChatButton';

interface ChipListWidgetExtra {
  readonly editHint?: string;
  readonly onEdit?: (draft: string) => void;
}

interface ChipStyle {
  readonly bg: string;
  readonly text: string;
}

const CHIP_STYLE: Readonly<Record<ChipColor, ChipStyle>> = {
  green: { bg: 'bg-green-100', text: 'text-green-800' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

const CHIP_ICON_COLOR: Readonly<Record<ChipColor, string>> = {
  green: '#166534',
  orange: '#9A3412',
  gray: '#374151',
  blue: '#1E40AF',
};

function chipStyle(color: ChipColor | undefined): ChipStyle {
  if (!color) return CHIP_STYLE.gray;
  return CHIP_STYLE[color] ?? CHIP_STYLE.gray;
}

function chipIconColor(color: ChipColor | undefined): string {
  if (!color) return CHIP_ICON_COLOR.gray;
  return CHIP_ICON_COLOR[color] ?? CHIP_ICON_COLOR.gray;
}

interface ChipPillProps {
  readonly chip: Chip;
}

function ChipPill({ chip }: ChipPillProps) {
  const style = chipStyle(chip.color);
  const Icon = resolveIcon(chip.icon);
  const hasIcon = Boolean(chip.icon);
  const iconColor = chipIconColor(chip.color);

  return (
    <View
      className={`flex-row items-center rounded-full px-3 py-1 ${style.bg}`}
    >
      {hasIcon ? (
        <View className="mr-1">
          <Icon size={12} color={iconColor} strokeWidth={2} />
        </View>
      ) : null}
      <Text className={`text-xs font-medium ${style.text}`}>{chip.label}</Text>
    </View>
  );
}

export function ChipListWidget({
  title,
  chips,
  editHint,
  onEdit,
}: ChipListProps & ChipListWidgetExtra) {
  return (
    <Card>
      <Text className="text-text-primary text-base font-semibold mb-3">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {chips.map((chip, idx) => (
          <ChipPill key={`${chip.label}-${idx}`} chip={chip} />
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

export default ChipListWidget;
