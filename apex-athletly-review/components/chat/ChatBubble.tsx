/**
 * ChatBubble — Athletly V2
 *
 * Message bubble component for the coach chat.
 * - AI messages: left-aligned, surface bg, rounded-tl-sm
 * - User messages: right-aligned, primary bg, rounded-tr-sm
 * - System messages: centered, muted, italic
 * - Timestamp below in caption size
 * - Tool call badges row when present
 * - Long-press to copy message text (WhatsApp-style)
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Wrench, Check } from 'lucide-react-native';
import type { ChatMessage } from '@/types/chat';
import { Colors } from '@/lib/colors';

interface ChatBubbleProps {
  message: ChatMessage;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Fade-in/out "Kopiert" toast shown above the bubble after long-press. */
function CopiedToast({ opacity }: { opacity: Animated.Value }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{ opacity, position: 'absolute', top: -32, alignSelf: 'center', zIndex: 10 }}
      className="bg-neutral-800 rounded-full px-3 py-1 flex-row items-center gap-1"
    >
      <Check size={12} color="#fff" strokeWidth={2.5} />
      <Text className="text-white text-xs font-medium">Kopiert</Text>
    </Animated.View>
  );
}

function useCopyMessage(content: string) {
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);

  const onLongPress = useCallback(async () => {
    await Clipboard.setStringAsync(content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  }, [content, toastOpacity]);

  return { onLongPress, toastOpacity, showToast };
}

function ToolCallBadges({ toolCalls }: { toolCalls: string[] }) {
  return (
    <View className="flex-row flex-wrap gap-1.5 mt-2">
      {toolCalls.map((tool, index) => (
        <View
          key={`${tool}-${index}`}
          className="flex-row items-center bg-surface-nested rounded-full px-2.5 py-1"
        >
          <Wrench size={10} color={Colors.textMuted} strokeWidth={2} />
          <Text className="text-text-muted text-[10px] ml-1">{tool}</Text>
        </View>
      ))}
    </View>
  );
}

function AssistantBubble({ message }: { message: ChatMessage }) {
  const { onLongPress, toastOpacity, showToast } = useCopyMessage(message.content);

  return (
    <View className="self-start max-w-[85%] mb-3">
      {showToast && <CopiedToast opacity={toastOpacity} />}
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={400}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }}>
          <Text className="text-text-primary text-base leading-6">
            {message.content}
          </Text>
          {message.toolCalls && message.toolCalls.length > 0 && (
            <ToolCallBadges toolCalls={message.toolCalls} />
          )}
        </View>
      </Pressable>
      <Text className="text-text-muted text-[10px] mt-1 ml-1">
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  const { onLongPress, toastOpacity, showToast } = useCopyMessage(message.content);

  return (
    <View className="self-end max-w-[85%] mb-3">
      {showToast && <CopiedToast opacity={toastOpacity} />}
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={400}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3">
          <Text className="text-white text-base leading-6">
            {message.content}
          </Text>
        </View>
      </Pressable>
      <Text className="text-text-muted text-[10px] mt-1 mr-1 text-right">
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

function SystemBubble({ message }: { message: ChatMessage }) {
  return (
    <View className="self-center max-w-[85%] mb-3 px-4 py-2">
      <Text className="text-text-muted text-sm italic text-center">
        {message.content}
      </Text>
    </View>
  );
}

export function ChatBubble({ message }: ChatBubbleProps) {
  switch (message.role) {
    case 'assistant':
      return <AssistantBubble message={message} />;
    case 'user':
      return <UserBubble message={message} />;
    case 'system':
      return <SystemBubble message={message} />;
  }
}

export default ChatBubble;
