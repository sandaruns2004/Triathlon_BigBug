import 'dart:io';
import 'dart:typed_data';
import 'package:uuid/uuid.dart';
import '../../domain/models.dart';
import 'media_store.dart';
import 'payload_cipher.dart';

class NativeMediaStore implements MediaStore {
  NativeMediaStore(this.root, this.cipher);
  final Directory root;
  final PayloadCipher cipher;
  static const maxBytes = 2 * 1024 * 1024;

  Future<Directory> _directory(String userId) async {
    if (!RegExp(r'^[a-zA-Z0-9_-]+$').hasMatch(userId)) {
      throw const StorageFailure('Invalid storage identity.');
    }
    return Directory('${root.path}/evidence/$userId').create(recursive: true);
  }

  @override
  Future<EvidenceFile> importFile(
    String userId,
    String sourcePath, {
    required String mime,
  }) async {
    if (!['image/jpeg', 'image/png'].contains(mime)) {
      throw const StorageFailure('Use a JPEG or PNG image.');
    }
    File? temp;
    try {
      final source = File(sourcePath);
      final length = await source.length();
      if (length <= 0 || length > maxBytes) {
        throw const StorageFailure('Image must be between 1 byte and 2 MB.');
      }
      final bytes = await source.readAsBytes();
      final jpeg =
          bytes.length >= 3 &&
          bytes[0] == 0xff &&
          bytes[1] == 0xd8 &&
          bytes[2] == 0xff;
      final png =
          bytes.length >= 8 &&
          bytes[0] == 0x89 &&
          bytes[1] == 0x50 &&
          bytes[2] == 0x4e &&
          bytes[3] == 0x47;
      if ((mime == 'image/jpeg' && !jpeg) || (mime == 'image/png' && !png)) {
        throw const StorageFailure(
          'Image contents do not match its file type.',
        );
      }
      final id = const Uuid().v4();
      final directory = await _directory(userId);
      final path = '${directory.path}/$id.sealed';
      temp = File('$path.pending');
      final existing = await directory.list().any(
        (entry) =>
            entry.path.endsWith('.sealed') || entry.path.endsWith('.pending'),
      );
      final sealed = await cipher.seal(
        userId,
        'evidence/$id',
        bytes,
        createKey: !existing,
      );
      await temp.writeAsBytes(sealed, flush: true);
      await temp.rename(path);
      return EvidenceFile(id: id, path: path, bytes: length, mime: mime);
    } on StorageFailure {
      rethrow;
    } catch (_) {
      throw const StorageFailure(
        'Could not keep this image. Previous files are retained; retry.',
      );
    } finally {
      if (temp != null && await temp.exists()) await temp.delete();
    }
  }

  @override
  Future<Uint8List> read(String userId, EvidenceFile evidence) async {
    final dir = await _directory(userId);
    final expected = '${dir.path}/${evidence.id}.sealed';
    if (evidence.path != expected) {
      throw const StorageFailure(
        'Evidence belongs to another record or identity.',
      );
    }
    return cipher.open(
      userId,
      'evidence/${evidence.id}',
      await File(expected).readAsBytes(),
    );
  }

  @override
  Future<void> discard(String userId, EvidenceFile evidence) async {
    await read(userId, evidence);
    await File(evidence.path).delete();
  }
}
