/**
 * WeekStrip — 7-day horizontal selector (Mo-So) with SVG Progress Rings
 *
 * Each day shows a small SVG progress ring indicating session completion.
 * Rest days show an empty ring with a moon icon. Active days show
 * progress from 0% (planned, not done) to 100% (all sessions completed).
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Moon } from 'lucide-react-native';
import { getSportColor } from '@/lib/sport-colors';
import { getSportIcon } from '@/lib/sport-icons';
import { Colors } from '@/lib/colors';
import type { DayPlan } from '@/types/plan';

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

const RING_SIZE = 34;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const TRACK_COLOR = '#E2E8F0';

interface WeekStripProps {
  weekStart: string;
  days: readonly DayPlan[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateForDay(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart + 'T12:00:00');
  d.setDate(d.getDate() + dayIndex);
  return toLocalISO(d);
}

function getTodayISO(): string {
  return toLocalISO(new Date());
}

function getDayPlanForDate(days: readonly DayPlan[], date: string): DayPlan | undefined {
  return days.find((d) => d.date === date);
}

/**
 * Compute day completion percentage.
 * Currently sessions don't have a "completed" flag in the type,
 * so we treat all planned sessions as 0% progress (pending).
 * When a `completed` field is added to PlannedSession, update this.
 */
function computeDayProgress(daySessions: readonly import('@/types/plan').PlannedSession[]): number {
  if (daySessions.length === 0) return 0;
  // TODO: Replace with actual completion tracking once PlannedSession has `completed` field
  // For now, return 0 (all planned, none completed) as a sensible default.
  // Example future implementation:
  // const done = daySessions.filter(s => s.completed).length;
  // return Math.round((done / daySessions.length) * 100);
  return 0;
}

/** Determine the dominant sport color for the day's progress ring. */
function getDayRingColor(daySessions: readonly import('@/types/plan').PlannedSession[]): string {
  if (daySessions.length === 0) return Colors.primary;
  // Use the first session's sport color as the ring color
  return getSportColor(daySessions[0].sport);
}

interface ProgressRingProps {
  readonly size: number;
  readonly progress: number;
  readonly ringColor: string;
  readonly isRest: boolean;
  readonly dayNumber: number;
  readonly sessions: readonly import('@/types/plan').PlannedSession[];
}

function ProgressRing({ size, progress, ringColor, isRest, dayNumber, sessions }: ProgressRingProps) {
  const center = size / 2;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - clampedProgress / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          stroke={TRACK_COLOR}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {/* Progress arc — only render when there's actual progress */}
        {clampedProgress > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={RING_RADIUS}
            stroke={ringColor}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        )}
      </Svg>
      {/* Center content: moon for rest, sport icon for training days */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {isRest ? (
          <Moon size={12} color={Colors.textMuted} strokeWidth={2} />
        ) : (
          (() => {
            const SportIcon = sessions.length > 0
              ? getSportIcon(sessions[0].sport)
              : getSportIcon('');
            const iconColor = sessions.length > 0
              ? getSportColor(sessions[0].sport)
              : Colors.textSecondary;
            return <SportIcon size={14} color={iconColor} strokeWidth={2} />;
          })()
        )}
      </View>
    </View>
  );
}

export function WeekStrip({ weekStart, days, selectedDate, onSelectDate }: WeekStripProps) {
  const today = getTodayISO();

  return (
    <View className="flex-row justify-between px-2 py-2">
      {DAY_LABELS.map((label, index) => {
        const date = getDateForDay(weekStart, index);
        const dayNumber = new Date(date).getDate();
        const isToday = date === today;
        const isSelected = date === selectedDate;
        const dayPlan = getDayPlanForDate(days, date);
        const daySessions = dayPlan?.sessions ?? [];
        const isRest = daySessions.length === 0;
        const progress = computeDayProgress(daySessions);
        const ringColor = getDayRingColor(daySessions);

        return (
          <Pressable
            key={date}
            onPress={() => onSelectDate(date)}
            className={`items-center py-2 px-1 rounded-xl flex-1 mx-0.5 ${
              isSelected ? 'border-b-2' : ''
            }`}
            style={[
              isSelected
                ? { backgroundColor: `${Colors.primary}20`, borderBottomColor: Colors.primary }
                : undefined,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${dayNumber}`}
          >
            <Text
              className="text-xs font-medium mb-1"
              style={{ color: isToday ? Colors.primary : Colors.textSecondary }}
            >
              {label}
            </Text>

            {/* SVG Progress Ring */}
            <ProgressRing
              size={RING_SIZE}
              progress={progress}
              ringColor={ringColor}
              isRest={isRest}
              dayNumber={dayNumber}
              sessions={daySessions}
            />

            {isToday && (
              <Text className="text-[9px] font-medium mt-0.5" style={{ color: Colors.primary }}>
                Heute
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default WeekStrip;
