/**
 * ToolGroup - Athletly V2
 *
 * Live multi-step checklist for one tool group while the agent works.
 *
 * Renders one row per ToolStep with status-aware iconography:
 *   pending: gray dot, gray label
 *   running: blue spinner, primary label
 *   done:    green check, primary label
 *   error:   red AlertCircle, error label
 *
 * The card stays expanded while the group is active. Once it ends
 * (parent passes `collapsed=true`) the card auto-collapses to a
 * single-line summary that remains tappable to re-expand.
 *
 * Style note: NativeWind's wrapped Pressable does not honour the
 * function-form of the `style` prop, so we use plain object styles
 * and rely on `android_ripple` for tap feedback.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import {
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import type { ToolStep } from '@/types/chat';

interface ToolGroupProps {
  readonly groupId: string;
  readonly steps: ReadonlyArray<ToolStep>;
  readonly collapsed?: boolean;
  readonly onToggle?: () => void;
}

const CARD_STYLE = {
  backgroundColor: Colors.surface,
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
  gap: 6,
} as const;

const HEADER_ROW_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
};

const HEADER_LABEL_STYLE = {
  color: Colors.textSecondary,
  fontSize: 13,
  fontWeight: '600' as const,
};

const STEP_ROW_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
  paddingVertical: 2,
};

const STEP_INDICATOR_STYLE = {
  width: 18,
  height: 18,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const PENDING_DOT_STYLE = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: Colors.textMuted,
} as const;

const STEP_LABEL_BASE_STYLE = {
  fontSize: 14,
  flex: 1,
  flexShrink: 1,
};

function labelStyleFor(status: ToolStep['status']) {
  if (status === 'pending') {
    return { ...STEP_LABEL_BASE_STYLE, color: Colors.textMuted };
  }
  if (status === 'error') {
    return { ...STEP_LABEL_BASE_STYLE, color: Colors.error };
  }
  return { ...STEP_LABEL_BASE_STYLE, color: Colors.textPrimary };
}

function StepIndicator({ status }: { status: ToolStep['status'] }) {
  if (status === 'running') {
    return (
      <View style={STEP_INDICATOR_STYLE}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }
  if (status === 'done') {
    return (
      <View style={STEP_INDICATOR_STYLE}>
        <Check size={14} color={Colors.success} strokeWidth={3} />
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={STEP_INDICATOR_STYLE}>
        <AlertCircle size={14} color={Colors.error} strokeWidth={2.5} />
      </View>
    );
  }
  return (
    <View style={STEP_INDICATOR_STYLE}>
      <View style={PENDING_DOT_STYLE} />
    </View>
  );
}

function StepRow({ step }: { step: ToolStep }) {
  return (
    <View style={STEP_ROW_STYLE}>
      <StepIndicator status={step.status} />
      <Text style={labelStyleFor(step.status)} numberOfLines={2}>
        {step.displayLabel}
      </Text>
    </View>
  );
}

export function ToolGroup({
  groupId,
  steps,
  collapsed: collapsedProp,
  onToggle,
}: ToolGroupProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = collapsedProp !== undefined;
  const collapsed = isControlled ? collapsedProp : internalCollapsed;

  const handleToggle = useCallback(() => {
    if (onToggle) {
      onToggle();
      return;
    }
    if (!isControlled) {
      setInternalCollapsed((prev) => !prev);
    }
  }, [onToggle, isControlled]);

  const doneCount = useMemo(
    () => steps.filter((s) => s.status === 'done' || s.status === 'error').length,
    [steps],
  );
  const runningStep = useMemo(
    () => steps.find((s) => s.status === 'running'),
    [steps],
  );

  const headerText = `Schritte (${doneCount}/${steps.length})`;
  const ChevronIcon = collapsed ? ChevronRight : ChevronDown;

  return (
    <View style={CARD_STYLE} accessibilityLabel={`Werkzeuggruppe ${groupId}`}>
      <Pressable
        onPress={handleToggle}
        style={HEADER_ROW_STYLE}
        android_ripple={{ color: 'rgba(37,99,235,0.1)' }}
        accessibilityRole="button"
        accessibilityLabel={
          collapsed ? 'Schritte ausklappen' : 'Schritte einklappen'
        }
      >
        <ChevronIcon size={14} color={Colors.textSecondary} strokeWidth={2} />
        <Text style={HEADER_LABEL_STYLE}>{headerText}</Text>
      </Pressable>

      {collapsed && runningStep ? (
        <StepRow step={runningStep} />
      ) : null}

      {!collapsed
        ? steps.map((step, index) => (
            <StepRow key={`${step.toolName}-${index}`} step={step} />
          ))
        : null}
    </View>
  );
}

export default ToolGroup;
