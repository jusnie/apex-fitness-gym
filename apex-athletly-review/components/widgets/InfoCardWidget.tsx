/**
 * InfoCardWidget - Athletly V2
 *
 * Title with an optional icon, a list of label:value fact rows, and an
 * optional descriptive paragraph below the facts. Used for general
 * informational widgets the LLM emits.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { InfoCardProps, InfoFact } from '@/types/widgets';
import { resolveIcon } from './iconResolver';
import { EditInChatButton } from './EditInChatButton';

interface InfoCardWidgetExtra {
  readonly editHint?: string;
  readonly onEdit?: (draft: string) => void;
}

interface FactRowProps {
  readonly fact: InfoFact;
  readonly isLast: boolean;
}

function FactRow({ fact, isLast }: FactRowProps) {
  const borderClass = isLast ? '' : 'border-b border-divider';
  return (
    <View
      className={`flex-row items-start justify-between py-2.5 ${borderClass}`}
    >
      <Text className="text-text-secondary text-sm flex-shrink-0 mr-3">
        {fact.label}
      </Text>
      <Text
        className="text-text-primary text-sm flex-1 text-right"
        numberOfLines={3}
      >
        {fact.value}
      </Text>
    </View>
  );
}

export function InfoCardWidget({
  title,
  icon,
  facts,
  description,
  editHint,
  onEdit,
}: InfoCardProps & InfoCardWidgetExtra) {
  const Icon = resolveIcon(icon);
  const hasIcon = Boolean(icon);
  const hasFacts = Array.isArray(facts) && facts.length > 0;

  return (
    <Card>
      <View className="flex-row items-center mb-2">
        {hasIcon ? (
          <View className="mr-2">
            <Icon size={16} color={Colors.primary} strokeWidth={2} />
          </View>
        ) : null}
        <Text className="text-text-primary text-base font-semibold flex-1">
          {title}
        </Text>
      </View>

      {hasFacts ? (
        <View>
          {facts!.map((fact, idx) => (
            <FactRow
              key={`${fact.label}-${idx}`}
              fact={fact}
              isLast={idx === facts!.length - 1}
            />
          ))}
        </View>
      ) : null}

      {description ? (
        <Text className="text-text-primary text-sm leading-6 mt-3">
          {description}
        </Text>
      ) : null}

      <EditInChatButton
        hint={editHint}
        onEdit={onEdit}
        accessibilityLabel={`${title} im Chat anpassen`}
      />
    </Card>
  );
}

export default InfoCardWidget;
