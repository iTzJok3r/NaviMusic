import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_models.dart';
import '../../core/lyrics/lyrics_service.dart';
import '../../shared/providers.dart';

class LyricsSheet extends ConsumerStatefulWidget {
  final Song song;

  const LyricsSheet({super.key, required this.song});

  @override
  ConsumerState<LyricsSheet> createState() => _LyricsSheetState();
}

class _LyricsSheetState extends ConsumerState<LyricsSheet> {
  List<LyricLine> _lyrics = [];
  bool _isLoading = true;
  final ScrollController _scrollController = ScrollController();
  int _lastActiveIndex = -1;

  @override
  void initState() {
    super.initState();
    _loadLyrics();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadLyrics() async {
    final client = ref.read(subsonicClientProvider);
    if (client == null) {
      setState(() => _isLoading = false);
      return;
    }

    final service = LyricsService(client);
    final results = await service.fetchLyrics(widget.song);

    if (mounted) {
      setState(() {
        _lyrics = results;
        _isLoading = false;
      });
    }
  }

  void _scrollToActive(int index) {
    if (_lastActiveIndex == index || !_scrollController.hasClients) return;
    _lastActiveIndex = index;
    final targetOffset = (index * 48.0) - 120.0;
    _scrollController.animateTo(
      targetOffset.clamp(0.0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final playback = ref.watch(audioPlayerProvider);
    final controller = ref.read(audioPlayerProvider.notifier);

    // Find active lyric index
    int activeIndex = -1;
    if (_lyrics.isNotEmpty) {
      for (int i = 0; i < _lyrics.length; i++) {
        if (_lyrics[i].time <= playback.position) {
          activeIndex = i;
        } else {
          break;
        }
      }
      if (activeIndex >= 0) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToActive(activeIndex);
        });
      }
    }

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: Color(0xFF14141E),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.mic_external_on_rounded, color: Color(0xFF1DB954)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.song.title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      widget.song.artist,
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const Divider(height: 24, color: Colors.white12),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _lyrics.isEmpty
                    ? Center(
                        child: Text(
                          'No synchronized lyrics found for this track.',
                          style: TextStyle(color: Colors.grey.shade500),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        itemCount: _lyrics.length,
                        itemBuilder: (context, i) {
                          final line = _lyrics[i];
                          final isActive = i == activeIndex;

                          return InkWell(
                            onTap: () {
                              controller.seek(line.time);
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                              child: Text(
                                line.text,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: isActive ? 20 : 15,
                                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                                  color: isActive ? const Color(0xFF1DB954) : Colors.grey.shade500,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
