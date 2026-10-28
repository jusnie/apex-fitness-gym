/**
 * Apple Health Service — Athletly V2
 *
 * Generic Apple Health integration that dynamically inventories ALL available
 * data types and syncs them to Supabase. The agent decides which data is
 * relevant — the app simply collects everything that is available.
 *
 * iOS only. Uses @kingstinct/react-native-healthkit.
 */

import { Platform } from 'react-native';
import {
  isHealthDataAvailable,
  requestAuthorization as hkRequestAuth,
  queryQuantitySamples,
  queryCategorySamples,
  queryWorkoutSamples,
  areObjectTypesAvailableAsync,
  type QuantitySample,
  type QuantityTypeIdentifier,
  type CategoryTypeIdentifier,
  type ObjectTypeIdentifier,
} from '@kingstinct/react-native-healthkit';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single health data record to be persisted. */
export interface HealthDataRecord {
  readonly data_type: string;
  readonly value: Record<string, unknown>;
  readonly source: string;
  readonly recorded_at: string;
}

/** Result of an inventory scan. */
export interface HealthInventory {
  readonly quantityTypes: readonly string[];
  readonly categoryTypes: readonly string[];
  readonly workoutAvailable: boolean;
}

/** Sync result summary. */
export interface SyncResult {
  readonly success: boolean;
  readonly recordsSynced: number;
  readonly errors: readonly string[];
  readonly syncedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER = 'apple_health';

/**
 * Comprehensive registry of ALL known HealthKit quantity type identifiers.
 * This list is intentionally exhaustive — the app inventories everything.
 * New HealthKit types only require adding the string here (no schema change).
 * The storage is fully generic (JSONB) so any new type is handled automatically.
 */
const ALL_QUANTITY_TYPES: readonly QuantityTypeIdentifier[] = [
  // Activity & Fitness
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
  'HKQuantityTypeIdentifierDistanceCycling',
  'HKQuantityTypeIdentifierDistanceSwimming',
  'HKQuantityTypeIdentifierDistanceWheelchair',
  'HKQuantityTypeIdentifierDistanceDownhillSnowSports',
  'HKQuantityTypeIdentifierDistanceCrossCountrySkiing',
  'HKQuantityTypeIdentifierDistancePaddleSports',
  'HKQuantityTypeIdentifierDistanceRowing',
  'HKQuantityTypeIdentifierDistanceSkatingSports',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
  'HKQuantityTypeIdentifierFlightsClimbed',
  'HKQuantityTypeIdentifierPushCount',
  'HKQuantityTypeIdentifierSwimmingStrokeCount',
  'HKQuantityTypeIdentifierNikeFuel',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKQuantityTypeIdentifierAppleMoveTime',
  'HKQuantityTypeIdentifierAppleStandTime',

  // Heart & Vitals
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierWalkingHeartRateAverage',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierHeartRateRecoveryOneMinute',
  'HKQuantityTypeIdentifierAtrialFibrillationBurden',
  'HKQuantityTypeIdentifierOxygenSaturation',
  'HKQuantityTypeIdentifierVO2Max',
  'HKQuantityTypeIdentifierRespiratoryRate',
  'HKQuantityTypeIdentifierBloodPressureSystolic',
  'HKQuantityTypeIdentifierBloodPressureDiastolic',
  'HKQuantityTypeIdentifierPeripheralPerfusionIndex',
  'HKQuantityTypeIdentifierBodyTemperature',
  'HKQuantityTypeIdentifierBasalBodyTemperature',
  'HKQuantityTypeIdentifierAppleSleepingWristTemperature',
  'HKQuantityTypeIdentifierAppleSleepingBreathingDisturbances',
  'HKQuantityTypeIdentifierBloodGlucose',
  'HKQuantityTypeIdentifierBloodKetones',
  'HKQuantityTypeIdentifierBloodAlcoholContent',
  'HKQuantityTypeIdentifierElectrodermalActivity',
  'HKQuantityTypeIdentifierInhalerUsage',
  'HKQuantityTypeIdentifierInsulinDelivery',

  // Body Measurements
  'HKQuantityTypeIdentifierBodyMassIndex',
  'HKQuantityTypeIdentifierBodyFatPercentage',
  'HKQuantityTypeIdentifierHeight',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierLeanBodyMass',
  'HKQuantityTypeIdentifierWaistCircumference',

  // Respiratory
  'HKQuantityTypeIdentifierForcedVitalCapacity',
  'HKQuantityTypeIdentifierForcedExpiratoryVolume1',
  'HKQuantityTypeIdentifierPeakExpiratoryFlowRate',

  // Mobility
  'HKQuantityTypeIdentifierAppleWalkingSteadiness',
  'HKQuantityTypeIdentifierSixMinuteWalkTestDistance',
  'HKQuantityTypeIdentifierWalkingSpeed',
  'HKQuantityTypeIdentifierWalkingStepLength',
  'HKQuantityTypeIdentifierWalkingAsymmetryPercentage',
  'HKQuantityTypeIdentifierWalkingDoubleSupportPercentage',
  'HKQuantityTypeIdentifierStairAscentSpeed',
  'HKQuantityTypeIdentifierStairDescentSpeed',

  // Running Metrics
  'HKQuantityTypeIdentifierRunningGroundContactTime',
  'HKQuantityTypeIdentifierRunningStrideLength',
  'HKQuantityTypeIdentifierRunningPower',
  'HKQuantityTypeIdentifierRunningVerticalOscillation',
  'HKQuantityTypeIdentifierRunningSpeed',

  // Cycling Metrics
  'HKQuantityTypeIdentifierCyclingSpeed',
  'HKQuantityTypeIdentifierCyclingPower',
  'HKQuantityTypeIdentifierCyclingFunctionalThresholdPower',
  'HKQuantityTypeIdentifierCyclingCadence',
  'HKQuantityTypeIdentifierCrossCountrySkiingSpeed',
  'HKQuantityTypeIdentifierPaddleSportsSpeed',
  'HKQuantityTypeIdentifierRowingSpeed',

  // Workout Effort
  'HKQuantityTypeIdentifierWorkoutEffortScore',
  'HKQuantityTypeIdentifierEstimatedWorkoutEffortScore',
  'HKQuantityTypeIdentifierPhysicalEffort',

  // Environment
  'HKQuantityTypeIdentifierUVExposure',
  'HKQuantityTypeIdentifierTimeInDaylight',
  'HKQuantityTypeIdentifierEnvironmentalAudioExposure',
  'HKQuantityTypeIdentifierHeadphoneAudioExposure',
  'HKQuantityTypeIdentifierEnvironmentalSoundReduction',
  'HKQuantityTypeIdentifierUnderwaterDepth',
  'HKQuantityTypeIdentifierWaterTemperature',

  // Nutrition
  'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  'HKQuantityTypeIdentifierDietaryProtein',
  'HKQuantityTypeIdentifierDietaryCarbohydrates',
  'HKQuantityTypeIdentifierDietaryFatTotal',
  'HKQuantityTypeIdentifierDietaryFatSaturated',
  'HKQuantityTypeIdentifierDietaryFatMonounsaturated',
  'HKQuantityTypeIdentifierDietaryFatPolyunsaturated',
  'HKQuantityTypeIdentifierDietaryCholesterol',
  'HKQuantityTypeIdentifierDietarySodium',
  'HKQuantityTypeIdentifierDietaryFiber',
  'HKQuantityTypeIdentifierDietarySugar',
  'HKQuantityTypeIdentifierDietaryWater',
  'HKQuantityTypeIdentifierDietaryCaffeine',
  'HKQuantityTypeIdentifierDietaryVitaminA',
  'HKQuantityTypeIdentifierDietaryVitaminB6',
  'HKQuantityTypeIdentifierDietaryVitaminB12',
  'HKQuantityTypeIdentifierDietaryVitaminC',
  'HKQuantityTypeIdentifierDietaryVitaminD',
  'HKQuantityTypeIdentifierDietaryVitaminE',
  'HKQuantityTypeIdentifierDietaryVitaminK',
  'HKQuantityTypeIdentifierDietaryCalcium',
  'HKQuantityTypeIdentifierDietaryIron',
  'HKQuantityTypeIdentifierDietaryThiamin',
  'HKQuantityTypeIdentifierDietaryRiboflavin',
  'HKQuantityTypeIdentifierDietaryNiacin',
  'HKQuantityTypeIdentifierDietaryFolate',
  'HKQuantityTypeIdentifierDietaryBiotin',
  'HKQuantityTypeIdentifierDietaryPantothenicAcid',
  'HKQuantityTypeIdentifierDietaryPhosphorus',
  'HKQuantityTypeIdentifierDietaryIodine',
  'HKQuantityTypeIdentifierDietaryMagnesium',
  'HKQuantityTypeIdentifierDietaryZinc',
  'HKQuantityTypeIdentifierDietarySelenium',
  'HKQuantityTypeIdentifierDietaryCopper',
  'HKQuantityTypeIdentifierDietaryManganese',
  'HKQuantityTypeIdentifierDietaryChromium',
  'HKQuantityTypeIdentifierDietaryMolybdenum',
  'HKQuantityTypeIdentifierDietaryChloride',
  'HKQuantityTypeIdentifierDietaryPotassium',

  // Other
  'HKQuantityTypeIdentifierNumberOfTimesFallen',
  'HKQuantityTypeIdentifierNumberOfAlcoholicBeverages',
] as const;

const ALL_CATEGORY_TYPES: readonly CategoryTypeIdentifier[] = [
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKCategoryTypeIdentifierAppleStandHour',
  'HKCategoryTypeIdentifierHighHeartRateEvent',
  'HKCategoryTypeIdentifierLowHeartRateEvent',
  'HKCategoryTypeIdentifierIrregularHeartRhythmEvent',
  'HKCategoryTypeIdentifierMindfulSession',
  'HKCategoryTypeIdentifierLowCardioFitnessEvent',
  'HKCategoryTypeIdentifierHeadphoneAudioExposureEvent',
  'HKCategoryTypeIdentifierEnvironmentalAudioExposureEvent',
  'HKCategoryTypeIdentifierAppleWalkingSteadinessEvent',
  'HKCategoryTypeIdentifierHandwashingEvent',
  'HKCategoryTypeIdentifierToothbrushingEvent',
  'HKCategoryTypeIdentifierSleepApneaEvent',
  // Symptoms
  'HKCategoryTypeIdentifierFatigue',
  'HKCategoryTypeIdentifierHeadache',
  'HKCategoryTypeIdentifierDizziness',
  'HKCategoryTypeIdentifierNausea',
  'HKCategoryTypeIdentifierShortnessOfBreath',
  'HKCategoryTypeIdentifierChestTightnessOrPain',
  'HKCategoryTypeIdentifierLowerBackPain',
  'HKCategoryTypeIdentifierMoodChanges',
  'HKCategoryTypeIdentifierSleepChanges',
  'HKCategoryTypeIdentifierCoughing',
  'HKCategoryTypeIdentifierFever',
  'HKCategoryTypeIdentifierGeneralizedBodyAche',
  // Reproductive
  'HKCategoryTypeIdentifierCervicalMucusQuality',
  'HKCategoryTypeIdentifierOvulationTestResult',
  'HKCategoryTypeIdentifierMenstrualFlow',
  'HKCategoryTypeIdentifierIntermenstrualBleeding',
  'HKCategoryTypeIdentifierSexualActivity',
  'HKCategoryTypeIdentifierContraceptive',
  'HKCategoryTypeIdentifierLactation',
  'HKCategoryTypeIdentifierPregnancy',
  'HKCategoryTypeIdentifierPregnancyTestResult',
  'HKCategoryTypeIdentifierProgesteroneTestResult',
] as const;

// ---------------------------------------------------------------------------
// Platform guard
// ---------------------------------------------------------------------------

function assertIOS(): void {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Health is only available on iOS.');
  }
}

