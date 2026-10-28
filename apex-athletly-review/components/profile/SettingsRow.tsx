/**
 * SettingsRow — Athletly V2
 *
 * Reusable row component for settings lists.
 * Supports icon, label, value, badge, chevron, destructive variant.
 */

import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '@/lib/colors';

interface SettingsRowProps {
  icon?: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value?: string;
  badge?: React.ReactNode;
  onPress?: () => void;
  isDestructive?: boolean;
  isLast?: boolean;
  rightElement?: React.ReactNode;
}

export function SettingsRow({
  icon: Icon,
  label,
  value,
  badge,
  onPress,
  isDestructive = false,
  isLast = false,
  rightElement,
}: SettingsRowProps) {
  const labelColor = isDestructive ? 'text-error' : 'text-text-primary';
  const iconColor = isDestructive ? Colors.error : Colors.textSecondary;
  const borderClass = isLast ? '' : 'border-b border-divider';

  const content = (
    <View className={`flex-row items-center py-3.5 px-4 ${borderClass}`}>
      {Icon && (
        <View className="w-8 items-center mr-3">
          <Icon size={20} color={iconColor} />
        </View>
      )}
      <Text className={`flex-1 text-base ${labelColor}`}>
        {label}
      </Text>
      {badge}
      {value && (
        <Text className="text-sm text-text-secondary mr-2">
          {value}
        </Text>
      )}
      {rightElement}
      {onPress && !rightElement && (
        <ChevronRight size={18} color={Colors.textMuted} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export default SettingsRow;
