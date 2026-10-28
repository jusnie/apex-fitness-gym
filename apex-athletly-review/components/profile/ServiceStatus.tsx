/**
 * ServiceStatus — Athletly V2
 *
 * Connected service indicator with status badge and action buttons.
 * Used in the profile screen for Garmin Connect and future services.
 */

import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { RefreshCw, X, ChevronRight } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Colors } from '@/lib/colors';

interface ServiceStatusProps {
  name: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  isConnected: boolean;
  lastSync?: string;
  onConnect?: () => void;
  onSync?: () => void;
  onDisconnect?: () => void;
  onPress?: () => void;
  isLoading?: boolean;
}

/**
 * Format an ISO date string to a relative German time label.
 */
function formatLastSync(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'Gerade eben';
  if (diffMin < 60) return `Vor ${diffMin} Min.`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Vor ${diffHours} Std.`;

  const diffDays = Math.floor(diffHours / 24);
  return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
}

export function ServiceStatus({
  name,
  icon: Icon,
  isConnected,
  lastSync,
  onConnect,
  onSync,
  onDisconnect,
  onPress,
  isLoading = false,
}: ServiceStatusProps) {
  const content = (
    <View className="flex-row items-center py-3.5 px-4">
      <View className="w-8 items-center mr-3">
        <Icon size={20} color={Colors.textSecondary} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-0.5">
          <Text className="text-base text-text-primary">{name}</Text>
          {isConnected ? (
            <Badge type="status" status="success" label="Verbunden" />
          ) : (
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: '#94A3B815' }}>
              <Text className="text-xs font-semibold text-text-muted">
                Nicht verbunden
              </Text>
            </View>
          )}
        </View>
        {isConnected && lastSync && (
          <Text className="text-xs text-text-muted">
            Letzte Sync: {formatLastSync(lastSync)}
          </Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : isConnected ? (
        <View className="flex-row items-center gap-2">
          {onSync && (
            <Button variant="icon" size="sm" icon={RefreshCw} onPress={onSync} />
          )}
          {onDisconnect && (
            <Button variant="icon" size="sm" icon={X} onPress={onDisconnect} />
          )}
          {onPress && (
            <ChevronRight size={16} color={Colors.textMuted} />
          )}
        </View>
      ) : (
        onConnect && (
          <Button variant="ghost" size="sm" label="Verbinden" onPress={onConnect} />
        )
      )}
    </View>
  );

  if (onPress && isConnected) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        accessibilityRole="button"
        accessibilityLabel={`${name} Details anzeigen`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export default ServiceStatus;
