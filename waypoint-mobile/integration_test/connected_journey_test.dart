import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import 'package:waypoint_mobile/app/environment.dart';
import 'package:waypoint_mobile/core/auth/authentication_repository.dart';
import 'package:waypoint_mobile/core/data/operational_repository.dart';
import 'package:waypoint_mobile/core/network/api_client.dart';
import 'package:waypoint_mobile/core/storage/local_database.dart';
import 'package:waypoint_mobile/core/storage/storage_runtime.dart';
import 'package:waypoint_mobile/core/sync/sync_lock.dart';
import 'package:waypoint_mobile/core/sync/sync_worker.dart';
import 'package:waypoint_mobile/features/driver_route/connected_route_repository.dart';
import 'package:waypoint_mobile/domain/models.dart';

class LostResponseTransport implements MutationTransport {
  LostResponseTransport(this.delegate);
  final MutationTransport delegate;
  bool lose = true;
  @override
  Future<void> upload(
    String userId,
    Map<String, dynamic> operation,
    String evidenceId, {
    String? reviewOperationId,
  }) => delegate.upload(
    userId,
    operation,
    evidenceId,
    reviewOperationId: reviewOperationId,
  );
  @override
  Future<Map<String, dynamic>> submit(
    String userId,
    Map<String, dynamic> request,
  ) async {
    final receipt = await delegate.submit(userId, request);
    if (lose) {
      lose = false;
      throw const SyncFailure(
        503,
        'response_lost',
        'Test drops only the acknowledgment after the real commit.',
      );
    }
    return receipt;
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets(
    'native identity → cached route → durable POD → lost receipt replay → Store receipt/note',
    (tester) async {
      final config = AppConfig.fromDefines();
      expect(config.authEmulatorHost, isNotEmpty);
      expect(config.firebaseProjectId, startsWith('demo-'));
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: Text('Connected emulator verification')),
        ),
      );
      final auth = await FirebaseAuthenticationRepository.initialize(config);
      var storage = await openStorage();
      expect(storage.error, isNull);
      // Explicitly synthetic identities only; never deletes a non-test user's records.
      for (final user in ['test-driver', 'test-store']) {
        for (final table in LocalTable.values) {
          await storage.store!.db.customStatement(
            'DELETE FROM ${table.sqlName} WHERE user_id=?',
            [user],
          );
        }
      }
      Principal? current = await auth.signIn(
        'test-driver@emulator.waypoint.test',
        'local-emulator-only',
      );
      expect(current.role, MobileRole.driver);
      final api = ApiClient(config, auth);
      var repo = OperationalRepository(api, storage.store!, () => current);
      final route = await ConnectedRouteRepository(repo).assignedRoute(current);
      expect(route!.released, true);
      expect(route.stops.length, 2);
      final start = PendingOperation(
        id: const Uuid().v4(),
        entityId: route.tripId,
        type: 'trip_start',
        tripId: route.tripId,
        observedAt: DateTime.now(),
        concurrency: {
          'assignmentVersion': route.assignmentVersion,
          'releaseVersion': route.releaseVersion,
        },
        payload: {'parkedAcknowledged': true},
      );
      await repo.queue(current, start);
      var worker = SyncWorker(
        storage.store!,
        HttpMutationTransport(api, storage.store!, storage.media!),
        DatabaseSyncLock(storage.store!.db),
        () => current,
      );
      final startResult = await worker.run(manual: true);
      expect(
        startResult.accepted,
        1,
        reason:
            (await storage.store!.read(
                  LocalTable.outbox,
                  current.userId,
                  start.id,
                ))?['message']
                as String?,
      );
      final updated = (await ConnectedRouteRepository(
        repo,
      ).assignedRoute(current))!;
      final stop = updated.stops.first;
      final tmp = await getTemporaryDirectory();
      final source = File('${tmp.path}/connected-test.png');
      await source.writeAsBytes(
        base64Decode(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZfkAAAAASUVORK5CYII=',
        ),
        flush: true,
      );
      final photo = await storage.media!.importFile(
        current.userId,
        source.path,
        mime: 'image/png',
      );
      await storage.store!.write(
        LocalTable.evidence,
        current.userId,
        photo.id,
        stop.stopId,
        {
          'id': photo.id,
          'path': photo.path,
          'mime': photo.mime,
          'bytes': photo.bytes,
        },
      );
      await source.delete();
      final proofId = const Uuid().v4(), operationId = const Uuid().v4();
      final payload = {
        'proofId': proofId,
        'outcome': 'full',
        'parkedAcknowledged': true,
        'recipientName': 'Synthetic recipient',
        'reason': '',
        'note': 'Emulator integration fixture',
        'lines': stop.lines
            .map(
              (l) => {
                'lineId': l.lineId,
                'unit': l.unit,
                'deliveredQty': l.quantity,
                'reason': '',
              },
            )
            .toList(),
        'evidenceIds': [photo.id],
      };
      final operation = PendingOperation(
        id: operationId,
        entityId: stop.stopId,
        type: 'delivery_recorded',
        tripId: updated.tripId,
        stopId: stop.stopId,
        orderId: stop.orderId,
        observedAt: DateTime.now(),
        dependencyIds: [start.id],
        evidenceIds: [photo.id],
        concurrency: {
          'assignmentVersion': updated.assignmentVersion,
          'stopManifestRevision': stop.manifestRevision,
          'stopDeliveryVersion': stop.deliveryVersion,
          'orderFulfillmentVersions': {
            stop.orderId: stop.orderFulfillmentVersion,
          },
        },
        payload: payload,
      );
      await repo.complete(current, proofId, payload, operation);
      await storage.store!.db.close();
      storage = await openStorage();
      repo = OperationalRepository(api, storage.store!, () => current);
      expect(
        (await storage.store!.read(
          LocalTable.proofs,
          current.userId,
          proofId,
        ))!['proofId'],
        proofId,
      );
      final transport = LostResponseTransport(
        HttpMutationTransport(api, storage.store!, storage.media!),
      );
      worker = SyncWorker(
        storage.store!,
        transport,
        DatabaseSyncLock(storage.store!.db),
        () => current,
      );
      expect((await worker.run(manual: true)).accepted, 0);
      expect((await worker.run(manual: true)).accepted, 1);
      final saved = await storage.store!.read(
        LocalTable.outbox,
        current.userId,
        operationId,
      );
      expect((saved!['acknowledgment'] as Map)['status'], 'already_applied');
      await auth.signOut();
      current = null;
      current = await auth.signIn(
        'test-store@emulator.waypoint.test',
        'local-emulator-only',
      );
      expect(
        await storage.store!.read(LocalTable.proofs, current.userId, proofId),
        isNull,
      );
      final catalogue = (await repo.read(
        'store/catalogue',
        'catalogue',
        current,
      )).data;
      final options = catalogue['serviceOptions'] as Map;
      final createOrder = PendingOperation(
        id: const Uuid().v4(),
        entityId: const Uuid().v4(),
        type: 'store_order_created',
        observedAt: DateTime.now(),
        payload: {
          'requestedDate': (options['serviceDates'] as List).first,
          'catalogueRevision': catalogue['revision'],
          'serviceOptionsVersion': options['version'],
          'note': 'Native canonical order check',
          'lines': [
            {'productId': 'MILK-CASE', 'quantity': 2, 'unit': 'case'},
          ],
        },
      );
      await repo.queue(current, createOrder);
      expect((await worker.run(manual: true)).accepted, 1);
      final createdOperation = await storage.store!.read(
        LocalTable.outbox,
        current.userId,
        createOrder.id,
      );
      final createdOrderId =
          (createdOperation!['acknowledgment'] as Map)['orderId'] as String;
      final createdOrder = (await repo.read(
        'store/orders/$createdOrderId',
        'created-order',
        current,
      )).data;
      expect(createdOrder['orderWeightKg'], 24);
      expect(createdOrder['status'], 'pending');
      final order = (await repo.read(
        'store/orders/${stop.orderId}',
        'order/${stop.orderId}',
        current,
      )).data;
      expect(order['status'], 'delivered');
      final receipt = PendingOperation(
        id: const Uuid().v4(),
        entityId: stop.orderId,
        type: 'receipt_recorded',
        orderId: stop.orderId,
        observedAt: DateTime.now(),
        concurrency: {
          'receiptVersion': order['receiptVersion'],
          'proofVersion': order['proofVersion'],
        },
        payload: {
          'lines': (order['deliveredLines'] as List)
              .map(
                (l) => {
                  'lineId': l['lineId'],
                  'unit': l['unit'],
                  'receivedQty': l['deliveredQty'],
                  'reason': '',
                },
              )
              .toList(),
          'note': '',
          'evidenceIds': [],
        },
      );
      await repo.queue(current, receipt);
      expect((await worker.run(manual: true)).accepted, 1);
      final note = (await repo.read(
        'store/orders/${stop.orderId}/delivery-note',
        'note',
        current,
      )).data;
      expect(note['reference'], 'DN-${stop.orderId}');
      await repo.refreshNotifications(current);
      expect(
        await storage.store!.list(current.userId, LocalTable.notifications),
        isNotEmpty,
      );
      await auth.signOut();
      current = null;
      await storage.store!.db.close();
    },
    timeout: const Timeout(Duration(minutes: 5)),
  );
}
