/// Application Build & Runtime Configuration
///
/// Never commit credentials here. Anything written into this file is compiled into
/// the shipped binary (it was previously committed as a plaintext password plus a
/// private LAN address). Pass them at build time instead:
///    flutter run --dart-define=NAVIDROME_URL="http://192.168.1.50:4533" \
///                --dart-define=NAVIDROME_USER="your_user" \
///                --dart-define=NAVIDROME_PASS="your_password"
class AppConfig {
  /// Navidrome server URL. Empty by default; the user enters it on the login screen.
  static const String defaultServerUrl = String.fromEnvironment('NAVIDROME_URL');

  /// Default username for auto-login. Empty by default.
  static const String defaultUsername = String.fromEnvironment('NAVIDROME_USER');

  /// Default password for auto-login. Empty by default - supply it through
  /// --dart-define at build time only.
  static const String defaultPassword = String.fromEnvironment('NAVIDROME_PASS');

  /// Automatically attempt connection on app startup without user interaction
  static const bool autoLoginOnStartup = true;

  /// Whether credentials are pre-configured in build
  static bool get hasPreconfiguredCredentials =>
      defaultUsername.isNotEmpty && defaultPassword.isNotEmpty;
}
