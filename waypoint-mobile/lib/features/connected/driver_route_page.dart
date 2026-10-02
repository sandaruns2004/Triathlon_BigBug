import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';
import '../../app/providers.dart';
import '../../core/data/operational_repository.dart';
import '../../core/theme/formatters.dart';
import '../../core/storage/local_database.dart';
import '../../core/widgets/waypoint_widgets.dart';
import '../../domain/models.dart';
import '../foundation/foundation_pages.dart';
import 'connected_pages.dart';

class ConnectedRoutePage extends ConsumerWidget {
  const ConnectedRoutePage({super.key});
  Future<void> issue(
    BuildContext context,
    WidgetRef ref,
    RouteSnapshot trip, {
    RouteStop? stop,
  }) async {
    if (!await confirmParked(context) || !context.mounted) return;
    final reason = TextEditingController();
    var category = stop == null ? 'breakdown' : 'closed';
    try {
      final result = await showWaypointSheet<Map<String, dynamic>>(
        context,
        title: stop == null ? 'Report a trip issue' : 'Report a stop issue',
        child: StatefulBuilder(
          builder: (context, setState) => Column(
            children: [
              DropdownButtonFormField<String>(
                initialValue: category,
                decoration: const InputDecoration(labelText: 'Issue'),
                items: stop == null
                    ? const [
                        DropdownMenuItem(
                          value: 'breakdown',
                          child: Text('Vehicle breakdown'),
                        ),
                        DropdownMenuItem(value: 'delay', child: Text('Delay')),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ]
                    : const [
                        DropdownMenuItem(
                          value: 'closed',
                          child: Text('Outlet closed'),
                        ),
                        DropdownMenuItem(
                          value: 'access',
                          child: Text('Access blocked'),
                        ),
                        DropdownMenuItem(
                          value: 'refused',
                          child: Text('Goods refused'),
                        ),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ],
                onChanged: (value) => setState(() => category = value!),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: reason,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Reason'),
              ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: 'Save issue',
                onPressed: () {
                  if (reason.text.trim().isNotEmpty) {
                    context.pop({
                      'reason': reason.text.trim(),
                      'category': category,
                      'parkedAcknowledged': true,
                    });
                  }
                },
              ),
            ],
          ),
        ),
      );
      if (result == null) return;
      final principal = ref.read(sessionProvider)!;
      await ref
          .read(operationalProvider)
          .queue(
            principal,
            PendingOperation(
              id: const Uuid().v4(),
              entityId: stop?.stopId ?? trip.tripId,
              type: stop == null ? 'trip_issue' : 'delivery_issue',
              tripId: trip.tripId,
              stopId: stop?.stopId,
              orderId: stop?.orderId,
              observedAt: DateTime.now(),
              concurrency: {'assignmentVersion': trip.assignmentVersion},
              payload: result,
            ),
          );
      ref.read(dataRevisionProvider.notifier).state++;
      if (context.mounted) {
        notice(
          context,
          'Issue saved on this phone. If offline, operations has not received it; contact them directly for urgent help.',
        );
      }
      await ref.read(syncWorkerProvider).run(manual: true);
    } catch (error) {
      if (context.mounted) notice(context, apiMessage(error));
    } finally {
      reason.dispose();
    }
  }

