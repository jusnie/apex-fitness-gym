/**
 * GoalHeroCard - Athletly V2
 *
 * Hero-style rendering for the `current_goal` identity section. Pulls
 * key/value blocks from the agent-written markdown (e.g. **Event:** ...,
 * **Date:** ..., **Target time:** ...) and falls back to the structured
 * goal object when keys are missing or unparseable.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Target,
  Calendar,
  Clock,
  MessageCircle,
  MapPin,
} from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { IdentitySection, IdentityStructured } from '@/types/identity';
import { parseBlocks, findValue } from './markdownBlocks';
import {
  formatGermanLongDate,
  formatRelativeDays,
  formatTargetTime,
  extractPace,
} from './identityFormat';

interface GoalHeroCardProps {
  readonly section: IdentitySection;
  readonly structured: IdentityStructured;
  readonly onEditPress: (section: IdentitySection) => void;
}

const EVENT_KEYS = ['event', 'ziel', 'wettkampf'];
const DATE_KEYS = ['date', 'datum'];
const TIME_KEYS = ['target time', 'target_time', 'zielzeit'];
const COURSE_KEYS = ['course facts', 'course', 'strecke', 'streckenfakten'];
const SOURCE_KEYS = ['source', 'quelle'];

function pickEvent(parsed: ReturnType<typeof parseBlocks>, structuredEvent: string | null): string | null {
  const fromBody = findValue(parsed, EVENT_KEYS);
  if (fromBody && fromBody.length > 0) return fromBody;
  return structuredEvent;
}

function pickDate(parsed: ReturnType<typeof parseBlocks>, structuredDate: string | null): string | null {
  const fromBody = findValue(parsed, DATE_KEYS);
  if (fromBody && fromBody.length > 0) {
    // strip any "(in 130 days)" tail since we compute that ourselves
    return fromBody.replace(/\s*\([^)]*\)\s*$/, '').trim();
  }
  return structuredDate;
}

function pickTime(parsed: ReturnType<typeof parseBlocks>, structuredTime: string | null): string | null {
  const fromBody = findValue(parsed, TIME_KEYS);
  if (fromBody && fromBody.length > 0) return fromBody;
  return structuredTime;
}

export function GoalHeroCard({
  section,
  structured,
  onEditPress,
}: GoalHeroCardProps) {
  const blocks = parseBlocks(section.body);
  const event = pickEvent(blocks, structured.goal.event);
  const dateRaw = pickDate(blocks, structured.goal.target_date);
  const timeRaw = pickTime(blocks, structured.goal.target_time);
  const courseFacts = findValue(blocks, COURSE_KEYS);
  const source = findValue(blocks, SOURCE_KEYS);

  const dateLong = formatGermanLongDate(dateRaw);
  const dateRelative = formatRelativeDays(dateRaw);
  const time = formatTargetTime(timeRaw);
  const pace = extractPace(courseFacts);
  const handleEdit = () => onEditPress(section);

  const hasContent = Boolean(event || dateLong || time || courseFacts);

  if (!hasContent) {
    return (
      <Card>
        <View className="flex-row items-center mb-2">
          <Target size={14} color={Colors.textMuted} strokeWidth={2.5} />
          <Text className="text-text-muted text-xs font-semibold ml-1.5 tracking-wider">
            ZIEL
          </Text>
        </View>
        <Pressable
          onPress={handleEdit}
          accessibilityRole="button"
          accessibilityLabel="Ziel im Chat ergaenzen"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-text-muted text-sm leading-5 italic">
            Du hast Athletly noch kein Ziel verraten. Erzähl es im Chat.
          </Text>
        </Pressable>
      </Card>
    );
  }

  return (
    <Card>
      <View className="flex-row items-center mb-2">
        <Target size={14} color={Colors.textMuted} strokeWidth={2.5} />
        <Text className="text-text-muted text-xs font-semibold ml-1.5 tracking-wider">
          ZIEL
        </Text>
      </View>

      {event ? (
        <Text
          className="text-text-primary text-2xl font-semibold"
          style={{ letterSpacing: -0.3 }}
        >
          {event}
        </Text>
      ) : null}

      {dateLong ? (
        <View className="flex-row items-start mt-4">
          <View className="mt-0.5">
            <Calendar size={18} color={Colors.primary} strokeWidth={2} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-text-primary text-base font-medium">
              {dateLong}
            </Text>
            {dateRelative ? (
              <Text className="text-text-muted text-xs mt-0.5">
                {dateRelative}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {time ? (
        <View className="flex-row items-start mt-3">
          <View className="mt-1">
            <Clock size={18} color={Colors.primary} strokeWidth={2} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-text-primary text-xl font-semibold">
              {time}
            </Text>
            {pace ? (
              <Text className="text-text-muted text-xs mt-0.5">
                Pace {pace}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {courseFacts ? (
        <View className="mt-4">
          <View className="flex-row items-center mb-2">
            <MapPin size={12} color={Colors.textMuted} strokeWidth={2.5} />
            <Text className="text-text-muted text-xs font-semibold ml-1.5 tracking-wider">
              STRECKE
            </Text>
          </View>
          <Text className="text-text-secondary text-sm leading-6 italic">
            {courseFacts}
          </Text>
        </View>
      ) : null}

      {source ? (
        <Text className="text-text-muted text-[11px] mt-4">
          Quelle: {source}
        </Text>
      ) : null}

      <Pressable
        onPress={handleEdit}
        className="flex-row items-center justify-center mt-4 py-2.5 rounded-xl"
        style={({ pressed }) => ({
          backgroundColor: Colors.primaryUltraLight,
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel="Ziel im Chat anpassen"
      >
        <MessageCircle size={16} color={Colors.primary} strokeWidth={2} />
        <Text className="text-primary text-sm font-medium ml-2">
          Im Chat anpassen
        </Text>
      </Pressable>
    </Card>
  );
}

export default GoalHeroCard;
