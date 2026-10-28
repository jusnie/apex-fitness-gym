/**
 * Plan Types — Athletly V2
 *
 * Types for weekly training plans aligned with the Visionplan backend schema.
 * The `weekly_plans` table stores `days` as JSONB array, plus
 * `coach_message` and `reasoning` as top-level columns.
 */

export type Intensity = 'low' | 'moderate' | 'high';

export interface SessionDetails {
  readonly [key: string]: unknown;
}

export interface PlannedSession {
  readonly id?: string;
  readonly sport: string;
  readonly duration_minutes: number;
  readonly intensity: Intensity;
  readonly session_type: string;
  readonly description: string;
  readonly details?: SessionDetails;
}

export interface DayPlan {
  readonly date: string;           // ISO date string (YYYY-MM-DD)
  readonly day_name: string;       // e.g. "Montag"
  readonly sessions: readonly PlannedSession[];
  readonly rest_reason?: string;   // optional reason when sessions is empty
  readonly agentTip?: string;      // optional AI coach recovery tip
}

export interface WeeklyPlan {
  readonly id: string;
  readonly userId: string;
  readonly weekStart: string;      // ISO date string (Monday)
  readonly days: readonly DayPlan[];
  readonly coachMessage: string;
  readonly reasoning: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
