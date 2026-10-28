/**
 * QuoteCardWidget - Athletly V2
 *
 * Stylized quote with a thick accent left border, italic body, and an
 * optional attribution underneath.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { QuoteCardProps } from '@/types/widgets';
import { EditInChatButton } from './EditInChatButton';

interface QuoteCardWidgetExtra {
  readonly editHint?: string;
  readonly onEdit?: (draft: string) => void;
}

export function QuoteCardWidget({
  title,
  quote,
  attribution,
  editHint,
  onEdit,
}: QuoteCardProps & QuoteCardWidgetExtra) {
  return (
    <Card>
      {title ? (
        <Text className="text-text-primary text-base font-semibold mb-2">
          {title}
        </Text>
      ) : null}

      <View
        className="pl-4 py-1"
        style={{ borderLeftWidth: 3, borderLeftColor: Colors.primary }}
      >
        <Text
          className="text-text-primary text-base italic leading-7"
          style={{ letterSpacing: -0.1 }}
        >
          {quote}
        </Text>
        {attribution ? (
          <Text className="text-text-muted text-xs mt-2">
            {attribution}
          </Text>
        ) : null}
      </View>

      <EditInChatButton
        hint={editHint}
        onEdit={onEdit}
        accessibilityLabel={title ? `${title} im Chat anpassen` : 'Zitat im Chat anpassen'}
      />
    </Card>
  );
}

export default QuoteCardWidget;
