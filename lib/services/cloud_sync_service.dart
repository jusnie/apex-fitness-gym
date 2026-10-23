import 'package:supabase_flutter/supabase_flutter.dart';

import 'apex_cloud.dart';

/// The collections mirror the local-first app's persisted model. A collection
/// is synced only after the user enables an Apex account and cloud sync.
enum SyncCollection {
  profile,
  exercise,
  routine,
  session,
  measurement,
  note,
  nutrition,
  place,
  progressShot,
  setting;

  String get wireName => switch (this) {
        SyncCollection.progressShot => 'progress_shot',
        _ => name,
      };
}

class CloudDocument {
  const CloudDocument({
    required this.collection,
    required this.entityId,
    required this.payload,
    required this.version,
    required this.updatedAt,
    this.deletedAt,
  });

  final SyncCollection collection;
  final String entityId;
  final Map<String, dynamic> payload;
  final int version;
  final DateTime updatedAt;
  final DateTime? deletedAt;

  factory CloudDocument.fromMap(Map<String, dynamic> row) {
    final collection = SyncCollection.values.firstWhere(
      (value) => value.wireName == row['collection'],
      orElse: () => throw FormatException('Unknown sync collection: ${row['collection']}'),
    );
    return CloudDocument(
      collection: collection,
      entityId: row['entity_id'] as String,
      payload: Map<String, dynamic>.from((row['payload'] as Map?) ?? const {}),
      version: (row['version'] as num).toInt(),
      updatedAt: DateTime.parse(row['updated_at'] as String).toLocal(),
      deletedAt: row['deleted_at'] == null ? null : DateTime.parse(row['deleted_at'] as String).toLocal(),
    );
  }
}

/// Compare-and-swap sync API. It avoids a stale offline device silently
/// overwriting a newer cloud document: callers receive a Postgres 40001
/// conflict and can present a merge choice instead.
class CloudSyncService {
  CloudSyncService._();

  static final instance = CloudSyncService._();

  bool get isAvailable => ApexCloud.isReady && ApexCloud.client.auth.currentUser != null;

  Future<int> write({
    required SyncCollection collection,
    required String entityId,
    required Map<String, dynamic> payload,
    required int expectedVersion,
    required String deviceId,
    DateTime? deletedAt,
  }) async {
    final args = <String, dynamic>{
      'p_collection': collection.wireName,
      'p_entity_id': entityId,
      'p_payload': payload,
      'p_expected_version': expectedVersion,
      'p_device_id': deviceId,
      if (deletedAt != null) 'p_deleted_at': deletedAt.toUtc().toIso8601String(),
    };
    final result = await _client.rpc('apex_write_sync_document', params: args);
    if (result is num) return result.toInt();
    return int.parse(result.toString());
  }

  Future<List<CloudDocument>> pull({DateTime? changedAfter}) async {
    final query = _client.from('sync_documents').select();
    if (changedAfter != null) {
      query.gt('updated_at', changedAfter.toUtc().toIso8601String());
    }
    final rows = await query.order('updated_at', ascending: true);
    return (rows as List)
        .map((row) => CloudDocument.fromMap(Map<String, dynamic>.from(row as Map)))
        .toList(growable: false);
  }

  Future<void> registerDevice({required String deviceId, String? displayName}) async {
    await _client.from('user_devices').upsert({
      'user_id': _userId,
      'device_id': deviceId,
      'display_name': displayName,
      'last_seen_at': DateTime.now().toUtc().toIso8601String(),
    }, onConflict: 'user_id,device_id');
  }

  SupabaseClient get _client {
    if (!isAvailable) {
      throw StateError('Sign in and enable Apex Cloud before syncing.');
    }
    return ApexCloud.client;
  }

  String get _userId => _client.auth.currentUser!.id;
}
