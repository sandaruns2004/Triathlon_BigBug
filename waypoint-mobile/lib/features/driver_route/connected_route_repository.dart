import '../../core/data/operational_repository.dart';
import '../../core/storage/local_database.dart';
import '../../domain/models.dart';
import 'route_repository.dart';

class ConnectedRouteRepository implements RouteRepository {
  ConnectedRouteRepository(this.repository);
  final OperationalRepository repository;
  @override
  Future<RouteSnapshot?> assignedRoute(Principal principal) async {
    final result = await repository.read(
      'driver/trips',
      'driver-trips',
      principal,
      table: LocalTable.routeSnapshots,
    );
    final trips = (result.data['trips'] as List).cast<Map<String, dynamic>>();
    final eligible = trips
        .where((trip) => !['completed', 'cancelled'].contains(trip['status']))
        .toList();
    return eligible.isEmpty
        ? null
        : RouteSnapshot.fromJson({
            ...eligible.first,
            '_savedAt': result.savedAt.toIso8601String(),
            '_fromCache': result.fromCache,
            '_nextTrip': eligible.length > 1 ? eligible[1] : null,
          });
  }
}
