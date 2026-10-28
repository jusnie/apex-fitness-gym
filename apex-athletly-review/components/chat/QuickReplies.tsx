/**
 * QuickReplies — Athletly V2
 *
 * Horizontal scrolling chip row for quick reply suggestions.
 * Shown below agent messages when appropriate.
 * Styled per design spec section 5.7.
 */

import React from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import { Colors } from '@/lib/colors';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

const CHIP_STYLE = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: 'rgba(37,99,235,0.2)',
  borderRadius: 999,
  paddingHorizontal: 16,
  paddingVertical: 10,
  marginRight: 8,
} as const;

const CHIP_LABEL_STYLE = {
  color: Colors.primary,
  fontSize: 14,
  fontWeight: '500' as const,
};

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (replies.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      keyboardShouldPersistTaps="handled"
    >
      {replies.map((reply) => (
        <Pressable
          key={reply}
          onPress={() => onSelect(reply)}
          style={CHIP_STYLE}
          android_ripple={{ color: 'rgba(37,99,235,0.08)' }}
          accessibilityRole="button"
          accessibilityLabel={reply}
        >
          <Text style={CHIP_LABEL_STYLE}>{reply}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default QuickReplies;
