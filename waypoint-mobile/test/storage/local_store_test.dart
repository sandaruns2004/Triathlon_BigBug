import 'dart:io';
import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:waypoint_mobile/core/storage/key_vault.dart';
import 'package:waypoint_mobile/core/storage/local_database.dart';
import 'package:waypoint_mobile/core/storage/local_store.dart';
import 'package:waypoint_mobile/core/storage/payload_cipher.dart';
import 'package:waypoint_mobile/core/sync/sync_lock.dart';
import 'package:waypoint_mobile/domain/models.dart';

class LegacyDatabase extends LocalDatabase {
  LegacyDatabase(super.executor);
  @override
  int get schemaVersion => 1;
  @override
  MigrationStrategy get migration =>
      MigrationStrategy(onCreate: (_) => createV1());
}

void main() {
  late Directory directory;
  late LocalDatabase db;
  late MemoryKeyVault vault;
  late LocalStore store;
  setUp(() async {
    directory = await Directory.systemTemp.createTemp('waypoint-storage-');
    vault = MemoryKeyVault();
    db = LocalDatabase(NativeDatabase(File('${directory.path}/test.sqlite')));
    store = LocalStore(db, PayloadCipher(vault));
  });
  tearDown(() async {
    await db.close();
    await directory.delete(recursive: true);
  });
  LocalDraft draft(String note) => LocalDraft(
    id: 'draft-1',
    entityId: 'stop-1',
    note: note,
    updatedAt: DateTime.utc(2026, 9, 30, 1),
  );
  test(
    'encrypted draft survives database close/reopen and user B cannot see it',
    () async {
      await store.saveDraft('user-a', draft('private receiving note'));
      final raw = await db
          .customSelect('SELECT payload FROM drafts')
          .getSingle();
      expect(
        String.fromCharCodes(raw.read<Uint8List>('payload')),
        isNot(contains('private receiving note')),
      );
      await db.close();
      db = LocalDatabase(NativeDatabase(File('${directory.path}/test.sqlite')));
      store = LocalStore(db, PayloadCipher(vault));
      expect(
        (await store.loadDraft('user-a', 'draft-1'))?.note,
        'private receiving note',
      );
      expect(await store.loadDraft('user-b', 'draft-1'), isNull);
    },
  );
  test('failed update retains the prior draft', () async {
    await store.saveDraft('user-a', draft('original'));
    await db.customStatement(
      "CREATE TRIGGER fail_draft BEFORE UPDATE ON drafts BEGIN SELECT RAISE(ABORT,'full'); END",
    );
    await expectLater(
      store.saveDraft('user-a', draft('replacement')),
      throwsA(isA<StorageFailure>()),
    );
    expect((await store.loadDraft('user-a', 'draft-1'))?.note, 'original');
  });
  test(
    'proof/outbox commit rolls back as a unit; immutable IDs cannot overwrite',
    () async {
      await db.customStatement(
        "CREATE TRIGGER fail_queue BEFORE INSERT ON outbox_operations BEGIN SELECT RAISE(ABORT,'full'); END",
      );
      const operation = PendingOperation(
        id: 'op-1',
        entityId: 'stop-1',
        type: 'delivery_recorded',
        payload: {'quantity': 12},
      );
      await expectLater(
        store.commitLocalCompletion('user-a', 'proof-1', {
          'recipient': 'Fixture',
        }, operation),
        throwsA(isA<Exception>()),
      );
      expect(await store.read(LocalTable.proofs, 'user-a', 'proof-1'), isNull);
      expect(await store.queuedCount('user-a'), 0);
      await db.customStatement('DROP TRIGGER fail_queue');
      await store.commitLocalCompletion('user-a', 'proof-1', {
        'recipient': 'Fixture',
      }, operation);
      await expectLater(
        store.commitLocalCompletion('user-a', 'proof-1', {
          'recipient': 'Changed',
        }, operation),
        throwsA(isA<Exception>()),
      );
      expect(
        (await store.read(
          LocalTable.proofs,
          'user-a',
          'proof-1',
        ))?['recipient'],
        'Fixture',
      );
      expect(await store.queuedCount('user-a'), 1);
      expect(await store.queuedCount('user-b'), 0);
    },
  );
  test('v1-to-v2 additive migration preserves unsynced records', () async {
    await db.close();
    final legacy = LegacyDatabase(
      NativeDatabase(File('${directory.path}/legacy.sqlite')),
    );
    final legacyStore = LocalStore(legacy, PayloadCipher(vault));
    await legacyStore.saveDraft('user-a', draft('legacy draft'));
    await legacyStore.commitLocalCompletion(
      'user-a',
      'proof-1',
      {'quantity': 12},
      const PendingOperation(
        id: 'op-1',
        entityId: 'stop-1',
        type: 'delivery_recorded',
        payload: {'quantity': 12},
      ),
    );
    await legacy.close();
    db = LocalDatabase(NativeDatabase(File('${directory.path}/legacy.sqlite')));
    store = LocalStore(db, PayloadCipher(vault));
    expect((await store.loadDraft('user-a', 'draft-1'))?.note, 'legacy draft');
    expect(await store.queuedCount('user-a'), 1);
    expect(
      await DatabaseSyncLock(db).acquire(
        'user-a',
        'worker-1',
        DateTime.utc(2026),
        const Duration(minutes: 1),
      ),
      isTrue,
    );
  });
  test(
    'sync leases exclude a second worker, expire and are owner-bound',
    () async {
      final lock = DatabaseSyncLock(db);
      final now = DateTime.utc(2026);
      expect(
        await lock.acquire(
          'user-a',
          'worker-1',
          now,
          const Duration(seconds: 30),
        ),
        isTrue,
      );
      expect(
        await lock.acquire(
          'user-a',
          'worker-2',
          now,
          const Duration(seconds: 30),
        ),
        isFalse,
      );
      await lock.release('user-a', 'worker-2');
      expect(
        await lock.acquire(
          'user-a',
          'worker-2',
          now,
          const Duration(seconds: 30),
        ),
        isFalse,
      );
      expect(
        await lock.acquire(
          'user-b',
          'worker-2',
          now,
          const Duration(seconds: 30),
        ),
        isTrue,
      );
      expect(
        await lock.acquire(
          'user-a',
          'worker-2',
          now.add(const Duration(seconds: 31)),
          const Duration(seconds: 30),
        ),
        isTrue,
      );
      expect(
        await lock.renew(
          'user-a',
          'worker-1',
          now,
          const Duration(seconds: 30),
        ),
        isFalse,
      );
    },
  );
  test(
    'lost key cannot silently recreate and overwrite existing data',
    () async {
      await store.saveDraft('user-a', draft('keep me'));
      final locked = LocalStore(db, PayloadCipher(MemoryKeyVault()));
      await expectLater(
        locked.loadDraft('user-a', 'draft-1'),
        throwsA(isA<StorageFailure>()),
      );
      await expectLater(
        locked.saveDraft('user-a', draft('replacement')),
        throwsA(isA<StorageFailure>()),
      );
      expect((await store.loadDraft('user-a', 'draft-1'))?.note, 'keep me');
    },
  );
}
