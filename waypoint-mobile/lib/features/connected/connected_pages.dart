import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../app/providers.dart';
import '../../core/data/operational_repository.dart';
import '../../core/theme/formatters.dart';
import '../../core/widgets/waypoint_widgets.dart';
import '../../domain/models.dart';
import '../foundation/foundation_pages.dart';

typedef ReadKey = (String, String);
final remoteReadProvider = FutureProvider.family<CachedRead, ReadKey>((
  ref,
  key,
) {
  ref.watch(dataRevisionProvider);
  final principal = ref.watch(sessionProvider)!;
  return ref.watch(operationalProvider).read(key.$1, key.$2, principal);
});
final operationsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(dataRevisionProvider);
  return ref.watch(operationalProvider).operations(ref.watch(sessionProvider)!);
});
const operationLabels = {
  'trip_start': 'Route departure',
  'trip_closeout': 'Trip closeout',
  'trip_issue': 'Trip issue',
  'delivery_issue': 'Stop issue',
  'delivery_recorded': 'Delivery proof',
  'store_order_created': 'Order request',
  'receipt_recorded': 'Store receipt',
  'store_issue': 'Store issue',
  'update_acknowledged': 'Update acknowledgment',
};
String statusLabel(String status) => switch (status) {
  'queued' => 'Saved on this phone',
  'uploading' => 'Uploading photos',
  'submitting' => 'Awaiting server receipt',
  'synced' => 'Accepted by server',
  'retryableError' => 'Retry needed',
  'authRequired' => 'Sign in to continue',
  'conflict' => 'Changed · needs review',
  'rejected' => 'Needs correction',
  'awaitingOperations' => 'Operations review',
  'retainedForAudit' => 'Retained for audit',
  _ => status.replaceAll('_', ' '),
};
StatusTone statusTone(String status) =>
    ['synced', 'delivered', 'receipt_confirmed', 'completed'].contains(status)
    ? StatusTone.success
    : [
        'held',
        'conflict',
        'rejected',
        'failed',
        'refused',
        'skipped',
      ].contains(status)
    ? StatusTone.blocked
    : StatusTone.attention;
Future<bool> confirmParked(
  BuildContext context, {
  String title = 'Safely parked?',
}) async {
  var checked = false;
  return await showWaypointSheet<bool>(
        context,
        title: title,
        child: StatefulBuilder(
          builder: (context, setState) => Column(
            children: [
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: checked,
                onChanged: (value) => setState(() => checked = value ?? false),
                title: const Text('I am safely parked and can use the phone.'),
              ),
              PrimaryButton(
                label: 'Continue',
                onPressed: checked ? () => context.pop(true) : null,
              ),
            ],
          ),
        ),
      ) ==
      true;
}

void notice(BuildContext context, String message) {
  if (context.mounted) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class RemoteContent extends ConsumerWidget {
  const RemoteContent({super.key, required this.query, required this.builder});
  final ReadKey query;
  final Widget Function(CachedRead) builder;
  @override
  Widget build(BuildContext context, WidgetRef ref) => ref
      .watch(remoteReadProvider(query))
      .when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => PageBody(
          children: [
            ErrorState(
              message: apiMessage(error),
              onRetry: () => ref.invalidate(remoteReadProvider(query)),
            ),
          ],
        ),
        data: builder,
      );
}

class ConnectedTodayPage extends ConsumerStatefulWidget {
  const ConnectedTodayPage({super.key});
  @override
  ConsumerState<ConnectedTodayPage> createState() => _ConnectedTodayPageState();
}

class _ConnectedTodayPageState extends ConsumerState<ConnectedTodayPage> {
  bool busy = false;
  Future<void> start(RouteSnapshot trip) async {
    if (busy) return;
    setState(() => busy = true);
    try {
      if (!await confirmParked(context, title: 'Before departure')) return;
      final principal = ref.read(sessionProvider)!;
      if (!trip.startEligible) {
        throw StateError(
          'Operations publication, loading and earlier trip completion must be confirmed first.',
        );
      }
      final operations = await ref
          .read(operationalProvider)
          .operations(principal);
      if (operations.any(
        (op) =>
            (op['request'] as Map?)?['tripId'] == trip.tripId &&
            op['type'] == 'trip_start',
      )) {
        throw StateError('Departure is already saved. Check Sync Centre.');
      }
      await ref
          .read(operationalProvider)
          .queue(
            principal,
            PendingOperation(
              id: const Uuid().v4(),
              entityId: trip.tripId,
              type: 'trip_start',
              tripId: trip.tripId,
              observedAt: DateTime.now(),
              concurrency: {
                'assignmentVersion': trip.assignmentVersion,
                'releaseVersion': trip.releaseVersion,
              },
              payload: {'parkedAcknowledged': true},
            ),
          );
      ref.read(dataRevisionProvider.notifier).state++;
      if (mounted) {
        notice(
          context,
          'Departure saved on this phone. Server confirmation follows sync.',
        );
      }
      await ref.read(syncWorkerProvider).run(manual: true);
    } catch (error) {
      if (mounted) notice(context, apiMessage(error));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
              PageHeading(
                'Hello, ${principal.name}',
                '${principal.depot} · Driver',
              ),
              if (trip == null)
                const EmptyState(
                  title: 'No assigned route',
                  message:
                      'Operations will assign your route. Pending proof remains available in Activity.',
                  asset: 'assets/mobile/no-assigned-trip.png',
                )
              else ...[
                TripCard(trip: trip, onView: () => context.go('/driver/route')),
                StatusChip(
                  statusLabel(trip.status),
                  tone: statusTone(trip.held ? 'held' : trip.status),
                ),
                if (trip.savedAt != null)
                  Text(
                    '${trip.fromCache ? 'Saved route' : 'Route saved'} · ${businessDate(trip.savedAt!)} ${businessTime(trip.savedAt!)} · revision ${trip.routeRevision}',
                  ),
                if (operations.any(
                  (op) =>
                      op['type'] == 'trip_start' &&
                      (op['request'] as Map?)?['tripId'] == trip.tripId &&
                      op['status'] != 'synced',
                ))
                  const StatusChip(
                    'Departure saved on this phone · pending confirmation',
                    tone: StatusTone.attention,
                  )
                else if (trip.status == 'ready_to_depart' &&
                    trip.released &&
                    !trip.held &&
                    trip.startEligible)
                  PrimaryButton(
                    label: 'Start route',
                    busy: busy,
                    onPressed: () => start(trip),
                  )
                else if (trip.status == 'loading' || trip.held)
                  const Text(
                    'Departure stays blocked until loading and operations release this trip.',
                  ),
                if (trip.status == 'ready_to_depart' && !trip.startEligible)
                  const Text(
                    'Waiting for published dispatch or confirmed closeout of the earlier trip.',
                  ),
                if (trip.nextTrip != null)
                  Text(
                    'Next: Trip ${trip.nextTrip!['tripNumber']} · ${trip.nextTrip!['vehicleId']} · ${statusLabel(trip.nextTrip!['status'] as String)}. Departure follows confirmed earlier-trip closeout.',
                  ),
              ],
              Text(
                '${operations.where((op) => op['status'] != 'synced').length} pending operations',
              ),
              PrimaryButton(
                label: 'Open Sync Centre',
                onPressed: () => context.push('/driver/activity/sync'),
              ),
            ],
          ),
        );
  }
}
