/**
 * ChoiceCard - Athletly V2 GenUI
 *
 * Handles both `choice_single` and `choice_multi` UI components. Renders
 * tappable chips that wrap horizontally. Single-mode submits immediately
 * on tap; multi-mode toggles selection and shows a Weiter button.
 *
 * Once submitted, the card freezes in its resolved state and only shows
 * the user's chosen value(s).
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
  CHIP_SELECTED_STYLE,
  CHIP_UNSELECTED_STYLE,
  CHIP_LABEL_SELECTED_STYLE,
  CHIP_LABEL_UNSELECTED_STYLE,
} from './styles';

export type ChoiceMode = 'single' | 'multi';

interface ChoiceCardProps {
  readonly question: string;
  readonly options: ReadonlyArray<string>;
  readonly mode: ChoiceMode;
  readonly submitLabel?: string;
  readonly disabled: boolean;
  readonly resolvedText?: string;
  readonly onSubmit: (response: string) => void;
}

const ROW_STYLE = {
  flexDirection: 'row' as const,
  flexWrap: 'wrap' as const,
  marginBottom: 4,
};

function buildResponse(labels: ReadonlyArray<string>): string {
  return `Ich wahle: ${labels.join(', ')}`;
}

export function ChoiceCard({
  question,
  options,
  mode,
  submitLabel,
  disabled,
  resolvedText,
  onSubmit,
}: ChoiceCardProps) {
  const [selected, setSelected] = useState<ReadonlyArray<string>>([]);

  const toggle = useCallback(
    (option: string) => {
      if (disabled) return;
      if (mode === 'single') {
        setSelected([option]);
        onSubmit(buildResponse([option]));
        return;
      }
      setSelected((prev) =>
        prev.includes(option)
          ? prev.filter((o) => o !== option)
          : [...prev, option],
      );
    },
    [disabled, mode, onSubmit],
  );

  const handleSubmit = useCallback(() => {
    if (disabled) return;
    if (selected.length === 0) return;
    onSubmit(buildResponse(selected));
  }, [disabled, selected, onSubmit]);

  const cardStyle = disabled ? [CARD_STYLE, DISABLED_STYLE] : CARD_STYLE;
  const submitText =
    submitLabel ?? (mode === 'multi' ? 'Weiter' : undefined);

  return (
    <View style={cardStyle}>
      <Text style={QUESTION_STYLE}>{question}</Text>
      <View style={ROW_STYLE}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const chipStyle = isSelected
            ? CHIP_SELECTED_STYLE
            : CHIP_UNSELECTED_STYLE;
          const labelStyle = isSelected
            ? CHIP_LABEL_SELECTED_STYLE
            : CHIP_LABEL_UNSELECTED_STYLE;
          return (
            <Pressable
              key={option}
              onPress={() => toggle(option)}
              disabled={disabled}
              style={chipStyle}
              android_ripple={{ color: 'rgba(37,99,235,0.15)' }}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected: isSelected, disabled }}
            >
              <Text style={labelStyle}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'multi' && !disabled && submitText ? (
        <Pressable
          onPress={handleSubmit}
          disabled={selected.length === 0}
          style={
            selected.length === 0
              ? [PRIMARY_BUTTON_STYLE, DISABLED_STYLE]
              : PRIMARY_BUTTON_STYLE
          }
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

export default ChoiceCard;
