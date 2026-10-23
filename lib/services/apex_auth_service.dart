import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/apex_backend_config.dart';
import 'apex_cloud.dart';

/// Account operations for optional cloud backup, coaching, and community.
/// All calls throw a StateError when a local-only build has no cloud config.
class ApexAuthService {
  ApexAuthService._();

  static final instance = ApexAuthService._();

  User? get currentUser => ApexCloud.isReady ? ApexCloud.client.auth.currentUser : null;
  Stream<AuthState> get onAuthStateChange => _client.auth.onAuthStateChange;

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String displayName,
  }) {
    return _client.auth.signUp(
      email: email.trim(),
      password: password,
      emailRedirectTo: ApexBackendConfig.authRedirectUri,
      data: {'display_name': displayName.trim()},
    );
  }

  Future<AuthResponse> signIn({required String email, required String password}) {
    return _client.auth.signInWithPassword(email: email.trim(), password: password);
  }

  Future<void> sendPasswordRecovery(String email) {
    return _client.auth.resetPasswordForEmail(
      email.trim(),
      redirectTo: ApexBackendConfig.authRedirectUri,
    );
  }

  Future<void> signOut() => _client.auth.signOut();

  SupabaseClient get _client {
    if (!ApexCloud.isReady) {
      throw StateError('Accounts are not enabled in this build.');
    }
    return ApexCloud.client;
  }
}
