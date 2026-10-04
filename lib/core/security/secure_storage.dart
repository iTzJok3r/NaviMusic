import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure Storage vault wrapping platform-native keystores:
/// - iOS/macOS: Keychain Services
/// - Android: Keystore + EncryptedSharedPreferences
/// - Windows: Windows Data Protection API (DPAPI)
/// - Linux: libsecret / Keyring
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(
            encryptedSharedPreferences: true,
          ),
          iOptions: IOSOptions(
            accessibility: KeychainAccessibility.unlocked_this_device,
          ),
          mOptions: MacOsOptions(
            accessibility: KeychainAccessibility.unlocked_this_device,
          ),
        );

  static const String _keyUsername = 'navidrome_user';
  static const String _keyServerUrl = 'navidrome_server_url';
  static const String _keyToken = 'navidrome_auth_token';
  static const String _keySalt = 'navidrome_auth_salt';
  static const String _keyCertPins = 'navidrome_cert_pins';
  static const String _keyLastAuth = 'navidrome_last_auth';

  Future<void> saveCredentials({
    required String username,
    required String serverUrl,
    required String token,
    required String salt,
    List<String>? certPins,
  }) async {
    await _storage.write(key: _keyUsername, value: username);
    await _storage.write(key: _keyServerUrl, value: serverUrl);
    await _storage.write(key: _keyToken, value: token);
    await _storage.write(key: _keySalt, value: salt);
    if (certPins != null && certPins.isNotEmpty) {
      await _storage.write(key: _keyCertPins, value: certPins.join(','));
    }
    await _storage.write(
      key: _keyLastAuth,
      value: DateTime.now().toIso8601String(),
    );
  }

  Future<Map<String, String?>> getCredentials() async {
    return {
      'username': await _storage.read(key: _keyUsername),
      'serverUrl': await _storage.read(key: _keyServerUrl),
      'token': await _storage.read(key: _keyToken),
      'salt': await _storage.read(key: _keySalt),
      'certPins': await _storage.read(key: _keyCertPins),
      'lastAuth': await _storage.read(key: _keyLastAuth),
    };
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
