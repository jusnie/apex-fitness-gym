/**
 * SessionCard - Workout session details card with glassmorphism effect.
 *
 * Renders the structured session produced by the agent: sport badge,
 * intensity, session type, description, total duration, and the
 * optional structured `steps[]` tree (warmup/work/repeat/cooldown)
 * with targets and notes. Presentation-only: no coaching judgments.
 */

import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Clock, HelpCircle, ThumbsDown, Calendar } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/lib/colors';
import { getSportColor } from '@/lib/sport-colors';
import type { PlannedSession } from '@/types/plan';

interface SessionCardProps {
  session: PlannedSession;
  onStart?: () => void;
  onQuickAction?: (action: string, message: string) => void;
}

const QUICK_ACTIONS = [
  { key: 'why', label: 'Warum?', message: 'Warum habe ich heute dieses Training im Plan?', icon: HelpCircle },
  { key: 'too_hard', label: 'Zu hart', message: 'Das Training heute ist mir zu hart. Kannst du es anpassen?', icon: ThumbsDown },
  { key: 'reschedule', label: 'Verschieben', message: 'Kann ich das Training heute verschieben?', icon: Calendar },
] as const;

/**
 * Map common agent-emitted intensity tokens to a German label.
 * Keys are normalized (lowercased, trimmed) before lookup.
 * "Unbekannt" remains the final fallback.
 */
const INTENSITY_LABELS: Record<string, string> = {
  easy: 'Leicht',
  recovery: 'Leicht',
  low: 'Leicht',
  moderate: 'Moderat',
  tempo: 'Moderat',
  steady: 'Moderat',
  high: 'Intensiv',
  hard: 'Intensiv',
  threshold: 'Intensiv',
  vo2max: 'Intensiv',
};

const DEFAULT_INTENSITY_LABEL = 'Unbekannt';

function getIntensityLabel(raw: string | undefined): string {
  if (!raw) return DEFAULT_INTENSITY_LABEL;
  const key = raw.trim().toLowerCase();
  return INTENSITY_LABELS[key] ?? DEFAULT_INTENSITY_LABEL;
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  intervals: 'Intervalle',
  tempo: 'Tempo',
  long_run: 'Langer Lauf',
  easy_run: 'Lockerer Lauf',
  recovery: 'Erholung',
  strength: 'Kraft',
  flexibility: 'Beweglichkeit',
  endurance: 'Ausdauer',
  race: 'Wettkampf',
};

/**
 * Resolve a session type label. Falls back to the original string
 * after a lowercased + underscored lookup, so "Long Run" matches
 * "long_run".
 */
