import 'dart:typed_data';

class EvidenceFile {
  const EvidenceFile({
    required this.id,
    required this.path,
    required this.bytes,
    required this.mime,
  });
  final String id;
  final String path;
  final int bytes;
  final String mime;
}

abstract interface class MediaStore {
  Future<EvidenceFile> importFile(
    String userId,
    String sourcePath, {
    required String mime,
  });
  Future<Uint8List> read(String userId, EvidenceFile evidence);
  Future<void> discard(String userId, EvidenceFile evidence);
}
