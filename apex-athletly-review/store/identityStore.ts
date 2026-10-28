/**
 * Identity Store - Athletly V2
 *
 * Zustand store backing the "Wie Athletly dich sieht" settings screen.
 * Fetches both the legacy `/profile/identity` endpoint (sections plus
 * structured profile block) and the new `/profile/identity/widgets`
 * endpoint (LLM-generated typed widgets). The screen prefers widgets when
 * available and falls back to sections when the widgets endpoint fails or
 * returns empty.
 */

import { create } from 'zustand';
import { apiGet } from '@/lib/api';
import { log } from '@/lib/logger';
import type { IdentityResponse } from '@/types/identity';
import type { WidgetsResponse } from '@/types/widgets';

const TAG = 'IdentityStore';

interface IdentityState {
  readonly currentIdentity: IdentityResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;

  readonly widgets: WidgetsResponse | null;
  readonly widgetsLoading: boolean;
  readonly widgetsError: string | null;

  fetchIdentity: (userId: string) => Promise<void>;
  fetchWidgets: (userId: string) => Promise<void>;
  clear: () => void;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  currentIdentity: null,
  isLoading: false,
  error: null,

  widgets: null,
  widgetsLoading: false,
  widgetsError: null,

  fetchIdentity: async (userId: string) => {
    set({ isLoading: true, error: null });
    const endTimer = log.time(TAG, 'fetchIdentity');
    try {
      log.debug(TAG, 'Fetching identity', { userId: userId.slice(0, 8) });
      const data = await apiGet<IdentityResponse>('/profile/identity');
      endTimer();
      log.info(TAG, 'Identity loaded', {
        sections: data.sections.length,
        hasName: data.athlete_name !== null,
      });
      set({ currentIdentity: data, isLoading: false, error: null });
    } catch (err) {
      endTimer();
      const message = err instanceof Error ? err.message : 'Fehler beim Laden';
      log.error(TAG, 'fetchIdentity failed', { error: message });
      set({ isLoading: false, error: message });
    }
  },

  fetchWidgets: async (userId: string) => {
    set({ widgetsLoading: true, widgetsError: null });
    const endTimer = log.time(TAG, 'fetchWidgets');
    try {
      log.debug(TAG, 'Fetching widgets', { userId: userId.slice(0, 8) });
      const data = await apiGet<WidgetsResponse>('/profile/identity/widgets');
      endTimer();
      log.info(TAG, 'Widgets loaded', {
        count: data.widgets.length,
        cacheHit: data.cache_hit,
      });
      set({ widgets: data, widgetsLoading: false, widgetsError: null });
    } catch (err) {
      endTimer();
      const message = err instanceof Error ? err.message : 'Fehler beim Laden';
      log.error(TAG, 'fetchWidgets failed', { error: message });
      set({ widgetsLoading: false, widgetsError: message });
    }
  },

  clear: () =>
    set({
      currentIdentity: null,
      error: null,
      isLoading: false,
      widgets: null,
      widgetsError: null,
      widgetsLoading: false,
    }),
}));
