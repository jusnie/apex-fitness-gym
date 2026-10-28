/**
 * AgentStatus — Athletly V2
 *
 * Shows what the AI agent is currently doing:
 * - Thinking: animated pulsing dots "Denke nach..."
 * - Tool call: badge with tool name and spinner
 * Positioned above the input bar. Animated appear/disappear.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';
import { Wrench } from 'lucide-react-native';
import { Colors } from '@/lib/colors';

interface AgentStatusProps {
  isActive: boolean;
  status: string;
  tool?: string;
}

const DOT_COUNT = 3;
const DOT_DELAY = 200;
const DOT_DURATION = 600;

function ThinkingDots() {
  const dots = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * DOT_DELAY),
          Animated.timing(dot, {
            toValue: 1,
            duration: DOT_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: DOT_DURATION / 2,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [dots]);

  return (
    <View className="flex-row items-center gap-1.5">
      {dots.map((opacity, index) => (
        <Animated.View
          key={index}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: Colors.textSecondary,
            opacity,
            transform: [
              {
                scale: opacity.interpolate({
                  inputRange: [0.3, 1],
                  outputRange: [0.8, 1.3],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

function ToolHintBadge({ tool }: { tool: string }) {
  return (
    <View className="flex-row items-center bg-surface-nested rounded-full px-3 py-1.5">
      <Wrench size={14} color={Colors.textMuted} strokeWidth={1.5} />
      <Text className="text-text-muted text-xs italic ml-1.5">
        Verwende {tool}...
      </Text>
    </View>
  );
}

export function AgentStatus({ isActive, status, tool }: AgentStatusProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive, fadeAnim]);

  if (!isActive) {
    return null;
  }

  return (
    <Animated.View
      className="flex-row items-center px-4 py-2 gap-3"
      style={{ opacity: fadeAnim }}
    >
      {tool ? (
        <ToolHintBadge tool={tool} />
      ) : (
        <View className="flex-row items-center gap-2">
          <ThinkingDots />
          <Text className="text-text-muted text-xs">{status || 'Denke nach...'}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default AgentStatus;
