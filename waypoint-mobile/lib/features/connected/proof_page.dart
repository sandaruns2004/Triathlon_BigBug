import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../app/providers.dart';
import '../../core/data/operational_repository.dart';
import '../../core/media/evidence_capture.dart';
import '../../core/storage/local_database.dart';
import '../../core/storage/media_store.dart';
import '../../core/widgets/signature_pad.dart';
import '../../core/widgets/waypoint_widgets.dart';
import '../../domain/models.dart';
import '../foundation/foundation_pages.dart';
import 'connected_pages.dart';

class ProofPage extends ConsumerStatefulWidget {
  const ProofPage({super.key, required this.stopId});
  final String stopId;
  @override
  ConsumerState<ProofPage> createState() => _ProofPageState();
}

class _ProofPageState extends ConsumerState<ProofPage> {
  RouteSnapshot? trip;
  Principal? owner;
  RouteStop? stop;
  Map<String, dynamic> draft = {};
  String? error;
  bool busy = false, parked = false;
  OperationalRepository? repository;
  bool formReady = false;
  int stage = 0;
  Future<void> saving = Future.value();
  Timer? debounce;
  final recipient = TextEditingController(),
      reason = TextEditingController(),
      note = TextEditingController();
  final quantities = <String, TextEditingController>{};
  final lineReasons = <String, TextEditingController>{};
  List<List<double>?> signature = [];
  String get draftId => 'pod/${widget.stopId}';
  List<String> get photos =>
      ((draft['evidenceIds'] as List?) ?? []).cast<String>();
  List<ManifestLine> get proofLines =>
      ((draft['approvedLines'] as List?) ?? []).map((entry) {
        final line = Map<String, dynamic>.from(entry as Map);
        final current = stop!.lines
            .where((l) => l.lineId == line['lineId'])
            .firstOrNull;
        return ManifestLine(
          lineId: line['lineId'] as String,
          productId:
              line['productId'] as String? ??
              current?.productId ??
              line['lineId'] as String,
          name:
              line['name'] as String? ??
              current?.name ??
              line['lineId'] as String,
          quantity: line['quantity'] as int,
          unit: line['unit'] as String,
        );
      }).toList();
  @override
  void initState() {
    super.initState();
    Future.microtask(load);
  }

  Future<void> load() async {
    try {
      final principal = ref.read(sessionProvider)!;
      repository = ref.read(operationalProvider);
      owner = principal;
      final route = await ref.read(routeProvider(principal).future);
      final matches =
          route?.stops.where((s) => s.stopId == widget.stopId).toList() ?? [];
      if (route == null || matches.isEmpty) {
        throw StateError(
          'This stop is not on your current assignment. Preserved proof is in Activity.',
        );
      }
      final ops = await ref.read(operationalProvider).operations(principal);
      if (ops.any(
        (o) =>
            o['type'] == 'delivery_recorded' &&
            o['entityId'] == widget.stopId &&
            o['status'] != 'rejected' &&
            !(o['status'] == 'retainedForAudit' &&
                (o['review'] as Map?)?['status'] == 'request_followup'),
      )) {
        throw StateError('Proof is already saved. Open Sync Centre.');
      }
      if (route.held || matches.first.deliveryVersion > 0) {
        throw StateError(
          'This stop cannot accept new proof. Refresh the route.',
        );
      }
      final localStart = ops.any(
        (o) =>
            o['type'] == 'trip_start' &&
            (o['request'] as Map?)?['tripId'] == route.tripId &&
            !['rejected', 'conflict'].contains(o['status']),
      );
      if (!['on_route', 'returning'].contains(route.status) && !localStart) {
        throw StateError(
          'Start this released route before recording an outcome.',
        );
      }
      final saved = await ref
          .read(operationalProvider)
          .loadForm(principal, draftId);
      if (!mounted) return;
      trip = route;
      stop = matches.first;
      draft =
          saved ??
          {
            'outcome': 'full',
            'evidenceIds': <String>[],
            'operationId': const Uuid().v4(),
            'proofId': const Uuid().v4(),
            'concurrency': {
              'assignmentVersion': route.assignmentVersion,
              'stopManifestRevision': stop!.manifestRevision,
              'stopDeliveryVersion': stop!.deliveryVersion,
              'orderFulfillmentVersions': {
                stop!.orderId: stop!.orderFulfillmentVersion,
              },
            },
            'approvedLines': stop!.lines
                .map(
                  (l) => {
                    'lineId': l.lineId,
                    'productId': l.productId,
                    'name': l.name,
                    'quantity': l.quantity,
                    'unit': l.unit,
                  },
                )
                .toList(),
          };
      recipient.text = draft['recipientName'] as String? ?? '';
      if (ops.any(
        (o) =>
            o['id'] == draft['operationId'] &&
            (o['status'] == 'rejected' ||
                (o['review'] as Map?)?['status'] == 'request_followup'),
      )) {
        draft['operationId'] = const Uuid().v4();
        draft['proofId'] = const Uuid().v4();
        draft['concurrency'] = {
          'assignmentVersion': route.assignmentVersion,
          'stopManifestRevision': stop!.manifestRevision,
          'stopDeliveryVersion': stop!.deliveryVersion,
          'orderFulfillmentVersions': {
            stop!.orderId: stop!.orderFulfillmentVersion,
          },
        };
        draft['correction'] = true;
        draft['approvedLines'] = stop!.lines
            .map(
              (l) => {
                'lineId': l.lineId,
                'productId': l.productId,
                'name': l.name,
                'quantity': l.quantity,
                'unit': l.unit,
              },
            )
            .toList();
      }
      draft['approvedLines'] ??= stop!.lines
          .map(
            (l) => {
              'lineId': l.lineId,
              'productId': l.productId,
              'name': l.name,
              'quantity': l.quantity,
              'unit': l.unit,
            },
          )
          .toList();
      reason.text = draft['reason'] as String? ?? '';
      note.text = draft['note'] as String? ?? '';
      for (final line in proofLines) {
        final previous = ((draft['lines'] as List?) ?? [])
            .where((l) => l['lineId'] == line.lineId)
            .toList();
        quantities[line.lineId] = TextEditingController(
          text:
              '${previous.isEmpty ? line.quantity : previous.first['deliveredQty']}',
        );
        lineReasons[line.lineId] = TextEditingController(
          text: previous.isEmpty
              ? ''
              : previous.first['reason'] as String? ?? '',
        );
      }
      signature = ((draft['signaturePoints'] as List?) ?? [])
          .map(
            (p) => p == null
                ? null
                : (p as List).map((n) => (n as num).toDouble()).toList(),
          )
          .toList();
      formReady = true;
      setState(() {});
      await persist();
      if (mounted) {
        final yes = await confirmParked(
          context,
          title: 'Before recording this stop',
        );
        if (mounted) setState(() => parked = yes);
      }
    } catch (e) {
      if (mounted) setState(() => error = apiMessage(e));
    }
  }

