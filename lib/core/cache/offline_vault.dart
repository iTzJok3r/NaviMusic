import 'dart:io';
import 'dart:typed_data';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

/// Encrypted Local Storage Vault for offline music files.
///
/// Files are AES-256-CBC encrypted before being written to disk. Every file gets a
/// fresh random IV which is stored as the first 16 bytes of the file; the previous
/// implementation reused one all-zero IV for every track, which makes ciphertexts
/// comparable across tracks and voids CBC's security guarantees.
///
/// NOTE: this vault is not wired into any screen yet - nothing in the app calls it.
class OfflineAudioVault {
  static const int _ivLength = 16;

  final enc.Encrypter _encrypter;

  OfflineAudioVault._(this._encrypter);

  /// Initializes the vault using a 256-bit key (from the platform keystore).
  factory OfflineAudioVault.fromKey(List<int> key32Bytes) {
    assert(key32Bytes.length == 32, 'AES-256 key must be exactly 32 bytes.');
    final key = enc.Key(Uint8List.fromList(key32Bytes));
    return OfflineAudioVault._(enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc)));
  }

  Future<String> _getVaultDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final vaultDir = Directory(p.join(appDir.path, 'secure_audio_vault'));
    if (!await vaultDir.exists()) {
      await vaultDir.create(recursive: true);
    }
    return vaultDir.path;
  }

  /// Encrypts and writes raw downloaded audio bytes to disk as `IV || ciphertext`.
  Future<File> saveEncryptedTrack(String songId, Uint8List rawAudioBytes) async {
    final dir = await _getVaultDirectory();
    final filePath = p.join(dir, '$songId.enc');

    final iv = enc.IV.fromSecureRandom(_ivLength);
    final encrypted = _encrypter.encryptBytes(rawAudioBytes, iv: iv);
    final file = File(filePath);
    return await file.writeAsBytes(<int>[...iv.bytes, ...encrypted.bytes]);
  }

  /// Decrypts a stored audio file into memory for playback.
  Future<Uint8List> readDecryptedTrack(String songId) async {
    final dir = await _getVaultDirectory();
    final file = File(p.join(dir, '$songId.enc'));

    if (!await file.exists()) {
      throw FileNotFoundException('Offline track with id $songId does not exist.');
    }

    final bytes = await file.readAsBytes();
    if (bytes.length <= _ivLength) {
      throw FileNotFoundException('Offline track $songId is truncated.');
    }

    final iv = enc.IV(Uint8List.fromList(bytes.sublist(0, _ivLength)));
    final payload = Uint8List.fromList(bytes.sublist(_ivLength));
    final decrypted = _encrypter.decryptBytes(enc.Encrypted(payload), iv: iv);
    return Uint8List.fromList(decrypted);
  }

  /// Checks if a song is downloaded offline.
  Future<bool> isTrackOffline(String songId) async {
    final dir = await _getVaultDirectory();
    return File(p.join(dir, '$songId.enc')).exists();
  }

  /// Deletes an offline track.
  Future<void> deleteOfflineTrack(String songId) async {
    final dir = await _getVaultDirectory();
    final file = File(p.join(dir, '$songId.enc'));
    if (await file.exists()) {
      await file.delete();
    }
  }
}

class FileNotFoundException implements Exception {
  final String message;
  FileNotFoundException(this.message);
  @override
  String toString() => message;
}
