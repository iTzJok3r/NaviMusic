import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/subsonic_client.dart';
import '../core/network/endpoint_manager.dart';
import '../core/security/secure_storage.dart';
import '../features/playback/audio_controller.dart';

final isDesktopProvider = Provider<bool>((ref) {
  return Platform.isWindows || Platform.isMacOS || Platform.isLinux;
});

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final endpointManagerProvider = Provider<EndpointManager>((ref) {
  final isDesktop = ref.watch(isDesktopProvider);
  return EndpointManager(isDesktopOverride: isDesktop);
});

final subsonicClientProvider = StateProvider<SubsonicClient?>((ref) => null);

final audioPlayerProvider = StateNotifierProvider<AudioPlayerNotifier, PlaybackState>((ref) {
  return AudioPlayerNotifier(() => ref.read(subsonicClientProvider));
});