function getSessionTypeLabel(sessionType: string): string {
  if (!sessionType) return '';
  const normalized = sessionType.trim().toLowerCase().replace(/\s+/g, '_');
  return SESSION_TYPE_LABELS[normalized] ?? sessionType;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// --- Step rendering ---

const STEP_TYPE_LABELS: Record<string, string> = {
  warmup: 'Aufwärmen',
  warm_up: 'Aufwärmen',
  work: 'Belastung',
  interval: 'Intervall',
  rest: 'Pause',
  recovery: 'Erholung',
  cooldown: 'Auslaufen',
  cool_down: 'Auslaufen',
  repeat: 'Wiederholung',
};

function getStepTypeLabel(type: string | undefined): string {
  if (!type) return '';
  const key = type.trim().toLowerCase().replace(/\s+/g, '_');
  return STEP_TYPE_LABELS[key] ?? type;
}

/**
 * Format an interval duration. Accepts minutes (number) or seconds
 * (number). Returns "" if neither is present.
 */
function formatStepDuration(step: Record<string, unknown>): string {
  const minutes = typeof step.duration_minutes === 'number' ? step.duration_minutes : undefined;
  const seconds = typeof step.duration_seconds === 'number' ? step.duration_seconds : undefined;

  if (typeof minutes === 'number' && minutes > 0) {
    const whole = Math.floor(minutes);
    const sec = Math.round((minutes - whole) * 60);
    if (sec === 0) return `${whole}:00`;
    return `${whole}:${String(sec).padStart(2, '0')}`;
  }
  if (typeof seconds === 'number' && seconds > 0) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  if (typeof step.distance_m === 'number' && step.distance_m > 0) {
    return `${step.distance_m} m`;
  }
  if (typeof step.distance_km === 'number' && step.distance_km > 0) {
    return `${step.distance_km} km`;
  }
  return '';
}

/**
 * Build a compact target chip text from common target fields.
 * Returns null when no recognized targets are present.
 */
function getStepTargetText(step: Record<string, unknown>): string | null {
  const targets = (typeof step.targets === 'object' && step.targets !== null
    ? step.targets
    : step) as Record<string, unknown>;

  const parts: string[] = [];

  const pace = targets.pace_min_km;
  if (typeof pace === 'string' && pace.trim().length > 0) {
    parts.push(`${pace}/km`);
  } else if (typeof pace === 'number') {
    parts.push(`${pace}/km`);
  } else if (Array.isArray(pace) && pace.length === 2) {
    parts.push(`${pace[0]}-${pace[1]}/km`);
  }

  const hrZone = targets.hr_zone;
  if (typeof hrZone === 'string' && hrZone.trim().length > 0) {
    parts.push(`Zone ${hrZone}`);
  } else if (typeof hrZone === 'number') {
    parts.push(`Zone ${hrZone}`);
  } else if (Array.isArray(hrZone) && hrZone.length === 2) {
    parts.push(`Zone ${hrZone[0]}-${hrZone[1]}`);
  }

  const hrBpm = targets.hr_bpm;
  if (typeof hrBpm === 'string' && hrBpm.trim().length > 0) {
    parts.push(`${hrBpm} bpm`);
  } else if (Array.isArray(hrBpm) && hrBpm.length === 2) {
    parts.push(`${hrBpm[0]}-${hrBpm[1]} bpm`);
  }

  const power = targets.power_w ?? targets.power;
  if (typeof power === 'string' && power.trim().length > 0) {
    parts.push(`${power} W`);
  } else if (typeof power === 'number') {
    parts.push(`${power} W`);
  } else if (Array.isArray(power) && power.length === 2) {
    parts.push(`${power[0]}-${power[1]} W`);
  }

  const rpe = targets.rpe;
  if (typeof rpe === 'string' && rpe.trim().length > 0) {
    parts.push(`RPE ${rpe}`);
  } else if (typeof rpe === 'number') {
    parts.push(`RPE ${rpe}`);
  }

  return parts.length > 0 ? parts.join(' / ') : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractSteps(details: PlannedSession['details']): readonly Record<string, unknown>[] {
  if (!details) return [];
  const raw = (details as Record<string, unknown>).steps;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRecord);
}

function extractNotes(details: PlannedSession['details']): string {
  if (!details) return '';
  const notes = (details as Record<string, unknown>).notes;
  return typeof notes === 'string' ? notes.trim() : '';
}

interface StepLineProps {
  step: Record<string, unknown>;
  indent?: boolean;
}

function StepTargetChip({ text }: { readonly text: string }) {
  return (
    <View
      style={{
        backgroundColor: Colors.surfaceMuted,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <Text className="text-xs" style={{ color: Colors.textSecondary }}>
        {text}
      </Text>
    </View>
  );
}

function StepLine({ step, indent = false }: StepLineProps) {
  const typeLabel = getStepTypeLabel(typeof step.type === 'string' ? step.type : undefined);
  const duration = formatStepDuration(step);
  const description = typeof step.description === 'string' ? step.description.trim() : '';
  const targetText = getStepTargetText(step);

  // Compose the leading text: "<Type> <duration> - <description>"
  const head: string[] = [];
  if (typeLabel) head.push(typeLabel);
  if (duration) head.push(duration);
  const headText = head.join(' ');
  const tailText = description ? (headText ? ` - ${description}` : description) : '';

  return (
    <View
      className="flex-row items-start gap-2 py-0.5"
      style={indent ? { paddingLeft: 16 } : undefined}
    >
      <Text
        className="text-sm flex-1"
        style={{ color: Colors.textSecondary }}
      >
        {headText}
        {tailText}
      </Text>
      {targetText ? <StepTargetChip text={targetText} /> : null}
    </View>
  );
}

interface StepTreeProps {
  steps: readonly Record<string, unknown>[];
}

function StepTree({ steps }: StepTreeProps) {
  return (
    <View className="mb-3">
      {steps.map((step, idx) => {
        const type = typeof step.type === 'string' ? step.type.toLowerCase() : '';
        const isRepeat = type === 'repeat';
        const repeatCount = typeof step.repeat_count === 'number' && step.repeat_count > 0
          ? step.repeat_count
          : typeof step.count === 'number' && step.count > 0
            ? step.count
            : undefined;
        const innerSteps = Array.isArray(step.steps)
          ? step.steps.filter(isRecord)
          : [];

        if (isRepeat && innerSteps.length > 0) {
          const label = repeatCount ? `${repeatCount}x` : 'Wdh.';
          return (
            <View key={`step-${idx}`} className="py-0.5">
              <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                {label} (
              </Text>
              {innerSteps.map((inner, innerIdx) => (
                <StepLine
                  key={`step-${idx}-inner-${innerIdx}`}
                  step={inner}
                  indent
                />
              ))}
              <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                )
              </Text>
            </View>
          );
        }

        return <StepLine key={`step-${idx}`} step={step} />;
      })}
    </View>
  );
}

const GLASS_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...GLASS_SHADOW,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurView: {
    padding: 16,
  },
  fallbackBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 16,
    borderRadius: 16,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});

function GlassBackground({ children }: { readonly children: React.ReactNode }) {
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.blurContainer}>
        <BlurView intensity={40} tint="light" style={styles.blurView}>
          {children}
        </BlurView>
      </View>
    );
  }

  // Android fallback: semi-transparent white
  return (
    <View style={styles.fallbackBg}>
      {children}
    </View>
  );
}

