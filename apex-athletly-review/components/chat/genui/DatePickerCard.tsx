/**
 * DatePickerCard - Athletly V2 GenUI
 *
 * Lightweight date input. The app does not depend on
 * @react-native-community/datetimepicker, so we use a plain TextInput
 * accepting YYYY-MM-DD with inline validation and min/max bounds.
 *
 * If a native picker dependency is added later, swap the body of this
 * component without changing the registry contract.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import {
  CARD_STYLE,
  QUESTION_STYLE,
  PRIMARY_BUTTON_STYLE,
  PRIMARY_LABEL_STYLE,
  DISABLED_STYLE,
  RESOLVED_HINT_STYLE,
  TEXT_INPUT_STYLE,
  HINT_STYLE,
} from './styles';
import { Colors } from '@/lib/colors';

interface DatePickerCardProps {
  readonly question: string;
  readonly minDate?: string;
  readonly maxDate?: string;
  readonly initialDate?: string;
  readonly submitLabel?: string;
  readonly disabled: boolean;
  readonly resolvedText?: string;
  readonly onSubmit: (response: string) => void;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const ts = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(ts)) return false;
  const reformatted = new Date(ts).toISOString().slice(0, 10);
  return reformatted === value;
}

function withinBounds(value: string, min?: string, max?: string): boolean {
  if (min && value < min) return false;
  if (max && value > max) return false;
  return true;
}

const ERROR_STYLE = {
  color: Colors.error,
  fontSize: 12,
  marginTop: -6,
  marginBottom: 10,
} as const;

export function DatePickerCard({
  question,
  minDate,
  maxDate,
  initialDate,
  submitLabel,
  disabled,
  resolvedText,
  onSubmit,
}: DatePickerCardProps) {
  const [value, setValue] = useState<string>(initialDate ?? '');

  const isValid = isValidDateString(value) && withinBounds(value, minDate, maxDate);

  const handleSubmit = useCallback(() => {
    if (disabled || !isValid) return;
    onSubmit(`Ich wahle: ${value}`);
  }, [disabled, isValid, value, onSubmit]);

  const cardStyle = disabled ? [CARD_STYLE, DISABLED_STYLE] : CARD_STYLE;
  const submitText = submitLabel ?? 'Weiter';

  const showFormatError = value.length > 0 && !DATE_REGEX.test(value);
  const showBoundsError =
    DATE_REGEX.test(value) && !withinBounds(value, minDate, maxDate);

  const boundsHint =
    minDate && maxDate
      ? `Zwischen ${minDate} und ${maxDate}`
      : minDate
        ? `Frhuestens ${minDate}`
        : maxDate
          ? `Spaetestens ${maxDate}`
          : 'Format: YYYY-MM-DD';

  return (
    <View style={cardStyle}>
      <Text style={QUESTION_STYLE}>{question}</Text>

      {!disabled ? (
        <>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            style={TEXT_INPUT_STYLE}
            accessibilityLabel="Datum"
          />
          {showFormatError ? (
            <Text style={ERROR_STYLE}>Bitte im Format YYYY-MM-DD eingeben.</Text>
          ) : showBoundsError ? (
            <Text style={ERROR_STYLE}>Datum liegt ausserhalb des erlaubten Bereichs.</Text>
          ) : (
            <Text style={HINT_STYLE}>{boundsHint}</Text>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={!isValid}
            style={
              isValid
                ? PRIMARY_BUTTON_STYLE
                : [PRIMARY_BUTTON_STYLE, DISABLED_STYLE]
            }
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            accessibilityRole="button"
            accessibilityLabel={submitText}
            accessibilityState={{ disabled: !isValid }}
          >
            <Text style={PRIMARY_LABEL_STYLE}>{submitText}</Text>
          </Pressable>
        </>
      ) : null}

      {disabled && resolvedText ? (
        <Text style={RESOLVED_HINT_STYLE}>{resolvedText}</Text>
      ) : null}
    </View>
  );
}

export default DatePickerCard;
