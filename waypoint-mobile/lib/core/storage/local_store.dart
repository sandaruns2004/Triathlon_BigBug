import 'dart:convert';
import 'package:drift/drift.dart';
import '../../domain/models.dart';
import 'local_database.dart';
import 'payload_cipher.dart';

abstract interface class DraftRepository {
  Future<LocalDraft?> loadDraft(String userId, String id);
  Future<void> saveDraft(String userId, LocalDraft draft);
}

class LocalStore implements DraftRepository {
  LocalStore(this.db, this.cipher);
  final LocalDatabase db;
  final PayloadCipher cipher;

  Future<bool> hasUserData(String userId) async {
    for (final table in LocalTable.values) {
      final rows = await db
          .customSelect(
            'SELECT 1 FROM ${table.sqlName} WHERE user_id = ? LIMIT 1',
            variables: [Variable.withString(userId)],
          )
          .get();
      if (rows.isNotEmpty) return true;
    }
    return false;
  }

  Future<void> write(
    LocalTable table,
    String userId,
    String id,
    String entityId,
    Map<String, dynamic> data, {
    String status = 'draft',
  }) async {
    try {
      final sealed = await cipher.seal(
        userId,
        '${table.sqlName}/$id',
        utf8.encode(jsonEncode(data)),
        createKey: !await hasUserData(userId),
      );
      await db.customStatement(
        'INSERT INTO ${table.sqlName}(user_id,id,entity_id,status,payload,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET entity_id=excluded.entity_id, status=excluded.status, payload=excluded.payload,updated_at=excluded.updated_at',
        [
          userId,
          id,
          entityId,
          status,
          sealed,
          DateTime.now().toUtc().toIso8601String(),
        ],
      );
    } catch (_) {
      throw const StorageFailure(
        'Could not save on this phone. Previous records are retained. Free storage or retry.',
      );
    }
  }

  Future<Map<String, dynamic>?> read(
    LocalTable table,
    String userId,
    String id,
  ) async {
    try {
      final row = await db
          .customSelect(
            'SELECT payload FROM ${table.sqlName} WHERE user_id=? AND id=?',
            variables: [Variable.withString(userId), Variable.withString(id)],
          )
          .getSingleOrNull();
      if (row == null) return null;
      final clear = await cipher.open(
        userId,
        '${table.sqlName}/$id',
        row.read<Uint8List>('payload'),
      );
      return jsonDecode(utf8.decode(clear)) as Map<String, dynamic>;
    } catch (_) {
      throw const StorageFailure(
        'Could not unlock the saved record. It has been retained; retry or contact support.',
      );
    }
  }

  @override
  Future<void> saveDraft(String userId, LocalDraft draft) => db.transaction(
    () => write(
      LocalTable.drafts,
      userId,
      draft.id,
      draft.entityId,
      draft.toJson(),
    ),
  );
  @override
  Future<LocalDraft?> loadDraft(String userId, String id) async {
    final json = await read(LocalTable.drafts, userId, id);
    return json == null ? null : LocalDraft.fromJson(json);
  }

  Future<void> commitLocalCompletion(
    String userId,
    String proofId,
    Map<String, dynamic> proof,
    PendingOperation operation,
  ) async {
    await db.transaction(() async {
      await _guardDuplicate(userId, operation);
      // INSERT only for immutable proof/outbox; reusing an ID never overwrites evidence.
      for (final entry in [
        (LocalTable.proofs, proofId, proof),
        (LocalTable.outbox, operation.id, operation.toJson()),
      ]) {
        final sealed = await cipher.seal(
          userId,
          '${entry.$1.sqlName}/${entry.$2}',
          utf8.encode(jsonEncode(entry.$3)),
          createKey: !await hasUserData(userId),
        );
        await db.customStatement(
          'INSERT INTO ${entry.$1.sqlName}(user_id,id,entity_id,status,payload,updated_at) VALUES(?,?,?,?,?,?)',
          [
            userId,
            entry.$2,
            operation.entityId,
            'queued',
            sealed,
            DateTime.now().toUtc().toIso8601String(),
          ],
        );
      }
    });
  }

