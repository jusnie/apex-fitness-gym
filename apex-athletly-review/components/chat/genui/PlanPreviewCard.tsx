/**
 * PlanPreviewCard - Athletly V2 GenUI
 *
 * Renders a compact week-grid preview of a training plan when the backend
 * emits a `ui_component` event with type `plan_preview`. Unlike the other
 * GenUI cards this one is informational rather than blocking: the chat
 * continues to flow below it. The "Open Plan" button navigates to the full
 * plan tab; the "Adjust" button sends a follow-up user message so the agent
 * can keep iterating on the plan.
 *
 * Fields on individual sessions may be missing - render gracefully when
 * duration, intensity, or name are absent.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/lib/colors';
import { CARD_STYLE, DISABLED_STYLE } from './styles';

export interface PlanPreviewSession {
  readonly day?: string;
  readonly date?: string;
  readonly sport?: string;
  readonly name?: string;
  readonly description?: string;
  readonly duration_minutes?: number;
  readonly intensity?: string;
  readonly steps?: ReadonlyArray<unknown>;
  readonly notes?: string;
}

export interface PlanPreviewCardProps {
  readonly id: string;
  readonly plan_id: string;
  readonly start_date?: string;
  readonly focus?: string;
  readonly sessions: ReadonlyArray<PlanPreviewSession>;
  readonly truncated_in_ui?: boolean;
  readonly onSubmit: (response: string) => void;
  readonly disabled: boolean;
  readonly resolvedText?: string;
}

// --- Constants ---------------------------------------------------------

const ADJUST_MESSAGE = 'Lass mich den Plan anpassen';

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

type DayKey = (typeof DAY_KEYS)[number];

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Mo',
  tuesday: 'Di',
  wednesday: 'Mi',
  thursday: 'Do',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'So',
};

const DAY_ALIASES: Record<string, DayKey> = {
  monday: 'monday',
  mon: 'monday',
  mo: 'monday',
  montag: 'monday',
  tuesday: 'tuesday',
  tue: 'tuesday',
  tues: 'tuesday',
  di: 'tuesday',
  dienstag: 'tuesday',
  wednesday: 'wednesday',
  wed: 'wednesday',
  mi: 'wednesday',
  mittwoch: 'wednesday',
  thursday: 'thursday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  do: 'thursday',
  donnerstag: 'thursday',
  friday: 'friday',
  fri: 'friday',
  fr: 'friday',
  freitag: 'friday',
  saturday: 'saturday',
  sat: 'saturday',
  sa: 'saturday',
  samstag: 'saturday',
  sonnabend: 'saturday',
  sunday: 'sunday',
  sun: 'sunday',
  so: 'sunday',
  sonntag: 'sunday',
};

const INTENSITY_LABELS: Record<string, 'Leicht' | 'Moderat' | 'Intensiv'> = {
  easy: 'Leicht',
  recovery: 'Leicht',
  low: 'Leicht',
  leicht: 'Leicht',
  moderate: 'Moderat',
  tempo: 'Moderat',
  steady: 'Moderat',
  moderat: 'Moderat',
  high: 'Intensiv',
  hard: 'Intensiv',
  threshold: 'Intensiv',
  vo2max: 'Intensiv',
  intensiv: 'Intensiv',
};

const SPORT_LABELS: Record<string, string> = {
  running: 'Laufen',
  cycling: 'Radfahren',
  swimming: 'Schwimmen',
  strength: 'Kraft',
  walking: 'Gehen',
  hiking: 'Wandern',
  yoga: 'Yoga',
  mobility: 'Mobility',
};

const MONTH_LABELS = [
  'Januar',
  'Februar',
  'Marz',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

// --- Helpers -----------------------------------------------------------

function normalizeDay(raw: string | undefined): DayKey | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return DAY_ALIASES[key] ?? null;
}

function getIntensityLabel(
  raw: string | undefined,
): 'Leicht' | 'Moderat' | 'Intensiv' | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return INTENSITY_LABELS[key] ?? null;
}

function getSportLabel(raw: string | undefined): string {
  if (!raw) return '';
  const key = raw.trim().toLowerCase();
  return SPORT_LABELS[key] ?? raw;
}

function formatDuration(minutes: number | undefined): string {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    return '';
  }
  if (minutes <= 60) return `${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatWeekStart(startDate: string | undefined): string {
  if (!startDate) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate.trim());
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!month || !day || month < 1 || month > 12) return '';
  const monthLabel = MONTH_LABELS[month - 1] ?? '';
  if (!monthLabel) return '';
  // Year omitted to stay compact; the chat context already implies recency.
  void year;
  return `Woche ab ${day}. ${monthLabel}`;
}

function groupSessionsByDay(
  sessions: ReadonlyArray<PlanPreviewSession>,
): Record<DayKey, ReadonlyArray<PlanPreviewSession>> {
  const result: Record<DayKey, PlanPreviewSession[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
  for (const session of sessions) {
    const key = normalizeDay(session.day);
    if (!key) continue;
    result[key] = [...result[key], session];
  }
  return result;
}

function getIntensityColors(
  label: 'Leicht' | 'Moderat' | 'Intensiv' | null,
): { readonly bg: string; readonly fg: string } {
  if (label === 'Leicht') {
    return { bg: Colors.successLight, fg: Colors.success };
  }
  if (label === 'Moderat') {
    return { bg: Colors.warningLight, fg: Colors.warning };
  }
  if (label === 'Intensiv') {
    return { bg: Colors.errorLight, fg: Colors.error };
  }
  return { bg: Colors.surfaceMuted, fg: Colors.textMuted };
}

// --- Static styles -----------------------------------------------------

const HEADER_STYLE = {
  color: Colors.textPrimary,
  fontSize: 16,
  fontWeight: '700' as const,
  marginBottom: 2,
};

const SUBHEADER_STYLE = {
  color: Colors.textSecondary,
  fontSize: 13,
  marginBottom: 12,
};

const ROW_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: 8,
  borderTopWidth: 1,
  borderTopColor: Colors.divider,
};

const ROW_FIRST_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: 8,
};

const DAY_LABEL_STYLE = {
  width: 32,
  color: Colors.textSecondary,
  fontSize: 13,
  fontWeight: '600' as const,
};

const SESSION_COL_STYLE = {
  flex: 1,
  paddingRight: 8,
};

const SESSION_NAME_STYLE = {
  color: Colors.textPrimary,
  fontSize: 14,
  fontWeight: '500' as const,
};

const SESSION_SPORT_STYLE = {
  color: Colors.textMuted,
  fontSize: 12,
  marginTop: 1,
};

const DURATION_STYLE = {
  color: Colors.textSecondary,
  fontSize: 12,
  width: 60,
  textAlign: 'right' as const,
  marginRight: 8,
};

const BADGE_CONTAINER_STYLE = {
  width: 72,
  alignItems: 'flex-end' as const,
};

const BADGE_STYLE_BASE = {
  borderRadius: 999,
  paddingHorizontal: 8,
  paddingVertical: 2,
};

const BADGE_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: '600' as const,
};

const EMPTY_DASH_STYLE = {
  color: Colors.textMuted,
  fontSize: 14,
};

const TRUNCATED_STYLE = {
  color: Colors.textMuted,
  fontSize: 12,
  fontStyle: 'italic' as const,
  marginTop: 8,
};

const FOOTER_STYLE = {
  flexDirection: 'row' as const,
  gap: 8,
  marginTop: 12,
};

const FOOTER_BUTTON_PRIMARY_STYLE = {
  flex: 1,
  backgroundColor: Colors.primary,
  borderRadius: 10,
  height: 40,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 14,
};

const FOOTER_BUTTON_SECONDARY_STYLE = {
  flex: 1,
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.divider,
  borderRadius: 10,
  height: 40,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 14,
};

const FOOTER_LABEL_PRIMARY_STYLE = {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600' as const,
};

const FOOTER_LABEL_SECONDARY_STYLE = {
  color: Colors.textPrimary,
  fontSize: 14,
  fontWeight: '600' as const,
};

// --- Subcomponents -----------------------------------------------------

interface DayRowProps {
  readonly dayKey: DayKey;
  readonly sessions: ReadonlyArray<PlanPreviewSession>;
  readonly isFirst: boolean;
}

function DayRow({ dayKey, sessions, isFirst }: DayRowProps) {
  const rowStyle = isFirst ? ROW_FIRST_STYLE : ROW_STYLE;

  if (sessions.length === 0) {
    return (
      <View style={rowStyle}>
        <Text style={DAY_LABEL_STYLE}>{DAY_LABELS[dayKey]}</Text>
        <View style={SESSION_COL_STYLE}>
          <Text style={EMPTY_DASH_STYLE}>-</Text>
        </View>
        <Text style={DURATION_STYLE} />
        <View style={BADGE_CONTAINER_STYLE} />
      </View>
    );
  }

  return (
    <View style={rowStyle}>
      <Text style={DAY_LABEL_STYLE}>{DAY_LABELS[dayKey]}</Text>
      <View style={SESSION_COL_STYLE}>
        {sessions.map((session, index) => {
          const name = (session.name && session.name.trim()) || 'Einheit';
          const sportLabel = getSportLabel(session.sport);
          return (
            <View
              key={`${dayKey}-${index}`}
              style={index > 0 ? { marginTop: 4 } : undefined}
            >
              <Text style={SESSION_NAME_STYLE} numberOfLines={1}>
                {name}
              </Text>
              {sportLabel ? (
                <Text style={SESSION_SPORT_STYLE} numberOfLines={1}>
                  {sportLabel}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
      <Text style={DURATION_STYLE} numberOfLines={1}>
        {formatDuration(sessions[0]?.duration_minutes)}
      </Text>
      <View style={BADGE_CONTAINER_STYLE}>
        {(() => {
          const label = getIntensityLabel(sessions[0]?.intensity);
          if (!label) return null;
          const { bg, fg } = getIntensityColors(label);
          return (
            <View style={{ ...BADGE_STYLE_BASE, backgroundColor: bg }}>
              <Text style={{ ...BADGE_LABEL_STYLE, color: fg }}>{label}</Text>
            </View>
          );
        })()}
      </View>
    </View>
  );
}

// --- Main component ----------------------------------------------------

export function PlanPreviewCard({
  start_date,
  focus,
  sessions,
  truncated_in_ui,
  onSubmit,
  disabled,
}: PlanPreviewCardProps) {
  const router = useRouter();

  const handleOpenPlan = useCallback(() => {
    router.push('/(tabs)/plan');
  }, [router]);

  const handleAdjust = useCallback(() => {
    if (disabled) return;
    onSubmit(ADJUST_MESSAGE);
  }, [disabled, onSubmit]);

  const grouped = groupSessionsByDay(sessions);
  const headerTitle = (() => {
    const weekLabel = formatWeekStart(start_date);
    return weekLabel ? `Dein Plan - ${weekLabel}` : 'Dein Plan';
  })();
  const focusLabel = focus && focus.trim().length > 0 ? focus.trim() : '';

  const cardStyle = disabled ? [CARD_STYLE, DISABLED_STYLE] : CARD_STYLE;

  return (
    <View style={cardStyle}>
      <Text style={HEADER_STYLE}>{headerTitle}</Text>
      {focusLabel ? (
        <Text style={SUBHEADER_STYLE}>{`Fokus: ${focusLabel}`}</Text>
      ) : (
        <View style={{ marginBottom: 8 }} />
      )}

      <View>
        {DAY_KEYS.map((dayKey, index) => (
          <DayRow
            key={dayKey}
            dayKey={dayKey}
            sessions={grouped[dayKey]}
            isFirst={index === 0}
          />
        ))}
      </View>

      {truncated_in_ui ? (
        <Text style={TRUNCATED_STYLE}>
          Weitere Einheiten in der Plan-Ansicht
        </Text>
      ) : null}

      <View style={FOOTER_STYLE}>
        <Pressable
          onPress={handleOpenPlan}
          style={FOOTER_BUTTON_PRIMARY_STYLE}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          accessibilityRole="button"
          accessibilityLabel="Plan offnen"
        >
          <Text style={FOOTER_LABEL_PRIMARY_STYLE}>Plan offnen</Text>
        </Pressable>
        <Pressable
          onPress={handleAdjust}
          disabled={disabled}
          style={
            disabled
              ? [FOOTER_BUTTON_SECONDARY_STYLE, DISABLED_STYLE]
              : FOOTER_BUTTON_SECONDARY_STYLE
          }
          android_ripple={{ color: 'rgba(37,99,235,0.15)' }}
          accessibilityRole="button"
          accessibilityLabel="Plan anpassen"
        >
          <Text style={FOOTER_LABEL_SECONDARY_STYLE}>Anpassen</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default PlanPreviewCard;
