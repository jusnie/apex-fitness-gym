import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/apex_backend_config.dart';

/// Boots the optional cloud layer without compromising the local-only app.
///
/// A missing build-time configuration deliberately leaves the local workout
/// tracker running. The app must never require a network connection to open,
/// log a set, or complete a workout.
class ApexCloud {
  ApexCloud._();

  static var _ready = false;

  static bool get isReady => _ready;
  static bool get isConfigured => ApexBackendConfig.isConfigured;

  static SupabaseClient get client {
    if (!_ready) {
      throw StateError('Apex cloud is not configured for this build.');
    }
    return Supabase.instance.client;
  }

  static Future<void> initialize() async {
    if (!ApexBackendConfig.isConfigured || _ready) return;
    try {
      await Supabase.initialize(
        url: ApexBackendConfig.supabaseUrl,
        publishableKey: ApexBackendConfig.publishableKey,
        authOptions: const FlutterAuthClientOptions(authFlowType: AuthFlowType.pkce),
      );
      _ready = true;
    } catch (error) {
      // Invalid or absent cloud settings must not break a local workout log.
      debugPrint('Apex cloud is unavailable: $error');
    }
  }
}
