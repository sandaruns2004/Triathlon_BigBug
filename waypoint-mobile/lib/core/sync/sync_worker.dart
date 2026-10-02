import 'dart:async';
import 'dart:math';
import 'package:cryptography/cryptography.dart';
import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../../domain/models.dart';
import '../network/api_client.dart';
import '../storage/local_database.dart';
import '../storage/local_store.dart';
import '../storage/media_store.dart';
import 'sync_lock.dart';

class SyncFailure implements Exception {
  const SyncFailure(this.status, this.code, this.message);
  final int status;
  final String code, message;
}

abstract interface class MutationTransport {
  Future<void> upload(
    String userId,
    Map<String, dynamic> operation,
    String evidenceId, {
    String? reviewOperationId,
  });
  Future<Map<String, dynamic>> submit(
    String userId,
    Map<String, dynamic> request,
  );
}

class HttpMutationTransport implements MutationTransport {
  HttpMutationTransport(this.api, this.store, this.media);
  final ApiClient api;
  final LocalStore store;
  final MediaStore media;
  @override
  Future<void> upload(
    String userId,
    Map<String, dynamic> operation,
    String evidenceId, {
    String? reviewOperationId,
  }) async {
    final metadata = await store.read(LocalTable.evidence, userId, evidenceId);
    if (metadata == null) {
      throw const SyncFailure(
        422,
        'missing_attachment',
        'Saved attachment is missing. Keep the proof and contact operations.',
      );
    }
    final file = EvidenceFile(
      id: metadata['id'] as String,
      path: metadata['path'] as String,
      bytes: metadata['bytes'] as int,
      mime: metadata['mime'] as String,
    );
    final bytes = await media.read(userId, file);
    final hash = (await Sha256().hash(
      bytes,
    )).bytes.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join();
    if (metadata['sha256'] != null && metadata['sha256'] != hash) {
      throw const SyncFailure(
        422,
        'attachment_changed',
        'Saved attachment changed. Original proof is retained.',
      );
    }
    final request = operation['request'] as Map<String, dynamic>;
    final session = (await api.dio.post<Map<String, dynamic>>(
      'media/upload-sessions',
      options: Options(extra: {'expectedUserId': userId}),
      data: {
        'evidenceId': evidenceId,
        'mime': file.mime,
        'bytes': bytes.length,
        'sha256': hash,
        if (request['tripId'] != null) 'tripId': request['tripId'],
        if (request['stopId'] != null) 'stopId': request['stopId'],
        if (request['orderId'] != null) 'orderId': request['orderId'],
        'reviewOperationId': ?reviewOperationId,
      },
    )).data!;
    if (session['status'] != 'finalized') {
      if (session['uploadPath'] != null) {
        await api.dio.put<dynamic>(
          session['uploadPath'] as String,
          data: bytes,
          options: Options(
            extra: {'expectedUserId': userId},
            contentType: file.mime,
            headers: {'Content-Length': bytes.length},
          ),
        );
      } else {
        final url = Uri.parse(session['uploadUrl'] as String);
        if (url.scheme != 'https') {
          throw const SyncFailure(
            422,
            'invalid_upload_url',
            'A secure upload URL is required.',
          );
        }
        // Signed storage requests never receive the API bearer token.
        await Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 20),
            receiveTimeout: const Duration(seconds: 60),
          ),
        ).put<dynamic>(
          url.toString(),
          data: bytes,
          options: Options(
            contentType: file.mime,
            headers: {'Content-Length': bytes.length},
          ),
        );
      }
      final finalized = (await api.dio.post<Map<String, dynamic>>(
        'media/$evidenceId/finalize',
        options: Options(extra: {'expectedUserId': userId}),
        data: {},
      )).data!;
      if (finalized['status'] != 'finalized' || finalized['sha256'] != hash) {
        throw const SyncFailure(
          422,
          'finalize_mismatch',
          'Server did not verify this photo.',
        );
      }
    }
    await store.write(
      LocalTable.evidence,
      userId,
      evidenceId,
      operation['entityId'] as String,
      {...metadata, 'sha256': hash, 'remoteStatus': 'finalized'},
    );
  }

  @override
  Future<Map<String, dynamic>> submit(
    String userId,
    Map<String, dynamic> request,
  ) async {
    final response = await api.dio.post<Map<String, dynamic>>(
      'sync/operations',
      options: Options(extra: {'expectedUserId': userId}),
      data: {
        'operations': [request],
      },
    );
    final results = response.data!['results'] as List;
    if (results.length != 1 || results.first is! Map) {
      throw const SyncFailure(
        503,
        'missing_receipt',
        'The server did not acknowledge this operation.',
      );
    }
    final result = Map<String, dynamic>.from(results.first as Map);
    if (!['accepted', 'already_applied'].contains(result['status'])) {
      throw SyncFailure(
        result['httpStatus'] as int? ?? 503,
        result['code'] as String? ?? 'server_unavailable',
        result['message'] as String? ??
            'Server has not accepted this operation.',
      );
    }
    return result;
  }
}