  Map<String, dynamic> fields() => {
    ...draft,
    'recipientName': recipient.text.trim(),
    'reason': reason.text.trim(),
    'note': note.text,
    'signaturePoints': signature,
    'lines': proofLines
        .map(
          (l) => {
            'lineId': l.lineId,
            'deliveredQty': int.tryParse(quantities[l.lineId]!.text) ?? -1,
            'unit': l.unit,
            'reason': lineReasons[l.lineId]!.text.trim(),
          },
        )
        .toList(),
  };
  Future<void> persist() {
    if (!formReady) return Future.value();
    final snapshot = fields();
    final principal = owner!;
    final repo = repository!, id = draftId, entity = stop!.stopId;
    saving = saving
        .catchError((Object _) {})
        .then((_) => repo.saveForm(principal, id, entity, snapshot));
    return saving;
  }

  void changed() {
    debounce?.cancel();
    debounce = Timer(const Duration(milliseconds: 250), () {
      persist().catchError((Object e) {
        if (mounted) notice(context, apiMessage(e));
      });
    });
  }

  Future<void> capture() async {
    if (busy || photos.length >= 3) return;
    setState(() => busy = true);
    try {
      debounce?.cancel();
      await persist();
      final principal = ref.read(sessionProvider)!;
      final storage = ref.read(storageProvider);
      await EvidenceCapture(
        storage.store!,
        storage.media!,
      ).capture(principal, draftId, stop!.stopId);
      final saved = await ref
          .read(operationalProvider)
          .loadForm(principal, draftId);
      if (mounted) {
        setState(
          () => draft = {
            ...draft,
            'evidenceIds': saved?['evidenceIds'] ?? photos,
          },
        );
      }
    } catch (e) {
      if (mounted) notice(context, apiMessage(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  String? validate() {
    final outcome = draft['outcome'];
    bool differs = false, delivered = false;
    for (final line in proofLines) {
      final qty = int.tryParse(quantities[line.lineId]!.text);
      if (qty == null || qty < 0 || qty > line.quantity) {
        return 'Use whole quantities from zero to the approved quantity.';
      }
      differs |= qty != line.quantity;
      delivered |= qty > 0;
      if (qty != line.quantity &&
          lineReasons[line.lineId]!.text.trim().isEmpty &&
          reason.text.trim().isEmpty) {
        return 'Explain each quantity difference.';
      }
    }
    if (outcome == 'full' && differs) {
      return 'Select Partial when quantities differ.';
    }
    if (outcome == 'partial' && (!differs || !delivered)) {
      return 'Partial needs some delivered goods and an explained difference.';
    }
    if (['failed', 'refused', 'skipped'].contains(outcome) &&
        (delivered || reason.text.trim().isEmpty)) {
      return 'An unsuccessful stop needs zero delivered quantities and a reason.';
    }
    if (['full', 'partial'].contains(outcome)) {
      if (recipient.text.trim().isEmpty) return 'Enter the recipient name.';
      if (photos.isEmpty) return 'Keep at least one delivery photo.';
      if (trip!.evidencePolicy['signatureRequired'] == true &&
          signature.whereType<List<double>>().length < 2) {
        return 'A drawn signature is required by this route policy.';
      }
    }
    return null;
  }

  Future<void> complete() async {
    if (busy || !parked) return;
    final problem = validate();
    if (problem != null) {
      notice(context, problem);
      return;
    }
    setState(() => busy = true);
    try {
      debounce?.cancel();
      await persist();
      final principal = ref.read(sessionProvider)!;
      final ops = await ref.read(operationalProvider).operations(principal);
      final dependencies = ops
          .where(
            (o) =>
                o['type'] == 'trip_start' &&
                (o['request'] as Map?)?['tripId'] == trip!.tripId &&
                o['status'] != 'rejected',
          )
          .map((o) => o['id'] as String)
          .toList();
      final f = fields();
      final payload = {
        'proofId': draft['proofId'],
        'outcome': draft['outcome'],
        'parkedAcknowledged': true,
        'recipientName': f['recipientName'],
        'reason': f['reason'],
        'note': f['note'],
        'lines': f['lines'],
        'evidenceIds': photos,
        if (signature.whereType<List<double>>().length >= 2)
          'signature': jsonEncode({'mode': 'drawn', 'points': signature}),
      };
      final op = PendingOperation(
        id: draft['operationId'] as String,
        entityId: stop!.stopId,
        type: 'delivery_recorded',
        tripId: trip!.tripId,
        stopId: stop!.stopId,
        orderId: stop!.orderId,
        observedAt: DateTime.now(),
        concurrency: Map<String, dynamic>.from(draft['concurrency'] as Map),
        dependencyIds: dependencies,
        evidenceIds: photos,
        payload: payload,
      );
      await ref
          .read(operationalProvider)
          .complete(principal, draft['proofId'] as String, payload, op);
      ref.read(dataRevisionProvider.notifier).state++;
      if (mounted) {
        notice(
          context,
          'Proof saved on this phone. Open Sync Centre for server acceptance.',
        );
        context.pop();
      }
      await ref.read(syncWorkerProvider).run(manual: true);
    } catch (e) {
      if (mounted) notice(context, apiMessage(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  void dispose() {
    debounce?.cancel();
    if (stop != null) persist().catchError((Object _) {});
    recipient.dispose();
    reason.dispose();
    note.dispose();
    for (final controller in [...quantities.values, ...lineReasons.values]) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (error != null) {
      return PageBody(
        children: [
          ErrorState(
            message: error!,
            onRetry: () {
              setState(() => error = null);
              load();
            },
          ),
        ],
      );
    }
    if (stop == null) return const Center(child: CircularProgressIndicator());
    final old = draft['concurrency'] as Map;
    final changedManifest =
        old['stopManifestRevision'] != stop!.manifestRevision ||
        old['assignmentVersion'] != trip!.assignmentVersion;
    return PageBody(
      children: [
        PageHeading(
          stop!.name,
          'Step ${stage + 1} of 3 · quantities, evidence, review',
        ),
        if (!parked)
          PrimaryButton(
            label: 'I am safely parked',
            onPressed: () async {
              final yes = await confirmParked(context);
              if (mounted) setState(() => parked = yes);
            },
          ),
        if (changedManifest)
          SurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'The approved manifest changed. Your original draft is retained; saving submits its original versions for explicit review.',
                ),
                ...((draft['approvedLines'] as List?) ?? []).map(
                  (l) => Text('Saved: ${l['quantity']} ${l['unit']}'),
                ),
                ...stop!.lines.map(
                  (l) => Text('Current: ${l.name} · ${l.quantity} ${l.unit}'),
                ),
              ],
            ),
          ),
        if (parked) ...[
          if (draft['correction'] == true)
            const Text(
              'Corrected copy: review the current approved lines and evidence. Your rejected original remains unchanged in Activity.',
            ),
          if (stage == 0) ...[
            DropdownButtonFormField<String>(
              initialValue: draft['outcome'] as String,
              decoration: const InputDecoration(labelText: 'Stop outcome'),
              items: [
                'full',
                'partial',
                'failed',
                'refused',
                'skipped',
              ].map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
              onChanged: (value) {
                setState(() => draft['outcome'] = value);
                if (['failed', 'refused', 'skipped'].contains(value)) {
                  for (final c in quantities.values) {
                    c.text = '0';
                  }
                }
                changed();
              },
            ),
            ...proofLines.map(
              (l) => SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${l.name} · approved ${l.quantity} ${l.unit}'),
                    TextField(
                      controller: quantities[l.lineId],
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Delivered (${l.unit})',
                      ),
                      onChanged: (_) => changed(),
                    ),
                    TextField(
                      controller: lineReasons[l.lineId],
                      maxLength: 500,
                      decoration: const InputDecoration(
                        labelText: 'Reason for difference',
                      ),
                      onChanged: (_) => changed(),
                    ),
                  ],
                ),
              ),
            ),
            TextField(
              controller: reason,
              maxLength: 500,
              decoration: const InputDecoration(
                labelText: 'Exception / overall reason',
              ),
              onChanged: (_) => changed(),
            ),
          ],
          if (stage == 1) ...[
            if (['full', 'partial'].contains(draft['outcome']))
              TextField(
                controller: recipient,
                maxLength: 120,
                decoration: const InputDecoration(labelText: 'Recipient name'),
                onChanged: (_) => changed(),
              ),
            Text('Photos: ${photos.length}/3 · JPEG or PNG, up to 2 MB each'),
            ...photos.map(
              (id) => EvidencePreview(
                evidenceId: id,
                onRemove: () async {
                  setState(
                    () => draft['evidenceIds'] = photos
                        .where((p) => p != id)
                        .toList(),
                  );
                  await persist();
                },
              ),
            ),
            PrimaryButton(
              label: 'Take delivery photo',
              busy: busy,
              onPressed: photos.length < 3 ? capture : null,
            ),
            const Text('Signature (optional unless required by the route)'),
            SignaturePad(
              points: signature,
              onChanged: (points) {
                setState(() => signature = points);
                changed();
              },
            ),
            TextButton(
              onPressed: () {
                setState(() => signature = []);
                changed();
              },
              child: const Text('Clear signature'),
            ),
            TextField(
              controller: note,
              maxLength: 1000,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Delivery note'),
              onChanged: (_) => changed(),
            ),
          ],
          if (stage == 2) ...[
            StatusChip('Review before saving', tone: StatusTone.attention),
            Text('Outcome: ${draft['outcome']}'),
            ...proofLines.map(
              (l) => Text('${l.name}: ${quantities[l.lineId]!.text} ${l.unit}'),
            ),
            Text(
              'Recipient: ${recipient.text.isEmpty ? 'Not required for unsuccessful outcomes' : recipient.text}',
            ),
            Text('${photos.length} retained photos · ${reason.text}'),
            PrimaryButton(
              label: 'Complete stop · save proof',
              busy: busy,
              onPressed: complete,
            ),
          ],
          if (stage < 2)
            PrimaryButton(
              label: 'Continue',
              onPressed: () async {
                try {
                  await persist();
                  if (mounted) setState(() => stage++);
                } catch (e) {
                  if (context.mounted) notice(context, apiMessage(e));
                }
              },
            ),
          if (stage > 0)
            TextButton(
              onPressed: () => setState(() => stage--),
              child: const Text('Back'),
            ),
        ],
      ],
    );
  }
}

