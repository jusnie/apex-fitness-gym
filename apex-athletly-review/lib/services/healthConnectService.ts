/**
 * Health Connect Service — Athletly V2
 *
 * Generic Android Health Connect integration that dynamically inventories ALL
 * available data types and syncs them to Supabase. The agent decides which
 * data is relevant — the app simply collects everything that is available.
 *
 * Android only. Uses react-native-health-connect.
 */

import { Platform } from 'react-native';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  getGrantedPermissions,
  revokeAllPermissions,
  SdkAvailabilityStatus,
  type RecordType,
  type Permission,
  type ReadRecordsOptions,
} from 'react-native-health-connect';
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
export interface HealthConnectInventory {
  readonly availableTypes: readonly string[];
  readonly totalTypesScanned: number;
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

const PROVIDER = 'health_connect';

/**
 * All known Health Connect record types.
 * This list is derived from the HealthConnectRecord union type.
 * New types added to the SDK will be picked up when this list is updated,
 * but the storage is fully generic (JSONB) so no schema change is needed.
 */
const ALL_RECORD_TYPES: readonly RecordType[] = [
  'ActiveCaloriesBurned',
  'BasalBodyTemperature',
  'BasalMetabolicRate',
  'BloodGlucose',
  'BloodPressure',
  'BodyFat',
  'BodyTemperature',
  'BodyWaterMass',
  'BoneMass',
  'CervicalMucus',
  'CyclingPedalingCadence',
  'ElevationGained',
  'ExerciseSession',
  'FloorsClimbed',
  'HeartRate',
  'RestingHeartRate',
  'Steps',
  'StepsCadence',
  'Distance',
  'Height',
  'Hydration',
  'HeartRateVariabilityRmssd',
  'SexualActivity',
  'Weight',
  'Nutrition',
  'LeanBodyMass',
  'IntermenstrualBleeding',
  'Speed',
  'MenstruationFlow',
  'MenstruationPeriod',
  'SleepSession',
  'RespiratoryRate',
  'WheelchairPushes',
  'Vo2Max',
  'OvulationTest',
  'TotalCaloriesBurned',
  'OxygenSaturation',
  'Power',
] as const;

// ---------------------------------------------------------------------------
// Platform guard
// ---------------------------------------------------------------------------

function assertAndroid(): void {
  if (Platform.OS !== 'android') {
    throw new Error('Health Connect is only available on Android.');
  }
}

// ---------------------------------------------------------------------------
// Initialization & Permissions
// ---------------------------------------------------------------------------

/**
 * Check whether Health Connect SDK is available on this device.
 */
export async function isAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

/**
 * Initialize the Health Connect SDK. Must be called before any other operation.
 * Returns true when initialization succeeds.
 */
export async function initializeSdk(): Promise<boolean> {
  assertAndroid();

  try {
    const result = await initialize();
    return result;
  } catch (err) {
    console.error('[healthConnect] Initialization failed:', err);
    return false;
  }
}

/**
 * Request read permissions for ALL known Health Connect record types.
 * Returns the list of granted permissions.
 */
export async function requestAuthorization(): Promise<readonly Permission[]> {
  assertAndroid();

  try {
    const permissions: Permission[] = ALL_RECORD_TYPES.map((recordType) => ({
      accessType: 'read' as const,
      recordType,
    }));

    const granted = await requestPermission(permissions);
    return granted as Permission[];
  } catch (err) {
    console.error('[healthConnect] Authorization failed:', err);
    return [];
  }
}

/**
 * Get currently granted permissions.
 */
export async function getPermissions(): Promise<readonly Permission[]> {
  assertAndroid();

  try {
    const granted = await getGrantedPermissions();
    return granted as Permission[];
  } catch (err) {
    console.error('[healthConnect] Failed to get permissions:', err);
    return [];
  }
}

/**
 * Check if any read permissions are currently granted.
 */
export async function hasPermissions(): Promise<boolean> {
  const permissions = await getPermissions();
  return permissions.some(
    (p) => 'accessType' in p && p.accessType === 'read',
  );
}

// ---------------------------------------------------------------------------
// Inventory — discover what record types actually have data
// ---------------------------------------------------------------------------

/**
 * Inventory which record types have data in the last 90 days.
 * Types the user has not granted access to will return empty results
 * and are excluded from the inventory.
 */
export async function inventoryAvailableTypes(): Promise<HealthConnectInventory> {
  assertAndroid();

  const since = daysAgo(90);
  const now = new Date();
  const availableTypes: string[] = [];

  const timeRangeFilter: ReadRecordsOptions['timeRangeFilter'] = {
    operator: 'between',
    startTime: since.toISOString(),
    endTime: now.toISOString(),
  };

  const probes = ALL_RECORD_TYPES.map(async (recordType) => {
    try {
      const result = await readRecords(recordType, {
        timeRangeFilter,
        pageSize: 1,
      });
      if (result.records.length > 0) {
        availableTypes.push(recordType);
      }
    } catch {
      // Type not available or not authorized — skip
    }
  });

  await Promise.allSettled(probes);

  return {
    availableTypes: [...availableTypes],
    totalTypesScanned: ALL_RECORD_TYPES.length,
  };
}

// ---------------------------------------------------------------------------
// Sync — read ALL available data and persist to Supabase
// ---------------------------------------------------------------------------

/**
 * Full sync: reads data from all available types since `syncDays` ago
 * and upserts into Supabase `health_data` table.
 */
export async function syncAllData(
  userId: string,
  syncDays: number = 7,
): Promise<SyncResult> {
  assertAndroid();

  const since = daysAgo(syncDays);
  const now = new Date();
  const errors: string[] = [];
  const allRecords: HealthDataRecord[] = [];

  // 1. Inventory
  const inventory = await inventoryAvailableTypes();

  // 2. Fetch records for each available type
  const timeRangeFilter: ReadRecordsOptions['timeRangeFilter'] = {
    operator: 'between',
    startTime: since.toISOString(),
    endTime: now.toISOString(),
  };

  const fetches = inventory.availableTypes.map(async (recordType) => {
    try {
      const typedRecordType = recordType as RecordType;
      let pageToken: string | undefined;

      do {
        const result = await readRecords(typedRecordType, {
          timeRangeFilter,
          pageSize: 1000,
          pageToken,
        });

        const records = result.records.map((record) =>
          recordResultToDataRecord(recordType, record as Record<string, unknown>),
        );
        allRecords.push(...records);

        pageToken = result.pageToken;
      } while (pageToken);
    } catch (err) {
      errors.push(`${recordType}: ${String(err)}`);
    }
  });

  await Promise.allSettled(fetches);

  // 3. Persist to Supabase in batches
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

  // 4. Update provider_tokens to track connection status
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
 * Revoke Health Connect permissions and remove the connection record
 * from Supabase.
 */
export async function disconnect(userId: string): Promise<void> {
  try {
    await revokeAllPermissions();
  } catch (err) {
    console.error('[healthConnect] Failed to revoke permissions:', err);
  }

  const { error } = await supabase
    .from('provider_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', PROVIDER);

  if (error) {
    console.error('[healthConnect] Failed to remove provider record:', error.message);
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

/**
 * Convert any Health Connect record result into a generic HealthDataRecord.
 * RecordResult<T> omits `recordType`, so we accept a generic object and
 * store the data_type from the caller. All fields become the JSONB `value`.
 */
function recordResultToDataRecord(
  dataType: string,
  record: Record<string, unknown>,
): HealthDataRecord {
  // Determine the recorded_at timestamp from the record.
  // IntervalRecords have startTime, InstantaneousRecords have time.
  const recordedAt =
    typeof record.startTime === 'string'
      ? record.startTime
      : typeof record.time === 'string'
        ? record.time
        : new Date().toISOString();

  // Determine source from metadata if available
  const metadata = record.metadata as Record<string, unknown> | undefined;
  const source =
    (metadata?.dataOrigin as string | undefined) ?? PROVIDER;

  return {
    data_type: dataType,
    value: record,
    source,
    recorded_at: recordedAt,
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
        access_token: 'local',   // Health Connect has no OAuth token
        updated_at: syncedAt,
      },
      { onConflict: 'user_id,provider' },
    );

  if (error) {
    console.error('[healthConnect] Failed to upsert provider status:', error.message);
  }
}
