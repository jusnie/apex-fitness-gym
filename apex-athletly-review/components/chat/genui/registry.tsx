/**
 * GenUI Registry - Athletly V2
 *
 * Switches on the SSE `ui_component` payload's `type` discriminator and
 * renders the matching inline component. Returns null for unknown types
 * so the chat stays usable when the backend ships a new component the
 * client hasn't been updated to render yet.
 *
 * Contract is intentionally tiny: (component, onSubmit, disabled) ->
 * ReactNode. Components themselves own their internal state.
 */

import React from 'react';
import type { UIComponent, TextInputFieldSpec, TextInputFieldType } from './types';
import { ChoiceCard } from './ChoiceCard';
import { NumberStepper } from './NumberStepper';
import { DatePickerCard } from './DatePickerCard';
import { ConfirmCard } from './ConfirmCard';
import { TextInputCard } from './TextInputCard';
import { PlanPreviewCard, type PlanPreviewSession } from './PlanPreviewCard';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): ReadonlyArray<string> {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asFieldType(value: unknown): TextInputFieldType | undefined {
  if (value === 'text' || value === 'email' || value === 'password') return value;
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asTextInputFields(value: unknown): ReadonlyArray<TextInputFieldSpec> {
  if (!Array.isArray(value)) return [];
  const result: TextInputFieldSpec[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const name = asString(record.name, '');
    const label = asString(record.label, '');
    if (name.length === 0 || label.length === 0) continue;
    result.push({
      name,
      label,
      placeholder: asOptionalString(record.placeholder),
      type: asFieldType(record.type),
      isPassword: asBoolean(record.isPassword),
    });
  }
  return result;
}

function asOnSubmit(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asPlanPreviewSessions(
  value: unknown,
): ReadonlyArray<PlanPreviewSession> {
  if (!Array.isArray(value)) return [];
  const result: PlanPreviewSession[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const steps = Array.isArray(record.steps)
      ? (record.steps as ReadonlyArray<unknown>)
      : undefined;
    result.push({
      day: asOptionalString(record.day),
      date: asOptionalString(record.date),
      sport: asOptionalString(record.sport),
      name: asOptionalString(record.name),
      description: asOptionalString(record.description),
      duration_minutes: asOptionalNumber(record.duration_minutes),
      intensity: asOptionalString(record.intensity),
      steps,
      notes: asOptionalString(record.notes),
    });
  }
  return result;
}


export function renderUIComponent(
  component: UIComponent,
  onSubmit: (response: string) => void,
  disabled: boolean,
  resolvedText?: string,
): React.ReactNode {
  const { type, props } = component;

  switch (type) {
    case 'choice_single':
    case 'choice_multi': {
      const mode = type === 'choice_single' ? 'single' : 'multi';
      return (
        <ChoiceCard
          question={asString(props.question, '')}
          options={asStringArray(props.options)}
          mode={mode}
          submitLabel={asOptionalString(props.submit_label)}
          disabled={disabled}
          resolvedText={resolvedText}
          onSubmit={onSubmit}
        />
      );
    }

    case 'number_stepper': {
      const min = asNumber(props.min, 0);
      const max = asNumber(props.max, 100);
      return (
        <NumberStepper
          question={asString(props.question, '')}
          min={min}
          max={max}
          step={asOptionalNumber(props.step)}
          initial={asOptionalNumber(props.initial)}
          unit={asOptionalString(props.unit)}
          submitLabel={asOptionalString(props.submit_label)}
          disabled={disabled}
          resolvedText={resolvedText}
          onSubmit={onSubmit}
        />
      );
    }

    case 'date_picker': {
      return (
        <DatePickerCard
          question={asString(props.question, '')}
          minDate={asOptionalString(props.min_date)}
          maxDate={asOptionalString(props.max_date)}
          initialDate={asOptionalString(props.initial_date)}
          submitLabel={asOptionalString(props.submit_label)}
          disabled={disabled}
          resolvedText={resolvedText}
          onSubmit={onSubmit}
        />
      );
    }

    case 'confirm': {
      return (
        <ConfirmCard
          question={asString(props.question, '')}
          confirmLabel={asOptionalString(props.confirm_label)}
          cancelLabel={asOptionalString(props.cancel_label)}
          disabled={disabled}
          resolvedText={resolvedText}
          onSubmit={onSubmit}
        />
      );
    }

    case 'text_input': {
      return (
        <TextInputCard
          id={component.id}
          question={asString(props.question, '')}
          fields={asTextInputFields(props.fields)}
          submit_label={asOptionalString(props.submit_label)}
          on_submit={asOnSubmit(props.on_submit)}
          disabled={disabled}
          resolvedText={resolvedText}
          onSubmit={onSubmit}
        />
      );
    }

    case 'plan_preview': {
      return (
        <PlanPreviewCard
          id={component.id}
          plan_id={asString(props.plan_id, '')}
          start_date={asOptionalString(props.start_date)}
          focus={asOptionalString(props.focus)}
          sessions={asPlanPreviewSessions(props.sessions)}
          truncated_in_ui={asBoolean(props.truncated_in_ui)}
          disabled={disabled}
          resolvedText={resolvedText}
          onSubmit={onSubmit}
        />
      );
    }

    default:
      return null;
  }
}
