/**
 * EditInChatButton - Athletly V2
 *
 * Shared "Im Chat anpassen" pill used by every widget that exposes an
 * edit hint. Centralized so all widgets stay visually identical and the
 * widget components themselves can stay under the 150-line budget.
 */

import React from 'react';
import { Pressable, Text } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Colors } from '@/lib/colors';

interface EditInChatButtonProps {
  readonly hint?: string;
  readonly onEdit?: (draft: string) => void;
  readonly accessibilityLabel?: string;
}

export function EditInChatButton({
  hint,
  onEdit,
  accessibilityLabel = 'Im Chat anpassen',
}: EditInChatButtonProps) {
  if (!hint || !onEdit) return null;

  return (
    <Pressable
      onPress={() => onEdit(hint)}
      className="flex-row items-center justify-center mt-4 py-2.5 rounded-xl"
      style={({ pressed }) => ({
        backgroundColor: Colors.primaryUltraLight,
        opacity: pressed ? 0.7 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <MessageCircle size={16} color={Colors.primary} strokeWidth={2} />
      <Text className="text-primary text-sm font-medium ml-2">
        Im Chat anpassen
      </Text>
    </Pressable>
  );
}

export default EditInChatButton;
