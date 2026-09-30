import 'package:drift/drift.dart';
import '../storage/local_database.dart';

abstract interface class SyncLock {
  Future<bool> acquire(
    String userId,
    String owner,
    DateTime now,
    Duration duration,
  );
  Future<bool> renew(
    String userId,
    String owner,
    DateTime now,
    Duration duration,
  );
  Future<void> release(String userId, String owner);
}

class DatabaseSyncLock implements SyncLock {
  DatabaseSyncLock(this.db);
  final LocalDatabase db;
  @override
  Future<bool> acquire(
    String userId,
    String owner,
    DateTime now,
    Duration duration,
  ) => db.transaction(() async {
    final rows = await db
        .customSelect(
          'SELECT owner,expires_at FROM sync_leases WHERE user_id=?',
          variables: [Variable.withString(userId)],
        )
        .get();
    if (rows.isNotEmpty &&
        rows.first.read<int>('expires_at') > now.millisecondsSinceEpoch) {
      return false;
    }
    await db.customStatement(
      'INSERT INTO sync_leases(user_id,owner,expires_at) VALUES(?,?,?) '
      'ON CONFLICT(user_id) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at',
      [userId, owner, now.add(duration).millisecondsSinceEpoch],
    );
    return true;
  });
  @override
  Future<bool> renew(
    String userId,
    String owner,
    DateTime now,
    Duration duration,
  ) async {
    final changed = await db.customUpdate(
      'UPDATE sync_leases SET expires_at=? WHERE user_id=? AND owner=? AND expires_at>?',
      variables: [
        Variable.withInt(now.add(duration).millisecondsSinceEpoch),
        Variable.withString(userId),
        Variable.withString(owner),
        Variable.withInt(now.millisecondsSinceEpoch),
      ],
    );
    return changed == 1;
  }

  @override
  Future<void> release(String userId, String owner) => db.customStatement(
    'DELETE FROM sync_leases WHERE user_id=? AND owner=?',
    [userId, owner],
  );
}
