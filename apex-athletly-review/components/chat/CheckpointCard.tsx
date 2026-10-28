/**
 * CheckpointCard — Athletly V2
 *
 * Inline card in chat for checkpoint confirmation.
 * - Nested variant card with preview content
 * - Type indicator: "Bestaetigung erforderlich" (HARD) or "Vorschlag" (SOFT)
 * - Accept/Reject buttons
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles, ShieldCheck, Lightbulb } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/lib/colors';
import type { Checkpoint } from '@/types/chat';

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  onConfirm: (accepted: boolean) => void;
  isConfirming: boolean;
}

const TYPE_CONFIG = {
  HARD: {
    label: 'Bestaetigung erforderlich',
    Icon: ShieldCheck,
    color: Colors.warning,
  },
  SOFT: {
    label: 'Vorschlag',
    Icon: Lightbulb,
    color: Colors.primary,
  },
} as const;

function formatPreview(preview: Record<string, unknown>): string {
  return Object.entries(preview)
    .map(([key, value]) => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return `${key}: ${value}`;
      if (Array.isArray(value)) return value.join('\n');
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join('\n');
}

export function CheckpointCard({
  checkpoint,
  onConfirm,
  isConfirming,
}: CheckpointCardProps) {
  const config = TYPE_CONFIG[checkpoint.type];
  const previewText = formatPreview(checkpoint.preview);

  return (
    <View className="self-start max-w-[90%] mb-3">
      <Card variant="nested" className="gap-3">
        {/* Header */}
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color={Colors.primary} strokeWidth={2} />
          <Text className="text-text-primary text-base font-semibold flex-1">
            Neuer Trainingsplan
          </Text>
        </View>

        {/* Type badge */}
        <View className="flex-row items-center gap-1.5">
          <config.Icon size={12} color={config.color} strokeWidth={2} />
          <Text className="text-xs font-medium" style={{ color: config.color }}>
            {config.label}
          </Text>
        </View>

        {/* Preview content */}
        {previewText.length > 0 && (
          <Text className="text-text-secondary text-sm leading-5">
            {previewText}
          </Text>
        )}

        {/* Action buttons */}
        <View className="flex-row gap-3 mt-1">
          <View className="flex-1">
            <Button
              variant="ghost"
              label="Ablehnen"
              size="sm"
              onPress={() => onConfirm(false)}
              disabled={isConfirming}
            />
          </View>
          <View className="flex-1">
            <Button
              variant="primary"
              label="Annehmen"
              size="sm"
              onPress={() => onConfirm(true)}
              loading={isConfirming}
              disabled={isConfirming}
            />
          </View>
        </View>
      </Card>
    </View>
  );
}

export default CheckpointCard;
