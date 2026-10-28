import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularGaugeProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  unit?: string;
}

export function CircularGauge({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#2563EB',
  label,
  unit,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference * (1 - clampedValue / 100);

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Center content */}
      <View className="absolute items-center justify-center">
        <Text className="font-bold text-2xl" style={{ color: '#0F172A', letterSpacing: -0.5 }}>
          {Math.round(clampedValue)}
          {unit && <Text className="text-sm font-medium" style={{ color: '#475569' }}>{unit}</Text>}
        </Text>
        {label && (
          <Text className="text-xs font-medium mt-0.5" style={{ color: '#475569' }}>{label}</Text>
        )}
      </View>
    </View>
  );
}

export default CircularGauge;
