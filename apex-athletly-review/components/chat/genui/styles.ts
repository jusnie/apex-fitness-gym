/**
 * Shared styles for GenUI cards.
 *
 * Mirrors the look of components/chat/ActionCard.tsx so inline UI components
 * feel native to the chat surface.
 *
 * Style note: NativeWind's wrapped Pressable does not reliably honour the
 * function-form of the `style` prop, so we use plain object styles
 * everywhere and rely on `android_ripple` for tap feedback.
 */

import { Colors } from '@/lib/colors';

export const CARD_STYLE = {
  backgroundColor: Colors.surface,
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
} as const;

export const QUESTION_STYLE = {
  color: Colors.textPrimary,
  fontSize: 15,
  fontWeight: '600' as const,
  marginBottom: 12,
} as const;

export const PRIMARY_BUTTON_STYLE = {
  backgroundColor: Colors.primary,
  borderRadius: 12,
  height: 48,
  width: '100%' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 20,
  shadowColor: Colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 4,
} as const;

export const PRIMARY_LABEL_STYLE = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600' as const,
} as const;

export const CANCEL_BUTTON_STYLE = {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.divider,
  borderRadius: 12,
  height: 48,
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 20,
} as const;

export const CANCEL_LABEL_STYLE = {
  color: Colors.textSecondary,
  fontSize: 16,
  fontWeight: '600' as const,
} as const;

export const DISABLED_STYLE = { opacity: 0.55 } as const;

export const RESOLVED_HINT_STYLE = {
  color: Colors.textMuted,
  fontSize: 13,
  fontStyle: 'italic' as const,
  marginTop: 4,
} as const;

export const CHIP_BASE_STYLE = {
  borderRadius: 999,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderWidth: 1,
  marginRight: 8,
  marginBottom: 8,
} as const;

export const CHIP_UNSELECTED_STYLE = {
  ...CHIP_BASE_STYLE,
  backgroundColor: Colors.surface,
  borderColor: Colors.divider,
} as const;

export const CHIP_SELECTED_STYLE = {
  ...CHIP_BASE_STYLE,
  backgroundColor: Colors.primary,
  borderColor: Colors.primary,
} as const;

export const CHIP_LABEL_UNSELECTED_STYLE = {
  color: Colors.textPrimary,
  fontSize: 14,
  fontWeight: '500' as const,
} as const;

export const CHIP_LABEL_SELECTED_STYLE = {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600' as const,
} as const;

export const STEPPER_BUTTON_STYLE = {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: Colors.primaryUltraLight,
  borderWidth: 1,
  borderColor: Colors.primaryLight,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
} as const;

export const STEPPER_BUTTON_LABEL_STYLE = {
  color: Colors.primary,
  fontSize: 22,
  fontWeight: '700' as const,
  lineHeight: 24,
} as const;

export const STEPPER_VALUE_STYLE = {
  color: Colors.textPrimary,
  fontSize: 28,
  fontWeight: '700' as const,
  textAlign: 'center' as const,
  minWidth: 120,
} as const;

export const TEXT_INPUT_STYLE = {
  backgroundColor: Colors.inputBg,
  borderWidth: 1,
  borderColor: Colors.inputBorder,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  color: Colors.textPrimary,
  marginBottom: 12,
} as const;

export const HINT_STYLE = {
  color: Colors.textMuted,
  fontSize: 12,
  marginTop: -6,
  marginBottom: 10,
} as const;
