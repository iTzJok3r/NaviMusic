import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import '../../core/api/api_models.dart';
import '../../core/api/subsonic_client.dart';

class PlaybackState {
  final Song? currentSong;
  final List<Song> queue;
  final int currentIndex;
  final bool isPlaying;
  final Duration position;
  final Duration duration;
  final double volume;

  const PlaybackState({
    this.currentSong,
    this.queue = const [],
    this.currentIndex = -1,
    this.isPlaying = false,
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.volume = 1.0,
  });

  PlaybackState copyWith({
    Song? currentSong,
    List<Song>? queue,
    int? currentIndex,
    bool? isPlaying,
    Duration? position,
    Duration? duration,
    double? volume,
  }) {
    return PlaybackState(
      currentSong: currentSong ?? this.currentSong,
      queue: queue ?? this.queue,
      currentIndex: currentIndex ?? this.currentIndex,
      isPlaying: isPlaying ?? this.isPlaying,
      position: position ?? this.position,
      duration: duration ?? this.duration,
      volume: volume ?? this.volume,
    );
  }
}

class AudioPlayerNotifier extends StateNotifier<PlaybackState> {
  final AudioPlayer _player = AudioPlayer();
  final SubsonicClient? Function() _clientProvider;

  AudioPlayerNotifier(this._clientProvider) : super(const PlaybackState()) {
    _initListeners();
  }

  void _initListeners() {
    _player.playerStateStream.listen((stateData) {
      state = state.copyWith(isPlaying: stateData.playing);
      if (stateData.processingState == ProcessingState.completed) {
        skipToNext();
      }
    });

    _player.positionStream.listen((pos) {
      state = state.copyWith(position: pos);
    });

    _player.durationStream.listen((dur) {
      if (dur != null) {
        state = state.copyWith(duration: dur);
      }
    });
  }

  Future<void> playSong(Song song, {List<Song>? contextQueue}) async {
    final client = _clientProvider();
    if (client == null) return;

    final streamUrl = client.getStreamUrl(song.id);
    final queue = contextQueue ?? [song];
    final index = queue.indexWhere((s) => s.id == song.id);

    state = state.copyWith(
      currentSong: song,
      queue: queue,
      currentIndex: index >= 0 ? index : 0,
    );

    try {
      await _player.setUrl(streamUrl);
      await _player.play();
      unawaited(client.scrobble(song.id, submission: false));
    } catch (e) {
      // Audio stream error
    }
  }

  Future<void> togglePlayPause() async {
    if (_player.playing) {
      await _player.pause();
    } else {
      await _player.play();
    }
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  Future<void> skipToNext() async {
    if (state.queue.isEmpty) return;
    final nextIndex = state.currentIndex + 1;
    if (nextIndex < state.queue.length) {
      await playSong(state.queue[nextIndex], contextQueue: state.queue);
    }
  }

  Future<void> skipToPrevious() async {
    if (state.queue.isEmpty) return;
    if (state.position.inSeconds > 3) {
      await seek(Duration.zero);
      return;
    }
    final prevIndex = state.currentIndex - 1;
    if (prevIndex >= 0) {
      await playSong(state.queue[prevIndex], contextQueue: state.queue);
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }
}
