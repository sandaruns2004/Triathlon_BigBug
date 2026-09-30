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
import 'dart:convert';
import 'dart:io';
import 'package:waypoint_mobile/features/driver_route/route_repository.dart';

class TestRouteRepository implements RouteRepository {
  TestRouteRepository(this.trip);
  final RouteSnapshot trip;
  @override
  Future<RouteSnapshot?> assignedRoute(Principal principal) async => trip;
}

void main() {
  final trip = RouteSnapshot.fromJson(
    jsonDecode(File('assets/fixtures/route.json').readAsStringSync())
        as Map<String, dynamic>,
  );
  for (final width in [320.0, 390.0, 600.0]) {
    for (final scale in [1.0, 1.8]) {
      for (final principal in [fixtureDriver, fixtureStore]) {
        testWidgets(
          '$width width, $scale text: ${principal.role.name} shell has no clipping',
          (tester) async {
            tester.view.physicalSize = Size(width, 900);
            tester.view.devicePixelRatio = 1;
            addTearDown(tester.view.resetPhysicalSize);
            addTearDown(tester.view.resetDevicePixelRatio);
            final container = ProviderContainer(
              overrides: [
                configProvider.overrideWithValue(
                  AppConfig(
                    environment: AppEnvironment.development,
                    fixtureMode: true,
                    apiBaseUrl: Uri.parse('http://10.0.2.2:3000/'),
                    socketUrl: Uri.parse('http://10.0.2.2:3000'),
                  ),
                ),
                storageProvider.overrideWithValue(
                  const StorageRuntime(drafts: UnavailableDraftRepository()),
                ),
                sessionProvider.overrideWith((ref) => principal),
                routeRepositoryProvider.overrideWithValue(
                  TestRouteRepository(trip),
                ),
              ],
            );
            addTearDown(container.dispose);
            await tester.pumpWidget(
              UncontrolledProviderScope(
                container: container,
                child: MediaQuery(
                  data: MediaQueryData(
                    size: Size(width, 900),
                    textScaler: TextScaler.linear(scale),
                  ),
                  child: const WaypointApp(),
                ),
              ),
            );
            await tester.pumpAndSettle();
            // MaterialApp supplies a platform MediaQuery; use the actual platform text scale too.
            tester.platformDispatcher.textScaleFactorTestValue = scale;
            addTearDown(
              tester.platformDispatcher.clearTextScaleFactorTestValue,
            );
            await tester.pumpAndSettle();
            expect(tester.takeException(), isNull);
            expect(
              find.text('Fixture preview · no server actions'),
              findsOneWidget,
            );
            final router = container.read(routerProvider);
            for (final path
                in principal.role == MobileRole.driver
                    ? ['/driver/route', '/driver/activity', '/driver/profile']
                    : [
                        '/store/orders',
                        '/store/notifications',
                        '/store/profile',
                      ]) {
              router.go(path);
              await tester.pumpAndSettle();
              expect(tester.takeException(), isNull);
            }
            await tester.pumpWidget(const SizedBox());
          },
        );
      }
    }
  }
  testWidgets(
    'deep links require identity and wrong-role routes are redirected',
    (tester) async {
      final container = ProviderContainer(
        overrides: [
          configProvider.overrideWithValue(
            AppConfig(
              environment: AppEnvironment.development,
              fixtureMode: true,
              apiBaseUrl: Uri.parse('http://10.0.2.2/'),
              socketUrl: Uri.parse('http://10.0.2.2/'),
            ),
          ),
          storageProvider.overrideWithValue(
            const StorageRuntime(drafts: UnavailableDraftRepository()),
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
      var router = container.read(routerProvider);
      router.go('waypoint-dev:///driver/route');
      await tester.pumpAndSettle();
      expect(router.routeInformationProvider.value.uri.path, '/welcome');
      container.read(sessionProvider.notifier).state = fixtureDriver;
      await tester.pumpAndSettle();
      router = container.read(routerProvider);
      expect(router.routeInformationProvider.value.uri.path, '/driver/route');
      container.read(sessionProvider.notifier).state = fixtureStore;
      await tester.pumpAndSettle();
      // Account changes rebuild navigation so an old account's forms cannot survive.
      router = container.read(routerProvider);
      router.go('/driver/route');
      await tester.pumpAndSettle();
      expect(router.routeInformationProvider.value.uri.path, '/store/home');
      expect(find.text('VEH001 / Trip 1'), findsNothing);
      await tester.pumpWidget(const SizedBox());
    },
  );
  test(
    'release configuration refuses insecure endpoints and production fixtures',
    () {
      final config = AppConfig(
        environment: AppEnvironment.production,
        fixtureMode: true,
        apiBaseUrl: Uri.parse('http://localhost/'),
        socketUrl: Uri.parse('http://localhost/'),
      );
      expect(() => config.validate(releaseBuild: true), throwsStateError);
    },
  );
}
