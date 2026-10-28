/**
 * Widget types - Athletly V2
 *
 * Typed contract for the universal widget renderer powering the identity
 * screen. Backend returns `GET /profile/identity/widgets` with an
 * LLM-generated list of typed widgets that the frontend renders
 * automatically. No per-section logic on the client side.
 */

export interface ProfileHeaderProps {
  readonly name: string;
  readonly subtitle?: string;
  readonly sport_badges?: readonly string[];
}

export interface HeroGoalProps {
  readonly event: string;
  readonly target_date?: string;
  readonly countdown_days?: number;
  readonly target_time?: string;
  readonly pace?: string;
  readonly course_description?: string;
  readonly source?: string;
}

export interface StatItem {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly icon?: string;
}

export interface StatGridProps {
  readonly title: string;
  readonly stats: readonly StatItem[];
}

export type TimelineItemStatus = 'done' | 'pending' | 'failed' | 'neutral';

export interface TimelineItem {
  readonly date?: string;
  readonly label: string;
  readonly description?: string;
  readonly status?: TimelineItemStatus;
}

export interface TimelineProps {
  readonly title: string;
  readonly items: readonly TimelineItem[];
}

export type ChecklistItemStatus = 'open' | 'done' | 'in_progress';

export interface ChecklistItem {
  readonly text: string;
  readonly status: ChecklistItemStatus;
}

export interface ChecklistProps {
  readonly title: string;
  readonly items: readonly ChecklistItem[];
}

export type ChipColor = 'green' | 'orange' | 'gray' | 'blue';

export interface Chip {
  readonly label: string;
  readonly color?: ChipColor;
  readonly icon?: string;
}

export interface ChipListProps {
  readonly title: string;
  readonly chips: readonly Chip[];
}

export interface InfoFact {
  readonly label: string;
  readonly value: string;
}

export interface InfoCardProps {
  readonly title: string;
  readonly icon?: string;
  readonly facts?: readonly InfoFact[];
  readonly description?: string;
}

export interface QuoteCardProps {
  readonly title?: string;
  readonly quote: string;
  readonly attribution?: string;
}

export type Widget =
  | { readonly type: 'profile_header'; readonly props: ProfileHeaderProps }
  | { readonly type: 'hero_goal'; readonly props: HeroGoalProps }
  | { readonly type: 'stat_grid'; readonly props: StatGridProps }
  | { readonly type: 'timeline'; readonly props: TimelineProps }
  | { readonly type: 'checklist'; readonly props: ChecklistProps }
  | { readonly type: 'chip_list'; readonly props: ChipListProps }
  | { readonly type: 'info_card'; readonly props: InfoCardProps }
  | { readonly type: 'quote_card'; readonly props: QuoteCardProps };

export type WidgetType = Widget['type'];

export interface WidgetsResponse {
  readonly widgets: readonly Widget[];
  readonly generated_at: string;
  readonly cache_hit: boolean;
  readonly edit_hint_per_widget?: Readonly<Record<string, string>>;
}
