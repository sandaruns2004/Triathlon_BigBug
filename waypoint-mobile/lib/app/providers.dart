import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/storage_runtime.dart';
import '../domain/models.dart';
import '../features/driver_route/route_repository.dart';
import 'environment.dart';
import '../core/auth/authentication_repository.dart';
import '../core/network/api_client.dart';
import '../core/data/operational_repository.dart';
import '../core/sync/sync_worker.dart';
import '../core/sync/sync_lock.dart';
import '../features/driver_route/connected_route_repository.dart';

final configProvider = Provider<AppConfig>((ref) => AppConfig.fromDefines());
final storageProvider = Provider<StorageRuntime>(
  (ref) => throw StateError('Storage must be initialized.'),
);
final sessionProvider = StateProvider<Principal?>((ref) => null);
final authProvider = Provider<AuthenticationRepository?>((ref) => null);
final dataRevisionProvider = StateProvider<int>((ref) => 0);
final apiProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(configProvider), ref.watch(authProvider)!),
);
final operationalProvider = Provider<OperationalRepository>(
  (ref) => OperationalRepository(
    ref.watch(apiProvider),
    ref.watch(storageProvider).store!,
    () => ref.read(sessionProvider),
  ),
);
final syncWorkerProvider = Provider<SyncWorker>((ref) {
  final storage = ref.watch(storageProvider);
  return SyncWorker(
    storage.store!,
    HttpMutationTransport(
      ref.watch(apiProvider),
      storage.store!,
      storage.media!,
    ),
    DatabaseSyncLock(storage.store!.db),
    () => ref.read(sessionProvider),
    onChanged: () => ref.read(dataRevisionProvider.notifier).state++,
  );
});
final routeRepositoryProvider = Provider<RouteRepository>((ref) {
  if (!ref.watch(configProvider).fixtureMode) {
    return ConnectedRouteRepository(ref.watch(operationalProvider));
  }
  return FixtureRouteRepository();
});
final routeProvider = FutureProvider.family<RouteSnapshot?, Principal>((
  ref,
  principal,
) {
  ref.watch(dataRevisionProvider);
  return ref.watch(routeRepositoryProvider).assignedRoute(principal);
});
const fixtureDriver = Principal(
  userId: 'fixture-driver',
  name: 'Roshan',
  role: MobileRole.driver,
  depot: 'Peliyagoda',
  fixture: true,
);
const fixtureStore = Principal(
  userId: 'fixture-store',
  name: 'Thilini',
  role: MobileRole.store,
  outletId: 'OUT005',
  fixture: true,
);