final evidencePreviewProvider = FutureProvider.family<Uint8List, String>((
  ref,
  id,
) async {
  final storage = ref.read(storageProvider),
      principal = ref.watch(sessionProvider)!;
  final row = await storage.store!.read(
    LocalTable.evidence,
    principal.userId,
    id,
  );
  if (row == null) {
    throw const StorageFailure('Saved photo metadata is missing.');
  }
  return storage.media!.read(
    principal.userId,
    EvidenceFile(
      id: id,
      path: row['path'] as String,
      bytes: row['bytes'] as int,
      mime: row['mime'] as String,
    ),
  );
});

class EvidencePreview extends ConsumerWidget {
  const EvidencePreview({super.key, required this.evidenceId, this.onRemove});
  final String evidenceId;
  final VoidCallback? onRemove;
  @override
  Widget build(BuildContext context, WidgetRef ref) => Column(
    children: [
      ref
          .watch(evidencePreviewProvider(evidenceId))
          .when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => Text(apiMessage(e)),
            data: (bytes) => Image.memory(
              bytes,
              height: 140,
              fit: BoxFit.contain,
              semanticLabel: 'Retained evidence photo',
              errorBuilder: (_, _, _) => const Text(
                'Photo preview unavailable. The retained file remains available for recovery.',
              ),
            ),
          ),
      if (onRemove != null)
        TextButton(onPressed: onRemove, child: const Text('Remove from draft')),
    ],
  );
}
