import 'package:drift/wasm.dart';
import 'key_vault.dart';
import 'local_database.dart';
import 'local_store.dart';
import 'payload_cipher.dart';
import 'storage_runtime.dart';
import 'storage_runtime_preview.dart';
import 'web_media_store.dart';

Future<StorageRuntime> openPlatformStorage() async {
  LocalDatabase? db;
  try {
    final result = await WasmDatabase.open(
      databaseName: 'waypoint',
      sqlite3Uri: Uri.parse('sqlite3.wasm'),
      driftWorkerUri: Uri.parse('drift_worker.js'),
    );
    db = LocalDatabase(result.resolvedExecutor);
    if (result.chosenImplementation == WasmStorageImplementation.inMemory ||
        result.chosenImplementation ==
            WasmStorageImplementation.unsafeIndexedDb) {
      throw StateError('Durable browser storage is unavailable.');
    }
    await db.customSelect('SELECT 1').get();
    final store = LocalStore(db, PayloadCipher(SecureKeyVault()));
    return StorageRuntime(
      drafts: store,
      store: store,
      media: WebMediaStore(store),
    );
  } catch (_) {
    await db?.close();
    return const StorageRuntime(
      drafts: UnavailableDraftRepository(),
      error:
          'Browser storage could not open. Use Chrome on HTTPS or localhost with site storage enabled. Saved work has not been deleted.',
    );
  }
}
