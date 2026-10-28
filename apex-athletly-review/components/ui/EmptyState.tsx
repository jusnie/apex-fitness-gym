import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-8">
      <Icon size={48} color="#94A3B8" strokeWidth={1.5} />
      <Text className="text-text-primary text-lg font-semibold mt-4 text-center">
        {title}
      </Text>
      <Text className="text-text-secondary text-sm text-center mt-2 leading-5">
        {description}
      </Text>
      {actionLabel && onAction && (
        <View className="mt-6">
          <Button variant="primary" size="md" label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

export default EmptyState;
