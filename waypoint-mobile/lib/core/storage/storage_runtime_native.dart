import 'dart:io';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/services.dart';
import 'key_vault.dart';
import 'local_database.dart';
import 'local_store.dart';
import 'native_media_store.dart';
import 'payload_cipher.dart';
import 'storage_runtime.dart';
import 'storage_runtime_preview.dart' show UnavailableDraftRepository;

Future<StorageRuntime> openPlatformStorage() async {
  try {
    final root = await getApplicationSupportDirectory();
    await root.create(recursive: true);
    if (Platform.isIOS) {
      // The native bridge verifies this is the app-owned directory before
      // excluding evidence/SQLite from backup and setting file protection.
      await const MethodChannel(
        'lk.waypoint/storage',
      ).invokeMethod<void>('protectStorage', {'path': root.path});
    }
    final db = LocalDatabase(
      NativeDatabase(File('${root.path}/waypoint.sqlite')),
    );
    await db.customSelect('SELECT 1').get();
    final cipher = PayloadCipher(SecureKeyVault());
    return StorageRuntime(
      drafts: LocalStore(db, cipher),
      store: LocalStore(db, cipher),
      media: NativeMediaStore(root, cipher),
    );
  } catch (_) {
    return const StorageRuntime(
      drafts: UnavailableDraftRepository(),
      error:
          'Device storage could not open. Nothing will be marked saved. Retry after checking storage.',
    );
  }
}
