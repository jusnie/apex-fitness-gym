/**
 * ConfirmCard - Athletly V2 GenUI
 *
 * Two buttons side by side: a primary confirm and a subtle cancel.
 * Tap either submits immediately with the localized label.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  CARD_STYLE,
  QUESTION_STYLE,
  PRIMARY_BUTTON_STYLE,
  PRIMARY_LABEL_STYLE,
  CANCEL_BUTTON_STYLE,
  CANCEL_LABEL_STYLE,
  DISABLED_STYLE,
  RESOLVED_HINT_STYLE,
} from './styles';

interface ConfirmCardProps {
  readonly question: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly disabled: boolean;
  readonly resolvedText?: string;
  readonly onSubmit: (response: string) => void;
}

const ROW_STYLE = {
  flexDirection: 'row' as const,
  gap: 12,
};

const CONFIRM_BUTTON_STYLE = {
  ...PRIMARY_BUTTON_STYLE,
  flex: 1,
  width: undefined as unknown as '100%',
};

export function ConfirmCard({
  question,
  confirmLabel,
  cancelLabel,
  disabled,
  resolvedText,
  onSubmit,
}: ConfirmCardProps) {
  const confirmText = confirmLabel ?? 'Ja';
  const cancelText = cancelLabel ?? 'Nein';

  const handleConfirm = useCallback(() => {
    if (disabled) return;
    onSubmit(confirmText);
  }, [disabled, confirmText, onSubmit]);

  const handleCancel = useCallback(() => {
    if (disabled) return;
    onSubmit(cancelText);
  }, [disabled, cancelText, onSubmit]);

  const cardStyle = disabled ? [CARD_STYLE, DISABLED_STYLE] : CARD_STYLE;

  return (
    <View style={cardStyle}>
      <Text style={QUESTION_STYLE}>{question}</Text>

      {!disabled ? (
        <View style={ROW_STYLE}>
          <Pressable
            onPress={handleCancel}
            disabled={disabled}
            style={CANCEL_BUTTON_STYLE}
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
            accessibilityRole="button"
            accessibilityLabel={cancelText}
          >
            <Text style={CANCEL_LABEL_STYLE}>{cancelText}</Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            disabled={disabled}
            style={CONFIRM_BUTTON_STYLE}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            accessibilityRole="button"
            accessibilityLabel={confirmText}
          >
            <Text style={PRIMARY_LABEL_STYLE}>{confirmText}</Text>
          </Pressable>
        </View>
      ) : null}

      {disabled && resolvedText ? (
        <Text style={RESOLVED_HINT_STYLE}>{resolvedText}</Text>
      ) : null}
    </View>
  );
}

export default ConfirmCard;
