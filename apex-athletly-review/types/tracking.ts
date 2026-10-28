/**
 * Tracking Types — Athletly V2
 *
 * Types for activity tracking, sport selection, and quick-log entries.
 * The `activities` table stores completed workouts with sport, duration,
 * intensity, and optional metadata (body parts, notes, distance, HR).
 */

export type TrackingIntensity = 'low' | 'moderate' | 'high';

export interface SportOption {
  readonly name: string;
  readonly label: string;
}

export interface BodyPartOption {
  readonly key: string;
  readonly label: string;
}

export interface QuickLogEntry {
  readonly sport: string;
  readonly durationMinutes: number;
  readonly intensity: TrackingIntensity;
  readonly bodyParts?: readonly string[];
  readonly notes?: string;
}

export interface TrackedActivity {
  readonly id: string;
  readonly userId: string;
  readonly sport: string;
  readonly startTime: string;
  readonly durationSeconds: number;
  readonly source: string;
  readonly notes?: string;
  readonly bodyParts?: readonly string[];
  readonly createdAt: string;
}
