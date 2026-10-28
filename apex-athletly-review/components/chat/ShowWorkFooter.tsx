/**
 * ShowWorkFooter - Athletly V2
 *
 * Inline collapsible footer attached under a completed assistant message
 * showing the tools the agent used in that turn. Closed by default.
 *
 * Visual rhythm matches ToolGroup but without a card border or shadow
 * because it lives under the chat bubble.
 *
 * Style note: NativeWind's wrapped Pressable does not honour the
 * function-form of the `style` prop, so we use plain object styles
 * and rely on `android_ripple` for tap feedback.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, ChevronRight, Check, AlertCircle } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import type { ToolStep } from '@/types/chat';

interface ShowWorkFooterProps {
  readonly steps: ReadonlyArray<ToolStep>;
}

const CONTAINER_STYLE = {
  marginTop: 4,
  marginBottom: 8,
  paddingHorizontal: 4,
  gap: 6,
};

const TRIGGER_ROW_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
  paddingVertical: 4,
};

const TRIGGER_LABEL_STYLE = {
  color: Colors.textMuted,
  fontSize: 12,
  fontWeight: '500' as const,
};

const STEP_ROW_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'flex-start' as const,
  gap: 8,
  paddingVertical: 2,
};

const STEP_INDICATOR_STYLE = {
  width: 16,
  height: 16,
  marginTop: 2,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const DISPLAY_LABEL_STYLE = {
  color: Colors.textPrimary,
  fontSize: 13,
  fontWeight: '500' as const,
};

const TOOL_NAME_STYLE = {
  color: Colors.textMuted,
  fontSize: 11,
  marginTop: 1,
};

const STEP_TEXT_COLUMN_STYLE = {
  flex: 1,
  flexShrink: 1,
};

function FooterStepRow({ step }: { step: ToolStep }) {
  const isError = step.status === 'error';
  const Icon = isError ? AlertCircle : Check;
  const iconColor = isError ? Colors.error : Colors.success;
  return (
    <View style={STEP_ROW_STYLE}>
      <View style={STEP_INDICATOR_STYLE}>
        <Icon size={12} color={iconColor} strokeWidth={2.5} />
      </View>
      <View style={STEP_TEXT_COLUMN_STYLE}>
        <Text style={DISPLAY_LABEL_STYLE}>{step.displayLabel}</Text>
        <Text style={TOOL_NAME_STYLE}>{step.toolName}</Text>
      </View>
    </View>
  );
}

export function ShowWorkFooter({ steps }: ShowWorkFooterProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (steps.length === 0) {
    return null;
  }

  const ChevronIcon = expanded ? ChevronDown : ChevronRight;
  const triggerLabel = `Werkzeuge verwendet (${steps.length})`;

  return (
    <View style={CONTAINER_STYLE}>
      <Pressable
        onPress={toggle}
        style={TRIGGER_ROW_STYLE}
        android_ripple={{ color: 'rgba(37,99,235,0.08)' }}
        accessibilityRole="button"
        accessibilityLabel={
          expanded
            ? 'Werkzeugliste einklappen'
            : 'Werkzeugliste ausklappen'
        }
      >
        <ChevronIcon size={12} color={Colors.textMuted} strokeWidth={2} />
        <Text style={TRIGGER_LABEL_STYLE}>{triggerLabel}</Text>
      </Pressable>

      {expanded
        ? steps.map((step, index) => (
            <FooterStepRow key={`${step.toolName}-${index}`} step={step} />
          ))
        : null}
    </View>
  );
}

export default ShowWorkFooter;