// ---------------------------------------------------------------------------
// Initialization & Permissions
// ---------------------------------------------------------------------------

/**
 * Request read authorization for ALL known HealthKit data types.
 * Returns true when the permission dialog has been presented.
 * (HealthKit does not reveal whether individual types were actually granted.)
 */
export async function requestAuthorization(): Promise<boolean> {
  assertIOS();

  try {
    // Combine all types into a single toRead array
    const allReadTypes: readonly string[] = [
      ...ALL_QUANTITY_TYPES,
      ...ALL_CATEGORY_TYPES,
      'HKWorkoutTypeIdentifier',
    ];

    await hkRequestAuth({
      toRead: allReadTypes as QuantityTypeIdentifier[],
      toShare: [],
    });

    return true;
  } catch (err) {
    console.error('[appleHealth] Authorization failed:', err);
    return false;
  }
}

/**
 * Check whether HealthKit is available on this device.
 */
export function isAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;

  try {
    return isHealthDataAvailable();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Inventory — discover what data types actually have data
// ---------------------------------------------------------------------------

/**
 * Inventory which data types have data in the last 90 days.
 * Uses areObjectTypesAvailableAsync for a fast initial check, then probes
 * each available type with a limit-1 query.
 */
export async function inventoryAvailableTypes(): Promise<HealthInventory> {
  assertIOS();

  const since = daysAgo(90);
  const now = new Date();
  const dateFilter = { date: { startDate: since, endDate: now } };

  const availableQuantity: string[] = [];
  const availableCategory: string[] = [];

  // Check which object types exist on this device/OS version
  const allTypes: ObjectTypeIdentifier[] = [
    ...ALL_QUANTITY_TYPES,
    ...ALL_CATEGORY_TYPES,
    'HKWorkoutTypeIdentifier' as ObjectTypeIdentifier,
  ];
  const typeAvailability = await areObjectTypesAvailableAsync(allTypes);

  // Probe each available quantity type in parallel
  const quantityProbes = ALL_QUANTITY_TYPES
    .filter((t) => typeAvailability[t] !== false)
    .map(async (type) => {
      try {
        const samples = await queryQuantitySamples(type, {
          filter: dateFilter,
          limit: 1,
        });
        if (samples.length > 0) {
          availableQuantity.push(type);
        }
      } catch {
        // Type not available or not authorized — skip
      }
    });

  // Probe each available category type
  const categoryProbes = ALL_CATEGORY_TYPES
    .filter((t) => typeAvailability[t] !== false)
    .map(async (type) => {
      try {
        const samples = await queryCategorySamples(type, {
          filter: dateFilter,
          limit: 1,
        });
        if (samples.length > 0) {
          availableCategory.push(type);
        }
      } catch {
        // Skip
      }
    });

  await Promise.allSettled([...quantityProbes, ...categoryProbes]);

  // Workouts
  let workoutAvailable = false;
  if (typeAvailability['HKWorkoutTypeIdentifier'] !== false) {
    try {
      const workouts = await queryWorkoutSamples({
        filter: dateFilter,
        limit: 1,
      });
      workoutAvailable = workouts.length > 0;
    } catch {
      // Skip
    }
  }

  return {
    quantityTypes: [...availableQuantity],
    categoryTypes: [...availableCategory],
    workoutAvailable,
  };
}

// ---------------------------------------------------------------------------
// Sync — read ALL available data and persist to Supabase
// ---------------------------------------------------------------------------

/**
 * Full sync: reads data from all available types since `syncDays` ago
 * (default 7) and upserts into Supabase `health_data` table.
 */
export async function syncAllData(
  userId: string,
  syncDays: number = 7,
): Promise<SyncResult> {
  assertIOS();

  const since = daysAgo(syncDays);
  const now = new Date();
  const dateFilter = { date: { startDate: since, endDate: now } };
  const errors: string[] = [];
  const allRecords: HealthDataRecord[] = [];

  // 1. Inventory
  const inventory = await inventoryAvailableTypes();

  // 2. Fetch quantity samples
  const quantityFetches = inventory.quantityTypes.map(async (type) => {
    try {
      const samples = await queryQuantitySamples(
        type as QuantityTypeIdentifier,
        { filter: dateFilter, limit: 0 },
      );
      const records = samples.map((s) => quantitySampleToRecord(type, s));
      allRecords.push(...records);
    } catch (err) {
      errors.push(`quantity/${type}: ${String(err)}`);
    }
  });

  // 3. Fetch category samples
  const categoryFetches = inventory.categoryTypes.map(async (type) => {
    try {
      const samples = await queryCategorySamples(
        type as CategoryTypeIdentifier,
        { filter: dateFilter, limit: 0 },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = samples.map((s: any) => categorySampleToRecord(type, s));
      allRecords.push(...records);
    } catch (err) {
      errors.push(`category/${type}: ${String(err)}`);
    }
  });

  // 4. Fetch workouts
  const workoutFetch = inventory.workoutAvailable
    ? (async () => {
        try {
          const workouts = await queryWorkoutSamples({
            filter: dateFilter,
            limit: 0,
          });
          const records = workouts.map(workoutToRecord);
          allRecords.push(...records);
        } catch (err) {
          errors.push(`workouts: ${String(err)}`);
        }
      })()
    : Promise.resolve();

  await Promise.allSettled([...quantityFetches, ...categoryFetches, workoutFetch]);

  // 5. Persist to Supabase in batches
  const batchSize = 500;
  let synced = 0;

  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = allRecords.slice(i, i + batchSize);
    const rows = batch.map((r) => ({
      user_id: userId,
      provider: PROVIDER,
      data_type: r.data_type,
      value: r.value,
      source: r.source,
      recorded_at: r.recorded_at,
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('health_data')
      .upsert(rows, {
        onConflict: 'user_id,provider,data_type,recorded_at',
      });

    if (error) {
      errors.push(`upsert batch ${i}: ${error.message}`);
    } else {
      synced += batch.length;
    }
  }

  const syncedAt = new Date().toISOString();

  // 6. Update provider_tokens to track connection status
  await upsertProviderStatus(userId, syncedAt);

  return {
    success: errors.length === 0,
    recordsSynced: synced,
    errors,
    syncedAt,
  };
}

// ---------------------------------------------------------------------------
// Disconnect
// ---------------------------------------------------------------------------

/**
 * Remove the Apple Health connection record from Supabase.
 * (HealthKit permissions can only be revoked from the iOS Settings app.)
 */
export async function disconnect(userId: string): Promise<void> {
  const { error } = await supabase
    .from('provider_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', PROVIDER);

  if (error) {
    console.error('[appleHealth] Failed to remove provider record:', error.message);
    throw new Error('Verbindung konnte nicht getrennt werden.');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function dateToISO(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString();
}

function quantitySampleToRecord(
  dataType: string,
  sample: QuantitySample,
): HealthDataRecord {
  return {
    data_type: dataType,
    value: {
      quantity: sample.quantity,
      unit: sample.unit,
      startDate: dateToISO(sample.startDate),
      endDate: dateToISO(sample.endDate),
      metadata: sample.metadata ?? {},
    },
    source: sample.sourceRevision?.source?.name ?? PROVIDER,
    recorded_at: dateToISO(sample.startDate),
  };
}

function categorySampleToRecord(
  dataType: string,
  sample: { value: unknown; startDate: Date; endDate: Date; metadata?: Record<string, unknown>; sourceRevision?: { source?: { name?: string } } },
): HealthDataRecord {
  return {
    data_type: dataType,
    value: {
      value: sample.value,
      startDate: dateToISO(sample.startDate),
      endDate: dateToISO(sample.endDate),
      metadata: sample.metadata ?? {},
    },
    source: sample.sourceRevision?.source?.name ?? PROVIDER,
    recorded_at: dateToISO(sample.startDate),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function workoutToRecord(workout: any): HealthDataRecord {
  return {
    data_type: 'HKWorkout',
    value: {
      workoutActivityType: workout.workoutActivityType,
      duration: workout.duration,
      startDate: dateToISO(workout.startDate),
      endDate: dateToISO(workout.endDate),
      totalEnergyBurned: workout.totalEnergyBurned,
      totalDistance: workout.totalDistance,
      metadata: workout.metadata ?? {},
    },
    source: workout.sourceRevision?.source?.name ?? PROVIDER,
    recorded_at: dateToISO(workout.startDate),
  };
}

async function upsertProviderStatus(
  userId: string,
  syncedAt: string,
): Promise<void> {
  const { error } = await supabase
    .from('provider_tokens')
    .upsert(
      {
        user_id: userId,
        provider: PROVIDER,
        access_token: 'local',   // Apple Health has no OAuth token
        updated_at: syncedAt,
      },
      { onConflict: 'user_id,provider' },
    );

  if (error) {
    console.error('[appleHealth] Failed to upsert provider status:', error.message);
  }
}
