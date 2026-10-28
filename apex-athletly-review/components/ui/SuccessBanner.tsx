import React from 'react';
import { View, Text } from 'react-native';

interface SuccessBannerProps {
  message: string;
}

export function SuccessBanner({ message }: SuccessBannerProps) {
  return (
    <View
      className="rounded-xl px-4 py-3"
      style={{ backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#BFDBFE' }}
    >
      <Text className="text-sm font-medium text-center" style={{ color: '#2563EB' }}>
        {message}
      </Text>
    </View>
  );
}

export default SuccessBanner;
