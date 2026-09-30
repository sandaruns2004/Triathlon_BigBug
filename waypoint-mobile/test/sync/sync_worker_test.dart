import 'dart:convert';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uuid/uuid.dart';
import 'package:waypoint_mobile/core/storage/key_vault.dart';
import 'package:waypoint_mobile/core/storage/local_database.dart';
import 'package:waypoint_mobile/core/storage/local_store.dart';
import 'package:waypoint_mobile/core/storage/payload_cipher.dart';
import 'package:waypoint_mobile/core/sync/sync_lock.dart';
import 'package:waypoint_mobile/core/sync/sync_worker.dart';
import 'package:waypoint_mobile/domain/models.dart';

class FakeTransport implements MutationTransport {
  final calls = <Map<String, dynamic>>[];
  Future<Map<String, dynamic>> Function(Map<String, dynamic>)? action;
  @override
  Future<void> upload(
    String userId,
    Map<String, dynamic> operation,
    String evidenceId, {
    String? reviewOperationId,
  }) async {}
  @override
  Future<Map<String, dynamic>> submit(
    String userId,
    Map<String, dynamic> request,
  ) async {
    calls.add(jsonDecode(jsonEncode(request)) as Map<String, dynamic>);
    return action == null
        ? {'operationId': request['operationId'], 'status': 'accepted'}
        : action!(request);
  }
}

