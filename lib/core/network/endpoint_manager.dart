import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import '../security/local_ip_guard.dart';
import '../security/certificate_pinner.dart';
import 'endpoint_model.dart';

/// Manages dual endpoint switching (Mobile) and strict local network enforcement (Desktop).
class EndpointManager {
  final List<NavidromeEndpoint> _endpoints = [];
  NavidromeEndpoint? _activeEndpoint;
  final bool isDesktop;

  EndpointManager({bool? isDesktopOverride})
      : isDesktop = isDesktopOverride ?? (Platform.isWindows || Platform.isMacOS || Platform.isLinux);

  List<NavidromeEndpoint> get endpoints => List.unmodifiable(_endpoints);
  NavidromeEndpoint? get activeEndpoint => _activeEndpoint;

  /// Registers an endpoint, applying desktop hardening rules if running on Desktop.
  void registerEndpoint(NavidromeEndpoint endpoint) {
    if (isDesktop) {
      // Reject any non-local endpoint immediately on desktop platforms
      LocalIpGuard.validateDesktopEndpoint(endpoint.uri);
    }
    _endpoints.removeWhere((e) => e.id == endpoint.id);
    _endpoints.add(endpoint);
    _endpoints.sort((a, b) => a.priority.compareTo(b.priority));
  }

  /// Sets active endpoint directly after validation.
  void setActiveEndpoint(NavidromeEndpoint endpoint) {
    if (isDesktop) {
      LocalIpGuard.validateDesktopEndpoint(endpoint.uri);
    }
    _activeEndpoint = endpoint;
  }

  /// Automatically selects the best available endpoint based on connectivity and latency.
  Future<NavidromeEndpoint?> selectBestEndpoint() async {
    for (final ep in _endpoints) {
      final isHealthy = await testConnection(ep);
      if (isHealthy) {
        _activeEndpoint = ep;
        return ep;
      }
    }
    return null;
  }

  /// Probes endpoint health using a lightweight Subsonic ping probe.
  Future<bool> testConnection(NavidromeEndpoint endpoint, {Duration timeout = const Duration(seconds: 4)}) async {
    try {
      if (isDesktop && endpoint.type == EndpointType.remote) {
        return false;
      }

      final dio = Dio(
        BaseOptions(
          baseUrl: endpoint.baseUrl,
          connectTimeout: timeout,
          receiveTimeout: timeout,
        ),
      );

      // Setup custom certificate pinning if pins are configured
      if (endpoint.pinSha256 != null && dio.httpClientAdapter is IOHttpClientAdapter) {
        final pinner = CertificatePinner(
          allowedPins: {endpoint.pinSha256!},
          allowSelfSignedForLan: !endpoint.verifyCert,
        );
        (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
          return pinner.createPinnedHttpClient(isDesktop: isDesktop);
        };
      }

      final response = await dio.get('/rest/ping.view', queryParameters: {'f': 'json', 'v': '1.16.1', 'c': 'NavidromeProbe'});
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Placeholder for mDNS / Bonjour local LAN service discovery (_navidrome._tcp.local).
  Future<List<NavidromeEndpoint>> discoverLocalEndpoints() async {
    // In production, integration with package:multicast_dns / mDNS
    return _endpoints.where((e) => e.type == EndpointType.local).toList();
  }
}
