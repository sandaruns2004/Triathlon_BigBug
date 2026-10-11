import 'dart:convert';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import '../../domain/models.dart';
import 'local_database.dart';
import 'local_store.dart';
import 'media_store.dart';

/// Browser blobs are copied into encrypted durable records before success.
class WebMediaStore implements MediaStore {
  WebMediaStore(this.store);
  final LocalStore store;

  @override
  Future<EvidenceFile> importFile(
    String userId,
    String sourcePath, {
    required String mime,
  }) async {
    final source = XFile(sourcePath);
    final size = await source.length();
    if (size <= 0 || size > 2 * 1024 * 1024) {
      throw const StorageFailure('Image must be between 1 byte and 2 MB.');
    }
    final bytes = await source.readAsBytes();
    final jpeg =
        bytes.length >= 3 &&
        bytes[0] == 255 &&
        bytes[1] == 216 &&
        bytes[2] == 255;
    final png =
        bytes.length >= 8 &&
        bytes[0] == 137 &&
        bytes[1] == 80 &&
        bytes[2] == 78 &&
        bytes[3] == 71;
    if (!((mime == 'image/jpeg' && jpeg) || (mime == 'image/png' && png))) {
      throw const StorageFailure('Use a valid JPEG or PNG image.');
    }
    final id = const Uuid().v4();
    final path = 'browser/$userId/$id';
    await store.write(LocalTable.evidence, userId, 'file/$id', id, {
      'path': path,
      'bytes': base64Encode(bytes),
    });
    return EvidenceFile(id: id, path: path, bytes: bytes.length, mime: mime);
  }

  @override
  Future<Uint8List> read(String userId, EvidenceFile evidence) async {
    if (evidence.path != 'browser/$userId/${evidence.id}') {
      throw const StorageFailure('Evidence belongs to another account.');
    }
    final record = await store.read(
      LocalTable.evidence,
      userId,
      'file/${evidence.id}',
    );
    if (record == null || record['path'] != evidence.path) {
      throw const StorageFailure('Saved attachment is missing.');
    }
    return base64Decode(record['bytes'] as String);
  }

  @override
  Future<void> discard(String userId, EvidenceFile evidence) async {
    await read(userId, evidence);
    await store.db.customStatement(
      'DELETE FROM evidence_metadata WHERE user_id = ? AND id = ?',
      [userId, 'file/${evidence.id}'],
    );
  }
}
