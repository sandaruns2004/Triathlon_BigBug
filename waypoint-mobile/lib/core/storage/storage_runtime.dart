import 'storage_runtime_preview.dart'
    if (dart.library.io) 'storage_runtime_native.dart'
    as platform;
import 'local_store.dart';
import 'media_store.dart';

class StorageRuntime {
  const StorageRuntime({
    required this.drafts,
    this.store,
    this.media,
    this.error,
  });
  final DraftRepository drafts;
  final LocalStore? store;
  final MediaStore? media;
  final String? error;
  bool get durable => store != null;
}

Future<StorageRuntime> openStorage() => platform.openPlatformStorage();
