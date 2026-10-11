import 'package:dio/dio.dart';
import '../../domain/models.dart';
import '../network/api_client.dart';
import '../storage/local_database.dart';
import '../storage/local_store.dart';

class CachedRead {
  const CachedRead(this.data, this.savedAt, {required this.fromCache});
  final Map<String, dynamic> data;
  final DateTime savedAt;
  final bool fromCache;
}

class OperationalRepository {
  OperationalRepository(this.api, this.store, this.currentPrincipal);
  final ApiClient api;
  final LocalStore store;
  final Principal? Function() currentPrincipal;
  bool usingCache = false;
  Map<String, dynamic> _readData(String path, Map<String, dynamic> data) {
    // The shared order endpoint includes exceptions beside the order. Keep
    // screen/cache contracts consistent with earlier flat order responses.
    if (RegExp(r'^store/orders/[^/]+$').hasMatch(path) &&
        data['order'] is Map) {
      return Map<String, dynamic>.from(data['order'] as Map);
    }
    return data;
  }

  bool authorized(Principal principal) {
    final current = currentPrincipal();
    return current?.userId == principal.userId &&
        current?.role == principal.role &&
        current?.outletId == principal.outletId &&
        current?.depot == principal.depot &&
        current?.authVersion == principal.authVersion &&
        !principal.fixture &&
        principal.offlineExpiresAt != null &&
        DateTime.now().toUtc().isBefore(principal.offlineExpiresAt!);
  }

  Future<CachedRead> read(
    String path,
    String cacheId,
    Principal principal, {
    LocalTable table = LocalTable.orders,
  }) async {
    cacheId =
        '${principal.role.name}/${principal.depot}/${principal.outletId}/$cacheId';
    if (!authorized(principal)) {
      throw StateError('Sign in again. Saved work is retained.');
    }
    try {
      final response = await api.dio.get<Map<String, dynamic>>(path);
      if (!authorized(principal)) {
        throw StateError('Account changed during refresh.');
      }
      final data = _readData(path, response.data!);
      final savedAt = DateTime.now().toUtc();
      await store.db.transaction(() async {
        if (path == 'driver/trips') {
          final previous = await store.read(table, principal.userId, cacheId);
          final oldTrips =
              ((previous?['data'] as Map?)?['trips'] as List?) ?? [];
          for (final next in data['trips'] as List) {
            final before = oldTrips
                .where((t) => t['tripId'] == next['tripId'])
                .firstOrNull;
            if (before != null &&
                before['routeRevision'] != next['routeRevision']) {
              await store.write(
                LocalTable.checkpoints,
                principal.userId,
                'route-comparison/${next['tripId']}',
                next['tripId'] as String,
                {
                  'before': before,
                  'after': next,
                  'detectedAt': savedAt.toIso8601String(),
                },
              );
            }
          }
        }
        await store.write(table, principal.userId, cacheId, cacheId, {
          'data': data,
          'savedAt': savedAt.toIso8601String(),
        });
      });
      usingCache = false;
      return CachedRead(data, savedAt, fromCache: false);
    } on DioException catch (error) {
      if (!authorized(principal) ||
          (error.response != null &&
              (error.response!.statusCode ?? 500) < 500)) {
        rethrow;
      }
      final cache = await store.read(table, principal.userId, cacheId);
      if (cache == null) {
        throw StateError(
          'Connect to download this data first. Existing drafts are retained.',
        );
      }
      usingCache = true;
      return CachedRead(
        _readData(path, cache['data'] as Map<String, dynamic>),
        DateTime.parse(cache['savedAt'] as String),
        fromCache: true,
      );
    }
  }

  Future<void> saveForm(
    Principal principal,
    String id,
    String entityId,
    Map<String, dynamic> fields,
  ) async {
    // Disposal can finish a save for its captured owner after sign-out.
    // Never let a new scope overwrite retained proof from an earlier scope.
    final previous = await store.read(LocalTable.drafts, principal.userId, id);
    if (previous?['ownerScope'] != null &&
        !operationScopeMatches(previous!, principal)) {
      throw StateError(
        'This saved form belongs to an earlier account scope. Contact operations.',
      );
    }
    await store.write(LocalTable.drafts, principal.userId, id, entityId, {
      ...fields,
      'ownerScope': {
        'role': principal.role.name,
        'depot': principal.depot,
        'outletId': principal.outletId,
      },
    });
  }

  Future<Map<String, dynamic>?> loadForm(Principal principal, String id) async {
    if (!authorized(principal)) {
      throw StateError('Sign in again to open saved work.');
    }
    final saved = await store.read(LocalTable.drafts, principal.userId, id);
    if (saved == null) return null;
    // Legacy carts already encode their outlet in their key. Other legacy
    // forms have no provable scope and remain retained for operations recovery.
    final legacyCart =
        saved['ownerScope'] == null &&
        principal.role == MobileRole.store &&
        id == 'cart/${principal.outletId}';
    if (!legacyCart && !operationScopeMatches(saved, principal)) {
      throw StateError(
        'This saved form needs an account-scope review. Contact operations; saved work is retained.',
      );
    }
    return saved;
  }

  Future<List<Map<String, dynamic>>> operations(Principal principal) async =>
      (await store.list(
        principal.userId,
        LocalTable.outbox,
      )).where((op) => operationScopeMatches(op, principal)).toList();
  Future<void> queue(Principal principal, PendingOperation operation) async {
    if (!authorized(principal)) {
      throw StateError('Sign in before saving new work.');
    }
    await store.enqueue(principal.userId, operation.forPrincipal(principal));
  }

  Future<void> complete(
    Principal principal,
    String proofId,
    Map<String, dynamic> proof,
    PendingOperation operation,
  ) async {
    if (!authorized(principal)) {
      throw StateError('Sign in before completing this stop.');
    }
    await store.commitLocalCompletion(
      principal.userId,
      proofId,
      proof,
      operation.forPrincipal(principal),
    );
  }

  Future<void> refreshNotifications(Principal principal) async {
    if (!authorized(principal)) return;
    final checkpointId =
        'notifications/${principal.role.name}/${principal.depot}/${principal.outletId}';
    final checkpoint = await store.read(
      LocalTable.checkpoints,
      principal.userId,
      checkpointId,
    );
    var cursor = checkpoint?['cursor'] as String?;
    for (var page = 0; page < 20; page++) {
      final result = (await api.dio.get<Map<String, dynamic>>(
        'notifications',
        queryParameters: {'after': ?cursor},
      )).data!;
      if (!authorized(principal)) return;
      await store.db.transaction(() async {
        for (final item in result['notifications'] as List) {
          final notification = Map<String, dynamic>.from(item as Map);
          await store.write(
            LocalTable.notifications,
            principal.userId,
            notification['notificationId'] as String,
            notification['entityId'] as String,
            notification,
          );
        }
        await store.write(
          LocalTable.checkpoints,
          principal.userId,
          checkpointId,
          'notifications',
          {'cursor': result['cursor']},
        );
      });
      cursor = result['cursor'] as String?;
      if (result['hasMore'] != true) return;
    }
  }
}

String apiMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['error'] is Map) {
      return ((data['error'] as Map)['message'] as String?) ??
          'Server could not accept this action.';
    }
    if (error.response?.statusCode == 401) {
      return 'Sign in again. Saved proof is retained.';
    }
    return 'Connection or server unavailable. Saved work is retained; retry.';
  }
  if (error is StorageFailure) return error.message;
  if (error is StateError) return error.message.toString();
  return 'Could not complete this action. Saved work is retained.';
}
