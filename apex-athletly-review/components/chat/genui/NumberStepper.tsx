/**
 * NumberStepper - Athletly V2 GenUI
 *
 * Numeric input with minus / plus buttons, respecting min/max/step bounds.
 * Shows the current value with an optional unit suffix. Submits a value
 * formatted as "Ich wahle: <value> <unit?>".
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  CARD_STYLE,
  QUESTION_STYLE,
  PRIMARY_BUTTON_STYLE,
  PRIMARY_LABEL_STYLE,
  DISABLED_STYLE,
  RESOLVED_HINT_STYLE,
  STEPPER_BUTTON_STYLE,
  STEPPER_BUTTON_LABEL_STYLE,
  STEPPER_VALUE_STYLE,
} from './styles';

interface NumberStepperProps {
  readonly question: string;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly initial?: number;
  readonly unit?: string;
  readonly submitLabel?: string;
  readonly disabled: boolean;
  readonly resolvedText?: string;
  readonly onSubmit: (response: string) => void;
}

const ROW_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginBottom: 16,
  gap: 16,
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function formatResponse(value: number, unit?: string): string {
  return unit ? `Ich wahle: ${value} ${unit}` : `Ich wahle: ${value}`;
}

export function NumberStepper({
  question,
  min,
  max,
  step,
  initial,
  unit,
  submitLabel,
  disabled,
  resolvedText,
  onSubmit,
}: NumberStepperProps) {
  const effectiveStep = step && step > 0 ? step : 1;
  const startValue = clamp(initial ?? min, min, max);
  const [value, setValue] = useState<number>(startValue);

  const atMin = value <= min;
  const atMax = value >= max;

  const handleDecrement = useCallback(() => {
    if (disabled || atMin) return;
    setValue((prev) => clamp(prev - effectiveStep, min, max));
  }, [disabled, atMin, effectiveStep, min, max]);

  const handleIncrement = useCallback(() => {
    if (disabled || atMax) return;
    setValue((prev) => clamp(prev + effectiveStep, min, max));
  }, [disabled, atMax, effectiveStep, min, max]);

  const handleSubmit = useCallback(() => {
    if (disabled) return;
    onSubmit(formatResponse(value, unit));
  }, [disabled, value, unit, onSubmit]);

  const cardStyle = disabled ? [CARD_STYLE, DISABLED_STYLE] : CARD_STYLE;
  const submitText = submitLabel ?? 'Weiter';

  const display = unit ? `${value} ${unit}` : `${value}`;

  return (
    <View style={cardStyle}>
      <Text style={QUESTION_STYLE}>{question}</Text>

      <View style={ROW_STYLE}>
        <Pressable
          onPress={handleDecrement}
          disabled={disabled || atMin}
          style={
            disabled || atMin
              ? [STEPPER_BUTTON_STYLE, DISABLED_STYLE]
              : STEPPER_BUTTON_STYLE
          }
          android_ripple={{ color: 'rgba(37,99,235,0.2)', radius: 24 }}
          accessibilityRole="button"
          accessibilityLabel="Verringern"
        >
          <Text style={STEPPER_BUTTON_LABEL_STYLE}>-</Text>
        </Pressable>

        <Text style={STEPPER_VALUE_STYLE}>{display}</Text>

        <Pressable
          onPress={handleIncrement}
          disabled={disabled || atMax}
          style={
            disabled || atMax
              ? [STEPPER_BUTTON_STYLE, DISABLED_STYLE]
              : STEPPER_BUTTON_STYLE
          }
          android_ripple={{ color: 'rgba(37,99,235,0.2)', radius: 24 }}
          accessibilityRole="button"
          accessibilityLabel="Erhohen"
        >
          <Text style={STEPPER_BUTTON_LABEL_STYLE}>+</Text>
        </Pressable>
      </View>

      {!disabled ? (
        <Pressable
          onPress={handleSubmit}
          disabled={disabled}
          style={PRIMARY_BUTTON_STYLE}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          accessibilityRole="button"
          accessibilityLabel={submitText}
        >
          <Text style={PRIMARY_LABEL_STYLE}>{submitText}</Text>
        </Pressable>
      ) : null}

      {disabled && resolvedText ? (
        <Text style={RESOLVED_HINT_STYLE}>{resolvedText}</Text>
      ) : null}
    </View>
  );
}

export default NumberStepper;
