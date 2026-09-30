import '../../domain/models.dart';
import 'local_store.dart';
import 'storage_runtime.dart';

class UnavailableDraftRepository implements DraftRepository {
  const UnavailableDraftRepository();
  @override
  Future<LocalDraft?> loadDraft(String userId, String id) async => null;
  @override
  Future<void> saveDraft(
    String userId,
    LocalDraft draft,
  ) async => throw const StorageFailure(
    'Durable storage is available in the installed app, not this browser preview.',
  );
}

Future<StorageRuntime> openPlatformStorage() async => const StorageRuntime(
  drafts: UnavailableDraftRepository(),
  error: 'Browser UI preview · durable records require the Android app.',
);
