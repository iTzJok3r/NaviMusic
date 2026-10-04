import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/providers.dart';
import 'lyrics_sheet.dart';

class NowPlayingBar extends ConsumerWidget {
  const NowPlayingBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playback = ref.watch(audioPlayerProvider);
    final controller = ref.read(audioPlayerProvider.notifier);
    final client = ref.watch(subsonicClientProvider);

    final currentSong = playback.currentSong;
    if (currentSong == null) {
      return const SizedBox.shrink();
    }

    final coverArtUrl = currentSong.coverArtId != null && client != null
        ? client.getCoverArtUrl(currentSong.coverArtId!, size: 100)
        : null;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF18181F),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1))),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Progress Bar
            SliderTheme(
              data: SliderTheme.of(context).copyWith(
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 4),
                trackHeight: 2,
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 8),
              ),
              child: Slider(
                value: playback.position.inSeconds.toDouble().clamp(
                      0.0,
                      playback.duration.inSeconds.toDouble() > 0
                          ? playback.duration.inSeconds.toDouble()
                          : 1.0,
                    ),
                max: playback.duration.inSeconds > 0
                    ? playback.duration.inSeconds.toDouble()
                    : 1.0,
                onChanged: (val) {
                  controller.seek(Duration(seconds: val.toInt()));
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
              child: Row(
                children: [
                  // Album Art thumbnail
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      width: 48,
                      height: 48,
                      color: Colors.grey.shade900,
                      child: coverArtUrl != null
                          ? Image.network(
                              coverArtUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(Icons.music_note, color: Colors.grey),
                            )
                          : const Icon(Icons.music_note, color: Colors.grey),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Title & Artist
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentSong.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          currentSong.artist,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  // Controls
                  IconButton(
                    icon: const Icon(Icons.mic_external_on_rounded, size: 20),
                    tooltip: 'Lyrics',
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => LyricsSheet(song: currentSong),
                      );
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.skip_previous_rounded),
                    onPressed: () => controller.skipToPrevious(),
                  ),
                  IconButton.filled(
                    icon: Icon(playback.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded),
                    onPressed: () => controller.togglePlayPause(),
                  ),
                  IconButton(
                    icon: const Icon(Icons.skip_next_rounded),
                    onPressed: () => controller.skipToNext(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