void main() {
  late LocalDatabase db;
  late LocalStore store;
  late FakeTransport transport;
  late SyncWorker worker;
  Principal? current;
  setUp(() {
    db = LocalDatabase(NativeDatabase.memory());
    store = LocalStore(db, PayloadCipher(MemoryKeyVault()));
    transport = FakeTransport();
    current = Principal(
      userId: 'driver-a',
      name: 'Driver A',
      role: MobileRole.driver,
      depot: 'Peliyagoda',
      offlineExpiresAt: DateTime.now().add(const Duration(hours: 1)),
    );
    worker = SyncWorker(store, transport, DatabaseSyncLock(db), () => current);
  });
  tearDown(() async {
    await db.close();
  });
  PendingOperation op(
    String entity,
    String type, {
    List<String> dependencies = const [],
    int seconds = 0,
  }) => PendingOperation(
    id: const Uuid().v4(),
    entityId: entity,
    type: type,
    tripId: 'TRIP-1',
    observedAt: DateTime.now().add(Duration(seconds: seconds)),
    dependencyIds: dependencies,
    payload: {'immutable': 'original'},
    ownerScope: const {
      'role': 'driver',
      'depot': 'Peliyagoda',
      'outletId': null,
    },
  );
  test('lost response replays the same immutable ID and request', () async {
    final operation = op('STOP-1', 'delivery_recorded');
    await store.enqueue('driver-a', operation);
    var first = true;
    transport.action = (request) async {
      if (first) {
        first = false;
        throw const SyncFailure(503, 'lost_response', 'Server receipt lost.');
      }
      return {
        'operationId': request['operationId'],
        'status': 'already_applied',
      };
    };
    expect((await worker.run(manual: true)).accepted, 0);
    final retained = await store.read(
      LocalTable.outbox,
      'driver-a',
      operation.id,
    );
    expect(retained!['status'], 'retryableError');
    expect((await worker.run(manual: true)).accepted, 1);
    expect(transport.calls[0], transport.calls[1]);
    expect(
      (await store.read(
        LocalTable.outbox,
        'driver-a',
        operation.id,
      ))!['status'],
      'synced',
    );
  });
  test('same user with changed depot cannot replay earlier scope', () async {
    final operation = op('STOP-1', 'delivery_recorded');
    await store.enqueue('driver-a', operation);
    current = Principal(
      userId: 'driver-a',
      name: 'Driver A',
      role: MobileRole.driver,
      depot: 'Ratmalana',
      offlineExpiresAt: DateTime.now().add(const Duration(hours: 1)),
    );
    expect((await worker.run(manual: true)).accepted, 0);
    expect(transport.calls, isEmpty);
    expect(
      (await store.read(
        LocalTable.outbox,
        'driver-a',
        operation.id,
      ))!['status'],
      'authRequired',
    );
  });
  test(
    'dependencies submit before proof and partial failure stays pending',
    () async {
      final start = op('TRIP-1', 'trip_start', seconds: -3),
          proof = op(
            'STOP-1',
            'delivery_recorded',
            dependencies: [],
            seconds: -1,
          );
      final dependent = PendingOperation(
        id: proof.id,
        entityId: proof.entityId,
        type: proof.type,
        tripId: proof.tripId,
        dependencyIds: [start.id],
        observedAt: proof.observedAt,
        payload: proof.payload,
        ownerScope: proof.ownerScope,
      );
      await store.enqueue('driver-a', dependent);
      await store.enqueue('driver-a', start);
      transport.action = (r) async {
        if (r['operationId'] == proof.id) {
          throw const SyncFailure(503, 'timeout', 'Retry.');
        }
        return {'operationId': r['operationId'], 'status': 'accepted'};
      };
      final result = await worker.run(manual: true);
      expect(result.accepted, 1);
      expect(result.remaining, 1);
      expect(transport.calls.map((r) => r['operationId']), [
        start.id,
        proof.id,
      ]);
    },
  );
  test(
    '401 pauses uploads; revision conflicts retain original proof',
    () async {
      final a = op('STOP-1', 'delivery_recorded', seconds: -1),
          b = op('STOP-2', 'delivery_recorded');
      await store.enqueue('driver-a', a);
      await store.enqueue('driver-a', b);
      transport.action = (r) async =>
          throw const SyncFailure(401, 'reauthenticate', 'Sign in.');
      await worker.run(manual: true);
      expect(transport.calls.length, 1);
      expect(
        (await store.read(LocalTable.outbox, 'driver-a', a.id))!['status'],
        'authRequired',
      );
      transport.action = (r) async => throw const SyncFailure(
        409,
        'manifest_changed',
        'Compare original proof.',
      );
      await worker.run(manual: true);
      final saved = await store.read(LocalTable.outbox, 'driver-a', a.id);
      expect(saved!['status'], 'conflict');
      expect((saved['request'] as Map)['payload'], a.payload);
      final calls = transport.calls.length;
      await worker.run(manual: true);
      expect(transport.calls.length, calls);
    },
  );
  test('wrong acknowledgment cannot mark an operation accepted', () async {
    final a = op('STOP-1', 'delivery_recorded');
    await store.enqueue('driver-a', a);
    transport.action = (r) async => {
      'operationId': const Uuid().v4(),
      'status': 'accepted',
    };
    expect((await worker.run(manual: true)).accepted, 0);
    expect(
      (await store.read(LocalTable.outbox, 'driver-a', a.id))!['status'],
      'retryableError',
    );
  });
  test(
    'account change during response cannot accept or expose another account work',
    () async {
      final a = op('STOP-1', 'delivery_recorded');
      await store.enqueue('driver-a', a);
      transport.action = (r) async {
        current = Principal(
          userId: 'driver-b',
          name: 'B',
          role: MobileRole.driver,
          offlineExpiresAt: DateTime.now().add(const Duration(hours: 1)),
        );
        return {'operationId': r['operationId'], 'status': 'accepted'};
      };
      expect((await worker.run(manual: true)).accepted, 0);
      expect(
        (await store.read(LocalTable.outbox, 'driver-a', a.id))!['status'],
        isNot('synced'),
      );
      expect(await store.list('driver-b', LocalTable.outbox), isEmpty);
    },
  );
  test(
    'double tap creates only one critical operation; rejected original remains immutable',
    () async {
      final a = op('TRIP-1', 'trip_start'), b = op('TRIP-1', 'trip_start');
      final results = await Future.wait([
        store
            .enqueue('driver-a', a)
            .then((_) => true)
            .catchError((Object _) => false),
        store
            .enqueue('driver-a', b)
            .then((_) => true)
            .catchError((Object _) => false),
      ]);
      expect(results.where((v) => v).length, 1);
      expect((await store.list('driver-a', LocalTable.outbox)).length, 1);
      final saved = (await store.list('driver-a', LocalTable.outbox)).single;
      await store.updateOperation(
        'driver-a',
        saved['id'] as String,
        status: 'rejected',
        message: 'Review fields.',
      );
      final replacement = op('TRIP-1', 'trip_start');
      await store.enqueue('driver-a', replacement);
      expect(
        (await store.read(
          LocalTable.outbox,
          'driver-a',
          saved['id'] as String,
        ))!['request'],
        saved['request'],
      );
    },
  );
  test('expired offline lease never submits or deletes saved work', () async {
    final a = op('STOP-1', 'delivery_recorded');
    await store.enqueue('driver-a', a);
    current = Principal(
      userId: 'driver-a',
      name: 'A',
      role: MobileRole.driver,
      offlineExpiresAt: DateTime.now().subtract(const Duration(seconds: 1)),
    );
    await worker.run(manual: true);
    expect(transport.calls, isEmpty);
    expect(await store.queuedCount('driver-a'), 1);
  });
}
