/**
 * Auth Store — Athletly V2
 *
 * Zustand store for authentication state.
 * Listens to Supabase onAuthStateChange and checks onboarding status.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import type { User, Session, Subscription } from '@supabase/supabase-js';

const TAG = 'AuthStore';

interface AuthState {
  user: User | null;
  session: Session | null;
  isOnboarded: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Subscription | undefined;
  setOnboarded: (value: boolean) => void;
  reset: () => void;
}

/**
 * Check if user has completed onboarding by querying profiles table.
 * The profiles table has an `onboarding_complete` boolean column.
 *
 * The Supabase client can stall on certain auth-refresh edge cases (e.g.
 * a brand-new user without a profile row, or a token refresh racing the
 * query). We bound the wait with a 3s timeout - on miss we assume
 * not-onboarded so the chat can render and the agent can drive the
 * onboarding skill.
 */
async function checkOnboardingStatus(userId: string): Promise<boolean> {
  const endTimer = log.time(TAG, `checkOnboardingStatus(${userId.slice(0, 8)}...)`);

  const query = (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      log.warn(TAG, 'Onboarding status query error', { message: error.message, code: error.code });
      return false;
    }

    const result = data?.onboarding_complete === true;
    log.info(TAG, `Onboarding status: ${result}`, { data });
    return result;
  })();

  const timeout = new Promise<boolean>((resolve) => {
    setTimeout(() => {
      log.warn(TAG, 'Onboarding status query timed out after 3s, defaulting to false');
      resolve(false);
    }, 3000);
  });

  try {
    const result = await Promise.race([query, timeout]);
    endTimer();
    return result;
  } catch (err) {
    endTimer();
    log.error(TAG, 'Failed to check onboarding', { error: String(err) });
    return false;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isOnboarded: false,
  isLoading: true,
  isInitialized: false,

  initialize: () => {
    log.info(TAG, '🚀 initialize() called');
    set({ isLoading: true });

    // Get initial session — clear stale tokens gracefully
    const endGetSession = log.time(TAG, 'getSession');
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      endGetSession();

      if (error) {
        log.warn(TAG, 'Stale session, signing out', { message: error.message });
        const endSignOut = log.time(TAG, 'signOut (stale)');
        await supabase.auth.signOut();
        endSignOut();
        set({
          user: null,
          session: null,
          isOnboarded: false,
          isLoading: false,
          isInitialized: true,
        });
        log.info(TAG, '✅ Initialized (no session, stale cleared)');
        return;
      }

      if (session?.user) {
        log.info(TAG, 'Session found', {
          userId: session.user.id.slice(0, 8) + '...',
          email: session.user.email,
          expiresAt: session.expires_at,
        });
        const onboarded = await checkOnboardingStatus(session.user.id);
        set({
          user: session.user,
          session,
          isOnboarded: onboarded,
          isLoading: false,
          isInitialized: true,
        });
        log.info(TAG, '✅ Initialized (authenticated)', { onboarded });
      } else {
        log.info(TAG, 'No session found');
        set({
          user: null,
          session: null,
          isOnboarded: false,
          isLoading: false,
          isInitialized: true,
        });
        log.info(TAG, '✅ Initialized (unauthenticated)');
      }
    }).catch((err) => {
      log.error(TAG, '💥 getSession() threw an exception!', { error: String(err) });
      set({
        user: null,
        session: null,
        isOnboarded: false,
        isLoading: false,
        isInitialized: true,
      });
    });

    // Listen for auth changes
    log.debug(TAG, 'Setting up onAuthStateChange listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log.info(TAG, `Auth state changed: ${event}`, {
          hasSession: !!session,
          userId: session?.user?.id?.slice(0, 8),
        });

        if (session?.user) {
          const onboarded = await checkOnboardingStatus(session.user.id);
          set({
            user: session.user,
            session,
            isOnboarded: onboarded,
            isLoading: false,
          });
          log.info(TAG, 'State updated after auth change', { event, onboarded });
        } else {
          set({
            user: null,
            session: null,
            isOnboarded: false,
            isLoading: false,
          });
          log.info(TAG, 'State cleared after auth change', { event });
        }
      }
    );

    return subscription;
  },

  setOnboarded: (value) => {
    log.info(TAG, `setOnboarded: ${value}`);
    set({ isOnboarded: value });
  },

  reset: () => {
    log.info(TAG, 'reset() called');
    set({
      user: null,
      session: null,
      isOnboarded: false,
      isLoading: false,
    });
  },
}));
