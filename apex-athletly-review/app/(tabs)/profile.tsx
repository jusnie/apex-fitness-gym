/**
 * Profile Screen — Athletly V2
 *
 * Account settings, connected services, and app preferences.
 * Design spec section 7.5. German text throughout.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { Colors } from '@/lib/colors';
import { log } from '@/lib/logger';

const TAG = 'ProfileScreen';
import {
  Watch,
  Smartphone,
  Heart,
  Bell,
  Globe,
  Mail,
  Lock,
  LogOut,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useHealthStore } from '@/store/healthStore';
import { useChatStore } from '@/store/chatStore';
import { useAuth } from '@/hooks/useAuth';
import { useAppleHealth } from '@/hooks/useAppleHealth';
import { useHealthConnect } from '@/hooks/useHealthConnect';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { Card } from '@/components/ui';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SettingsRow } from '@/components/profile/SettingsRow';
import { ServiceStatus } from '@/components/profile/ServiceStatus';
import { GarminConnectModal } from '@/components/profile/GarminConnectModal';

const APP_VERSION = '1.0.0';

interface GarminStatus {
  connected: boolean;
  last_sync?: string;
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const connectedServices = useHealthStore((s) => s.connectedServices);
  const fetchConnectedServices = useHealthStore((s) => s.fetchConnectedServices);
  const { signOut } = useAuth();
  const router = useRouter();

  const [garminStatus, setGarminStatus] = useState<GarminStatus>({ connected: false });
  const [garminLoading, setGarminLoading] = useState(false);
  const [showGarminModal, setShowGarminModal] = useState(false);

  const appleHealth = useAppleHealth();
  const healthConnect = useHealthConnect();

  const email = user?.email ?? '';
  const createdAt = user?.created_at;

  const garminService = connectedServices.find((s) => s.provider === 'garmin');
  const isGarminConnected = garminStatus.connected || (garminService?.connected ?? false);
  const lastSync = garminStatus.last_sync ?? garminService?.lastSync;

  /**
   * Load Garmin connection status from the API.
   */
  const loadGarminStatus = useCallback(async () => {
    try {
      const status = await apiGet<GarminStatus>('/garmin/status');
      setGarminStatus(status);
    } catch {
      // Fail silently — status defaults to disconnected
    }
  }, []);

  useEffect(() => {
    log.info(TAG, 'Screen mounted', { email });
    return () => log.info(TAG, 'Screen unmounted');
  }, [email]);

  useEffect(() => {
    if (user?.id) {
      log.info(TAG, 'Fetching connected services + Garmin status');
      fetchConnectedServices(user.id);
      loadGarminStatus();
    }
  }, [user?.id, fetchConnectedServices, loadGarminStatus]);

  /**
   * Sync Garmin data.
   */
  const handleGarminSync = useCallback(async () => {
    setGarminLoading(true);
    try {
      await apiPost('/garmin/sync');
      await loadGarminStatus();
    } catch {
      Alert.alert('Sync fehlgeschlagen', 'Garmin-Daten konnten nicht synchronisiert werden.');
    } finally {
      setGarminLoading(false);
    }
  }, [loadGarminStatus]);

  /**
   * Disconnect Garmin.
   */
  const handleGarminDisconnect = useCallback(() => {
    Alert.alert(
      'Garmin trennen',
      'Moechtest du die Verbindung zu Garmin Connect wirklich trennen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Trennen',
          style: 'destructive',
          onPress: async () => {
            setGarminLoading(true);
            try {
              await apiDelete('/garmin/disconnect');
              setGarminStatus({ connected: false });
              if (user?.id) {
                fetchConnectedServices(user.id);
              }
            } catch {
              Alert.alert('Fehler', 'Verbindung konnte nicht getrennt werden.');
            } finally {
              setGarminLoading(false);
            }
          },
        },
      ],
    );
  }, [user?.id, fetchConnectedServices]);

  /**
   * Handle successful Garmin connect.
   */
  const handleGarminConnected = useCallback(() => {
    setShowGarminModal(false);
    loadGarminStatus();
    if (user?.id) {
      fetchConnectedServices(user.id);
    }
  }, [user?.id, fetchConnectedServices, loadGarminStatus]);

  /**
   * Navigate to the service detail screen for a given provider.
   */
  const navigateToServiceDetail = useCallback(
    (provider: string) => {
      router.push({ pathname: '/service-detail', params: { provider } });
    },
    [router],
  );

  /**
   * Connect Apple Health — request permissions and initial sync.
   */
  const handleAppleHealthConnect = useCallback(async () => {
    const success = await appleHealth.connect();
    if (!success && appleHealth.error) {
      Alert.alert('Apple Health', appleHealth.error);
    }
  }, [appleHealth]);

  /**
   * Manual Apple Health sync.
   */
  const handleAppleHealthSync = useCallback(async () => {
    await appleHealth.sync();
    if (appleHealth.error) {
      Alert.alert('Sync fehlgeschlagen', 'Apple Health Daten konnten nicht synchronisiert werden.');
    }
  }, [appleHealth]);

  /**
   * Disconnect Apple Health with confirmation.
   */
  const handleAppleHealthDisconnect = useCallback(() => {
    Alert.alert(
      'Apple Health trennen',
      'Moechtest du die Verbindung zu Apple Health wirklich trennen? Die Berechtigung muss separat in den iOS-Einstellungen widerrufen werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Trennen',
          style: 'destructive',
          onPress: async () => {
            await appleHealth.disconnect();
            if (user?.id) {
              fetchConnectedServices(user.id);
            }
          },
        },
      ],
    );
  }, [appleHealth, user?.id, fetchConnectedServices]);

  /**
   * Connect Health Connect — request permissions and initial sync.
   */
  const handleHealthConnectConnect = useCallback(async () => {
    const success = await healthConnect.connect();
    if (!success && healthConnect.error) {
      Alert.alert('Health Connect', healthConnect.error);
    }
  }, [healthConnect]);

  /**
   * Manual Health Connect sync.
   */
  const handleHealthConnectSync = useCallback(async () => {
    await healthConnect.sync();
    if (healthConnect.error) {
      Alert.alert('Sync fehlgeschlagen', 'Health Connect Daten konnten nicht synchronisiert werden.');
    }
  }, [healthConnect]);

  /**
   * Disconnect Health Connect with confirmation.
   */
  const handleHealthConnectDisconnect = useCallback(() => {
    Alert.alert(
      'Health Connect trennen',
      'Moechtest du die Verbindung zu Health Connect wirklich trennen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Trennen',
          style: 'destructive',
          onPress: async () => {
            try {
              await healthConnect.disconnect();
              if (user?.id) {
                fetchConnectedServices(user.id);
              }
            } catch {
              Alert.alert('Fehler', 'Verbindung konnte nicht getrennt werden.');
            }
          },
        },
      ],
    );
  }, [healthConnect, user?.id, fetchConnectedServices]);

  /**
   * Reset everything user-owned: profile, journal, plans, activities,
   * provider_tokens, sessions, chat messages. Auth user stays signed in.
   * After success the chat is empty and the agent restarts onboarding.
   */
  const handleResetProfile = useCallback(() => {
    Alert.alert(
      'Daten zurueck setzen',
      'Profil, Chat-Verlauf, Plaene, Trainingsdaten und Health-Metrics werden geloescht. Garmin/Strava-Verbindungen bleiben erhalten, damit du nicht neu einloggen musst. Fortfahren?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Alles loeschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiPost('/profile/reset');
              useChatStore.getState().clearMessages();
              useAuthStore.getState().setOnboarded(false);
              if (user?.id) {
                fetchConnectedServices(user.id);
              }
              router.replace('/(tabs)/coach');
              Alert.alert('Erledigt', 'Dein Profil wurde zurueckgesetzt.');
            } catch (err) {
              log.error(TAG, 'Reset failed', { error: String(err) });
              Alert.alert(
                'Fehler',
                'Reset fehlgeschlagen. Bitte spaeter erneut versuchen.',
              );
            }
          },
        },
      ],
    );
  }, [router, fetchConnectedServices, user?.id]);

  /**
   * Logout with confirmation dialog.
   */
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Abmelden',
      'Moechtest du dich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.success) {
              Alert.alert('Fehler', result.error ?? 'Abmelden fehlgeschlagen.');
            }
          },
        },
      ],
    );
  }, [signOut]);

  return (
    <View className="flex-1 bg-background">
      <GradientHeader title="Profil" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader email={email} createdAt={createdAt} />

        {/* Verbundene Dienste */}
        <SectionHeader title="Verbundene Dienste" />
        <Card>
          <ServiceStatus
            name="Garmin Connect"
            icon={Watch}
            isConnected={isGarminConnected}
            lastSync={lastSync}
            onConnect={() => setShowGarminModal(true)}
            onSync={handleGarminSync}
            onDisconnect={handleGarminDisconnect}
            onPress={() => navigateToServiceDetail('garmin')}
            isLoading={garminLoading}
          />
          <View className="h-px ml-14" style={{ backgroundColor: Colors.divider }} />
          {Platform.OS === 'ios' && appleHealth.available ? (
            <ServiceStatus
              name="Apple Health"
              icon={Smartphone}
              isConnected={appleHealth.connected}
              lastSync={appleHealth.lastSync ?? undefined}
              onConnect={handleAppleHealthConnect}
              onSync={handleAppleHealthSync}
              onDisconnect={handleAppleHealthDisconnect}
              onPress={() => navigateToServiceDetail('apple_health')}
              isLoading={appleHealth.syncing}
            />
          ) : Platform.OS !== 'android' ? (
            <>
              <ServiceStatus
                name="Apple Health"
                icon={Smartphone}
                isConnected={false}
              />
              <View className="py-1.5 px-4">
                <Text className="text-xs text-text-muted ml-11">
                  Nicht verfuegbar
                </Text>
              </View>
            </>
          ) : null}
          {Platform.OS === 'android' && (
            <>
              <View className="h-px ml-14" style={{ backgroundColor: Colors.divider }} />
              {healthConnect.isAvailable ? (
                <ServiceStatus
                  name="Health Connect"
                  icon={Heart}
                  isConnected={healthConnect.isConnected}
                  lastSync={healthConnect.lastSync ?? undefined}
                  onConnect={handleHealthConnectConnect}
                  onSync={handleHealthConnectSync}
                  onDisconnect={handleHealthConnectDisconnect}
                  onPress={() => navigateToServiceDetail('health_connect')}
                  isLoading={healthConnect.isSyncing}
                />
              ) : (
                <>
                  <ServiceStatus
                    name="Health Connect"
                    icon={Heart}
                    isConnected={false}
                  />
                  <View className="py-1.5 px-4">
                    <Text className="text-xs text-text-muted ml-11">
                      Health Connect nicht verfuegbar
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </Card>

        {/* Einstellungen */}
        <SectionHeader title="Einstellungen" />
        <Card>
          <SettingsRow
            icon={Sparkles}
            label="Wie Athletly dich sieht"
            onPress={() => router.push('/identity')}
          />
          <SettingsRow
            icon={Globe}
            label="Sprache"
            value="Deutsch"
            onPress={() => {}}
          />
          <SettingsRow
            icon={Bell}
            label="Benachrichtigungen"
            onPress={() => {}}
            isLast
          />
        </Card>

        {/* Account */}
        <SectionHeader title="Account" />
        <Card>
          <SettingsRow
            icon={Mail}
            label="E-Mail"
            value={email}
          />
          <SettingsRow
            icon={Lock}
            label="Passwort aendern"
            onPress={() => {}}
          />
          <SettingsRow
            icon={RotateCcw}
            label="Daten zuruecksetzen"
            onPress={handleResetProfile}
            isDestructive
          />
          <SettingsRow
            icon={LogOut}
            label="Abmelden"
            onPress={handleLogout}
            isDestructive
          />
          <SettingsRow
            icon={Trash2}
            label="Konto loeschen"
            isDestructive
            isLast
          />
        </Card>

        {/* App Version */}
        <Text className="text-text-muted text-xs text-center mt-6">
          Athletly v{APP_VERSION}
        </Text>
      </ScrollView>

      <GarminConnectModal
        visible={showGarminModal}
        onClose={() => setShowGarminModal(false)}
        onSuccess={handleGarminConnected}
      />
    </View>
  );
}

/**
 * Section header for profile groups.
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-text-secondary text-xs uppercase tracking-wider mb-2 mt-6 ml-1">
      {title}
    </Text>
  );
}
