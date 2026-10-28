import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: 4 | 6 | 8;
}

const heightClasses: Record<number, string> = {
  4: 'h-1',
  6: 'h-1.5',
  8: 'h-2',
};

export function ProgressBar({ progress, color, height = 6 }: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedProgress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, animatedWidth]);

  return (
    <View className={`w-full bg-surface-muted rounded-full ${heightClasses[height]}`}>
      <Animated.View
        className={`${heightClasses[height]} rounded-full`}
        style={[
          { backgroundColor: color ?? '#2563EB' },
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

export default ProgressBar;
