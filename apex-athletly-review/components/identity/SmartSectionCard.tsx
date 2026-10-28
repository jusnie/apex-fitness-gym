/**
 * SmartSectionCard - Athletly V2
 *
 * Default renderer for identity sections whose body is agent-written
 * markdown. Parses the body into typed blocks (keyValue, bullet,
 * paragraph, heading) and renders each appropriately. Keeps the existing
 * "Athletly hat dazu noch nichts gelernt..." placeholder for empty
 * sections plus the standard "Im Chat anpassen" CTA.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  MessageCircle,
  Circle,
  CheckCircle2,
} from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { IdentitySection } from '@/types/identity';
import { parseBlocks, type Block } from './markdownBlocks';
import { looksLikeIsoDate, formatGermanShortDate } from './identityFormat';

interface SmartSectionCardProps {
  readonly section: IdentitySection;
  readonly onEditPress: (section: IdentitySection) => void;
}

const EMPTY_PLACEHOLDER =
  'Athletly hat dazu noch nichts gelernt. Erzähl es im Chat.';

const DONE_KEYWORDS: readonly string[] = [
  'erledigt',
  'fertig',
  'gemacht',
  'done',
  'tried successfully',
  'completed',
  'abgeschlossen',
];

function isDoneBullet(text: string): boolean {
  const lower = text.toLowerCase();
  return DONE_KEYWORDS.some((kw) => lower.startsWith(kw) || lower.includes(`(${kw})`));
}

function prettifyValue(value: string): string {
  const trimmed = value.trim();
  if (looksLikeIsoDate(trimmed)) {
    return formatGermanShortDate(trimmed) ?? trimmed;
  }
  return trimmed;
}

function renderBlock(block: Block, index: number) {
  if (block.type === 'keyValue') {
    return (
      <View key={`kv-${index}`} className="flex-row items-start mt-1.5">
        <Text className="text-text-secondary text-sm font-semibold">
          {block.key}:
        </Text>
        <Text className="text-text-primary text-sm leading-6 flex-1 ml-1.5">
          {prettifyValue(block.value)}
        </Text>
      </View>
    );
  }

  if (block.type === 'bullet') {
    const done = isDoneBullet(block.text);
    const Icon = done ? CheckCircle2 : Circle;
    const color = done ? Colors.success : Colors.textMuted;
    return (
      <View key={`b-${index}`} className="flex-row items-start mt-2">
        <View className="mt-1">
          <Icon size={14} color={color} strokeWidth={2} />
        </View>
        <Text className="text-text-primary text-sm leading-6 flex-1 ml-2">
          {block.text}
        </Text>
      </View>
    );
  }

  if (block.type === 'heading') {
    return (
      <Text
        key={`h-${index}`}
        className="text-text-muted text-xs font-semibold tracking-wider mt-3"
      >
        {block.text.toUpperCase()}
      </Text>
    );
  }

  return (
    <Text
      key={`p-${index}`}
      className="text-text-primary text-sm leading-6 mt-2"
    >
      {block.text}
    </Text>
  );
}

export function SmartSectionCard({
  section,
  onEditPress,
}: SmartSectionCardProps) {
  const handlePress = () => onEditPress(section);
  const trimmedBody = section.body.trim();
  const showAsEmpty = section.is_empty || trimmedBody.length === 0;

  if (showAsEmpty) {
    return (
      <Card>
        <Text className="text-text-primary text-base font-semibold mb-2">
          {section.title}
        </Text>
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={`${section.title} im Chat ergaenzen`}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-text-muted text-sm leading-5 italic">
            {EMPTY_PLACEHOLDER}
          </Text>
        </Pressable>
      </Card>
    );
  }

  const blocks = parseBlocks(trimmedBody);

  // If parsing didn't recognize any structure, fall back to the original
  // plain-text rendering with stripped markdown noise so we never display
  // raw asterisks.
  const noStructure = blocks.length === 0;

  return (
    <Card>
      <Text className="text-text-primary text-base font-semibold mb-1">
        {section.title}
      </Text>

      {noStructure ? (
        <Text className="text-text-primary text-sm leading-6 mt-1">
          {trimmedBody}
        </Text>
      ) : (
        <View>{blocks.map((b, i) => renderBlock(b, i))}</View>
      )}

      <Pressable
        onPress={handlePress}
        className="flex-row items-center justify-center mt-4 py-2.5 rounded-xl"
        style={({ pressed }) => ({
          backgroundColor: Colors.primaryUltraLight,
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel={`${section.title} im Chat anpassen`}
      >
        <MessageCircle size={16} color={Colors.primary} strokeWidth={2} />
        <Text className="text-primary text-sm font-medium ml-2">
          Im Chat anpassen
        </Text>
      </Pressable>
    </Card>
  );
}

export default SmartSectionCard;
