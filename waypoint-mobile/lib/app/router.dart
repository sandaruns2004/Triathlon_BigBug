import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../domain/models.dart';
import '../features/foundation/foundation_pages.dart';
import 'providers.dart';
import 'role_shell.dart';
import '../features/connected/connected_pages.dart';
import '../features/connected/driver_route_page.dart';
import '../features/connected/proof_page.dart';
import '../features/connected/sync_pages.dart';
import '../features/connected/store_pages.dart';
import '../features/connected/profile_notifications.dart';

class DeepLinkIntent {
  Uri? target;
}

Uri? normalizeNativeDeepLink(Uri uri) {
  if (!['waypoint', 'waypoint-dev', 'waypoint-staging'].contains(uri.scheme) ||
      uri.hasFragment ||
      uri.userInfo.isNotEmpty) {
    return null;
  }
  if (uri.hasAuthority && !['driver', 'store', ''].contains(uri.host)) {
    return null;
  }
  if (uri.hasPort) return null;
  final path = uri.host.isEmpty ? uri.path : '/${uri.host}${uri.path}';
  if (!path.startsWith('/driver/') && !path.startsWith('/store/')) return null;
  return Uri(path: path, query: uri.hasQuery ? uri.query : null);
}

final deepLinkIntentProvider = Provider((ref) => DeepLinkIntent());

final routerProvider = Provider<GoRouter>((ref) {
  ref.watch(
    sessionProvider.select(
      (p) => (p?.userId, p?.role, p?.depot, p?.outletId, p?.authVersion),
    ),
  );
  final fixture = ref.watch(configProvider).fixtureMode;
  final intent = ref.read(deepLinkIntentProvider);
  final refresh = ValueNotifier(0);
  var active = true;
  ref.listen(sessionProvider, (_, _) {
    if (active) refresh.value++;
  });
  final router = GoRouter(
    initialLocation: '/welcome',
    refreshListenable: refresh,
    redirect: (context, state) {
      if (state.uri.hasScheme || state.uri.hasAuthority) {
        final environment = ref.read(configProvider).environment.name;
        final expectedScheme = switch (environment) {
          'development' => 'waypoint-dev',
          'staging' => 'waypoint-staging',
          _ => 'waypoint',
        };
        if (state.uri.scheme != expectedScheme) return '/welcome';
        return normalizeNativeDeepLink(state.uri)?.toString() ?? '/welcome';
      }
      final principal = ref.read(sessionProvider);
      final path = state.uri.path;
      if (principal == null) {
        if (path.startsWith('/driver/') || path.startsWith('/store/')) {
          intent.target = state.uri;
        }
        return path == '/welcome' ? null : '/welcome';
      }
      final home = principal.role == MobileRole.driver
          ? '/driver/today'
          : '/store/home';
      if (path == '/welcome') {
        final target = intent.target;
        intent.target = null;
        if (target != null &&
            !target.hasAuthority &&
            !target.hasScheme &&
            target.path.startsWith(
              principal.role == MobileRole.driver ? '/driver/' : '/store/',
            )) {
          return target.toString();
        }
        return home;
      }
      if (path.startsWith('/driver') && principal.role != MobileRole.driver) {
        return home;
      }
      if (path.startsWith('/store') && principal.role != MobileRole.store) {
        return home;
      }
      return null;
    },
    routes: [
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomePage()),
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) =>
            RoleShell(role: MobileRole.driver, shell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/driver/today',
                builder: (_, _) => fixture
                    ? const DriverTodayPage()
                    : const ConnectedTodayPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/driver/route',
                builder: (_, _) => fixture
                    ? const DriverRoutePage()
                    : const ConnectedRoutePage(),
                routes: [
                  GoRoute(
                    path: 'stop/:id',
                    builder: (_, state) =>
                        ProofPage(stopId: state.pathParameters['id']!),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/driver/activity',
                builder: (_, _) => fixture
                    ? const ActivityPage()
                    : const ConnectedActivityPage(),
                routes: [
                  GoRoute(
                    path: 'sync',
                    builder: (_, _) => fixture
                        ? const SyncCentrePage()
                        : const ConnectedActivityPage(syncCentre: true),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/driver/profile',
                builder: (_, _) => fixture
                    ? const ProfilePage()
                    : const ConnectedProfilePage(),
                routes: [
                  GoRoute(
                    path: 'updates',
                    builder: (_, _) => const ConnectedNotificationsPage(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) =>
            RoleShell(role: MobileRole.store, shell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/store/home',
                builder: (_, _) => fixture
                    ? const StoreHomePage()
                    : const ConnectedStoreOrdersPage(home: true),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/store/orders',
                builder: (_, _) => fixture
                    ? const StoreOrdersPage()
                    : const ConnectedStoreOrdersPage(),
                routes: [
                  GoRoute(
                    path: 'new',
                    builder: (_, state) => StoreComposerPage(
                      correctionId: state.uri.queryParameters['correction'],
                    ),
                  ),
                  GoRoute(
                    path: ':id',
                    builder: (_, state) => StoreOrderDetailPage(
                      orderId: state.pathParameters['id']!,
                    ),
                    routes: [
                      GoRoute(
                        path: 'receipt',
                        builder: (_, state) => StoreReceiptIssuePage(
                          orderId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'issue',
                        builder: (_, state) => StoreReceiptIssuePage(
                          orderId: state.pathParameters['id']!,
                          issue: true,
                        ),
                      ),
                      GoRoute(
                        path: 'note',
                        builder: (_, state) => DeliveryNotePage(
                          orderId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/store/notifications',
                builder: (_, _) => fixture
                    ? const StoreNotificationsPage()
                    : const ConnectedNotificationsPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/store/profile',
                builder: (_, _) => fixture
                    ? const ProfilePage()
                    : const ConnectedProfilePage(),
                routes: [
                  GoRoute(
                    path: 'sync',
                    builder: (_, _) =>
                        const ConnectedActivityPage(syncCentre: true),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/catalogue',
        builder: (_, _) => const WidgetCataloguePage(),
      ),
    ],
  );
  ref.onDispose(() {
    active = false;
    router.dispose();
    refresh.dispose();
  });
  return router;
});
