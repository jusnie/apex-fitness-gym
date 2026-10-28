/**
 * TextInputCard - Athletly V2 GenUI
 *
 * Inline form card. Renders one or more labelled inputs followed by a
 * full-width primary submit button. Used for both agent-passthrough forms
 * (free-text answers turned into a chat message) and native handlers like
 * signup, login, or garmin_connect (see ./submit-handlers).
 *
 * Style note: NativeWind's wrapped Pressable does not reliably honour the
 * function-form of the `style` prop, so we use plain object styles + the
 * `android_ripple` API for tap feedback - matching the rest of GenUI.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  type KeyboardTypeOptions,
} from 'react-native';
import { Input } from '@/components/ui/Input';
import {
  CARD_STYLE,
  QUESTION_STYLE,
  PRIMARY_BUTTON_STYLE,
  PRIMARY_LABEL_STYLE,
  DISABLED_STYLE,
  RESOLVED_HINT_STYLE,
} from './styles';
import { Colors } from '@/lib/colors';
import { SUBMIT_HANDLERS, hasSubmitHandler } from './submit-handlers';
import { log } from '@/lib/logger';

const TAG = 'TextInputCard';

export type TextInputFieldType = 'text' | 'email' | 'password';

export interface TextInputField {
  readonly name: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly type?: TextInputFieldType;
  readonly isPassword?: boolean;
}

interface TextInputCardProps {
  readonly id: string;
  readonly question: string;
  readonly fields: ReadonlyArray<TextInputField>;
  readonly submit_label?: string;
  readonly on_submit: string | null;
  readonly onSubmit: (response: string) => void;
  readonly disabled: boolean;
  readonly resolvedText?: string;
}

const FIELDS_WRAPPER_STYLE = {
  gap: 12,
  marginBottom: 12,
} as const;

const ERROR_BOX_STYLE = {
  backgroundColor: Colors.errorLight,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 10,
  marginBottom: 12,
} as const;

const ERROR_TEXT_STYLE = {
  color: Colors.error,
  fontSize: 13,
  fontWeight: '500' as const,
} as const;

function keyboardTypeFor(type: TextInputFieldType | undefined): KeyboardTypeOptions {
  if (type === 'email') return 'email-address';
  return 'default';
}

function buildPassthroughResponse(
  fields: ReadonlyArray<TextInputField>,
  values: Readonly<Record<string, string>>,
): string {
  return fields
    .map((f) => `${f.name}=${values[f.name] ?? ''}`)
    .join(', ');
}

export function TextInputCard({
  id,
  question,
  fields,
  submit_label,
  on_submit,
  onSubmit,
  disabled,
  resolvedText,
}: TextInputCardProps) {
  const initialValues = useMemo<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const field of fields) {
      seed[field.name] = '';
    }
    return seed;
  }, [fields]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (name: string, next: string) => {
      setValues((prev) => ({ ...prev, [name]: next }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (disabled || submitting) return;

    setError(null);

    // Frontend-driven case: registered native handler.
    if (hasSubmitHandler(on_submit)) {
      setSubmitting(true);
      try {
        const handler = SUBMIT_HANDLERS[on_submit];
        const result = await handler(values);
        log.info(TAG, 'Native submit-handler succeeded', { id, on_submit });
        if (result.followupMessage) {
          onSubmit(result.followupMessage);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.';
        log.warn(TAG, 'Native submit-handler failed', {
          id,
          on_submit,
          message,
        });
        setError(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Agent-passthrough case.
    const response = buildPassthroughResponse(fields, values);
    log.info(TAG, 'Passthrough submit', { id, response });
    onSubmit(response);
  }, [disabled, submitting, on_submit, values, fields, onSubmit, id]);

  const cardStyle = disabled ? [CARD_STYLE, DISABLED_STYLE] : CARD_STYLE;
  const submitText = submit_label && submit_label.length > 0 ? submit_label : 'Weiter';
  const inputsEditable = !disabled && !submitting;

  return (
    <View style={cardStyle}>
      <Text style={QUESTION_STYLE}>{question}</Text>

      <View style={FIELDS_WRAPPER_STYLE}>
        {fields.map((field) => {
          const isPasswordField = field.isPassword === true || field.type === 'password';
          return (
            <Input
              key={field.name}
              label={field.label}
              placeholder={field.placeholder}
              value={values[field.name] ?? ''}
              onChangeText={(next) => handleChange(field.name, next)}
              isPassword={isPasswordField}
              keyboardType={isPasswordField ? 'default' : keyboardTypeFor(field.type)}
              autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
              autoCorrect={field.type !== 'email' && !isPasswordField}
              editable={inputsEditable}
            />
          );
        })}
      </View>

      {error ? (
        <View style={ERROR_BOX_STYLE}>
          <Text style={ERROR_TEXT_STYLE}>{error}</Text>
        </View>
      ) : null}

      {!disabled ? (
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={
            submitting ? [PRIMARY_BUTTON_STYLE, DISABLED_STYLE] : PRIMARY_BUTTON_STYLE
          }
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          accessibilityRole="button"
          accessibilityLabel={submitText}
          accessibilityState={{ disabled: submitting }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={PRIMARY_LABEL_STYLE}>{submitText}</Text>
          )}
        </Pressable>
      ) : null}

      {disabled && resolvedText ? (
        <Text style={RESOLVED_HINT_STYLE}>{resolvedText}</Text>
      ) : null}
    </View>
  );
}

export default TextInputCard;
