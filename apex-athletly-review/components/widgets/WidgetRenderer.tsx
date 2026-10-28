/**
 * WidgetRenderer - Athletly V2
 *
 * Single dispatcher mapping a typed Widget union to its concrete React
 * Native component. Unknown types are logged and skipped (never throw).
 *
 * NOTE on tests: the project has no jest/vitest configured. The pure
 * widget components are trivially mockable for future testing because
 * they only depend on props plus simple `Colors` and lucide icons.
 */

import React from 'react';
import { log } from '@/lib/logger';
import type { Widget } from '@/types/widgets';
import { ProfileHeaderWidget } from './ProfileHeaderWidget';
import { HeroGoalWidget } from './HeroGoalWidget';
import { StatGridWidget } from './StatGridWidget';
import { TimelineWidget } from './TimelineWidget';
import { ChecklistWidget } from './ChecklistWidget';
import { ChipListWidget } from './ChipListWidget';
import { InfoCardWidget } from './InfoCardWidget';
import { QuoteCardWidget } from './QuoteCardWidget';

const TAG = 'WidgetRenderer';

interface WidgetRendererProps {
  readonly widget: Widget;
  readonly index: number;
  readonly editHint?: string;
  readonly onEdit?: (draft: string) => void;
}

export function WidgetRenderer({
  widget,
  editHint,
  onEdit,
}: WidgetRendererProps) {
  const editProps = { editHint, onEdit };
  switch (widget.type) {
    case 'profile_header':
      return <ProfileHeaderWidget {...widget.props} />;
    case 'hero_goal':
      return <HeroGoalWidget {...widget.props} {...editProps} />;
    case 'stat_grid':
      return <StatGridWidget {...widget.props} {...editProps} />;
    case 'timeline':
      return <TimelineWidget {...widget.props} {...editProps} />;
    case 'checklist':
      return <ChecklistWidget {...widget.props} {...editProps} />;
    case 'chip_list':
      return <ChipListWidget {...widget.props} {...editProps} />;
    case 'info_card':
      return <InfoCardWidget {...widget.props} {...editProps} />;
    case 'quote_card':
      return <QuoteCardWidget {...widget.props} {...editProps} />;
    default: {
      const unknown = widget as { readonly type: string };
      log.warn(TAG, 'Unknown widget type, skipping', { type: unknown.type });
      return null;
    }
  }
}

export default WidgetRenderer;
