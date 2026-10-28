/**
 * useHealthConnect Hook — Athletly V2
 *
 * Hook that manages Android Health Connect initialization, authorization,
 * and data sync. Android-only — returns a no-op state on other platforms.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useHealthStore } from '@/store/healthStore';
import * as HealthConnectService from '@/lib/services/healthConnectService';
import type { SyncResult } from '@/lib/services/healthConnectService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthConnectState {
  /** Whether the Health Connect SDK is available on this device. */
  readonly isAvailable: boolean;
  /** Whether the SDK has been initialized. */
  readonly isInitialized: boolean;
  /** Whether the user has granted any read permissions. */
  readonly isConnected: boolean;
  /** Whether a sync operation is currently running. */
  readonly isSyncing: boolean;
  /** ISO timestamp of the last successful sync. */
  readonly lastSync: string | null;
  /** Error message from the last failed operation. */
  readonly error: string | null;
  /** Request permissions and connect. */
  readonly connect: () => Promise<boolean>;
  /** Trigger a manual sync. */
  readonly sync: () => Promise<SyncResult | null>;
  /** Disconnect and revoke permissions. */
  readonly disconnect: () => Promise<void>;
}

const NOOP_STATE: HealthConnectState = {
  isAvailable: false,
  isInitialized: false,
  isConnected: false,
  isSyncing: false,
  lastSync: null,
  error: null,
  connect: async () => false,
  sync: async () => null,
  disconnect: async () => {},
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useHealthConnect(): HealthConnectState {
  // Platform guard — return no-op state immediately on non-Android
  if (Platform.OS !== 'android') {
    return NOOP_STATE;
  }

  return useHealthConnectAndroid();
}

/**
 * Internal Android-only implementation. Separated to keep the platform
 * guard clean and avoid conditional hook calls.
 */
function useHealthConnectAndroid(): HealthConnectState {
  const user = useAuthStore((s) => s.user);
  const fetchConnectedServices = useHealthStore((s: { fetchConnectedServices: (userId: string) => Promise<void> }) => s.fetchConnectedServices);

  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate initialization
  const initRef = useRef(false);

  // ------ Initialization on mount ------
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        const available = await HealthConnectService.isAvailable();
        setIsAvailable(available);

        if (!available) return;

        const initialized = await HealthConnectService.initializeSdk();
        setIsInitialized(initialized);

        if (!initialized) return;

        const hasPerms = await HealthConnectService.hasPermissions();
        setIsConnected(hasPerms);
      } catch (err) {
        console.error('[useHealthConnect] Init error:', err);
        setError(String(err));
      }
    })();
  }, []);

  // ------ Auto-sync on mount when connected ------
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    (async () => {
      try {
        setIsSyncing(true);
        setError(null);

        const result = await HealthConnectService.syncAllData(user.id);
        setLastSync(result.syncedAt);

        if (!result.success) {
          console.warn('[useHealthConnect] Sync completed with errors:', result.errors);
        }

        fetchConnectedServices(user.id);
      } catch (err) {
        console.error('[useHealthConnect] Auto-sync error:', err);
        setError(String(err));
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [isConnected, user?.id, fetchConnectedServices]);

  // ------ Connect ------
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      if (!isInitialized) {
        const initialized = await HealthConnectService.initializeSdk();
        if (!initialized) {
          setError('Health Connect konnte nicht initialisiert werden.');
          return false;
        }
        setIsInitialized(true);
      }

      const granted = await HealthConnectService.requestAuthorization();

      if (granted.length === 0) {
        setError('Keine Berechtigungen erteilt.');
        return false;
      }

      setIsConnected(true);
      return true;
    } catch (err) {
      console.error('[useHealthConnect] Connect error:', err);
      setError(String(err));
      return false;
    }
  }, [isInitialized]);

  // ------ Manual sync ------
  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (!user?.id) {
      setError('Benutzer nicht angemeldet.');
      return null;
    }

    try {
      setIsSyncing(true);
      setError(null);

      const result = await HealthConnectService.syncAllData(user.id);
      setLastSync(result.syncedAt);

      if (!result.success) {
        console.warn('[useHealthConnect] Sync errors:', result.errors);
      }

      fetchConnectedServices(user.id);
      return result;
    } catch (err) {
      console.error('[useHealthConnect] Sync error:', err);
      setError(String(err));
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, fetchConnectedServices]);

  // ------ Disconnect ------
  const handleDisconnect = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      setError(null);
      await HealthConnectService.disconnect(user.id);
      setIsConnected(false);
      setLastSync(null);
      fetchConnectedServices(user.id);
    } catch (err) {
      console.error('[useHealthConnect] Disconnect error:', err);
      setError(String(err));
      throw err;
    }
  }, [user?.id, fetchConnectedServices]);

  return {
    isAvailable,
    isInitialized,
    isConnected,
    isSyncing,
    lastSync,
    error,
    connect,
    sync,
    disconnect: handleDisconnect,
  };
}

export default useHealthConnect;
