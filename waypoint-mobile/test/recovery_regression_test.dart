// Fault-injection coverage for the mobile review's recovery regressions.
import 'dart:convert';
import 'dart:io';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uuid/uuid.dart';
import 'package:waypoint_mobile/app/environment.dart';
import 'package:waypoint_mobile/app/providers.dart';
import 'package:waypoint_mobile/core/data/operational_repository.dart';
import 'package:waypoint_mobile/core/network/api_client.dart';
import 'package:waypoint_mobile/core/storage/key_vault.dart';
import 'package:waypoint_mobile/core/storage/local_database.dart';
import 'package:waypoint_mobile/core/storage/local_store.dart';
import 'package:waypoint_mobile/core/storage/payload_cipher.dart';
import 'package:waypoint_mobile/core/storage/storage_runtime.dart';
import 'package:waypoint_mobile/core/storage/storage_runtime_preview.dart';
import 'package:waypoint_mobile/core/sync/sync_lock.dart';
import 'package:waypoint_mobile/core/sync/sync_worker.dart';
import 'package:waypoint_mobile/core/theme/waypoint_theme.dart';
import 'package:waypoint_mobile/domain/models.dart';
import 'package:waypoint_mobile/features/connected/proof_page.dart';
import 'package:waypoint_mobile/features/connected/store_pages.dart';
import 'package:waypoint_mobile/features/authentication/sign_in_page.dart';
import 'package:waypoint_mobile/features/driver_route/route_repository.dart';

class AckFailureStore extends LocalStore {
  AckFailureStore(super.db, super.cipher);
  bool fail = true;
  @override
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
  }) async {
    if (status == 'synced' && fail) {
      fail = false;
      throw const StorageFailure(
        'Synthetic local acknowledgment write failure',
      );
    }
    await super.updateOperation(
      userId,
      id,
      status: status,
      message: message,
      failureCode: failureCode,
      attempts: attempts,
      nextAttemptAt: nextAttemptAt,
      acknowledgment: acknowledgment,
      review: review,
    );
  }
}

class Transport implements MutationTransport {
  int calls = 0;
  bool closeoutNotReady = false;
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
    calls++;
    if (closeoutNotReady) {
      throw const SyncFailure(409, 'closeout_not_ready', 'Unresolved stops');
    }
    return {'operationId': request['operationId'], 'status': 'accepted'};
  }
}

class Tokens implements TokenSource {
  @override
  Future<String?> idToken() async => 'synthetic';
}

class Route implements RouteRepository {
  Route(this.value);
  final RouteSnapshot value;
  @override
  Future<RouteSnapshot?> assignedRoute(Principal principal) async => value;
}

class Catalogue extends OperationalRepository {
  Catalogue(super.api, super.store, super.currentPrincipal);
  @override
  Future<CachedRead> read(
    String path,
    String cacheId,
    Principal principal, {
    LocalTable table = LocalTable.orders,
  }) async => CachedRead(
    {
      'revision': 2,
      'products': [
        {'productId': 'milk', 'name': 'Milk', 'unit': 'kg', 'maxQuantity': 100},
      ],
      'serviceOptions': {
        'version': 2,
        'serviceDates': ['2030-10-02'],
        'cutoff': '11:00',
        'window': '06:00–08:00',
      },
    },
    DateTime.now(),
    fromCache: false,
  );
}

