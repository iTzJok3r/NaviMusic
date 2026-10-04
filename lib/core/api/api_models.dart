/// Models representing Subsonic / Navidrome API Entities.

class Song {
  final String id;
  final String title;
  final String artist;
  final String? album;
  final String? albumId;
  final int duration; // in seconds
  final int? track;
  final int? year;
  final String? genre;
  final int? bitRate;
  final String? coverArtId;
  final String? path;
  final bool starred;

  const Song({
    required this.id,
    required this.title,
    required this.artist,
    this.album,
    this.albumId,
    required this.duration,
    this.track,
    this.year,
    this.genre,
    this.bitRate,
    this.coverArtId,
    this.path,
    this.starred = false,
  });

  factory Song.fromJson(Map<String, dynamic> json) {
    return Song(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Unknown Title',
      artist: json['artist'] as String? ?? 'Unknown Artist',
      album: json['album'] as String?,
      albumId: json['albumId'] as String?,
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      track: (json['track'] as num?)?.toInt(),
      year: (json['year'] as num?)?.toInt(),
      genre: json['genre'] as String?,
      bitRate: (json['bitRate'] as num?)?.toInt(),
      coverArtId: json['coverArt'] as String?,
      path: json['path'] as String?,
      starred: json['starred'] != null,
    );
  }
}

class Album {
  final String id;
  final String name;
  final String artist;
  final String? artistId;
  final String? coverArtId;
  final int songCount;
  final int duration;
  final int? year;
  final String? genre;
  final List<Song> songs;

  const Album({
    required this.id,
    required this.name,
    required this.artist,
    this.artistId,
    this.coverArtId,
    this.songCount = 0,
    this.duration = 0,
    this.year,
    this.genre,
    this.songs = const [],
  });

  factory Album.fromJson(Map<String, dynamic> json, [List<Song> songs = const []]) {
    return Album(
      id: json['id'] as String,
      name: json['name'] as String? ?? json['title'] as String? ?? 'Untitled Album',
      artist: json['artist'] as String? ?? 'Unknown Artist',
      artistId: json['artistId'] as String?,
      coverArtId: json['coverArt'] as String?,
      songCount: (json['songCount'] as num?)?.toInt() ?? songs.length,
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      year: (json['year'] as num?)?.toInt(),
      genre: json['genre'] as String?,
      songs: songs,
    );
  }
}

class Artist {
  final String id;
  final String name;
  final String? coverArtId;
  final int albumCount;

  const Artist({
    required this.id,
    required this.name,
    this.coverArtId,
    this.albumCount = 0,
  });

  factory Artist.fromJson(Map<String, dynamic> json) {
    return Artist(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Unknown Artist',
      coverArtId: json['coverArt'] as String?,
      albumCount: (json['albumCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class Playlist {
  final String id;
  final String name;
  final String? comment;
  final String? owner;
  final bool public;
  final int songCount;
  final int duration;
  final List<Song> songs;

  const Playlist({
    required this.id,
    required this.name,
    this.comment,
    this.owner,
    this.public = false,
    this.songCount = 0,
    this.duration = 0,
    this.songs = const [],
  });

  factory Playlist.fromJson(Map<String, dynamic> json, [List<Song> songs = const []]) {
    return Playlist(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Untitled Playlist',
      comment: json['comment'] as String?,
      owner: json['owner'] as String?,
      public: json['public'] as bool? ?? false,
      songCount: (json['songCount'] as num?)?.toInt() ?? songs.length,
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      songs: songs,
    );
  }
}

class SearchResult {
  final List<Artist> artists;
  final List<Album> albums;
  final List<Song> songs;

  const SearchResult({
    this.artists = const [],
    this.albums = const [],
    this.songs = const [],
  });
}
