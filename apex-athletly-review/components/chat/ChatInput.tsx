/**
 * ChatInput — Athletly V2
 *
 * Chat input bar at the bottom of the coach screen.
 * - TextInput with auto-grow (up to 5 lines, then scrolls internally)
 * - Mic button for voice input (pulsing red when recording)
 * - Send button (visible only when text is non-empty)
 * - Safe area padding at bottom
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, MicOff, Send } from 'lucide-react-native';
import { Colors } from '@/lib/colors';

interface ChatInputProps {
  onSend: (text: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  isListening: boolean;
  voiceTranscript: string;
  disabled?: boolean;
  /**
   * Optional draft text that pre-fills the input without sending. Used
   * when the user arrives at the chat from a deep-link (e.g. "Im Chat
   * anpassen" buttons on the identity screen). A new value will overwrite
   * the current input; pass a stable reference to avoid accidental
   * resets while the user is typing.
   */
  draft?: string;
}

const MAX_INPUT_LINES = 5;
const LINE_HEIGHT = 20;
const MAX_INPUT_HEIGHT = MAX_INPUT_LINES * LINE_HEIGHT + 16;

function PulsingMic({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Pressable
      onPress={onPress}
      className="h-9 w-9 rounded-full items-center justify-center"
      style={{ backgroundColor: 'rgba(248,113,113,0.15)' }}
      accessibilityRole="button"
      accessibilityLabel="Aufnahme stoppen"
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <MicOff size={20} color={Colors.error} strokeWidth={2} />
      </Animated.View>
    </Pressable>
  );
}

export function ChatInput({
  onSend,
  onVoiceStart,
  onVoiceStop,
  isListening,
  voiceTranscript,
  disabled = false,
  draft,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const appliedDraftRef = useRef<string | undefined>(undefined);

  // Auto-fill from voice transcript
  useEffect(() => {
    if (voiceTranscript) {
      setText(voiceTranscript);
    }
  }, [voiceTranscript]);

  // Apply each new draft exactly once. A subsequent identical `draft`
  // value (e.g. after a re-render with the same URL param) must NOT
  // overwrite what the user already typed.
  useEffect(() => {
    if (draft !== undefined && draft !== appliedDraftRef.current) {
      appliedDraftRef.current = draft;
      setText(draft);
      inputRef.current?.focus();
    }
  }, [draft]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onSend(trimmed);
    setText('');
  };

  const handleMicPress = () => {
    if (isListening) {
      onVoiceStop();
    } else {
      onVoiceStart();
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <View
      className="bg-white px-4 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8), shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }}
    >
      <View className="flex-row items-end gap-2">
        {/* Mic button */}
        {isListening ? (
          <PulsingMic onPress={handleMicPress} />
        ) : (
          <Pressable
            onPress={handleMicPress}
            disabled={disabled}
            className="h-9 w-9 rounded-full items-center justify-center"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : disabled ? 0.4 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel="Spracheingabe"
          >
            <Mic size={20} color={Colors.textSecondary} strokeWidth={2} />
          </Pressable>
        )}

        {/* Text input — no explicit height, let TextInput auto-size */}
        <View
          className="flex-1 rounded-2xl px-4 justify-center"
          style={{
            backgroundColor: '#F5F6F8',
            minHeight: 36,
            maxHeight: MAX_INPUT_HEIGHT,
          }}
        >
          <TextInput
            ref={inputRef}
            className="text-text-primary text-base"
            placeholderTextColor={Colors.textMuted}
            placeholder="Nachricht..."
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            multiline
            scrollEnabled
            textAlignVertical="center"
            style={{
              lineHeight: LINE_HEIGHT,
              paddingTop: 8,
              paddingBottom: 8,
              maxHeight: MAX_INPUT_HEIGHT,
            }}
            editable={!disabled}
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>

        {/* Send button */}
        {hasText && (
          <Pressable
            onPress={handleSend}
            disabled={disabled}
            className="h-9 w-9 rounded-full bg-primary items-center justify-center"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel="Nachricht senden"
          >
            <Send size={18} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default ChatInput;
