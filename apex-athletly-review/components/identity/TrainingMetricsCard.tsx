/**
 * TrainingMetricsCard - Athletly V2
 *
 * GenUI card for the `training` identity section. Picks up free-form
 * facts (PBs, recent test results, training notes) from the section body
 * and renders them as a small metric grid plus any leftover prose.
 *
 * Structured fitness markers (VO2max, threshold pace, weekly volume, FTP)
 * are already shown by StructuredProfileCard above this card; we only
 * surface metrics from the section body that are NOT in the structured
 * profile, to avoid duplication.
 *
 * If the section has no useful body content, we render the same compact
 * SmartSectionCard rendering as for other free-form sections.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MessageCircle, Dumbbell } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { IdentitySection, IdentityStructured } from '@/types/identity';
import { parseBlocks } from './markdownBlocks';
import { SmartSectionCard } from './SmartSectionCard';

interface TrainingMetricsCardProps {
  readonly section: IdentitySection;
  readonly structured: IdentityStructured;
  readonly onEditPress: (section: IdentitySection) => void;
}

const STRUCTURED_KEYS_LOWER: readonly string[] = [
  'vo2max',
  'vo2 max',
  'schwellenpace',
  'threshold pace',
  'threshold_pace',
  'wochenkilometer',
  'wochenumfang',
  'weekly volume',
  'weekly_volume',
  'ftp',
  'trainingstage',
  'training days',
  'max session',
  'max-session',
  'max_session',
];

interface Metric {
  readonly label: string;
  readonly value: string;
}

function isStructuredKey(key: string): boolean {
  const k = key.toLowerCase();
  return STRUCTURED_KEYS_LOWER.some((s) => k.includes(s));
}

function shortLabel(key: string): string {
  return key.replace(/\s*\(.*\)\s*$/, '').trim();
}

export function TrainingMetricsCard({
  section,
  structured,
  onEditPress,
}: TrainingMetricsCardProps) {
  const blocks = parseBlocks(section.body);

  // Pull every keyValue that ISN'T already covered by the structured
  // profile card. These are the "qualitative" facts: PBs, recent test
  // results, fueling notes, etc.
  const metrics: Metric[] = [];
  const otherBlocks = blocks.filter((b) => {
    if (b.type === 'keyValue') {
      if (isStructuredKey(b.key)) return false;
      metrics.push({ label: shortLabel(b.key), value: b.value });
      return false;
    }
    return true;
  });

  const hasMetrics = metrics.length > 0;
  const hasOther = otherBlocks.length > 0;

  // Empty body or only structured-duplicate keys: defer to the smart
  // renderer which handles the "nothing learned yet" placeholder cleanly.
  if (section.is_empty || (!hasMetrics && !hasOther)) {
    return (
      <SmartSectionCard section={section} onEditPress={onEditPress} />
    );
  }

  const handleEdit = () => onEditPress(section);

  return (
    <Card>
      <View className="flex-row items-center mb-3">
        <Dumbbell size={16} color={Colors.primary} strokeWidth={2} />
        <Text className="text-text-primary text-base font-semibold ml-2">
          {section.title}
        </Text>
      </View>

      {hasMetrics ? (
        <View className="flex-row flex-wrap -mx-1">
          {metrics.map((m, idx) => (
            <View key={`${m.label}-${idx}`} className="basis-1/2 p-1">
              <View
                className="rounded-[12px] p-3"
                style={{ backgroundColor: Colors.surfaceNested }}
              >
                <Text
                  className="text-text-muted text-[11px] font-semibold tracking-wider"
                  numberOfLines={1}
                >
                  {m.label.toUpperCase()}
                </Text>
                <Text
                  className="text-text-primary text-base font-semibold mt-1"
                  numberOfLines={2}
                >
                  {m.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {hasOther ? (
        <View className={hasMetrics ? 'mt-3' : ''}>
          {otherBlocks.map((block, idx) => {
            if (block.type === 'paragraph') {
              return (
                <Text
                  key={`p-${idx}`}
                  className="text-text-secondary text-sm leading-6 mt-1"
                >
                  {block.text}
                </Text>
              );
            }
            if (block.type === 'bullet') {
              return (
                <View key={`b-${idx}`} className="flex-row items-start mt-1">
                  <Text className="text-text-muted text-sm mr-2">{'•'}</Text>
                  <Text className="text-text-primary text-sm leading-6 flex-1">
                    {block.text}
                  </Text>
                </View>
              );
            }
            if (block.type === 'heading') {
              return (
                <Text
                  key={`h-${idx}`}
                  className="text-text-muted text-xs font-semibold tracking-wider mt-3"
                >
                  {block.text.toUpperCase()}
                </Text>
              );
            }
            return null;
          })}
        </View>
      ) : null}

      <Pressable
        onPress={handleEdit}
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

export default TrainingMetricsCard;
