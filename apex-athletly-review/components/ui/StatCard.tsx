import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  icon?: LucideIcon;
  value: string;
  unit?: string;
  label: string;
}

export function StatCard({ icon: Icon, value, unit, label }: StatCardProps) {
  return (
    <View
      className="rounded-[14px] p-4 flex-1"
      style={{ backgroundColor: '#F5F6F8' }}
    >
      {Icon && <Icon size={16} color="#94A3B8" strokeWidth={1.5} />}
      <View className="flex-row items-baseline gap-1 mt-2">
        <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>{value}</Text>
        {unit && <Text className="text-sm font-medium" style={{ color: '#475569' }}>{unit}</Text>}
      </View>
      <Text className="text-xs font-medium mt-0.5" style={{ color: '#475569' }}>{label}</Text>
    </View>
  );
}

export default StatCard;
