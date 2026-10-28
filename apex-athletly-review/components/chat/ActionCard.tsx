/**
 * ActionCard - Athletly V2
 *
 * Inline call-to-action card for agent-proposed actions in the chat.
 * Strong primary CTA with brand color; optional description above the button.
 * Used for signup, garmin connect, and future action types.
 *
 * Style note: NativeWind's wrapped Pressable does not reliably honour the
 * function-form of the `style` prop, so we use a plain object style and skip
 * the pressed-state visual feedback for now.
 */

import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Colors } from '@/lib/colors';

type ActionCardVariant = 'primary' | 'subtle';

interface ActionCardProps {
  label: string;
  description?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ActionCardVariant;
}

const CARD_STYLE = {
  backgroundColor: Colors.surface,
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
} as const;

const PRIMARY_BUTTON_STYLE = {
  backgroundColor: Colors.primary,
  borderRadius: 12,
  height: 48,
  width: '100%' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 20,
  shadowColor: Colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 4,
};

const SUBTLE_BUTTON_STYLE = {
  backgroundColor: Colors.primaryUltraLight,
  borderRadius: 12,
  height: 48,
  width: '100%' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 20,
  borderWidth: 1,
  borderColor: Colors.primaryLight,
};

const DESCRIPTION_STYLE = {
  color: Colors.textSecondary,
  fontSize: 14,
  lineHeight: 20,
  marginBottom: 12,
} as const;

const PRIMARY_LABEL_STYLE = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600' as const,
} as const;

const SUBTLE_LABEL_STYLE = {
  color: Colors.primary,
  fontSize: 16,
  fontWeight: '600' as const,
} as const;

const DISABLED_STYLE = { opacity: 0.5 } as const;

export function ActionCard({
  label,
  description,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: ActionCardProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  const buttonStyle = isPrimary ? PRIMARY_BUTTON_STYLE : SUBTLE_BUTTON_STYLE;
  const labelStyle = isPrimary ? PRIMARY_LABEL_STYLE : SUBTLE_LABEL_STYLE;
  const indicatorColor = isPrimary ? '#FFFFFF' : Colors.primary;

  return (
    <View style={CARD_STYLE}>
      {description ? <Text style={DESCRIPTION_STYLE}>{description}</Text> : null}
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={isDisabled ? [buttonStyle, DISABLED_STYLE] : buttonStyle}
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={indicatorColor} />
        ) : (
          <Text style={labelStyle}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default ActionCard;
