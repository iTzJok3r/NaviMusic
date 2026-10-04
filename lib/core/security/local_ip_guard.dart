import 'dart:io';

/// Exception thrown when a Desktop client attempts to connect to an unauthorized public IP/domain.
class PublicIpNotAllowedException implements Exception {
  final String host;
  final String reason;

  PublicIpNotAllowedException(this.host, [this.reason = 'Desktop app strictly forbids non-local/public connections.']);

  @override
  String toString() => 'PublicIpNotAllowedException: $reason (Host: $host)';
}

/// Security Guard enforcing Desktop Local-Only Policy.
class LocalIpGuard {
  /// Checks whether a given host or URL points strictly to a local private or loopback address.
  static bool isLocalAddress(String host) {
    final cleanHost = host.trim().toLowerCase();

    // Check loopback or localhost
    if (cleanHost == 'localhost' || cleanHost == '127.0.0.1' || cleanHost == '::1') {
      return true;
    }

    // Check mDNS .local
    if (cleanHost.endsWith('.local')) {
      return true;
    }

    // Try parsing as IP address
    final ip = InternetAddress.tryParse(cleanHost);
    if (ip != null) {
      if (ip.isLoopback || ip.isLinkLocal) {
        return true;
      }
      return _isPrivateIpv4(ip);
    }

    // Hostnames that resolve to public domains are disallowed for desktop local-only mode
    return false;
  }

  /// Verifies if an IPv4 address falls within standard RFC 1918 private subnets.
  static bool _isPrivateIpv4(InternetAddress address) {
    if (address.type != InternetAddressType.IPv4) {
      return false;
    }

    final raw = address.rawAddress;
    final b0 = raw[0];
    final b1 = raw[1];

    // 10.0.0.0/8
    if (b0 == 10) return true;

    // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
    if (b0 == 172 && b1 >= 16 && b1 <= 31) return true;

    // 192.168.0.0/16
    if (b0 == 192 && b1 == 168) return true;

    return false;
  }

  /// Validates a target URI for desktop. Throws [PublicIpNotAllowedException] if public.
  static void validateDesktopEndpoint(Uri uri) {
    final host = uri.host;
    if (!isLocalAddress(host)) {
      throw PublicIpNotAllowedException(
        host,
        'Desktop client is hardened: connection to non-local host "$host" is blocked by policy.',
      );
    }
  }
}
