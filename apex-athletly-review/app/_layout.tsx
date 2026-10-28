/**
 * Root Layout - Athletly V2 (chat-first)
 *
 * Entry point for the app. The chat is the only top-level surface.
 *
 * - Pre-signup: render PreSignupChat full-screen (no tabs, no Stack).
 * - Post-signup: render the Stack -> tabs as usual.
 *
 * Auth and onboarding both happen inside the chat via inline action cards.
 */

import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PreSignupChat } from '@/components/chat/PreSignupChat';
import { Colors } from '@/lib/colors';
import { log } from '@/lib/logger';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const TAG = 'RootLayout';

function LoadingScreen() {
  const mountTime = useRef(Date.now());

  useEffect(() => {
    log.info(TAG, 'LoadingScreen mounted');

    const warnTimer = setTimeout(() => {
      const elapsed = Date.now() - mountTime.current;
      log.warn(TAG, `LoadingScreen still visible after ${elapsed}ms`);
      log.warn(TAG, 'AuthStore state:', useAuthStore.getState());
    }, 5000);

    const criticalTimer = setTimeout(() => {
      const elapsed = Date.now() - mountTime.current;
      log.error(TAG, `LoadingScreen stuck for ${elapsed}ms`);
      const state = useAuthStore.getState();
      log.error(TAG, 'Full AuthStore state', {
        isInitialized: state.isInitialized,
        isLoading: state.isLoading,
        hasSession: !!state.session,
        hasUser: !!state.user,
        isOnboarded: state.isOnboarded,
      });
    }, 15000);

    return () => {
      const elapsed = Date.now() - mountTime.current;
      log.info(TAG, `LoadingScreen unmounted after ${elapsed}ms`);
      clearTimeout(warnTimer);
      clearTimeout(criticalTimer);
    };
  }, []);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: Colors.background }}
    >
      <ActivityIndicator size="large" color={Colors.primary} />
      {__DEV__ && (
        <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 16 }}>
          Initializing...
        </Text>
      )}
    </View>
  );
}

export default function RootLayout() {
  const { session, isInitialized, initialize } = useAuthStore();

  log.debug(TAG, `render() - isInitialized: ${isInitialized}, hasSession: ${!!session}`);

  useEffect(() => {
    log.info(TAG, 'RootLayout mounted, calling initialize()');
    const subscription = initialize();
    return () => {
      log.info(TAG, 'RootLayout unmounting, cleaning up subscription');
      subscription?.unsubscribe();
    };
  }, [initialize]);

  usePushNotifications();

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  if (!session) {
    log.info(TAG, 'Rendering pre-signup chat (no session)');
    return (
      <SafeAreaProvider>
        <ToastProvider>
          <ErrorBoundary>
            <PreSignupChat />
          </ErrorBoundary>
          <StatusBar style="dark" />
        </ToastProvider>
      </SafeAreaProvider>
    );
  }

  log.info(TAG, 'Rendering main app stack (authenticated)');

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Stack screenOptions={{ headerShown: false }} />
        </ErrorBoundary>
        <StatusBar style="dark" />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
