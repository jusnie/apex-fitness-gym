/**
 * Identity Screen - "Wie Athletly dich sieht"
 *
 * Standalone route (not a tab). Renders a list of typed widgets produced
 * by the backend LLM via `GET /profile/identity/widgets`. Every widget
 * (except the structural profile header) exposes an "Im Chat anpassen"
 * button which deep-links to the coach screen with a pre-filled German
 * draft message that the user can edit before sending.
 *
 * Fallback: if the widgets endpoint fails or returns an empty list, the
 * screen falls back to the previous section-card layout backed by
 * `GET /profile/identity`. This keeps the screen resilient while the
 * backend widget stream stabilizes.
 */

import React, { useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { log } from '@/lib/logger';
import { useAuthStore } from '@/store/authStore';
import { useIdentityStore } from '@/store/identityStore';
import { Skeleton } from '@/components/ui';
import {
  IdentityHeaderCard,
  StructuredProfileCard,
  SmartSectionCard,
  GoalHeroCard,
  TrainingMetricsCard,
} from '@/components/identity';
import { WidgetRenderer } from '@/components/widgets';
import type {
  IdentitySection,
  IdentityStructured,
} from '@/types/identity';

const TAG = 'IdentityScreen';

const STRUCTURED_DRAFT = 'Lass uns mein Profil anpassen: ';

function buildSectionDraft(section: IdentitySection): string {
  return `Lass uns ${section.title} anpassen: `;
}

export default function IdentityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const currentIdentity = useIdentityStore((s) => s.currentIdentity);
  const isLoading = useIdentityStore((s) => s.isLoading);
  const error = useIdentityStore((s) => s.error);
  const fetchIdentity = useIdentityStore((s) => s.fetchIdentity);

  const widgets = useIdentityStore((s) => s.widgets);
  const widgetsLoading = useIdentityStore((s) => s.widgetsLoading);
  const widgetsError = useIdentityStore((s) => s.widgetsError);
  const fetchWidgets = useIdentityStore((s) => s.fetchWidgets);

  useEffect(() => {
    log.info(TAG, 'Screen mounted');
    return () => log.info(TAG, 'Screen unmounted');
  }, []);

  useEffect(() => {
    if (!userId) return;
    log.info(TAG, 'Fetching identity and widgets', {
      userId: userId.slice(0, 8),
    });
    fetchWidgets(userId);
    fetchIdentity(userId);
  }, [userId, fetchWidgets, fetchIdentity]);

  const openChatWithDraft = useCallback(
    (draft: string) => {
      router.push({ pathname: '/(tabs)/coach', params: { draft } });
    },
    [router],
  );

  const handleWidgetEdit = useCallback(
    (draft: string) => {
      openChatWithDraft(draft);
    },
    [openChatWithDraft],
  );

  const handleStructuredEdit = useCallback(() => {
    openChatWithDraft(STRUCTURED_DRAFT);
  }, [openChatWithDraft]);

  const handleSectionEdit = useCallback(
    (section: IdentitySection) => {
      openChatWithDraft(buildSectionDraft(section));
    },
    [openChatWithDraft],
  );

  // State resolution:
  //   1. If widgets fetch returned a non-empty list -> render widgets.
  //   2. Else if widgets fetch finished (success-empty or failed) AND we
  //      have a fallback identity -> render the legacy section layout.
  //   3. Else if both endpoints still loading -> spinner.
  //   4. Else if both failed -> error.
  const hasWidgets = Boolean(widgets && widgets.widgets.length > 0);
  const widgetsSettled = widgets !== null || widgetsError !== null;
  const identitySettled = currentIdentity !== null || error !== null;
  const showLoading = !hasWidgets && !identitySettled && (widgetsLoading || isLoading);
  const showFallback = !hasWidgets && widgetsSettled && currentIdentity !== null;
  const showError =
    !hasWidgets && !currentIdentity && (error !== null || widgetsError !== null);
  const fallbackError = error ?? widgetsError ?? 'Unbekannter Fehler';

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        <View className="px-4 pt-3 pb-5">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 rounded-full p-1"
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Zurück"
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1">
              <Text
                className="text-white text-xl font-bold"
                style={{ letterSpacing: -0.3 }}
              >
                Wie Athletly dich sieht
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {hasWidgets ? (
          <WidgetsContent
            widgets={widgets!.widgets}
            editHints={widgets!.edit_hint_per_widget}
            onEdit={handleWidgetEdit}
          />
        ) : showFallback ? (
          <FallbackContent
            currentIdentity={currentIdentity!}
            onStructuredEdit={handleStructuredEdit}
            onSectionEdit={handleSectionEdit}
          />
        ) : showLoading ? (
          <LoadingState />
        ) : showError ? (
          <ErrorState message={fallbackError} />
        ) : null}
      </ScrollView>
    </View>
  );
}

