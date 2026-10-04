import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/app_config.dart';
import '../../core/api/subsonic_client.dart';
import '../../core/network/endpoint_model.dart';
import '../../core/security/local_ip_guard.dart';
import '../../shared/providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _urlController;
  late final TextEditingController _usernameController;
  late final TextEditingController _passwordController;
  final _pinController = TextEditingController();

  EndpointType _endpointType = EndpointType.local;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: AppConfig.defaultServerUrl);
    _usernameController = TextEditingController(text: AppConfig.defaultUsername);
    _passwordController = TextEditingController(text: AppConfig.defaultPassword);
  }

  @override
  void dispose() {
    _urlController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _handleConnect() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final isDesktop = ref.read(isDesktopProvider);
    final url = _urlController.text.trim();
    final uri = Uri.tryParse(url);

    if (uri == null || !uri.hasScheme || !uri.hasAuthority) {
      setState(() {
        _errorMessage = 'Invalid URL format. Please include http:// or https://';
        _isLoading = false;
      });
      return;
    }

    if (isDesktop) {
      try {
        LocalIpGuard.validateDesktopEndpoint(uri);
      } catch (e) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
        return;
      }
    }

    final endpoint = NavidromeEndpoint(
      id: 'active_server',
      name: isDesktop ? 'Local Navidrome' : (_endpointType == EndpointType.remote ? 'Cloud Navidrome' : 'LAN Navidrome'),
      baseUrl: url,
      type: _endpointType,
      pinSha256: _pinController.text.trim().isNotEmpty ? _pinController.text.trim() : null,
      verifyCert: _endpointType == EndpointType.remote,
    );

    try {
      final client = SubsonicClient(
        endpoint: endpoint,
        username: _usernameController.text.trim(),
        password: _passwordController.text.trim(),
        isDesktop: isDesktop,
      );

      final pingSuccess = await client.ping();
      if (pingSuccess) {
        await ref.read(secureStorageProvider).saveCredentials(
              username: _usernameController.text.trim(),
              serverUrl: url,
              token: '',
              salt: '',
            );
        ref.read(endpointManagerProvider).registerEndpoint(endpoint);
        ref.read(endpointManagerProvider).setActiveEndpoint(endpoint);
        ref.read(subsonicClientProvider.notifier).state = client;
      } else {
        setState(() => _errorMessage = 'Server replied with error or unauthenticated status.');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Connection failed: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = ref.watch(isDesktopProvider);

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Icon(Icons.album_rounded, size: 64, color: Color(0xFF1DB954)),
                      const SizedBox(height: 16),
                      Text(
                        'Connect to Navidrome',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isDesktop
                            ? '🔒 Desktop Hardened Mode: Local LAN Connections Only'
                            : 'Mobile Mode: Auto-switch between HTTPS and Local LAN',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                      ),
                      const SizedBox(height: 24),
                      if (!isDesktop) ...[
                        SegmentedButton<EndpointType>(
                          segments: const [
                            ButtonSegment(
                              value: EndpointType.local,
                              label: Text('Local IP (LAN)'),
                              icon: Icon(Icons.wifi),
                            ),
                            ButtonSegment(
                              value: EndpointType.remote,
                              label: Text('Remote (HTTPS)'),
                              icon: Icon(Icons.cloud_outlined),
                            ),
                          ],
                          selected: {_endpointType},
                          onSelectionChanged: (set) {
                            setState(() {
                              _endpointType = set.first;
                              if (_endpointType == EndpointType.remote) {
                                _urlController.text = 'https://music.yourdomain.com';
                              } else {
                                _urlController.text = 'http://192.168.1.50:4533';
                              }
                            });
                          },
                        ),
                        const SizedBox(height: 16),
                      ],
                      TextFormField(
                        controller: _urlController,
                        decoration: InputDecoration(
                          labelText: 'Server Base URL',
                          hintText: isDesktop ? 'http://192.168.1.50:4533' : 'https://music.example.com',
                          prefixIcon: const Icon(Icons.dns_rounded),
                          border: const OutlineInputBorder(),
                        ),
                        validator: (v) => v == null || v.isEmpty ? 'Please enter server URL' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _usernameController,
                        decoration: const InputDecoration(
                          labelText: 'Username',
                          prefixIcon: Icon(Icons.person_rounded),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) => v == null || v.isEmpty ? 'Please enter username' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          prefixIcon: Icon(Icons.lock_rounded),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) => v == null || v.isEmpty ? 'Please enter password' : null,
                      ),
                      if (_endpointType == EndpointType.remote) ...[
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _pinController,
                          decoration: const InputDecoration(
                            labelText: 'Certificate SHA-256 Pin (Optional)',
                            hintText: 'sha256/AAAAAAAAAAAAAAAA...',
                            prefixIcon: Icon(Icons.security_rounded),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ],
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red.withOpacity(0.3)),
                          ),
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      FilledButton.icon(
                        onPressed: _isLoading ? null : _handleConnect,
                        icon: _isLoading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.login_rounded),
                        label: Text(_isLoading ? 'Authenticating...' : 'Connect to Server'),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
