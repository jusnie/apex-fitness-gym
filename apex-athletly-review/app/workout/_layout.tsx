/**
 * Workout Layout — Athletly V2
 *
 * Simple Stack layout for live workout and summary screens.
 * Headers are handled by individual screens via GradientHeader.
 */

import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
