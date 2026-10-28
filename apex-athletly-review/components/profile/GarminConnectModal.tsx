/**
 * GarminConnectModal — Athletly V2
 *
 * Modal overlay with email + password inputs for Garmin Connect login.
 * Calls apiPost('/garmin/connect') and reports success/error.
 */

import React, { useState } from 'react';
import { View, Text, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Mail, Lock } from 'lucide-react-native';
import { Button, Input } from '@/components/ui';
import { apiPost } from '@/lib/api';
import { Colors } from '@/lib/colors';

interface GarminConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GarminConnectResponse {
  status: string;
}

export function GarminConnectModal({ visible, onClose, onSuccess }: GarminConnectModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Bitte gib E-Mail und Passwort ein.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await apiPost<GarminConnectResponse>('/garmin/connect', {
        email: trimmedEmail,
        password,
      });
      setEmail('');
      setPassword('');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verbindung fehlgeschlagen.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: Colors.overlay }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 mx-6 w-80"
            onPress={() => {}}
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-text-primary text-lg font-semibold">
                Garmin Connect
              </Text>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Schliessen"
              >
                <X size={20} color={Colors.textMuted} />
              </Pressable>
            </View>

            <Text className="text-text-secondary text-sm mb-4">
              Melde dich mit deinem Garmin Connect Konto an.
            </Text>

            <View className="gap-3 mb-4">
              <Input
                label="E-Mail"
                leftIcon={Mail}
                placeholder="garmin@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label="Passwort"
                leftIcon={Lock}
                isPassword
                placeholder="Passwort"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error && (
              <View className="bg-error/10 rounded-xl px-4 py-2.5 mb-4">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            )}

            <Button
              variant="primary"
              size="lg"
              label="Verbinden"
              onPress={handleConnect}
              loading={isLoading}
              disabled={isLoading}
            />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export default GarminConnectModal;
