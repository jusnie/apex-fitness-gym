/**
 * IdentityHeaderCard - Athletly V2
 *
 * Hero card at the top of the "Wie Athletly dich sieht" screen. Shows
 * the athlete's name (or a neutral fallback) and a human-readable "last
 * updated" stamp derived from the API response.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';

interface IdentityHeaderCardProps {
  readonly athleteName: string | null;
  readonly lastUpdatedAt: string | null;
}

/**
 * Render a "Stand: vor X" sentence from an ISO timestamp. Uses minute,
 * hour, day, and week buckets and falls back to a plain date when the
 * timestamp is older than ~4 weeks.
 */
function formatLastUpdated(iso: string | null): string {
  if (!iso) {
    return 'Stand: noch keine Aktualisierung';
  }

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return 'Stand: unbekannt';
  }

  const diffMs = Date.now() - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) {
    return 'Stand: gerade eben';
  }
  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute);
    return `Stand: vor ${mins} ${mins === 1 ? 'Minute' : 'Minuten'}`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `Stand: vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
  }
  if (diffMs < week) {
    const days = Math.floor(diffMs / day);
    return `Stand: vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
  }
  if (diffMs < 4 * week) {
    const weeks = Math.floor(diffMs / week);
    return `Stand: vor ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`;
  }
  const date = new Date(iso);
  const day2 = String(date.getDate()).padStart(2, '0');
  const month2 = String(date.getMonth() + 1).padStart(2, '0');
  return `Stand: ${day2}.${month2}.${date.getFullYear()}`;
}

export function IdentityHeaderCard({
  athleteName,
  lastUpdatedAt,
}: IdentityHeaderCardProps) {
  const displayName = athleteName?.trim() || 'Athlet:in';

  return (
    <Card variant="hero">
      <Text
        className="text-text-primary text-2xl font-bold"
        style={{ letterSpacing: -0.3 }}
      >
        {displayName}
      </Text>
      <Text className="text-text-muted text-sm mt-1">
        {formatLastUpdated(lastUpdatedAt)}
      </Text>
    </Card>
  );
}

export default IdentityHeaderCard;
