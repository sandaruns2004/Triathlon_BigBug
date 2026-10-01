import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:waypoint_mobile/app/environment.dart';
import 'package:waypoint_mobile/app/providers.dart';
import 'package:waypoint_mobile/app/router.dart';
import 'package:waypoint_mobile/app/waypoint_app.dart';
import 'package:waypoint_mobile/core/storage/storage_runtime.dart';
import 'package:waypoint_mobile/core/storage/storage_runtime_preview.dart';
import 'package:waypoint_mobile/domain/models.dart';
import 'package:waypoint_mobile/features/driver_route/route_repository.dart';

class PreviewRouteRepository implements RouteRepository {
  @override
  Future<RouteSnapshot?> assignedRoute(Principal principal) async =>
      RouteSnapshot.fromJson(
        jsonDecode(File('assets/fixtures/route.json').readAsStringSync())
            as Map<String, dynamic>,
      );
}

void main() {
  for (final principal in [fixtureDriver, fixtureStore]) {
    testWidgets(
      '${principal.role.name} fixture deep links never initialize operational services',
      (tester) async {
        final container = ProviderContainer(
          overrides: [
            configProvider.overrideWithValue(
              AppConfig(
                environment: AppEnvironment.development,
                fixtureMode: true,
                apiBaseUrl: Uri.parse('http://127.0.0.1:3000/'),
                socketUrl: Uri.parse('http://127.0.0.1:3000'),
              ),
            ),
            sessionProvider.overrideWith((ref) => principal),
            storageProvider.overrideWithValue(
              const StorageRuntime(drafts: UnavailableDraftRepository()),
            ),
            routeRepositoryProvider.overrideWithValue(PreviewRouteRepository()),
            operationalProvider.overrideWith(
              (ref) =>
                  throw StateError('Fixture accessed operational services'),
            ),
            syncWorkerProvider.overrideWith(
              (ref) => throw StateError('Fixture initialized a sync worker'),
            ),
          ],
        );
        addTearDown(container.dispose);
        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: const WaypointApp(),
          ),
        );
        await tester.pumpAndSettle();
        final router = container.read(routerProvider);
        final routes = principal.role == MobileRole.driver
            ? ['/driver/route/stop/FIXTURE-STOP-01', '/driver/profile/updates']
            : [
                '/store/orders/new',
                '/store/orders/FIXTURE-ORDER-01',
                '/store/orders/FIXTURE-ORDER-01/receipt',
                '/store/orders/FIXTURE-ORDER-01/issue',
                '/store/orders/FIXTURE-ORDER-01/note',
                '/store/profile/sync',
              ];
        for (final path in routes) {
          router.go(path);
          await tester.pumpAndSettle();
          expect(
            find.text('Available in the connected app'),
            findsOneWidget,
            reason: path,
          );
          expect(find.text('Try again'), findsNothing, reason: path);
          expect(find.text('Sync now'), findsNothing, reason: path);
          expect(tester.takeException(), isNull, reason: path);
          await tester.tap(find.text('Back to preview'));
          await tester.pumpAndSettle();
          expect(find.text('Available in the connected app'), findsNothing);
          expect(tester.takeException(), isNull);
        }
        await tester.pumpWidget(const SizedBox());
      },
    );
  }
}
