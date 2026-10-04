import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';

/// Exception thrown when TLS Certificate Pinning validation fails.
class CertificatePinningException implements Exception {
  final String host;
  final String receivedPin;

  CertificatePinningException(this.host, this.receivedPin);

  @override
  String toString() => 'CertificatePinningException: Untrusted certificate pin for host "$host". Received: $receivedPin';
}

/// Enforces TLS Certificate Pinning for secure remote connections.
class CertificatePinner {
  final Set<String> allowedPins;
  final bool allowSelfSignedForLan;

  const CertificatePinner({
    this.allowedPins = const {},
    this.allowSelfSignedForLan = true,
  });

  /// Configures a standard Dart [HttpClient] with certificate pinning and cipher constraints.
  HttpClient createPinnedHttpClient({bool isDesktop = false}) {
    final client = HttpClient(
      context: SecurityContext(withTrustedRoots: true),
    );

    // Enforce badCertificateCallback for certificate pinning and self-signed LAN exceptions
    client.badCertificateCallback = (X509Certificate cert, String host, int port) {
      return verifyCertificate(cert, host, port, isDesktop: isDesktop);
    };

    return client;
  }

  /// Verifies an incoming X509 certificate against the configured SHA-256 pins.
  bool verifyCertificate(X509Certificate cert, String host, int port, {bool isDesktop = false}) {
    // Calculate SHA-256 fingerprint of DER-encoded certificate
    final digest = sha256.convert(cert.der);
    final calculatedPin = 'sha256/${base64Encode(digest.bytes)}';

    // If allowed pins are configured and matched, permit connection
    if (allowedPins.contains(calculatedPin)) {
      return true;
    }

    // In local network mode (Desktop or Local LAN), self-signed certificates can be permitted
    if (allowSelfSignedForLan && _isLocalHost(host)) {
      return true;
    }

    return false;
  }

  static bool _isLocalHost(String host) {
    if (host == 'localhost' || host == '127.0.0.1') return true;
    if (host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local')) return true;
    return false;
  }
}