export function SessionCard({ session, onStart, onQuickAction }: SessionCardProps) {
  const sportColor = getSportColor(session.sport);
  const intensityLabel = getIntensityLabel(session.intensity);
  const typeLabel = getSessionTypeLabel(session.session_type);

  const steps = extractSteps(session.details);
  const notes = extractNotes(session.details);

  return (
    <View style={styles.cardOuter}>
      <GlassBackground>
        {/* Top accent bar */}
        <View style={[styles.accentBar, { backgroundColor: sportColor }]} />

        {/* Badges row */}
        <View className="flex-row items-center justify-between mt-1 mb-2">
          <View className="flex-row items-center gap-2">
            <Badge type="sport" sport={session.sport} label={session.sport} />
            {session.session_type ? (
              <Text className="text-xs font-medium" style={{ color: Colors.textMuted }}>
                {typeLabel}
              </Text>
            ) : null}
          </View>
          <Badge type="intensity" intensity={session.intensity} label={intensityLabel} />
        </View>

        {/* Description */}
        {session.description ? (
          <Text className="text-sm mb-3 leading-5" style={{ color: Colors.textSecondary }}>
            {session.description}
          </Text>
        ) : null}

        {/* Steps tree (warmup / work / repeat / cooldown) */}
        {steps.length > 0 ? <StepTree steps={steps} /> : null}

        {/* Notes */}
        {notes ? (
          <Text className="text-xs mb-3 leading-4" style={{ color: Colors.textMuted }}>
            Notes: {notes}
          </Text>
        ) : null}

        {/* Metrics row */}
        <View className="flex-row items-center gap-4 mb-3">
          {session.duration_minutes > 0 && (
            <View className="flex-row items-center gap-1.5">
              <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
              <Text className="text-sm" style={{ color: Colors.textSecondary }}>
                {formatDuration(session.duration_minutes)}
              </Text>
            </View>
          )}
        </View>

        {/* Quick action buttons */}
        {onQuickAction && (
          <View className="flex-row items-center gap-2 mb-3">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.key}
                variant="ghost"
                size="sm"
                label={action.label}
                icon={action.icon}
                onPress={() => onQuickAction(action.key, action.message)}
              />
            ))}
          </View>
        )}

        {/* Action buttons */}
        {onStart && (
          <View className="flex-row items-center justify-end gap-2">
            <Button variant="primary" size="sm" label="Starten" onPress={onStart} />
          </View>
        )}
      </GlassBackground>
    </View>
  );
}

export default SessionCard;
