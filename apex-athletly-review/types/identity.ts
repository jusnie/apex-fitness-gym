/**
 * Identity types - Athletly V2
 *
 * Shape returned by `GET /profile/identity`. Powers the
 * "Wie Athletly dich sieht" settings screen which shows what the AI
 * coach has learned about the athlete, broken into 7 canonical sections
 * plus a structured profile block.
 */

export interface IdentitySection {
  readonly key: string;
  readonly title: string;
  readonly body: string;
  readonly is_empty: boolean;
}

export interface IdentityFitness {
  readonly vo2max_estimate: number | null;
  readonly threshold_pace_min_km: number | null;
  readonly weekly_volume_km: number | null;
  readonly ftp_watts: number | null;
}

export interface IdentityGoal {
  readonly event: string | null;
  readonly target_date: string | null;
  readonly target_time: string | null;
}

export interface IdentityStructured {
  readonly sports: readonly string[];
  readonly training_days_per_week: number | null;
  readonly max_session_minutes: number | null;
  readonly fitness: IdentityFitness;
  readonly goal: IdentityGoal;
}

export interface IdentityResponse {
  readonly athlete_name: string | null;
  readonly sections: readonly IdentitySection[];
  readonly structured: IdentityStructured;
  readonly last_updated_at: string | null;
}
