import 'dart:io';
import '../lib/core/security/local_ip_guard.dart';

void main() {
  stdout.writeln('=== RUNNING SECURITY TESTS: LocalIpGuard ===');

  // Test 1: Loopback & Localhost
  assert(LocalIpGuard.isLocalAddress('localhost') == true, 'localhost must be local');
  assert(LocalIpGuard.isLocalAddress('127.0.0.1') == true, '127.0.0.1 must be local');
  assert(LocalIpGuard.isLocalAddress('::1') == true, '::1 must be local');
  stdout.writeln('✔ Loopback and localhost addresses allowed');

  // Test 2: RFC 1918 Private Ranges
  assert(LocalIpGuard.isLocalAddress('192.168.1.100') == true, '192.168.x.x must be local');
  assert(LocalIpGuard.isLocalAddress('10.0.0.1') == true, '10.x.x.x must be local');
  assert(LocalIpGuard.isLocalAddress('172.16.0.5') == true, '172.16.x.x must be local');
  assert(LocalIpGuard.isLocalAddress('172.31.255.254') == true, '172.31.x.x must be local');
  assert(LocalIpGuard.isLocalAddress('navidrome.local') == true, 'mDNS .local must be local');
  stdout.writeln('✔ Private subnets and mDNS addresses allowed');

  // Test 3: Public IPs and Domains MUST be blocked
  assert(LocalIpGuard.isLocalAddress('8.8.8.8') == false, '8.8.8.8 must NOT be local');
  assert(LocalIpGuard.isLocalAddress('1.1.1.1') == false, '1.1.1.1 must NOT be local');
  assert(LocalIpGuard.isLocalAddress('music.navidrome.org') == false, 'Public domains must NOT be local');
  stdout.writeln('✔ Public IP addresses and external domain names correctly blocked');

  // Test 4: validateDesktopEndpoint throws exception on public URI
  bool threwException = false;
  try {
    LocalIpGuard.validateDesktopEndpoint(Uri.parse('https://music.publicserver.com'));
  } on PublicIpNotAllowedException {
    threwException = true;
  }
  assert(threwException, 'Desktop guard must throw PublicIpNotAllowedException for public endpoints');
  stdout.writeln('✔ Desktop validation strictly blocks public URI');

  stdout.writeln('=== ALL LOCAL IP GUARD TESTS PASSED! ===');
}
