import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api/api_models.dart';
import '../api/subsonic_client.dart';

class LyricLine {
  final Duration time;
  final String text;

  const LyricLine({required this.time, required this.text});
}

/// Cross-platform Zero-API Multi-Source Synchronized & Plain Lyrics Engine.
class LyricsService {
  final SubsonicClient client;
  final Map<String, List<LyricLine>> _memoryCache = {};

  LyricsService(this.client);

  static const Map<String, String> _arabicAnimeVault = {
    'النمر المقنع': '''حلبة المصارعة ملتقى الأبطال
فيها زوايا أربعة ترقب الختام
كالحلم طائر... النمر المقنع
ينقض هائماً... النمر المقنع
لا يهاب الأخطار... شجاع مقدام
في وجه الأشرار... ينير الظلام
النمر المقنع... النمر المقنع
سوف ينتصر... في كل نزال
طائر... النمر المقنع
هائم... النمر المقنع
النمر المقنع''',

    'المحقق كونان': '''يكتشف الغامض والمثير
يستنتج بالعقل الكبير
كونان الرجل الصغير
يسعى دائماً
الصوت صوت الصدق
والحق دائماً يقال
المحقق كونان... يبدو واثقاً
يعمل جاهداً... لا يخشى المحن
كونان... المحقق كونان
هيا يا كونان''',

    'عهد الأصدقاء': '''حلمنا نهار... نهارنا عمل
نملك الخيار... وخيارنا الأمل
وتهدينا الحياة أضواءً في آخر النفق
تدعونا كي ننسى ألماً عشناه
نستسلم لكن لا ما دمنا أحياء نرزق
ما دام الأمل طريقاً فسنحياه
بيننا صديق... لا يعرف الكلل
مخلص رقيق... إن قال فعل
روميو صديقي يحفظ عهد الأصدقاء
يعرف كيف يجابه الأيام''',

    'ريمي': '''أنتي الأمان... أنتي الحنان
من تحت قدميك لنا الجنان
عندما تضحكين... تضحك الحياة
تزهر الآمال في طريقنا
أمي... أمي... أمي
دمتي لنا عوناً... ونوراً في الدجى
يا نبع الحنان... دمتي للأبد''',

    'القناص': '''قد لمعت عيناه... بالعزم انتفضت يمناه
في هدوء الليل... من هو الصامد المغامر
في وجه السيل... يبعد عن عينيه الراحة
يتحدى خصماً في الساحة
يرمي ويصيب الأهداف... يسعى دوماً لتحقيق الإنصاف
القناص... في كل مكان''',

    'هزيم الرعد': '''هزيم الرعد... هزيم الرعد
ما عاش الظالم يسبيك... وفينا نفس بعد
بحنيني بدمي أفديك... وروحي تنبت مجد
هزيم الرعد... هزيم الرعد
سيفك في الميدان نداء... يملأ أفق الكون ضياء
هزيم الرعد... هزيم الرعد''',

    'أنا وأخي': '''شوق يدفعني لأراها... أمي ذكرى لا أنساها
صوت أنقى من همس النسيم... يمسح عني الحزن المقيم
أمي الحبيبة... يا نبع الحنان
أخي الصغير أمانة في عنقي
سأرعاه بعيني وأحميه بحبي
دمتي لنا يا أمي''',

    'كابتن ماجد': '''كابتن ماجد... كابتن ماجد
عاد إليكم من جديد
تمريرة متقنة... تسديدة صاروخية
نحو الهدف في المرمى
سجل هدفاً رائعاً... كابتن ماجد
كابتن ماجد... في الملعب بطل''',
  };

