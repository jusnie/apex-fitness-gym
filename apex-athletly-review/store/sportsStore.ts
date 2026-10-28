/**
 * Sports Store — Athletly V2
 *
 * Zustand store for user sports configuration.
 * Sports are fetched from Supabase — nothing is hardcoded.
 * Each sport has a mode: 'training' (structured plans) or 'tracking' (log only).
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

type SportMode = 'training' | 'tracking';

interface UserSport {
  name: string;
  mode: SportMode;
  icon?: string;
  color?: string;
}

interface SportsState {
  userSports: UserSport[];
  isLoading: boolean;
  error: string | null;

  /** Fetch user sports from Supabase user profile. */
  fetchUserSports: (userId: string) => Promise<void>;

  /** Add a sport to the local list (optimistic). */
  addSport: (sport: UserSport) => void;

  /** Remove a sport by name (optimistic). */
  removeSport: (sportName: string) => void;

  /** Update the mode of a sport by name (optimistic). */
  updateMode: (sportName: string, mode: SportMode) => void;

  /** Clear store state. */
  clear: () => void;
}

export const useSportsStore = create<SportsState>((set, get) => ({
  userSports: [],
  isLoading: false,
  error: null,

  fetchUserSports: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('user_sports')
        .select('name, mode, icon, color')
        .eq('user_id', userId);

      if (error) {
        console.error('[sportsStore] Error fetching user sports:', error.message);
        set({ isLoading: false, error: error.message });
        return;
      }

      const sports: UserSport[] = (data || []).map((row) => ({
        name: row.name,
        mode: row.mode as SportMode,
        icon: row.icon ?? undefined,
        color: row.color ?? undefined,
      }));

      set({ userSports: sports, isLoading: false });
    } catch (err) {
      console.error('[sportsStore] Failed to fetch user sports:', err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Fehler beim Laden der Sportarten',
      });
    }
  },

  addSport: (sport) =>
    set((state) => ({
      userSports: [...state.userSports, sport],
    })),

  removeSport: (sportName) =>
    set((state) => ({
      userSports: state.userSports.filter((s) => s.name !== sportName),
    })),

  updateMode: (sportName, mode) =>
    set((state) => ({
      userSports: state.userSports.map((s) =>
        s.name === sportName ? { ...s, mode } : s,
      ),
    })),

  clear: () => set({ userSports: [], isLoading: false, error: null }),
}));
