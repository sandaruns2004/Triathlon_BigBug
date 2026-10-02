import 'package:image_picker/image_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../../domain/models.dart';
import '../storage/local_database.dart';
import '../storage/local_store.dart';
import '../storage/media_store.dart';

class EvidenceCapture {
  EvidenceCapture(this.store, this.media, [ImagePicker? picker])
    : picker = picker ?? ImagePicker();
  final LocalStore store;
  final MediaStore media;
  final ImagePicker picker;
  Future<String?> capture(
    Principal principal,
    String draftId,
    String entityId,
  ) async {
    await store.write(
      LocalTable.checkpoints,
      principal.userId,
      'camera-context',
      entityId,
      {'pending': true, 'draftId': draftId, 'entityId': entityId},
    );
    XFile? picked;
    try {
      picked = await picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 75,
        requestFullMetadata: false,
      );
    } on PlatformException {
      await store.write(
        LocalTable.checkpoints,
        principal.userId,
        'camera-context',
        entityId,
        {'pending': false},
      );
      throw const StorageFailure(
        'Camera unavailable or permission denied. Your form is retained. Check camera access in Settings and retry.',
      );
    }
    if (picked == null) {
      await store.write(
        LocalTable.checkpoints,
        principal.userId,
        'camera-context',
        entityId,
        {'pending': false},
      );
      return null;
    }
    final id = await _keep(principal.userId, draftId, entityId, picked);
    await store.write(
      LocalTable.checkpoints,
      principal.userId,
      'camera-context',
      entityId,
      {'pending': false},
    );
    return id;
  }

  Future<String> _keep(
    String userId,
    String draftId,
    String entityId,
    XFile picked,
  ) async {
    final header = await picked.openRead(0, 8).first;
    final mime = header.length >= 4 && header[0] == 137 && header[1] == 80
        ? 'image/png'
        : 'image/jpeg';
    final file = await media.importFile(userId, picked.path, mime: mime);
    await store.db.transaction(() async {
      await store.write(LocalTable.evidence, userId, file.id, entityId, {
        'id': file.id,
        'path': file.path,
        'mime': file.mime,
        'bytes': file.bytes,
        'entityId': entityId,
      });
      final draft = await store.read(LocalTable.drafts, userId, draftId) ?? {};
      final photos = ((draft['evidenceIds'] as List?) ?? []).cast<String>();
      if (photos.length >= 3) {
        throw const StorageFailure(
          'This draft already has three photos. The new file is retained for recovery.',
        );
      }
      await store.write(LocalTable.drafts, userId, draftId, entityId, {
        ...draft,
        'evidenceIds': [...photos, file.id],
      });
    });
    return file.id;
  }

  Future<void> recover(Principal principal) async {
    final context = await store.read(
      LocalTable.checkpoints,
      principal.userId,
      'camera-context',
    );
    if (context?['pending'] != true) return;
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      // image_picker lost-data recovery is Android-only. iOS interrupted
      // captures cannot be recovered unless already copied into app storage.
      await store.write(
        LocalTable.checkpoints,
        principal.userId,
        'camera-context',
        context!['entityId'] as String,
        {'pending': false},
      );
      throw const StorageFailure(
        'Camera capture was interrupted. Your saved form and earlier photos are retained; take the missing photo again.',
      );
    }
    final lost = await picker.retrieveLostData();
    if (!lost.isEmpty && lost.files != null) {
      for (final file in lost.files!) {
        await _keep(
          principal.userId,
          context!['draftId'] as String,
          context['entityId'] as String,
          file,
        );
      }
    } else if (lost.exception != null) {
      throw const StorageFailure(
        'Camera capture was interrupted. The form is retained; retry the photo.',
      );
    }
    await store.write(
      LocalTable.checkpoints,
      principal.userId,
      'camera-context',
      context!['entityId'] as String,
      {'pending': false},
    );
  }
}