  Future<void> closeout(
    BuildContext context,
    WidgetRef ref,
    RouteSnapshot trip,
  ) async {
    if (!await confirmParked(context, title: 'Returned to the depot?') ||
        !context.mounted) {
      return;
    }
    final confirmed = await showWaypointSheet<bool>(
      context,
      title: 'Confirm depot return',
      child: Column(
        children: [
          const Text(
            'Closeout requires all outcomes to be accepted and holds resolved. Trip 2 follows the server decision.',
          ),
          PrimaryButton(
            label: 'I have returned to the depot',
            onPressed: () => context.pop(true),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      final principal = ref.read(sessionProvider)!;
      final operations = await ref
          .read(operationalProvider)
          .operations(principal);
      if (operations.any(
        (op) =>
            op['type'] == 'trip_closeout' &&
            (op['request'] as Map?)?['tripId'] == trip.tripId,
      )) {
        throw StateError('Closeout is already saved. Check Sync Centre.');
      }
      final dependencies = operations
          .where(
            (op) =>
                (op['request'] as Map?)?['tripId'] == trip.tripId &&
                !['rejected', 'retainedForAudit'].contains(op['status']),
          )
          .map((op) => op['id'] as String)
          .toList();
      await ref
          .read(operationalProvider)
          .queue(
            principal,
            PendingOperation(
              id: const Uuid().v4(),
              entityId: trip.tripId,
              type: 'trip_closeout',
              tripId: trip.tripId,
              observedAt: DateTime.now(),
              dependencyIds: dependencies,
              payload: {'returnedToDepot': true, 'parkedAcknowledged': true},
            ),
          );
      ref.read(dataRevisionProvider.notifier).state++;
      if (context.mounted) {
        notice(
          context,
          'Closeout saved on this phone. Trip 2 is not unlocked locally.',
        );
      }
      await ref.read(syncWorkerProvider).run(manual: true);
    } catch (error) {
      if (context.mounted) notice(context, apiMessage(error));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final principal = ref.watch(sessionProvider)!;
    final operations = ref.watch(operationsProvider).valueOrNull ?? [];
    return ref
        .watch(routeProvider(principal))
        .when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => PageBody(
            children: [
              ErrorState(
                message: apiMessage(error),
                onRetry: () => ref.invalidate(routeProvider(principal)),
              ),
            ],
          ),
          data: (trip) => PageBody(
            children: [
              const PageHeading(
                'Your route',
                'Review the approved manifest while safely parked.',
              ),
              if (trip == null)
                const EmptyState(
                  title: 'No downloaded assignment',
                  message: 'Connect to receive an assigned route.',
                )
              else ...[
                StatusChip(
                  trip.fromCache
                      ? 'Saved route on this phone'
                      : 'Latest route saved',
                  tone: StatusTone.success,
                ),
                Text(
                  '${trip.serviceDate} · route revision ${trip.routeRevision}',
                ),
                Text(
                  'Current unresolved stop: ${trip.stops.where((s) => s.deliveryVersion == 0).firstOrNull?.name ?? 'All stops resolved'}',
                ),
                Text(
                  'Canonical outcomes: ${trip.stops.where((s) => s.status == 'delivered').length} full · ${trip.stops.where((s) => s.status == 'partial').length} partial · ${trip.stops.where((s) => ['failed', 'refused', 'skipped'].contains(s.status)).length} unsuccessful · ${trip.stops.where((s) => s.deliveryVersion == 0).length} unresolved',
                ),
                Text(
                  '${operations.where((o) => (o['request'] as Map?)?['tripId'] == trip.tripId && o['status'] != 'synced').length} local records awaiting confirmation or review',
                ),
                OutlinedButton(
                  onPressed: () async {
                    final comparison = await ref
                        .read(storageProvider)
                        .store!
                        .read(
                          LocalTable.checkpoints,
                          principal.userId,
                          'route-comparison/${trip.tripId}',
                        );
                    if (!context.mounted) return;
                    await showWaypointSheet<void>(
                      context,
                      title: 'Route changes',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (comparison == null)
                            const Text(
                              'No earlier saved revision is available on this phone.',
                            ),
                          if (comparison != null)
                            for (final version in ['before', 'after']) ...[
                              Text(
                                version == 'before'
                                    ? 'Previously saved route'
                                    : 'Latest approved route',
                              ),
                              ...(((comparison[version] as Map)['stops']
                                          as List?) ??
                                      [])
                                  .map(
                                    (s) => Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${s['name'] ?? s['outletName']} · ${s['window']}',
                                        ),
                                        ...((s['lines'] as List?) ?? []).map(
                                          (l) => Text(
                                            '${l['name']}: ${l['quantity']} ${l['unit']}',
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                            ],
                          const Text(
                            'Original drafts and queued proof remain unchanged. Acknowledge the current revision after reviewing it.',
                          ),
                        ],
                      ),
                    );
                  },
                  child: const Text('Compare route revisions'),
                ),
                ...trip.stops.indexed.map((entry) {
                  final stop = entry.$2;
                  final local = operations
                      .where(
                        (op) =>
                            (op['request'] as Map?)?['stopId'] == stop.stopId &&
                            op['type'] == 'delivery_recorded',
                      )
                      .toList();
                  final localStart = operations.any(
                    (op) =>
                        op['type'] == 'trip_start' &&
                        (op['request'] as Map?)?['tripId'] == trip.tripId &&
                        !['conflict', 'rejected'].contains(op['status']),
                  );
                  final windowEnd = stop.window.split('–').last;
                  final now = businessTime(DateTime.now());
                  final late =
                      businessDate(DateTime.now()) == trip.serviceDate &&
                      RegExp(r'^\d{2}:\d{2}$').hasMatch(windowEnd) &&
                      now.compareTo(windowEnd) > 0;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      StopCard(
                        stop: stop,
                        number: entry.$1 + 1,
                        onTap: () => showWaypointSheet<void>(
                          context,
                          title: 'Approved manifest',
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ...stop.lines.map(
                                (line) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Text(
                                    '${line.name}: ${line.quantity} ${line.unit}',
                                  ),
                                ),
                              ),
                              Text('${stop.window} · ${stop.instruction}'),
                              const SizedBox(height: 16),
                              if (late)
                                const StatusChip(
                                  'Receiving window passed · contact operations',
                                  tone: StatusTone.attention,
                                ),
                              OutlinedButton(
                                onPressed: () =>
                                    issue(context, ref, trip, stop: stop),
                                child: const Text(
                                  'Report closed, access or refusal issue',
                                ),
                              ),
                              const Text(
                                'A problem report does not resolve this stop. Record its actual delivery outcome separately.',
                              ),
                              if (stop.address.isNotEmpty)
                                OutlinedButton(
                                  onPressed: () async {
                                    if (!await confirmParked(context)) return;
                                    final uri = Uri.https(
                                      'www.google.com',
                                      '/maps/search/',
                                      {
                                        'api': '1',
                                        'query':
                                            stop.latitude != null &&
                                                stop.longitude != null
                                            ? '${stop.latitude},${stop.longitude}'
                                            : stop.address,
                                      },
                                    );
                                    if (!await launchUrl(
                                          uri,
                                          mode: LaunchMode.externalApplication,
                                        ) &&
                                        context.mounted) {
                                      notice(
                                        context,
                                        'Navigation could not open. Keep the saved address: ${stop.address}',
                                      );
                                    }
                                  },
                                  child: const Text('Open navigation'),
                                ),
                              if (!trip.held &&
                                  ([
                                        'on_route',
                                        'returning',
                                      ].contains(trip.status) ||
                                      localStart) &&
                                  stop.deliveryVersion == 0 &&
                                  local.every(
                                    (o) =>
                                        o['status'] == 'rejected' ||
                                        (o['review'] as Map?)?['status'] ==
                                            'request_followup',
                                  ))
                                PrimaryButton(
                                  label: 'Record stop outcome',
                                  onPressed: () {
                                    context.pop();
                                    context.push(
                                      '/driver/route/stop/${stop.stopId}',
                                    );
                                  },
                                )
                              else
                                Text(
                                  local.isNotEmpty
                                      ? statusLabel(
                                          local.last['status'] as String,
                                        )
                                      : 'Outcome: ${statusLabel(stop.status)}',
                                ),
                            ],
                          ),
                        ),
                      ),
                      if (local.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: StatusChip(
                            statusLabel(local.last['status'] as String),
                            tone: statusTone(local.last['status'] as String),
                          ),
                        ),
                    ],
                  );
                }),
                OutlinedButton(
                  onPressed: () => issue(context, ref, trip),
                  child: const Text('Report breakdown or delay'),
                ),
                PrimaryButton(
                  label: 'Request trip closeout',
                  onPressed: () => closeout(context, ref, trip),
                ),
                if (trip.routeRevision > 1)
                  OutlinedButton(
                    onPressed: () async {
                      try {
                        await ref
                            .read(operationalProvider)
                            .queue(
                              principal,
                              PendingOperation(
                                id: const Uuid().v4(),
                                entityId: trip.tripId,
                                type: 'update_acknowledged',
                                tripId: trip.tripId,
                                observedAt: DateTime.now(),
                                concurrency: {
                                  'routeRevision': trip.routeRevision,
                                },
                                payload: {},
                              ),
                            );
                        ref.read(dataRevisionProvider.notifier).state++;
                        await ref.read(syncWorkerProvider).run(manual: true);
                      } catch (error) {
                        if (context.mounted) notice(context, apiMessage(error));
                      }
                    },
                    child: Text(
                      'Acknowledge route revision ${trip.routeRevision}',
                    ),
                  ),
              ],
            ],
          ),
        );
  }
}
