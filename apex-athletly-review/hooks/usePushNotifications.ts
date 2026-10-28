/**
 * Push Notification Hook — Athletly V2
 *
 * Registers for Expo push notifications, persists the token to Supabase
 * `push_tokens` table, and handles incoming notification responses
 * (e.g. navigating to the coach chat on tap).
 */

import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { isStreamActive } from '@/lib/chatActiveFlag';

/**
 * Configure default notification behaviour (foreground display).
 * Must be called before any notification is received.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Suppress "coach replied" notifications when the user is actively
    // watching the SSE stream (they already see the response).
    const data = notification.request.content.data as Record<string, unknown> | undefined;
    if (data?.type === 'coach_response' && isStreamActive()) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

/**
 * Request permission and obtain the Expo push token.
 * Returns `null` when permission is denied or the device does not support push.
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications are not supported on web
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[usePushNotifications] Permission not granted');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('[usePushNotifications] Missing eas.projectId in app config');
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data;
}

/**
 * Persist the push token to the `push_tokens` table via upsert.
 * The table has columns: user_id (PK / unique), token, platform, updated_at.
 */
async function saveTokenToSupabase(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[usePushNotifications] Failed to save token:', error.message);
  } else {
    console.log('[usePushNotifications] Token saved');
  }
}

/**
 * Hook that registers push notifications and handles incoming notification taps.
 *
 * Should be called once in the root layout after auth is initialized.
 */
export function usePushNotifications(): void {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const router = useRouter();

  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);
  const notificationReceivedListener = useRef<Notifications.EventSubscription | null>(null);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;

      // Navigate to coach chat when a coach notification is tapped
      if (data?.type === 'coach_message' || data?.type === 'coach_response' || data?.navigate === 'coach') {
        router.push('/(tabs)/coach');
      }
    },
    [router],
  );

  useEffect(() => {
    if (!user?.id || !session) return;

    // Register token
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          return saveTokenToSupabase(user.id, token);
        }
      })
      .catch((err) => {
        console.error('[usePushNotifications] Registration error:', err);
      });

    // Listen for notification taps (user interacted with a notification)
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Listen for foreground notifications (optional logging)
    notificationReceivedListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('[usePushNotifications] Received:', notification.request.content.title);
      });

    return () => {
      notificationResponseListener.current?.remove();
      notificationReceivedListener.current?.remove();
    };
  }, [user?.id, session, handleNotificationResponse]);
}
