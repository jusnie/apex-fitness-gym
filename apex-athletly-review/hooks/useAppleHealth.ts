/**
 * useAppleHealth Hook — Athletly V2
 *
 * Manages Apple Health connection lifecycle: initialization, sync, and
 * disconnect. Persists connection state via Supabase provider_tokens.
 *
 * iOS only — returns a no-op state on non-iOS platforms.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import type { SyncResult, HealthInventory } from '@/lib/services/appleHealthService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppleHealthState {
  /** Whether HealthKit is available on this device. */
  readonly available: boolean;
  /** Whether the user has connected Apple Health in the app. */
  readonly connected: boolean;
  /** ISO timestamp of last successful sync. */
  readonly lastSync: string | null;
  /** Currently running a sync. */
  readonly syncing: boolean;
  /** Last sync result (null until first sync completes). */
  readonly lastResult: SyncResult | null;
  /** Available data type inventory (populated after first sync). */
  readonly inventory: HealthInventory | null;
  /** Human-readable error from last operation. */
  readonly error: string | null;

  /** Connect: request permissions and run initial sync. */
  readonly connect: () => Promise<boolean>;
  /** Manually trigger a sync. */
  readonly sync: () => Promise<void>;
  /** Disconnect Apple Health. */
  readonly disconnect: () => Promise<void>;
}

const PROVIDER = 'apple_health';

// ---------------------------------------------------------------------------
// Lazy import — avoids crashing on non-iOS platforms
// ---------------------------------------------------------------------------

async function loadService() {
  return import('@/lib/services/appleHealthService');
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppleHealth(): AppleHealthState {
  const userId = useAuthStore((s) => s.user?.id);

  const [available, setAvailable] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [inventory, setInventory] = useState<HealthInventory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // -----------------------------------------------------------------------
  // Check availability & existing connection on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (Platform.OS !== 'ios' || !userId) return;

    let cancelled = false;

    const init = async () => {
      try {
        const svc = await loadService();
        const avail = svc.isAvailable();
        if (!cancelled) setAvailable(avail);

        if (!avail) return;

        // Check if already connected via Supabase
        const { data } = await supabase
          .from('provider_tokens')
          .select('updated_at')
          .eq('user_id', userId)
          .eq('provider', PROVIDER)
          .maybeSingle();

        if (!cancelled && data) {
          setConnected(true);
          setLastSync(data.updated_at ?? null);
        }
      } catch (err) {
        console.error('[useAppleHealth] Init error:', err);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // -----------------------------------------------------------------------
  // Auto-sync when app comes to foreground (if connected)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (Platform.OS !== 'ios' || !connected || !userId) return;

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          // Trigger background sync without blocking the UI
          performSync(userId);
        }
        appStateRef.current = nextState;
      },
    );

    return () => subscription.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, userId]);

  // -----------------------------------------------------------------------
  // Connect
  // -----------------------------------------------------------------------
  const connect = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios' || !userId) return false;
    setError(null);

    try {
      const svc = await loadService();
      const granted = await svc.requestAuthorization();
      if (!granted) {
        setError('HealthKit-Berechtigung wurde nicht erteilt.');
        return false;
      }

      setConnected(true);
      await performSync(userId);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useAppleHealth] Connect error:', err);
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // -----------------------------------------------------------------------
  // Sync
  // -----------------------------------------------------------------------
  const performSync = useCallback(
    async (uid: string) => {
      setSyncing(true);
      setError(null);

      try {
        const svc = await loadService();
        const inv = await svc.inventoryAvailableTypes();
        setInventory(inv);

        const result = await svc.syncAllData(uid);
        setLastResult(result);
        setLastSync(result.syncedAt);

        if (!result.success) {
          console.warn('[useAppleHealth] Partial sync errors:', result.errors);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error('[useAppleHealth] Sync error:', err);
      } finally {
        setSyncing(false);
      }
    },
    [],
  );

  const sync = useCallback(async () => {
    if (!userId) return;
    await performSync(userId);
  }, [userId, performSync]);

  // -----------------------------------------------------------------------
  // Disconnect
  // -----------------------------------------------------------------------
  const handleDisconnect = useCallback(async () => {
    if (!userId) return;
    setError(null);

    try {
      const svc = await loadService();
      await svc.disconnect(userId);
      setConnected(false);
      setLastSync(null);
      setLastResult(null);
      setInventory(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useAppleHealth] Disconnect error:', err);
    }
  }, [userId]);

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------
  return {
    available,
    connected,
    lastSync,
    syncing,
    lastResult,
    inventory,
    error,
    connect,
    sync,
    disconnect: handleDisconnect,
  };
}
