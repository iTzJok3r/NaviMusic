import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_models.dart';
import '../../shared/providers.dart';
import '../playback/now_playing_bar.dart';

class LibraryView extends ConsumerStatefulWidget {
  const LibraryView({super.key});

  @override
  ConsumerState<LibraryView> createState() => _LibraryViewState();
}

class _LibraryViewState extends ConsumerState<LibraryView> {
  int _selectedIndex = 0;
  bool _isLoading = false;
  List<Artist> _artists = [];
  List<Playlist> _playlists = [];
  List<Song> _allSongs = [];
  List<Song> _searchResults = [];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    final client = ref.read(subsonicClientProvider);
    if (client == null) return;

    setState(() => _isLoading = true);
    try {
      final artists = await client.getArtists();
      final playlists = await client.getPlaylists();
      final songs = await client.getRandomSongs(size: 500);
      setState(() {
        _artists = artists;
        _playlists = playlists;
        _allSongs = songs;
      });
    } catch (_) {
      // Ignored or handled via snackbar
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSearch(String query) async {
    if (query.trim().isEmpty) return;
    final client = ref.read(subsonicClientProvider);
    if (client == null) return;

    setState(() => _isLoading = true);
    try {
      final results = await client.search3(query);
      setState(() => _searchResults = results.songs);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    switch (_selectedIndex) {
      case 0:
        return _buildArtistsGrid();
      case 1:
        return _buildPlaylistsList();
      case 2:
        return _buildSongsList();
      case 3:
        return _buildUploadTab();
      case 4:
        return _buildSearchTab();
      case 5:
      default:
        return _buildSettingsTab();
    }
  }

  Widget _buildSongsList() {
    final player = ref.read(audioPlayerProvider.notifier);

    if (_allSongs.isEmpty) {
      return const Center(child: Text('No tracks found in library.'));
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Row(
            children: [
              FilledButton.icon(
                onPressed: () {
                  if (_allSongs.isNotEmpty) {
                    player.playSong(_allSongs.first, contextQueue: _allSongs);
                  }
                },
                icon: const Icon(Icons.play_arrow_rounded),
                label: const Text('Play All'),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () {
                  if (_allSongs.isNotEmpty) {
                    final shuffled = List<Song>.from(_allSongs)..shuffle();
                    player.playSong(shuffled.first, contextQueue: shuffled);
                  }
                },
                icon: const Icon(Icons.shuffle_rounded),
                label: const Text('Shuffle All'),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _allSongs.length,
            itemBuilder: (context, index) {
              final song = _allSongs[index];
              return ListTile(
                leading: const Icon(Icons.music_note_rounded),
                title: Text(song.title),
                subtitle: Text('${song.artist} • ${song.album ?? ""}'),
                trailing: Text(
                  '${(song.duration ~/ 60)}:${(song.duration % 60).toString().padLeft(2, '0')}',
                ),
                onTap: () {
                  player.playSong(song, contextQueue: _allSongs);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildArtistsGrid() {
    if (_artists.isEmpty) {
      return const Center(child: Text('No artists found on Navidrome server.'));
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 180,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.8,
      ),
      itemCount: _artists.length,
      itemBuilder: (context, index) {
        final artist = _artists[index];
        return Card(
          clipBehavior: Clip.antiAlias,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: Colors.grey.shade800,
                child: const Icon(Icons.person, size: 40, color: Colors.white70),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: Text(
                  artist.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
              Text(
                '${artist.albumCount} Albums',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPlaylistsList() {
    if (_playlists.isEmpty) {
      return const Center(child: Text('No playlists available.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _playlists.length,
      itemBuilder: (context, index) {
        final playlist = _playlists[index];
        return ListTile(
          leading: const Icon(Icons.playlist_play_rounded, size: 36, color: Color(0xFF1DB954)),
          title: Text(playlist.name, style: const TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text('${playlist.songCount} tracks'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {},
        );
      },
    );
  }

  Widget _buildSearchTab() {
    final player = ref.read(audioPlayerProvider.notifier);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: SearchBar(
            controller: _searchController,
            hintText: 'Search songs, albums, or artists...',
            leading: const Icon(Icons.search),
            trailing: [
              IconButton(
                icon: const Icon(Icons.arrow_forward),
                onPressed: () => _handleSearch(_searchController.text),
              ),
            ],
            onSubmitted: _handleSearch,
          ),
        ),
        Expanded(
          child: _searchResults.isEmpty
              ? const Center(child: Text('Search your Subsonic library'))
              : ListView.builder(
                  itemCount: _searchResults.length,
                  itemBuilder: (context, index) {
                    final song = _searchResults[index];
                    return ListTile(
                      leading: const Icon(Icons.music_note),
                      title: Text(song.title),
                      subtitle: Text('${song.artist} • ${song.album ?? ""}'),
                      trailing: Text(
                        '${(song.duration ~/ 60)}:${(song.duration % 60).toString().padLeft(2, '0')}',
                      ),
                      onTap: () {
                        player.playSong(song, contextQueue: _searchResults);
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }

  void _showChangeServerDialog(String currentUrl) {
    final controller = TextEditingController(text: currentUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Change Server IP / URL'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Enter the new IP address or hostname for your Navidrome server:',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Server URL',
                hintText: 'http://your-server.local:4533',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final newUrl = controller.text.trim();
              if (newUrl.isNotEmpty) {
                await ref.read(secureStorageProvider).saveCredentials(
                      username: 'iTzJok3r',
                      serverUrl: newUrl,
                      token: '',
                      salt: '',
                    );
                Navigator.pop(ctx);
                // Reconnect or logout to apply new endpoint
                ref.read(subsonicClientProvider.notifier).state = null;
              }
            },
            child: const Text('Save & Reconnect'),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadTab() {
    final client = ref.read(subsonicClientProvider);
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: ListView(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.cloud_upload_rounded, color: Color(0xFF1DB954), size: 28),
                      const SizedBox(width: 12),
                      Text(
                        'Batch Music Upload & Ingestion',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Navidrome operates as a high-performance indexed music server. To add new albums or playlists:\n\n'
                    '1. Copy your audio files (.mp3, .flac, .m4a, .ogg) into your Navidrome music directory or network share (e.g. \\\\your-server.local\\music).\n'
                    '2. Press "Trigger Server Scan" below. Navidrome will instantly scan, extract tags, fetch cover art, and index all new tracks.',
                    style: TextStyle(fontSize: 13, height: 1.5, color: Colors.grey),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () async {
                      if (client == null) return;
                      try {
                        await client.startScan();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Navidrome library scan triggered successfully!'),
                              backgroundColor: Color(0xFF1DB954),
                            ),
                          );
                        }
                        _loadInitialData();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Scan error: $e'), backgroundColor: Colors.red),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Trigger Server Scan Now'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('Supported Batch Formats', style: TextStyle(fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Chip(label: Text('MP3')),
                      Chip(label: Text('FLAC')),
                      Chip(label: Text('M4A / AAC')),
                      Chip(label: Text('OGG Vorbis')),
                      Chip(label: Text('OPUS')),
                      Chip(label: Text('WAV')),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTab() {
    final activeEp = ref.watch(endpointManagerProvider).activeEndpoint;
    final isDesktop = ref.watch(isDesktopProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ListTile(
          title: const Text('Server Endpoint'),
          subtitle: Text(activeEp?.baseUrl ?? 'http://your-server.local:4533'),
          leading: const Icon(Icons.dns_rounded),
          trailing: const Icon(Icons.edit_rounded),
          onTap: () => _showChangeServerDialog(activeEp?.baseUrl ?? 'http://your-server.local:4533'),
        ),
        ListTile(
          title: const Text('Operating Mode'),
          subtitle: Text(isDesktop ? 'Desktop (Strict Local-Only)' : 'Mobile (Remote / LAN Auto)'),
          leading: Icon(isDesktop ? Icons.computer : Icons.phone_android),
        ),
        ListTile(
          title: const Text('Disconnect / Log Out'),
          leading: const Icon(Icons.logout, color: Colors.redAccent),
          onTap: () {
            ref.read(subsonicClientProvider.notifier).state = null;
          },
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = ref.watch(isDesktopProvider);

    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                if (isDesktop)
                  NavigationRail(
                    selectedIndex: _selectedIndex,
                    onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
                    labelType: NavigationRailLabelType.all,
                    leading: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16.0),
                      child: Icon(Icons.graphic_eq_rounded, color: Color(0xFF1DB954), size: 36),
                    ),
                    destinations: const [
                      NavigationRailDestination(icon: Icon(Icons.people_rounded), label: Text('Artists')),
                      NavigationRailDestination(icon: Icon(Icons.playlist_play_rounded), label: Text('Playlists')),
                      NavigationRailDestination(icon: Icon(Icons.music_note_rounded), label: Text('All Songs')),
                      NavigationRailDestination(icon: Icon(Icons.cloud_upload_rounded), label: Text('Upload')),
                      NavigationRailDestination(icon: Icon(Icons.search_rounded), label: Text('Search')),
                      NavigationRailDestination(icon: Icon(Icons.settings_rounded), label: Text('Settings')),
                    ],
                  ),
                Expanded(
                  child: Scaffold(
                    appBar: AppBar(
                      title: Text(
                        _selectedIndex == 0
                            ? 'Artists'
                            : _selectedIndex == 1
                                ? 'Playlists'
                                : _selectedIndex == 2
                                    ? 'All Songs'
                                    : _selectedIndex == 3
                                        ? 'Upload Music'
                                        : _selectedIndex == 4
                                            ? 'Search'
                                            : 'Settings',
                      ),
                    ),
                    body: _buildContent(),
                  ),
                ),
              ],
            ),
          ),
          const NowPlayingBar(),
        ],
      ),
      bottomNavigationBar: !isDesktop
          ? NavigationBar(
              selectedIndex: _selectedIndex,
              onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
              destinations: const [
                NavigationDestination(icon: Icon(Icons.people_rounded), label: 'Artists'),
                NavigationDestination(icon: Icon(Icons.playlist_play_rounded), label: 'Playlists'),
                NavigationDestination(icon: Icon(Icons.music_note_rounded), label: 'All Songs'),
                NavigationDestination(icon: Icon(Icons.cloud_upload_rounded), label: 'Upload'),
                NavigationDestination(icon: Icon(Icons.search_rounded), label: 'Search'),
                NavigationDestination(icon: Icon(Icons.settings_rounded), label: 'Settings'),
              ],
            )
          : null,
    );
  }
}