interface WidgetsContentProps {
  readonly widgets: readonly import('@/types/widgets').Widget[];
  readonly editHints?: Readonly<Record<string, string>>;
  readonly onEdit: (draft: string) => void;
}

function WidgetsContent({ widgets, editHints, onEdit }: WidgetsContentProps) {
  return (
    <View className="gap-3">
      {widgets.map((widget, index) => (
        <WidgetRenderer
          key={`${widget.type}-${index}`}
          widget={widget}
          index={index}
          editHint={editHints?.[String(index)]}
          onEdit={onEdit}
        />
      ))}
      <Text className="text-text-muted text-xs text-center mt-4 px-2 leading-5">
        Athletly lernt aus jeder Unterhaltung. Korrigiere im Chat, dann
        aktualisiert sich diese Ansicht.
      </Text>
    </View>
  );
}

interface FallbackContentProps {
  readonly currentIdentity: NonNullable<
    ReturnType<typeof useIdentityStore.getState>['currentIdentity']
  >;
  readonly onStructuredEdit: () => void;
  readonly onSectionEdit: (section: IdentitySection) => void;
}

function FallbackContent({
  currentIdentity,
  onStructuredEdit,
  onSectionEdit,
}: FallbackContentProps) {
  return (
    <View className="gap-3">
      <IdentityHeaderCard
        athleteName={currentIdentity.athlete_name}
        lastUpdatedAt={currentIdentity.last_updated_at}
      />

      <StructuredProfileCard
        structured={currentIdentity.structured}
        onEditPress={onStructuredEdit}
      />

      {currentIdentity.sections.map((section) => (
        <SectionCard
          key={section.key}
          section={section}
          structured={currentIdentity.structured}
          onEditPress={onSectionEdit}
        />
      ))}

      <Text className="text-text-muted text-xs text-center mt-4 px-2 leading-5">
        Athletly lernt aus jeder Unterhaltung. Korrigiere im Chat, dann
        aktualisiert sich diese Ansicht.
      </Text>
    </View>
  );
}

interface SectionCardProps {
  readonly section: IdentitySection;
  readonly structured: IdentityStructured;
  readonly onEditPress: (section: IdentitySection) => void;
}

function SectionCard({ section, structured, onEditPress }: SectionCardProps) {
  if (section.key === 'current_goal') {
    return (
      <GoalHeroCard
        section={section}
        structured={structured}
        onEditPress={onEditPress}
      />
    );
  }
  if (section.key === 'training') {
    return (
      <TrainingMetricsCard
        section={section}
        structured={structured}
        onEditPress={onEditPress}
      />
    );
  }
  return <SmartSectionCard section={section} onEditPress={onEditPress} />;
}

function LoadingState() {
  return (
    <View className="gap-3">
      <Skeleton width="100%" height={96} borderRadius={20} />
      <Skeleton width="100%" height={140} borderRadius={16} />
      <Skeleton width="100%" height={200} borderRadius={16} />
      <Skeleton width="100%" height={140} borderRadius={16} />
    </View>
  );
}

interface ErrorStateProps {
  readonly message: string;
}

function ErrorState({ message }: ErrorStateProps) {
  return (
    <View className="items-center justify-center py-12 px-6">
      <Text className="text-text-primary text-base font-semibold mb-2 text-center">
        Konnte dein Profil nicht laden.
      </Text>
      <Text className="text-text-muted text-sm text-center">
        {message}
      </Text>
    </View>
  );
}
