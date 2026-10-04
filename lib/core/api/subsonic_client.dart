import 'dart:collection';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import '../auth/token_generator.dart';
import '../network/endpoint_model.dart';
import '../security/certificate_pinner.dart';
import '../security/local_ip_guard.dart';
import 'api_models.dart';

class SubsonicApiException implements Exception {
  final int code;
  final String message;

  SubsonicApiException(this.code, this.message);

  @override
  String toString() => 'SubsonicApiException (Code $code): $message';
}

/// Production-ready Subsonic API Client connecting securely to Navidrome.
class SubsonicClient {
  final NavidromeEndpoint endpoint;
  final String username;
  final String password;
  final bool isDesktop;

  late final Dio _dio;
  SubsonicAuthToken? _currentToken;

  SubsonicClient({
    required this.endpoint,
    required this.username,
    required this.password,
    this.isDesktop = false,
  }) {
    if (isDesktop) {
      LocalIpGuard.validateDesktopEndpoint(endpoint.uri);
    }

    _dio = Dio(
      BaseOptions(
        baseUrl: endpoint.baseUrl,
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 15),
      ),
    );

    _setupSecurityAdapter();
    _setupAuthInterceptor();
  }

  void _setupSecurityAdapter() {
    if (_dio.httpClientAdapter is IOHttpClientAdapter) {
      final pinner = CertificatePinner(
        allowedPins: endpoint.pinSha256 != null ? {endpoint.pinSha256!} : const {},
        allowSelfSignedForLan: !endpoint.verifyCert,
      );
      (_dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
        return pinner.createPinnedHttpClient(isDesktop: isDesktop);
      };
    }
  }

  void _setupAuthInterceptor() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Rotate token if expired or not yet created
          if (_currentToken == null || _currentToken!.isExpired()) {
            _currentToken = SubsonicAuthToken.generate(
              username: username,
              password: password,
            );
          }

          final authParams = _currentToken!.toQueryParameters();
          options.queryParameters.addAll(authParams);

          return handler.next(options);
        },
      ),
    );
  }

  Map<String, dynamic> _unwrapResponse(dynamic data) {
    if (data is! Map<String, dynamic>) {
      throw SubsonicApiException(-1, 'Invalid server response structure');
    }

    final subsonic = data['subsonic-response'] as Map<String, dynamic>?;
    if (subsonic == null) {
      throw SubsonicApiException(-1, 'Missing subsonic-response header');
    }

    if (subsonic['status'] == 'failed') {
      final error = subsonic['error'] as Map<String, dynamic>?;
      final code = error?['code'] as int? ?? -1;
      final message = error?['message'] as String? ?? 'Subsonic request failed';
      throw SubsonicApiException(code, message);
    }

    return subsonic;
  }

  Future<bool> ping() async {
    final response = await _dio.get('/rest/ping.view');
    final data = _unwrapResponse(response.data);
    return data['status'] == 'ok';
  }

  Future<List<Artist>> getArtists() async {
    final response = await _dio.get('/rest/getArtists.view');
    final data = _unwrapResponse(response.data);
    final artistsRoot = data['artists'] as Map<String, dynamic>?;
    final indexList = artistsRoot?['index'] as List<dynamic>? ?? [];

    final result = <Artist>[];
    for (final index in indexList) {
      final artistItems = (index as Map<String, dynamic>)['artist'] as List<dynamic>? ?? [];
      for (final a in artistItems) {
        result.add(Artist.fromJson(a as Map<String, dynamic>));
      }
    }
    return result;
  }

  Future<Album> getAlbum(String id) async {
    final response = await _dio.get('/rest/getAlbum.view', queryParameters: {'id': id});
    final data = _unwrapResponse(response.data);
    final albumJson = data['album'] as Map<String, dynamic>;
    final songList = (albumJson['song'] as List<dynamic>? ?? [])
        .map((s) => Song.fromJson(s as Map<String, dynamic>))
        .toList();
    return Album.fromJson(albumJson, songList);
  }

  Future<List<Playlist>> getPlaylists() async {
    final response = await _dio.get('/rest/getPlaylists.view');
    final data = _unwrapResponse(response.data);
    final playlistsRoot = data['playlists'] as Map<String, dynamic>?;
    final playlistList = playlistsRoot?['playlist'] as List<dynamic>? ?? [];
    return playlistList.map((p) => Playlist.fromJson(p as Map<String, dynamic>)).toList();
  }

  Future<SearchResult> search3(String query) async {
    final response = await _dio.get('/rest/search3.view', queryParameters: {'query': query});
    final data = _unwrapResponse(response.data);
    final searchResult3 = data['searchResult3'] as Map<String, dynamic>? ?? {};

    final artists = (searchResult3['artist'] as List<dynamic>? ?? [])
        .map((a) => Artist.fromJson(a as Map<String, dynamic>))
        .toList();
    final albums = (searchResult3['album'] as List<dynamic>? ?? [])
        .map((al) => Album.fromJson(al as Map<String, dynamic>))
        .toList();
    final songs = (searchResult3['song'] as List<dynamic>? ?? [])
        .map((s) => Song.fromJson(s as Map<String, dynamic>))
        .toList();

    return SearchResult(artists: artists, albums: albums, songs: songs);
  }

  String getStreamUrl(String songId, {int? maxBitRate}) {
    if (_currentToken == null || _currentToken!.isExpired()) {
      _currentToken = SubsonicAuthToken.generate(username: username, password: password);
    }
    final params = _currentToken!.toQueryParameters();
    params['id'] = songId;
    if (maxBitRate != null) {
      params['maxBitRate'] = maxBitRate.toString();
    }

    final query = params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    return '${endpoint.baseUrl}/rest/stream.view?$query';
  }

  String getCoverArtUrl(String coverArtId, {int size = 300}) {
    if (_currentToken == null || _currentToken!.isExpired()) {
      _currentToken = SubsonicAuthToken.generate(username: username, password: password);
    }
    final params = _currentToken!.toQueryParameters();
    params['id'] = coverArtId;
    params['size'] = size.toString();

    final query = params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    return '${endpoint.baseUrl}/rest/getCoverArt.view?$query';
  }

  Future<void> scrobble(String songId, {bool submission = true}) async {
    await _dio.get('/rest/scrobble.view', queryParameters: {
      'id': songId,
      'submission': submission.toString(),
    });
  }

  Future<void> star(String id) async {
    await _dio.get('/rest/star.view', queryParameters: {'id': id});
  }

  Future<void> unstar(String id) async {
    await _dio.get('/rest/unstar.view', queryParameters: {'id': id});
  }

  Future<List<Song>> getRandomSongs({int size = 500}) async {
    final response = await _dio.get('/rest/getRandomSongs.view', queryParameters: {'size': size.toString()});
    final data = _unwrapResponse(response.data);
    final randomRoot = data['randomSongs'] as Map<String, dynamic>?;
    final songList = (randomRoot?['song'] as List<dynamic>? ?? [])
        .map((s) => Song.fromJson(s as Map<String, dynamic>))
        .toList();
    return songList;
  }

  Future<String?> getLyrics(String artist, String title) async {
    try {
      final response = await _dio.get('/rest/getLyrics.view', queryParameters: {'artist': artist, 'title': title});
      final data = _unwrapResponse(response.data);
      final lyrics = data['lyrics'] as Map<String, dynamic>?;
      return lyrics?['value'] as String?;
    } catch (_) {
      return null;
    }
  }

  Future<String?> getLyricsBySongId(String songId) async {
    try {
      final response = await _dio.get('/rest/getLyricsBySongId.view', queryParameters: {'id': songId});
      final data = _unwrapResponse(response.data);
      final list = data['lyricsList'] as Map<String, dynamic>?;
      final structured = (list?['structuredLyrics'] as List<dynamic>?)?.firstOrNull as Map<String, dynamic>?;
      final lines = structured?['line'] as List<dynamic>?;
      if (lines != null) {
        return lines.map((l) => (l as Map<String, dynamic>)['value']).join('\n');
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> startScan() async {
    await _dio.get('/rest/startScan.view');
  }
}
