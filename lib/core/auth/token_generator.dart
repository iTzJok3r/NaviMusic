import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

/// Subsonic Token Authentication Generator implementing the Subsonic 1.13.0+ protocol.
///
/// Password is NEVER transmitted over the wire. Instead:
/// token = md5(password + salt)
class SubsonicAuthToken {
  final String username;
  final String token;
  final String salt;
  final String clientName;
  final String apiVersion;
  final DateTime createdAt;

  const SubsonicAuthToken({
    required this.username,
    required this.token,
    required this.salt,
    this.clientName = 'NavidromeMobileDesktop',
    this.apiVersion = '1.16.1',
    required this.createdAt,
  });

  /// Generates a cryptographic random salt and calculates the MD5 token.
  factory SubsonicAuthToken.generate({
    required String username,
    required String password,
    String clientName = 'NavidromeMobileDesktop',
    String apiVersion = '1.16.1',
  }) {
    final salt = _generateSecureSalt(16);
    final combined = utf8.encode('$password$salt');
    final digest = md5.convert(combined);
    final token = digest.toString();

    return SubsonicAuthToken(
      username: username,
      token: token,
      salt: salt,
      clientName: clientName,
      apiVersion: apiVersion,
      createdAt: DateTime.now(),
    );
  }

  /// Converts authentication parameters into Subsonic query map.
  Map<String, String> toQueryParameters() {
    return {
      'u': username,
      't': token,
      's': salt,
      'v': apiVersion,
      'c': clientName,
      'f': 'json',
    };
  }

  /// Helper to generate random alphanumeric salt.
  static String _generateSecureSalt(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random.secure();
    return List.generate(length, (index) => chars[random.nextInt(chars.length)]).join();
  }

  /// Checks if token has exceeded the maximum session lifetime (e.g. 1 hour).
  bool isExpired([Duration maxAge = const Duration(hours: 1)]) {
    return DateTime.now().difference(createdAt) > maxAge;
  }
}
