import 'dart:convert';
import 'package:flutter/services.dart';
import '../../core/network/api_client.dart';
import '../../domain/models.dart';

abstract interface class RouteRepository {
  Future<RouteSnapshot?> assignedRoute(Principal principal);
}

class FixtureRouteRepository implements RouteRepository {
  @override
  Future<RouteSnapshot?> assignedRoute(Principal principal) async {
    if (!principal.fixture || principal.role != MobileRole.driver) {
      throw StateError('Fixture Driver only.');
    }
    final data =
        jsonDecode(await rootBundle.loadString('assets/fixtures/route.json'))
            as Map<String, dynamic>;
    if (data['driverUserId'] != principal.userId) return null;
    return RouteSnapshot.fromJson(data);
  }
}

class ApiRouteRepository implements RouteRepository {
  ApiRouteRepository(this.client);
  final ApiClient client;
  @override
  Future<RouteSnapshot?> assignedRoute(Principal principal) async {
    if (principal.fixture || principal.role != MobileRole.driver) {
      throw StateError('A verified Driver is required.');
    }
    final response = await client.dio.get<Map<String, dynamic>>('driver/trips');
    final data = response.data;
    if (data == null) return null;
    // Contract adapter remains gated on Phase 2 fixtures/server schemas.
    return RouteSnapshot.fromJson(data);
  }
}