  Future<int> queuedCount(String userId) async {
    final row = await db
        .customSelect(
          "SELECT COUNT(*) AS count FROM outbox_operations WHERE user_id=? AND status!='synced'",
          variables: [Variable.withString(userId)],
        )
        .getSingle();
    return row.read<int>('count');
  }

  Future<List<Map<String, dynamic>>> list(
    String userId,
    LocalTable table,
  ) async {
    final rows = await db
        .customSelect(
          'SELECT id FROM ${table.sqlName} WHERE user_id=? ORDER BY updated_at DESC',
          variables: [Variable.withString(userId)],
        )
        .get();
    final result = <Map<String, dynamic>>[];
    for (final row in rows) {
      final value = await read(table, userId, row.read<String>('id'));
      if (value != null) result.add(value);
    }
    return result;
  }

  Future<void> enqueue(String userId, PendingOperation operation) async {
    try {
      await db.transaction(() async {
        await _guardDuplicate(userId, operation);
        final sealed = await cipher.seal(
          userId,
          '${LocalTable.outbox.sqlName}/${operation.id}',
          utf8.encode(jsonEncode(operation.toJson())),
          createKey: !await hasUserData(userId),
        );
        await db.customStatement(
          'INSERT INTO outbox_operations(user_id,id,entity_id,status,payload,updated_at) VALUES(?,?,?,?,?,?)',
          [
            userId,
            operation.id,
            operation.entityId,
            'queued',
            sealed,
            DateTime.now().toUtc().toIso8601String(),
          ],
        );
      });
    } catch (_) {
      throw const StorageFailure(
        'Could not save this operation. Previous work is retained; retry.',
      );
    }
  }

  Future<void> _guardDuplicate(
    String userId,
    PendingOperation operation,
  ) async {
    if (!{
      'trip_start',
      'trip_closeout',
      'store_order_created',
      'receipt_recorded',
      'delivery_recorded',
    }.contains(operation.type)) {
      return;
    }
    final rows = await db
        .customSelect(
          'SELECT id FROM outbox_operations WHERE user_id=? AND entity_id=?',
          variables: [
            Variable.withString(userId),
            Variable.withString(operation.entityId),
          ],
        )
        .get();
    for (final row in rows) {
      final old = await read(LocalTable.outbox, userId, row.read<String>('id'));
      final followup =
          old?['status'] == 'retainedForAudit' &&
          (old?['review'] as Map?)?['status'] == 'request_followup';
      if (old?['type'] == operation.type &&
          old?['status'] != 'rejected' &&
          !followup) {
        throw const StorageFailure(
          'This action is already saved. Check its result in Sync Centre.',
        );
      }
    }
  }

  Future<void> updateOperation(
    String userId,
    String id, {
    required String status,
    String? message,
    String? failureCode,
    int? attempts,
    DateTime? nextAttemptAt,
    Map<String, dynamic>? acknowledgment,
    Map<String, dynamic>? review,
  }) => db.transaction(() async {
    final existing = await read(LocalTable.outbox, userId, id);
    if (existing == null) {
      throw const StorageFailure('Saved operation was not found.');
    }
    // Only delivery metadata changes; the original request/evidence IDs stay immutable.
    final updated = {
      ...existing,
      'status': status,
      'message': message,
      'failureCode': failureCode,
      'attempts': ?attempts,
      'nextAttemptAt': nextAttemptAt?.toUtc().toIso8601String(),
      'acknowledgment': ?acknowledgment,
      'review': ?review,
    };
    if (acknowledgment != null &&
        (acknowledgment['operationId'] != id ||
            ![
              'accepted',
              'already_applied',
            ].contains(acknowledgment['status']))) {
      throw const StorageFailure(
        'Server acknowledgment does not match this operation.',
      );
    }
    await write(
      LocalTable.outbox,
      userId,
      id,
      existing['entityId'] as String,
      updated,
      status: status,
    );
    if (acknowledgment != null) {
      await write(
        LocalTable.activity,
        userId,
        id,
        existing['entityId'] as String,
        {
          'operationId': id,
          'type': existing['type'],
          'acknowledgment': acknowledgment,
        },
        status: 'synced',
      );
    }
  });
}
