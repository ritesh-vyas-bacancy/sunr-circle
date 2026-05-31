/// App configuration from --dart-define-from-file at build time.
/// All values are read at compile time and cannot change at runtime.
class AppConfig {
  const AppConfig._();

  static const String supabaseUrl =
      String.fromEnvironment('SUPABASE_URL');

  static const String supabaseAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY');

  static const String environment =
      String.fromEnvironment('ENVIRONMENT', defaultValue: 'development');

  static const String appVersion =
      String.fromEnvironment('APP_VERSION', defaultValue: '1.0.0');

  static const String supportEmail =
      String.fromEnvironment('SUPPORT_EMAIL', defaultValue: 'support@sunrcircle.in');

  static bool get isProduction => environment == 'production';
  static bool get isDevelopment => environment == 'development';
}
