/**
 * Tracking Screen — Athletly V2
 *
 * Activity tracking: sport selection from user profile (Supabase),
 * body-part selection for gym sports, quick-log with duration/intensity/notes,
 * and save to activities table.
 * Design spec section 10 (Tracking tab).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Timer,
  Check,
  ChevronRight,
  Clock,
  Flame,
  StickyNote,
  Dumbbell,
} from 'lucide-react-native';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { useTrackingStore, isGymSport } from '@/store/trackingStore';
import { getSportColor } from '@/lib/sport-colors';
import { Colors } from '@/lib/colors';
import { log } from '@/lib/logger';
import type { TrackingIntensity } from '@/types/tracking';

const TAG = 'TrackingScreen';

// --- Intensity Config ---

interface IntensityOption {
  readonly value: TrackingIntensity;
  readonly label: string;
  readonly color: string;
}

const INTENSITY_OPTIONS: readonly IntensityOption[] = [
  { value: 'low', label: 'Leicht', color: Colors.success },
  { value: 'moderate', label: 'Mittel', color: Colors.warning },
  { value: 'high', label: 'Intensiv', color: Colors.error },
] as const;

// --- Duration Presets ---

const DURATION_PRESETS = [15, 30, 45, 60, 90] as const;

// --- Helpers ---

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} Min`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Gerade eben';
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Gestern';
  return `vor ${days} Tagen`;
}

// --- Main Screen ---

export default function TrackingScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    sports,
    bodyParts,
    recentActivities,
    selectedSport,
    selectedBodyParts,
    durationMinutes,
    intensity,
    notes,
    isLoading,
    isSaving,
    error,
    fetchSports,
    fetchBodyParts,
    fetchRecentActivities,
    selectSport,
    toggleBodyPart,
    setDuration,
    setIntensity,
    setNotes,
    saveActivity,
    resetForm,
  } = useTrackingStore();

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    log.info(TAG, 'Screen mounted');
    return () => log.info(TAG, 'Screen unmounted');
  }, []);

  // Fetch data on mount
  useEffect(() => {
    if (user?.id) {
      log.info(TAG, 'Fetching sports, body parts, activities');
      fetchSports(user.id);
      fetchBodyParts(user.id);
      fetchRecentActivities(user.id);
    }
  }, [user?.id, fetchSports, fetchBodyParts, fetchRecentActivities]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      fetchSports(user.id),
      fetchBodyParts(user.id),
      fetchRecentActivities(user.id),
    ]);
  }, [user?.id, fetchSports, fetchBodyParts, fetchRecentActivities]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!user?.id) return;
    log.info(TAG, 'Saving activity', { sport: selectedSport, duration: durationMinutes, intensity });
    const endTimer = log.time(TAG, 'saveActivity');
    const success = await saveActivity(user.id);
    endTimer();
    if (success) {
      log.info(TAG, 'Activity saved successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } else {
      log.warn(TAG, 'Activity save failed');
    }
  }, [user?.id, saveActivity, selectedSport, durationMinutes, intensity]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const showBodyParts = selectedSport !== null && isGymSport(selectedSport);
  const canSave = selectedSport !== null && durationMinutes >= 1;

  return (
    <View className="flex-1 bg-background">
      <GradientHeader title="Tracking" subtitle="Aktivitaet erfassen" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Success Banner */}
          {showSuccess && <SuccessBanner />}

          {/* Error Banner */}
          {error && <ErrorBanner message={error} />}

          {/* Loading State */}
          {isLoading && <TrackingSkeleton />}

          {/* Sport Selection */}
          {!isLoading && sports.length === 0 && (
            <View className="mt-8">
              <EmptyState
                icon={Dumbbell}
                title="Keine Sportarten konfiguriert"
                description="Dein Profil hat noch keine Sportarten. Frag deinen Coach oder ergaenze sie im Profil."
              />
            </View>
          )}

          {!isLoading && sports.length > 0 && (
            <View className="px-4 mt-4 gap-4">
              {/* Sport Grid */}
              <SectionHeader label="Sportart waehlen" />
              <SportGrid
                sports={sports.map((s) => s.name)}
                labels={Object.fromEntries(sports.map((s) => [s.name, s.label]))}
                selectedSport={selectedSport}
                onSelect={selectSport}
              />

              {/* Body Parts (Gym) */}
              {showBodyParts && (
                <>
                  <SectionHeader label="Muskelgruppe" />
                  <BodyPartSelector
                    options={bodyParts}
                    selected={selectedBodyParts}
                    onToggle={toggleBodyPart}
                  />
                </>
              )}

              {/* Quick Log Form */}
              {selectedSport && (
                <>
                  <SectionHeader label="Details" />
                  <Card variant="standard" className="gap-4">
                    {/* Duration */}
                    <DurationPicker
                      value={durationMinutes}
                      onChange={setDuration}
                    />

                    {/* Intensity */}
                    <IntensityPicker
                      value={intensity}
                      onChange={setIntensity}
                    />

                    {/* Notes */}
                    <NotesInput value={notes} onChange={setNotes} />
                  </Card>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3 mt-2">
                    <View className="flex-1">
                      <Button
                        variant="secondary"
                        size="lg"
                        label="Abbrechen"
                        onPress={handleCancel}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        variant="primary"
                        size="lg"
                        label="Speichern"
                        icon={Check}
                        onPress={handleSave}
                        loading={isSaving}
                        disabled={!canSave}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Recent Activities */}
              {recentActivities.length > 0 && (
                <>
                  <SectionHeader label="Letzte Aktivitaeten" />
                  <RecentActivitiesList activities={recentActivities} />
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- Sub-Components ---

function SectionHeader({ label }: { readonly label: string }) {
  return (
    <Text className="text-text-primary text-lg font-semibold">{label}</Text>
  );
}

function SuccessBanner() {
  return (
    <View className="mx-4 mt-4 rounded-xl p-3" style={{ backgroundColor: Colors.successLight }}>
      <Text className="text-center text-sm font-medium" style={{ color: Colors.success }}>
        Aktivitaet gespeichert!
      </Text>
    </View>
  );
}

function ErrorBanner({ message }: { readonly message: string }) {
  return (
    <View className="mx-4 mt-4 rounded-xl p-3" style={{ backgroundColor: Colors.errorLight }}>
      <Text className="text-center text-sm font-medium" style={{ color: Colors.error }}>
        {message}
      </Text>
    </View>
  );
}

function TrackingSkeleton() {
  return (
    <View className="px-4 mt-4 gap-4">
      <Skeleton width="40%" height={24} borderRadius={8} />
      <View className="flex-row flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`skel-sport-${i}`} width="47%" height={72} borderRadius={16} />
        ))}
      </View>
    </View>
  );
}

interface SportGridProps {
  readonly sports: readonly string[];
  readonly labels: Record<string, string>;
  readonly selectedSport: string | null;
  readonly onSelect: (sport: string | null) => void;
}

function SportGrid({ sports, labels, selectedSport, onSelect }: SportGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {sports.map((sport) => {
        const isSelected = selectedSport === sport;
        const color = getSportColor(sport);
        return (
          <Pressable
            key={sport}
            onPress={() => onSelect(isSelected ? null : sport)}
            className="rounded-[16px] p-4 items-center justify-center"
            style={[
              {
                width: '47%',
                flexGrow: 1,
                backgroundColor: isSelected ? color : Colors.surface,
                borderWidth: isSelected ? 0 : 1,
                borderColor: Colors.divider,
              },
              !isSelected && {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={labels[sport] ?? sport}
          >
            <Text
              className="text-base font-semibold text-center"
              style={{ color: isSelected ? '#FFFFFF' : Colors.textPrimary }}
            >
              {labels[sport] ?? sport}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface BodyPartSelectorProps {
  readonly options: readonly { readonly key: string; readonly label: string }[];
  readonly selected: readonly string[];
  readonly onToggle: (key: string) => void;
}

function BodyPartSelector({ options, selected, onToggle }: BodyPartSelectorProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.key);
        return (
          <Pressable
            key={option.key}
            onPress={() => onToggle(option.key)}
            className="rounded-xl px-4 py-2.5"
            style={{
              backgroundColor: isSelected ? Colors.primaryLight : Colors.surface,
              borderWidth: 1,
              borderColor: isSelected ? Colors.primary : Colors.divider,
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: isSelected ? Colors.primary : Colors.textSecondary }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface DurationPickerProps {
  readonly value: number;
  readonly onChange: (minutes: number) => void;
}

function DurationPicker({ value, onChange }: DurationPickerProps) {
  return (
    <View>
      <View className="flex-row items-center gap-2 mb-2">
        <Clock size={16} color={Colors.textMuted} strokeWidth={2} />
        <Text className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
          Dauer: {value} Min
        </Text>
      </View>
      <View className="flex-row gap-2">
        {DURATION_PRESETS.map((preset) => {
          const isActive = value === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => onChange(preset)}
              className="flex-1 rounded-xl py-2.5 items-center"
              style={{
                backgroundColor: isActive ? Colors.primary : Colors.surfaceNested,
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: isActive ? '#FFFFFF' : Colors.textSecondary }}
              >
                {preset}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface IntensityPickerProps {
  readonly value: TrackingIntensity;
  readonly onChange: (intensity: TrackingIntensity) => void;
}

function IntensityPicker({ value, onChange }: IntensityPickerProps) {
  return (
    <View>
      <View className="flex-row items-center gap-2 mb-2">
        <Flame size={16} color={Colors.textMuted} strokeWidth={2} />
        <Text className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
          Intensitaet
        </Text>
      </View>
      <View className="flex-row gap-2">
        {INTENSITY_OPTIONS.map((option) => {
          const isActive = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className="flex-1 rounded-xl py-2.5 items-center"
              style={{
                backgroundColor: isActive ? option.color : Colors.surfaceNested,
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: isActive ? '#FFFFFF' : Colors.textSecondary }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface NotesInputProps {
  readonly value: string;
  readonly onChange: (text: string) => void;
}

function NotesInput({ value, onChange }: NotesInputProps) {
  return (
    <View>
      <View className="flex-row items-center gap-2 mb-2">
        <StickyNote size={16} color={Colors.textMuted} strokeWidth={2} />
        <Text className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
          Notizen (optional)
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="z.B. Fuehle mich gut, Tempo gesteigert..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={3}
        className="rounded-xl p-3 text-sm"
        style={{
          backgroundColor: Colors.surfaceNested,
          color: Colors.textPrimary,
          minHeight: 72,
          textAlignVertical: 'top',
        }}
      />
    </View>
  );
}

interface RecentActivitiesListProps {
  readonly activities: readonly {
    readonly id: string;
    readonly sport: string;
    readonly durationSeconds: number;
    readonly startTime: string;
  }[];
}

function RecentActivitiesList({ activities }: RecentActivitiesListProps) {
  return (
    <Card variant="standard">
      {activities.map((activity, index) => {
        const color = getSportColor(activity.sport);
        const isLast = index === activities.length - 1;
        return (
          <View
            key={activity.id}
            className="flex-row items-center py-3"
            style={!isLast ? { borderBottomWidth: 1, borderBottomColor: Colors.divider } : undefined}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: `${color}18` }}
            >
              <Timer size={20} color={color} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                {activity.sport}
              </Text>
              <Text className="text-xs" style={{ color: Colors.textMuted }}>
                {formatDuration(activity.durationSeconds)}
              </Text>
            </View>
            <Text className="text-xs" style={{ color: Colors.textMuted }}>
              {formatRelativeTime(activity.startTime)}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}
