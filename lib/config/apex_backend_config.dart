/// Build-time configuration for the optional Apex cloud.
///
/// Keep credentials out of source control. Local-only mode stays fully usable
/// when these values are omitted.
class ApexBackendConfig {
  ApexBackendConfig._();

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const publishableKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
  static const authRedirectUri = 'apexfitness://auth-callback';

  static bool get isConfigured {
    final uri = Uri.tryParse(supabaseUrl);
    return uri != null && uri.hasScheme && uri.host.isNotEmpty && publishableKey.isNotEmpty;
  }
}
