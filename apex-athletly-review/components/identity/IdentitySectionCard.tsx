/**
 * IdentitySectionCard - Athletly V2
 *
 * One of the 7 canonical learning sections (identity, goal, training,
 * preferences, ...). Renders title + body as plain text with preserved
 * line breaks. Empty sections show a placeholder that doubles as the
 * call to action; populated sections expose an "Im Chat anpassen"
 * button.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors } from '@/lib/colors';
import type { IdentitySection } from '@/types/identity';

interface IdentitySectionCardProps {
  readonly section: IdentitySection;
  readonly onEditPress: (section: IdentitySection) => void;
}

const EMPTY_PLACEHOLDER =
  'Athletly hat dazu noch nichts gelernt. Erzähl es im Chat.';

export function IdentitySectionCard({
  section,
  onEditPress,
}: IdentitySectionCardProps) {
  const handlePress = () => onEditPress(section);
  const trimmedBody = section.body.trim();
  const showAsEmpty = section.is_empty || trimmedBody.length === 0;

  return (
    <Card>
      <Text className="text-text-primary text-base font-semibold mb-2">
        {section.title}
      </Text>

      {showAsEmpty ? (
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
      ) : (
        <>
          <Text className="text-text-primary text-sm leading-6">
            {trimmedBody}
          </Text>
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
        </>
      )}
    </Card>
  );
}

export default IdentitySectionCard;
