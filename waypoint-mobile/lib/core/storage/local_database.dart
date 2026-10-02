import 'package:drift/drift.dart';

enum LocalTable {
  routeSnapshots('route_snapshots'),
  manifestLines('manifest_lines'),
  drafts('drafts'),
  evidence('evidence_metadata'),
  proofs('proof_records'),
  outbox('outbox_operations'),
  activity('activity'),
  checkpoints('sync_checkpoints'),
  orders('cached_orders'),
  orderDrafts('order_drafts'),
  notifications('notifications');

  const LocalTable(this.sqlName);
  final String sqlName;
}

/// Explicit SQL schema: no generated ORM entities or destructive fallback.
class LocalDatabase extends GeneratedDatabase {
  LocalDatabase(super.executor);
  @override
  int get schemaVersion => 2;
  @override
  Iterable<TableInfo<Table, dynamic>> get allTables => const [];
  @override
  Iterable<DatabaseSchemaEntity> get allSchemaEntities => const [];

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (_) async {
      await createV1();
      await _createLeases();
    },
    onUpgrade: (_, from, to) async {
      if (from == 1 && to == 2) {
        await _createLeases();
      } else {
        throw StateError(
          'Unsupported migration; existing records have been retained.',
        );
      }
    },
    beforeOpen: (_) async {
      await customStatement('PRAGMA foreign_keys = ON');
      await customStatement('PRAGMA synchronous = FULL');
    },
  );

  Future<void> createV1() async {
    for (final table in LocalTable.values) {
      final name = table.sqlName;
      await customStatement(
        'CREATE TABLE $name (user_id TEXT NOT NULL, id TEXT NOT NULL, '
        'entity_id TEXT NOT NULL, status TEXT NOT NULL, payload BLOB NOT NULL, '
        'payload_version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, '
        'PRIMARY KEY (user_id, id))',
      );
      await customStatement(
        'CREATE INDEX idx_${name}_user_entity ON $name(user_id, entity_id)',
      );
    }
  }

  Future<void> _createLeases() => customStatement(
    'CREATE TABLE sync_leases '
    '(user_id TEXT PRIMARY KEY, owner TEXT NOT NULL, expires_at INTEGER NOT NULL)',
  );
}
