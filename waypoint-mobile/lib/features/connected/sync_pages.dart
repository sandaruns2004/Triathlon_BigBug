import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/data/operational_repository.dart';
import '../../core/widgets/waypoint_widgets.dart';
import '../foundation/foundation_pages.dart';
import 'connected_pages.dart';

class ConnectedActivityPage extends ConsumerWidget {
  const ConnectedActivityPage({super.key, this.syncCentre = false});
  final bool syncCentre;
  @override
  Widget build(BuildContext context, WidgetRef ref) => PageBody(
    children: [
      PageHeading(
        syncCentre ? 'Sync Centre' : 'Activity',
        'Saved locally and accepted by the server are separate states.',
      ),
      const Text(
        'Keep the app open to sync. Photos and proof remain encrypted on this phone when the connection is unavailable.',
      ),
      const SyncAction(),
      ref
          .watch(operationsProvider)
          .when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => ErrorState(
              message: apiMessage(e),
              onRetry: () => ref.invalidate(operationsProvider),
            ),
            data: (rows) => Column(
              children: [
                if (rows.isEmpty)
                  const EmptyState(
                    title: 'Nothing pending',
                    message: 'Your saved operations will appear here.',
                  ),
                ...rows.reversed.map(
                  (row) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: OperationCard(operation: row),
                  ),
                ),
              ],
            ),
          ),
    ],
  );
}

class SyncAction extends ConsumerStatefulWidget {
  const SyncAction({super.key});
  @override
  ConsumerState<SyncAction> createState() => _SyncActionState();
}

class _SyncActionState extends ConsumerState<SyncAction> {
  bool busy = false;
  String? result;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      PrimaryButton(
        label: 'Sync now',
        busy: busy,
        onPressed: () async {
          setState(() => busy = true);
          try {
            final summary = await ref
                .read(syncWorkerProvider)
                .run(manual: true);
            if (mounted) setState(() => result = summary.message);
          } catch (e) {
            if (context.mounted) notice(context, apiMessage(e));
          } finally {
            if (mounted) setState(() => busy = false);
          }
        },
      ),
      if (result != null)
        Padding(padding: const EdgeInsets.only(top: 8), child: Text(result!)),
    ],
  );
}

class OperationCard extends ConsumerStatefulWidget {
  const OperationCard({super.key, required this.operation});
  final Map<String, dynamic> operation;
  @override
  ConsumerState<OperationCard> createState() => _OperationCardState();
}

class _OperationCardState extends ConsumerState<OperationCard> {
  bool busy = false;
  Map<String, dynamic>? comparison;
  Future<void> review() async {
    if (busy) return;
    setState(() => busy = true);
    final principal = ref.read(sessionProvider)!;
    final op = widget.operation;
    try {
      if (op['status'] == 'conflict') {
        final reason = TextEditingController();
        final detail = await showWaypointSheet<String>(
          context,
          title: 'Preserve original proof for operations',
          child: Column(
            children: [
              const Text(
                'The original record stays unchanged. A review does not complete the delivery or overwrite a replacement route.',
              ),
              TextField(
                controller: reason,
                maxLength: 1000,
                decoration: const InputDecoration(
                  labelText: 'Explain what happened',
                ),
              ),
              PrimaryButton(
                label: 'Request review',
                onPressed: () {
                  if (reason.text.trim().isNotEmpty) {
                    Navigator.of(context).pop(reason.text.trim());
                  }
                },
              ),
            ],
          ),
        );
        reason.dispose();
        if (detail == null) return;
        await ref
            .read(apiProvider)
            .dio
            .post(
              'conflicts/${op['id']}/reviews',
              data: {'operation': op['request'], 'reason': detail},
            );
        // Historical media is uploaded only after the server authorizes this review.
        for (final eid in (op['evidenceIds'] as List? ?? [])) {
          await ref
              .read(syncWorkerProvider)
              .transport
              .upload(
                principal.userId,
                op,
                eid as String,
                reviewOperationId: op['id'] as String,
              );
        }
        await ref
            .read(storageProvider)
            .store!
            .updateOperation(
              principal.userId,
              op['id'] as String,
              status: 'awaitingOperations',
              message: 'Original proof retained for operations review.',
            );
        ref.read(dataRevisionProvider.notifier).state++;
      }
      final response = await ref
          .read(apiProvider)
          .dio
          .get<Map<String, dynamic>>('conflicts/${op['id']}');
      final decision = response.data!;
      if ([
        'approved_amendment',
        'retain_for_audit',
        'request_followup',
      ].contains(decision['status'])) {
        await ref
            .read(storageProvider)
            .store!
            .updateOperation(
              principal.userId,
              op['id'] as String,
              status: 'retainedForAudit',
              message:
                  'Original proof retained. Operations decision: ${decision['status']}',
              review: decision,
            );
        ref.read(dataRevisionProvider.notifier).state++;
      }
      if (mounted) setState(() => comparison = response.data);
    } catch (e) {
      if (mounted) notice(context, apiMessage(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final op = widget.operation;
    final request = op['request'] as Map? ?? {};
    final receipt = op['acknowledgment'] as Map?;
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            operationLabels[op['type']] ?? 'Saved operation',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          Text(op['entityId'] as String),
          StatusChip(
            statusLabel(op['status'] as String),
            tone: statusTone(op['status'] as String),
          ),
          if (op['message'] != null) Text(op['message'] as String),
          if (receipt != null)
            Text(
              'Server result: ${receipt['outcome'] ?? receipt['tripStatus'] ?? 'accepted'}',
            ),
          if (receipt?['orderId'] != null)
            Text('Order reference: ${receipt!['orderId']}'),
          if (op['status'] == 'rejected')
            const Text(
              'This record is retained. Open the original form, review changed fields and save a new corrected operation.',
            ),
          if (op['status'] == 'rejected' && op['type'] == 'store_order_created')
            PrimaryButton(
              label: 'Correct retained request',
              onPressed: () =>
                  context.push('/store/orders/new?correction=${op['id']}'),
            ),
          if (op['type'] == 'delivery_recorded' &&
              [
                'conflict',
                'awaitingOperations',
                'retainedForAudit',
              ].contains(op['status']))
            PrimaryButton(
              label: op['status'] == 'conflict'
                  ? 'Request operations review'
                  : 'Refresh review',
              busy: busy,
              onPressed: review,
            ),
          if (comparison != null) ...[
            Text('Review: ${comparison!['status']}'),
            if (comparison!['resolution'] != null)
              Text('Decision: ${comparison!['resolution']}'),
            const Text('Saved delivered quantities'),
            ...(((request['payload'] as Map?)?['lines'] as List?) ?? []).map(
              (l) => Text('${l['lineId']}: ${l['deliveredQty']} ${l['unit']}'),
            ),
            const Text('Current approved quantities'),
            ...(((comparison!['canonical'] as Map?)?['lines'] as List?) ?? [])
                .map(
                  (l) => Text('${l['lineId']}: ${l['quantity']} ${l['unit']}'),
                ),
          ],
        ],
      ),
    );
  }
}