class SyncSummary {
  const SyncSummary(this.accepted, this.remaining, this.message);
  final int accepted, remaining;
  final String message;
}

class SyncWorker {
  SyncWorker(
    this.store,
    this.transport,
    this.lock,
    this.currentPrincipal, {
    this.onChanged,
  });
  final LocalStore store;
  final MutationTransport transport;
  final SyncLock lock;
  final Principal? Function() currentPrincipal;
  final void Function()? onChanged;
  bool _running = false;
  bool _canContinue(Principal expected) {
    final principal = currentPrincipal();
    return principal?.userId == expected.userId &&
        principal?.role == expected.role &&
        principal?.depot == expected.depot &&
        principal?.outletId == expected.outletId &&
        principal?.authVersion == expected.authVersion &&
        principal?.offlineExpiresAt != null &&
        DateTime.now().toUtc().isBefore(principal!.offlineExpiresAt!);
  }

  Future<SyncSummary> run({bool manual = false}) async {
    final principal = currentPrincipal();
    if (_running ||
        principal == null ||
        principal.fixture ||
        !_canContinue(principal)) {
      return const SyncSummary(0, 0, 'Sign in to sync saved work.');
    }
    final userId = principal.userId, owner = const Uuid().v4();
    if (!await lock.acquire(
      userId,
      owner,
      DateTime.now(),
      const Duration(seconds: 90),
    )) {
      return SyncSummary(
        0,
        await store.queuedCount(userId),
        'Another sync worker is active.',
      );
    }
    _running = true;
    bool lostLease = false;
    final heartbeat = Timer.periodic(const Duration(seconds: 25), (_) async {
      try {
        if (!await lock.renew(
          userId,
          owner,
          DateTime.now(),
          const Duration(seconds: 90),
        )) {
          lostLease = true;
        }
      } catch (_) {
        lostLease = true;
      }
    });
    int accepted = 0;
    try {
      final operations = await store.list(userId, LocalTable.outbox);
      operations.sort(
        (a, b) => ((a['request'] as Map?)?['observedAt'] as String? ?? '')
            .compareTo((b['request'] as Map?)?['observedAt'] as String? ?? ''),
      );
      final byId = {for (final op in operations) op['id'] as String: op};
      for (final operation in operations) {
        if (lostLease || !_canContinue(principal)) break;
        final status = operation['status'];
        if ([
          'synced',
          'rejected',
          'awaitingOperations',
          'retainedForAudit',
        ].contains(status)) {
          continue;
        }
        // A readiness hold can resolve without changing this request. Older
        // app versions recorded it as a conflict; replay that same UUID too.
        final readinessConflict =
            status == 'conflict' &&
            operation['type'] == 'trip_closeout' &&
            (operation['failureCode'] == 'closeout_not_ready' ||
                operation['message'] ==
                    'All stop outcomes must be accepted and holds resolved before closeout.');
        if (status == 'conflict' && !readinessConflict) continue;
        if (!operationScopeMatches(operation, currentPrincipal()!)) {
          await store.updateOperation(
            userId,
            operation['id'] as String,
            status: 'authRequired',
            message:
                'Saved work belongs to an earlier role or outlet. Operations must authorize recovery.',
          );
          continue;
        }
        final next = DateTime.tryParse(
          operation['nextAttemptAt'] as String? ?? '',
        );
        if (!manual && next != null && DateTime.now().isBefore(next)) continue;
        final request = operation['request'] as Map<String, dynamic>?;
        if (request == null) {
          await store.updateOperation(
            userId,
            operation['id'] as String,
            status: 'rejected',
            message:
                'Unsupported saved payload version. Retain it for recovery.',
          );
          continue;
        }
        final dependencies = (request['dependencyIds'] as List?) ?? [];
        if (dependencies.any((id) => byId[id]?['status'] != 'synced')) continue;
        final id = operation['id'] as String;
        try {
          await store.updateOperation(userId, id, status: 'uploading');
          for (final evidenceId in (operation['evidenceIds'] as List? ?? [])) {
            if (lostLease || !_canContinue(principal)) break;
            await transport.upload(userId, operation, evidenceId as String);
          }
          if (lostLease || !_canContinue(principal)) break;
          await store.updateOperation(userId, id, status: 'submitting');
          final acknowledgment = await transport.submit(userId, request);
          if (lostLease || !_canContinue(principal)) break;
          if (acknowledgment['operationId'] != id ||
              ![
                'accepted',
                'already_applied',
              ].contains(acknowledgment['status'])) {
            throw const SyncFailure(
              503,
              'mismatched_receipt',
              'Server acknowledgment did not match this saved operation.',
            );
          }
          await store.updateOperation(
            userId,
            id,
            status: 'synced',
            acknowledgment: acknowledgment,
          );
          byId[id]!['status'] = 'synced';
          accepted++;
        } catch (error) {
          final failure = _failure(error);
          final attempts = (operation['attempts'] as int? ?? 0) + 1;
          final authentication = failure.status == 401;
          final conflict =
              [403, 404, 409].contains(failure.status) &&
              ![
                'dependency_pending',
                'closeout_not_ready',
              ].contains(failure.code);
          final rejected = [400, 413, 415, 422].contains(failure.status);
          final seconds = min(3600, 5 * pow(2, min(attempts, 9)).toInt());
          await store.updateOperation(
            userId,
            id,
            status: authentication
                ? 'authRequired'
                : conflict
                ? 'conflict'
                : rejected
                ? 'rejected'
                : 'retryableError',
            message: failure.message,
            failureCode: failure.code,
            attempts: attempts,
            nextAttemptAt: authentication || conflict || rejected
                ? null
                : DateTime.now().add(Duration(seconds: seconds)),
          );
          if (authentication) break;
        }
      }
      final remaining = await store.queuedCount(userId);
      return SyncSummary(
        accepted,
        remaining,
        '$accepted accepted · $remaining still pending',
      );
    } finally {
      heartbeat.cancel();
      try {
        await lock.release(userId, owner);
      } finally {
        _running = false;
        onChanged?.call();
      }
    }
  }

  SyncFailure _failure(Object error) {
    if (error is SyncFailure) return error;
    if (error is StorageFailure) {
      // A disk failure may occur after a successful server commit. Preserve
      // the UUID so recovery obtains the canonical receipt through replay.
      return SyncFailure(503, 'local_storage_failure', error.message);
    }
    if (error is DioException) {
      final body = error.response?.data;
      final details = body is Map && body['error'] is Map
          ? body['error'] as Map
          : null;
      return SyncFailure(
        error.response?.statusCode ?? 503,
        details?['code'] as String? ?? 'network_unavailable',
        details?['message'] as String? ??
            'Connection unavailable. Saved proof is retained; retry.',
      );
    }
    return const SyncFailure(
      503,
      'retryable_failure',
      'Saved work could not sync. It remains on this phone.',
    );
  }
}
