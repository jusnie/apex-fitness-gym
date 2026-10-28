/**
 * Tab Layout — Athletly V2
 *
 * Bottom tab navigation with 5 tabs:
 * Today (Home), Plan, Coach, Tracking, Profil.
 * Light HubFit-inspired theme.
 * Wrapped in ErrorBoundary for graceful crash handling.
 */

import { Tabs } from 'expo-router';
import { Home, Calendar, MessageCircle, Timer, User } from 'lucide-react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/lib/colors';

const TAB_BAR_STYLE = {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 0,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 3,
} as const;

const TAB_BAR_LABEL_STYLE = {
  fontSize: 10,
} as const;

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: TAB_BAR_STYLE,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarLabelStyle: TAB_BAR_LABEL_STYLE,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Plan',
            tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Coach',
            tabBarIcon: ({ color, size }) => (
              <MessageCircle size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tracking"
          options={{
            title: 'Tracking',
            tabBarIcon: ({ color, size }) => <Timer size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}
