/**
 * Auth Hook — Athletly V2
 *
 * Provides authentication actions (sign in, sign up, sign out, reset password).
 * Uses authStore for state, Supabase for auth operations.
 * Error messages in German.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { log } from '@/lib/logger';
import type { AuthError } from '@supabase/supabase-js';

const TAG = 'useAuth';

interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Convert Supabase auth errors to user-friendly German messages.
 */
function getErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'E-Mail oder Passwort ist falsch.';
    case 'Email not confirmed':
      return 'Bitte bestaetige zuerst deine E-Mail-Adresse.';
    case 'User already registered':
      return 'Diese E-Mail-Adresse ist bereits registriert.';
    case 'Password should be at least 6 characters':
      return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
    case 'Unable to validate email address: invalid format':
      return 'Bitte gib eine gueltige E-Mail-Adresse ein.';
    case 'Signup requires a valid password':
      return 'Bitte gib ein gueltiges Passwort ein.';
    case 'For security purposes, you can only request this once every 60 seconds':
      return 'Bitte warte 60 Sekunden, bevor du es erneut versuchst.';
    default:
      console.warn('[useAuth] Unhandled auth error:', error.message);
      return error.message || 'Ein Fehler ist aufgetreten.';
  }
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const reset = useAuthStore((state) => state.reset);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    log.info(TAG, 'signIn called', { email: email.trim().toLowerCase() });
    const endTimer = log.time(TAG, 'signInWithPassword');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      endTimer();

      if (error) {
        log.warn(TAG, 'signIn error', { message: error.message, status: error.status });
        return { success: false, error: getErrorMessage(error) };
      }

      log.info(TAG, 'signIn successful');
      return { success: true };
    } catch (err) {
      endTimer();
      log.error(TAG, 'signIn exception', { error: String(err) });
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    log.info(TAG, 'signUp called', { email: email.trim().toLowerCase() });
    const endTimer = log.time(TAG, 'signUp');
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });
      endTimer();

      if (error) {
        log.warn(TAG, 'signUp error', { message: error.message });
        return { success: false, error: getErrorMessage(error) };
      }

      log.info(TAG, 'signUp successful');
      return { success: true };
    } catch (err) {
      endTimer();
      log.error(TAG, 'signUp exception', { error: String(err) });
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    setIsLoading(true);
    log.info(TAG, 'signOut called');
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        log.warn(TAG, 'signOut error', { message: error.message });
        return { success: false, error: getErrorMessage(error) };
      }

      log.info(TAG, 'signOut successful');
      reset();
      return { success: true };
    } catch (err) {
      log.error(TAG, 'signOut exception', { error: String(err) });
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: undefined },
      );

      if (error) {
        return { success: false, error: getErrorMessage(error) };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    isLoading,
    user,
    session,
  };
}
