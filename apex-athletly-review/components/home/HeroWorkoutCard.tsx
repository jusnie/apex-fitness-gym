/**
 * HeroWorkoutCard — Athletly V2
 *
 * Hero-sized card showing today's planned workout session.
 * Variants: workout (with sport badge, intensity, CTA) and rest day (moon icon, relaxation).
 * Uses the Visionplan PlannedSession schema (duration_minutes, session_type, etc.).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Moon } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getSportColor } from '@/lib/sport-colors';
import { Colors } from '@/lib/colors';
import type { PlannedSession } from '@/types/plan';

interface HeroWorkoutCardProps {
  session: PlannedSession | null;
  isRestDay: boolean;
  onStart?: () => void;
  onDetails?: () => void;
  onAskCoach?: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const INTENSITY_LABELS: Record<string, string> = {
  low: 'Leicht',
  moderate: 'Moderat',
  high: 'Intensiv',
};

const DEFAULT_INTENSITY_LABEL = 'Unbekannt';

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

function getSessionTypeLabel(sessionType: string): string {
  return SESSION_TYPE_LABELS[sessionType] ?? sessionType;
}

function RestDayCard({ onAskCoach }: { onAskCoach?: () => void }) {
  return (
    <Card variant="hero" className="mx-4">
      <View
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: getSportColor('rest') }}
      />
      <View className="flex-row items-center gap-2 mb-3 ml-2">
        <Moon size={20} color={getSportColor('rest')} />
        <Text className="text-text-primary text-lg font-semibold">
          Ruhetag
        </Text>
      </View>
      <Text className="text-text-primary text-base font-semibold mb-2 ml-2">
        Aktive Regeneration
      </Text>
      <Text className="text-text-secondary text-sm leading-5 mb-4 ml-2">
        Dein Koerper braucht heute Pause.{'\n'}
        Leichtes Stretching oder Spaziergang empfohlen.
      </Text>
      {onAskCoach && (
        <View className="ml-2">
          <Button
            variant="ghost"
            size="sm"
            label="Trotzdem trainieren?"
            onPress={onAskCoach}
          />
        </View>
      )}
    </Card>
  );
}

function WorkoutCard({
  session,
  onStart,
  onDetails,
  onAskCoach,
}: {
  session: PlannedSession;
  onStart?: () => void;
  onDetails?: () => void;
  onAskCoach?: () => void;
}) {
  const sportColor = getSportColor(session.sport);
  const intensityLabel = INTENSITY_LABELS[session.intensity] ?? DEFAULT_INTENSITY_LABEL;
  const typeLabel = session.session_type ? getSessionTypeLabel(session.session_type) : null;

  return (
    <Card variant="hero" className="mx-4">
      {/* Sport-colored top border */}
      <View
        className="absolute top-0 left-4 right-4 h-1 rounded-full"
        style={{ backgroundColor: sportColor }}
      />

      {/* Sport badge + intensity */}
      <View className="flex-row items-center justify-between mt-2 mb-3">
        <Badge type="sport" sport={session.sport} label={session.sport} />
        <Badge type="intensity" intensity={session.intensity} label={intensityLabel} />
      </View>

      {/* Session type + duration */}
      <View className="flex-row items-center gap-3 mb-2">
        {typeLabel && (
          <Text className="text-text-primary text-xl font-semibold">
            {typeLabel}
          </Text>
        )}
        {session.duration_minutes > 0 && (
          <Text className="text-text-secondary text-sm">
            {formatDuration(session.duration_minutes)}
          </Text>
        )}
      </View>

      {/* Description */}
      {session.description ? (
        <Text className="text-text-secondary text-sm leading-5 mb-3">
          {session.description}
        </Text>
      ) : null}

      {/* Actions */}
      <View className="gap-2">
        <Button
          variant="primary"
          size="lg"
          label={onStart ? 'Training starten' : 'Details'}
          onPress={onStart ?? onDetails}
        />
        {onAskCoach && (
          <View className="flex-row justify-center">
            <Button
              variant="ghost"
              size="sm"
              label="Coach fragen"
              onPress={onAskCoach}
            />
          </View>
        )}
      </View>
    </Card>
  );
}

export function HeroWorkoutCard({
  session,
  isRestDay,
  onStart,
  onDetails,
  onAskCoach,
}: HeroWorkoutCardProps) {
  if (isRestDay || !session) {
    return <RestDayCard onAskCoach={onAskCoach} />;
  }

  return (
    <WorkoutCard
      session={session}
      onStart={onStart}
      onDetails={onDetails}
      onAskCoach={onAskCoach}
    />
  );
}

export default HeroWorkoutCard;
