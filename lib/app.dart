import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api/subsonic_client.dart';
import 'core/config/app_config.dart';
import 'core/network/endpoint_model.dart';
import 'features/auth/login_screen.dart';
import 'features/browse/library_view.dart';
import 'shared/providers.dart';
import 'shared/theme/app_theme.dart';

class NavidromeApp extends ConsumerStatefulWidget {
  const NavidromeApp({super.key});

  @override
  ConsumerState<NavidromeApp> createState() => _NavidromeAppState();
}

class _NavidromeAppState extends ConsumerState<NavidromeApp> {
  bool _isCheckingAutoLogin = true;

  @override
  void initState() {
    super.initState();
    _performAutoLoginCheck();
  }

  Future<void> _performAutoLoginCheck() async {
    try {
      // Auto-login only happens with build-time credentials.
      //
      // The previous version also tried to auto-login from secure storage, but the
      // Subsonic 1.13+ token flow needs the password to derive a fresh salt+hash on
      // every launch, and the password is deliberately never stored. The old check
      // treated the stored (always empty) token as proof of a usable session, so it
      // ran with an empty password, failed, and fell through to the login screen
      // anyway - just with a wasted round trip.
      if (!AppConfig.hasPreconfiguredCredentials) return;

      final storage = ref.read(secureStorageProvider);
      final isDesktop = ref.read(isDesktopProvider);
      final savedCreds = await storage.getCredentials();

      final username = AppConfig.defaultUsername;
      final password = AppConfig.defaultPassword;
      final serverUrl = savedCreds['serverUrl'] ?? AppConfig.defaultServerUrl;

      if (username.isNotEmpty && password.isNotEmpty && serverUrl.isNotEmpty) {
        final endpoint = NavidromeEndpoint(
          id: 'default_server',
          name: 'Home Navidrome',
          baseUrl: serverUrl,
          type: EndpointType.local,
          verifyCert: false,
        );

        final client = SubsonicClient(
          endpoint: endpoint,
          username: username,
          password: password,
          isDesktop: isDesktop,
        );

        final ok = await client.ping();
        if (ok) {
          await storage.saveCredentials(
            username: username,
            serverUrl: serverUrl,
            token: '',
            salt: '',
          );
          ref.read(endpointManagerProvider).registerEndpoint(endpoint);
          ref.read(endpointManagerProvider).setActiveEndpoint(endpoint);
          ref.read(subsonicClientProvider.notifier).state = client;
        }
      }
    } catch (_) {
      // In case of network change or invalid token, fall back to login screen
    } finally {
      if (mounted) {
        setState(() => _isCheckingAutoLogin = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final client = ref.watch(subsonicClientProvider);

    return MaterialApp(
      title: 'Navidrome Player',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      home: _isCheckingAutoLogin
          ? const Scaffold(
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.graphic_eq_rounded, size: 72, color: Color(0xFF1DB954)),
                    SizedBox(height: 24),
                    CircularProgressIndicator(strokeWidth: 3),
                    SizedBox(height: 16),
                    Text('Connecting to Navidrome...', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            )
          : (client == null ? const LoginScreen() : const LibraryView()),
    );
  }
}