void main() {
  final config = AppConfig(
    environment: AppEnvironment.development,
    fixtureMode: false,
    apiBaseUrl: Uri.parse('http://localhost/'),
    socketUrl: Uri.parse('http://localhost/'),
  );
  Principal principal(String depot) => Principal(
    userId: 'review-driver',
    name: 'Synthetic review driver',
    role: MobileRole.driver,
    depot: depot,
    offlineExpiresAt: DateTime.now().add(const Duration(hours: 1)),
  );
  PendingOperation operation(
    Principal owner, {
    String type = 'delivery_recorded',
  }) => PendingOperation(
    id: const Uuid().v4(),
    entityId: 'review-entity',
    type: type,
    observedAt: DateTime.now(),
    payload: const {},
    ownerScope: {'role': 'driver', 'depot': owner.depot, 'outletId': null},
  );

  testWidgets('unavailable storage explains the failure and blocks sign-in', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          configProvider.overrideWithValue(config),
          storageProvider.overrideWithValue(
            const StorageRuntime(
              drafts: UnavailableDraftRepository(),
              error: 'Synthetic storage unavailable',
            ),
          ),
        ],
        child: MaterialApp(
          theme: buildWaypointTheme(),
          home: const ConnectedSignInPage(),
        ),
      ),
    );
    expect(find.text('Synthetic storage unavailable'), findsOneWidget);
    expect(
      tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
      isNull,
    );
  });

  for (final variant in ['changed', 'unchanged', 'legacy']) {
    testWidgets(
      'restored cart $variant preserves or explicitly reviews unit meaning',
      (tester) async {
        final db = LocalDatabase(NativeDatabase.memory());
        final store = LocalStore(db, PayloadCipher(MemoryKeyVault()));
        final owner = Principal(
          userId: 'review-store',
          name: 'Synthetic Store',
          role: MobileRole.store,
          outletId: 'review-outlet',
          offlineExpiresAt: DateTime.now().add(const Duration(hours: 1)),
        );
        await store.write(
          LocalTable.drafts,
          owner.userId,
          'cart/review-outlet',
          'cart/review-outlet',
          {
            'operationId': const Uuid().v4(),
            'draftId': const Uuid().v4(),
            'requestedDate': '2030-10-02',
            'quantities': {'milk': 10},
            if (variant != 'legacy')
              'products': {
                'milk': {'unit': variant == 'changed' ? 'case' : 'kg'},
              },
          },
        );
        final container = ProviderContainer(
          overrides: [
            sessionProvider.overrideWith((ref) => owner),
            operationalProvider.overrideWithValue(
              Catalogue(ApiClient(config, Tokens()), store, () => owner),
            ),
          ],
        );
        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: MaterialApp(
              theme: buildWaypointTheme(),
              home: const Scaffold(body: StoreComposerPage()),
            ),
          ),
        );
        for (var i = 0; i < 25; i++) {
          await tester.runAsync(
            () => Future<void>.delayed(const Duration(milliseconds: 20)),
          );
          await tester.pump();
          if (find.byType(TextField).evaluate().isNotEmpty) break;
        }
        expect(tester.takeException(), isNull);
        final quantity = tester
            .widgetList<TextField>(find.byType(TextField))
            .firstWhere(
              (field) => field.decoration?.labelText == 'Quantity (kg)',
            );
        expect(quantity.controller!.text, variant == 'unchanged' ? '10' : '0');
        expect(
          find.byType(CheckboxListTile),
          variant == 'unchanged' ? findsNothing : findsOneWidget,
        );
        await tester.pumpWidget(const SizedBox());
        Map<String, dynamic>? retained;
        await tester.runAsync(() async {
          await Future<void>.delayed(const Duration(milliseconds: 50));
          retained = await store.read(
            LocalTable.drafts,
            owner.userId,
            'cart/review-outlet',
          );
        });
        expect((retained!['products'] as Map)['milk']['unit'], 'kg');
        if (variant != 'unchanged') {
          expect(retained!['catalogueChanges'], isNotEmpty);
        }
        container.dispose();
        await db.close();
      },
    );
  }

  test(
    'accepted receipt write failure replays the same operation after recovery',
    () async {
      final db = LocalDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final store = AckFailureStore(db, PayloadCipher(MemoryKeyVault()));
      final owner = principal('A'), transport = Transport();
      final op = operation(owner);
      await store.enqueue(owner.userId, op);
      final worker = SyncWorker(
        store,
        transport,
        DatabaseSyncLock(db),
        () => owner,
      );
      await worker.run(manual: true);
      expect(transport.calls, 1);
      expect(
        (await store.read(LocalTable.outbox, owner.userId, op.id))!['status'],
        'retryableError',
      );
      await worker.run(manual: true);
      expect(transport.calls, 2);
      expect(
        (await store.read(LocalTable.outbox, owner.userId, op.id))!['status'],
        'synced',
      );
    },
  );

  test(
    'closeout readiness hold retries when the server becomes ready',
    () async {
      final db = LocalDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final store = LocalStore(db, PayloadCipher(MemoryKeyVault()));
      final owner = principal('A');
      final transport = Transport()..closeoutNotReady = true;
      final op = operation(owner, type: 'trip_closeout');
      await store.enqueue(owner.userId, op);
      final worker = SyncWorker(
        store,
        transport,
        DatabaseSyncLock(db),
        () => owner,
      );
      await worker.run(manual: true);
      transport.closeoutNotReady = false;
      await worker.run(manual: true);
      expect(transport.calls, 2);
      expect(
        (await store.read(LocalTable.outbox, owner.userId, op.id))!['status'],
        'synced',
      );
    },
  );

  test('scope change preserves synced status and its acknowledgment', () async {
    final db = LocalDatabase(NativeDatabase.memory());
    addTearDown(db.close);
    final store = LocalStore(db, PayloadCipher(MemoryKeyVault()));
    var owner = principal('A');
    final op = operation(owner), transport = Transport();
    await store.enqueue(owner.userId, op);
    final worker = SyncWorker(
      store,
      transport,
      DatabaseSyncLock(db),
      () => owner,
    );
    await worker.run(manual: true);
    expect(
      (await store.read(LocalTable.outbox, owner.userId, op.id))!['status'],
      'synced',
    );
    owner = principal('B');
    await worker.run(manual: true);
    final saved = (await store.read(LocalTable.outbox, owner.userId, op.id))!;
    expect(saved['status'], 'synced');
    expect(saved['acknowledgment'], isNotNull);
  });

  testWidgets(
    'opening a changed manifest retains original delivered lines and units',
    (tester) async {
      final db = LocalDatabase(NativeDatabase.memory());
      final store = LocalStore(db, PayloadCipher(MemoryKeyVault()));
      final owner = principal('Peliyagoda');
      final data =
          jsonDecode(File('assets/fixtures/route.json').readAsStringSync())
              as Map<String, dynamic>;
      data['status'] = 'on_route';
      final first = (data['stops'] as List).first as Map;
      first['stopManifestRevision'] = 2;
      final originalLines = List<Map<String, dynamic>>.from(
        first['lines'] as List,
      );
      first['lines'] = [originalLines.first];
      final stopId = first['stopId'] as String;
      final oldDraft = {
        'outcome': 'partial',
        'operationId': const Uuid().v4(),
        'proofId': const Uuid().v4(),
        'evidenceIds': <String>[],
        'concurrency': {'assignmentVersion': 1, 'stopManifestRevision': 1},
        'approvedLines': originalLines,
        'lines': [
          for (final line in originalLines)
            {
              'lineId': line['lineId'],
              'deliveredQty': 4,
              'unit': line['unit'],
              'reason': 'Synthetic shortfall',
            },
        ],
      };
      await store.write(
        LocalTable.drafts,
        owner.userId,
        'pod/$stopId',
        stopId,
        oldDraft,
      );
      final repo = OperationalRepository(
        ApiClient(config, Tokens()),
        store,
        () => owner,
      );
      final container = ProviderContainer(
        overrides: [
          sessionProvider.overrideWith((ref) => owner),
          operationalProvider.overrideWithValue(repo),
          routeRepositoryProvider.overrideWithValue(
            Route(RouteSnapshot.fromJson(data)),
          ),
        ],
      );
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            theme: buildWaypointTheme(),
            home: Scaffold(body: ProofPage(stopId: stopId)),
          ),
        ),
      );
      Map<String, dynamic>? restored;
      for (var count = 0; count < 25; count++) {
        await tester.runAsync(() async {
          await Future<void>.delayed(const Duration(milliseconds: 20));
          restored = await store.read(
            LocalTable.drafts,
            owner.userId,
            'pod/$stopId',
          );
        });
        await tester.pump();
        if (find.text('Before recording this stop').evaluate().isNotEmpty) {
          break;
        }
      }
      expect(tester.takeException(), isNull);
      expect((restored!['approvedLines'] as List).length, 2);
      expect(restored!['lines'], oldDraft['lines']);
      await tester.pumpWidget(const SizedBox());
      await tester.runAsync(() async {
        await Future<void>.delayed(const Duration(milliseconds: 40));
      });
      container.dispose();
      await db.close();
    },
  );
}