  /// Cleans titles removing prefixes like 'أغنية بداية' or 'سبيستون'
  static String cleanSongTitle(String title) {
    return title
        .replaceAll(RegExp(r'^أغنية\s+(بداية|شارة|نهاية)?\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'^شارة\s+(بداية|نهاية)?\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'^أغنية\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'^شارة\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'-\s*سبيستون', caseSensitive: false), '')
        .replaceAll(RegExp(r'سبيستون|سبيس\s*تون|Spacetoon', caseSensitive: false), '')
        .replaceAll(RegExp(r'\(Official.*?\)|\[.*?\]', caseSensitive: false), '')
        .replaceAll(RegExp(r'\(.*?\)', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+', caseSensitive: false), ' ')
        .trim();
  }

  static bool isValidLyrics(String? text) {
    if (text == null || text.trim().length < 20) return false;
    final trimmed = text.trim();
    final badPatterns = [
      RegExp(r'class\s*=', caseSensitive: false),
      RegExp(r'href\s*=', caseSensitive: false),
      RegExp(r'https?:\/\/', caseSensitive: false),
      RegExp(r'duckduckgo', caseSensitive: false),
      RegExp(r'result__snippet', caseSensitive: false),
      RegExp(r'uddg\s*=', caseSensitive: false),
      RegExp(r'<\/?(a|div|span|script|style|html|body|p)\b', caseSensitive: false),
      RegExp(r'cookies|subscribe|all rights reserved', caseSensitive: false),
    ];
    for (final pat in badPatterns) {
      if (pat.hasMatch(trimmed)) return false;
    }
    return trimmed.split('\n').where((l) => l.trim().isNotEmpty).length >= 2;
  }

  /// Auto-detects lyrics from Navidrome, LRCLIB (direct & fuzzy), and auto-syncs plain text.
  Future<List<LyricLine>> fetchLyrics(Song song) async {
    if (_memoryCache.containsKey(song.id)) {
      return _memoryCache[song.id]!;
    }

    final cleanedTitle = cleanSongTitle(song.title);
    String? rawLrc;

    // Level 1: Check Built-in Arabic Anime Vault
    for (final entry in _arabicAnimeVault.entries) {
      if (cleanedTitle.contains(entry.key) || song.title.contains(entry.key)) {
        rawLrc = entry.value;
        break;
      }
    }

    // Level 2: Try Subsonic OpenSubsonic getLyricsBySongId
    if (rawLrc == null) {
      try {
        final subIdLyrics = await client.getLyricsBySongId(song.id);
        if (subIdLyrics != null && isValidLyrics(subIdLyrics)) {
          final parsed = parseLrc(subIdLyrics);
          if (parsed.isNotEmpty) {
            _memoryCache[song.id] = parsed;
            return parsed;
          }
        }
      } catch (_) {}
    }

    // Level 3: Try Subsonic standard getLyrics
    if (rawLrc == null) {
      try {
        final subLyrics = await client.getLyrics(song.artist, song.title);
        if (subLyrics != null && isValidLyrics(subLyrics)) {
          rawLrc = subLyrics;
        }
      } catch (_) {}
    }

    // Level 4: Fallback to LrcLib Exact Match (Zero-API)
    if (rawLrc == null || rawLrc.trim().isEmpty) {
      try {
        final cleanArtist = song.artist.replaceAll(RegExp(r'VEVO|Official|Topic', caseSensitive: false), '').trim();
        final url = Uri.parse(
          'https://lrclib.net/api/get?artist_name=${Uri.encodeComponent(cleanArtist)}&track_name=${Uri.encodeComponent(cleanedTitle)}&album_name=${Uri.encodeComponent(song.album ?? "")}&duration=${song.duration}',
        );
        final response = await http.get(url).timeout(const Duration(seconds: 4));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body) as Map<String, dynamic>;
          final cand = data['syncedLyrics'] as String? ?? data['plainLyrics'] as String?;
          if (cand != null && isValidLyrics(cand)) {
            rawLrc = cand;
          }
        }
      } catch (_) {}
    }

    // 4. Fallback to LrcLib Fuzzy Search (Zero-API)
    if (rawLrc == null || rawLrc.trim().isEmpty) {
      try {
        final query = '${song.artist} ${song.title}'.replaceAll(RegExp(r'\(Official.*?\)|\[.*?\]', caseSensitive: false), '').trim();
        final url = Uri.parse('https://lrclib.net/api/search?q=${Uri.encodeComponent(query)}');
        final response = await http.get(url).timeout(const Duration(seconds: 4));
        if (response.statusCode == 200) {
          final items = jsonDecode(response.body) as List<dynamic>;
          if (items.isNotEmpty) {
            final match = items.firstWhere(
              (i) => (i as Map<String, dynamic>)['syncedLyrics'] != null,
              orElse: () => items.first,
            ) as Map<String, dynamic>;
            rawLrc = match['syncedLyrics'] as String? ?? match['plainLyrics'] as String?;
          }
        }
      } catch (_) {}
    }

    if (rawLrc != null && rawLrc.trim().isNotEmpty) {
      final parsed = parseLrc(rawLrc);
      if (parsed.any((l) => l.time > Duration.zero)) {
        _memoryCache[song.id] = parsed;
        return parsed;
      } else {
        // Plain text: Karaokize rhythmically across song duration
        final autoSynced = karaokizeLyrics(rawLrc, song.duration);
        _memoryCache[song.id] = autoSynced;
        return autoSynced;
      }
    }

    return [];
  }

  /// Parses standard LRC string with timestamps: [mm:ss.xx] into structured [LyricLine]s.
  static List<LyricLine> parseLrc(String lrcContent) {
    final result = <LyricLine>[];
    final lines = lrcContent.split('\n');
    final regExp = RegExp(r'\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]');

    for (final line in lines) {
      final match = regExp.firstMatch(line);
      if (match != null) {
        final minutes = int.parse(match.group(1)!);
        final seconds = int.parse(match.group(2)!);
        final msStr = match.group(3);
        final millis = msStr != null ? int.parse(msStr.padRight(3, '0').substring(0, 3)) : 0;
        final duration = Duration(minutes: minutes, seconds: seconds, milliseconds: millis);
        final text = line.replaceAll(regExp, '').trim();
        if (text.isNotEmpty) {
          result.add(LyricLine(time: duration, text: text));
        }
      } else if (line.trim().isNotEmpty) {
        result.add(LyricLine(time: Duration.zero, text: line.trim()));
      }
    }

    result.sort((a, b) => a.time.compareTo(b.time));
    return result;
  }

  /// Smart Karaokizer: Generates live progressive rhythm timestamps for plain lyrics.
  static List<LyricLine> karaokizeLyrics(String plainText, int totalDurationSeconds) {
    final rawLines = plainText
        .split('\n')
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty && !RegExp(r'^\[(verse|chorus|intro|outro|bridge|hook)\]', caseSensitive: false).hasMatch(l))
        .toList();

    if (rawLines.isEmpty) return [];

    final duration = totalDurationSeconds > 30 ? totalDurationSeconds : 180;
    final introSeconds = (duration * 0.08).clamp(3.0, 15.0);
    final availableSeconds = duration - introSeconds - 5;
    final secondsPerLine = availableSeconds / rawLines.length;

    final result = <LyricLine>[];
    for (int i = 0; i < rawLines.length; i++) {
      final lineDuration = Duration(milliseconds: ((introSeconds + i * secondsPerLine) * 1000).toInt());
      result.add(LyricLine(time: lineDuration, text: rawLines[i]));
    }
    return result;
  }
}
