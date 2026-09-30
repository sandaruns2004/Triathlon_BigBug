import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../app/providers.dart';
import '../../core/data/operational_repository.dart';
import '../../core/media/evidence_capture.dart';
import '../../core/storage/local_database.dart';
import '../../core/widgets/waypoint_widgets.dart';
import '../../domain/models.dart';
import '../foundation/foundation_pages.dart';
import 'connected_pages.dart';
import 'proof_page.dart';
import 'sync_pages.dart';
import 'evidence_viewer.dart';
import 'profile_notifications.dart';

class ConnectedStoreOrdersPage extends ConsumerWidget {
  const ConnectedStoreOrdersPage({super.key, this.home = false});
  final bool home;
  @override
  Widget build(BuildContext context, WidgetRef ref) => RemoteContent(
    query: ('store/orders', 'store/orders'),
    builder: (read) => PageBody(
      children: [
        PageHeading(
          home ? 'Welcome, ${ref.watch(sessionProvider)!.name}' : 'Your orders',
          '${ref.watch(sessionProvider)!.outletId} · ${read.fromCache ? 'Saved view' : 'Latest view'}',
        ),
        PrimaryButton(
          label: 'Create order',
          onPressed: () => context.push('/store/orders/new'),
        ),
        if (home)
          ref
              .watch(notificationsProvider)
              .when(
                data: (rows) => TextButton(
                  onPressed: () => context.go('/store/notifications'),
                  child: Text(
                    '${rows.where((n) => n['read'] != true).length} unread outlet updates',
                  ),
                ),
                loading: () => const Text('Checking outlet updates…'),
                error: (_, _) => TextButton(
                  onPressed: () => context.go('/store/notifications'),
                  child: const Text('Open outlet updates'),
                ),
              ),
        Text(
          'Fetched ${read.savedAt.toUtc().toIso8601String()} · status updates, estimated arrival only',
        ),
        if (read.fromCache)
          Text(
            'Saved at ${read.savedAt.toLocal()} · connect for current delivery status',
          ),
        const SyncAction(),
        if ((read.data['orders'] as List).isEmpty)
          const EmptyState(
            title: 'No orders yet',
            message: 'Create a request from the current catalogue.',
          ),
        ...(read.data['orders'] as List).map(
          (o) => SurfaceCard(
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(o['orderId'] as String),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Requested: ${o['requestedDate'] ?? o['planDate']}'),
                  StatusChip(
                    statusLabel(o['status'] as String),
                    tone: statusTone(o['status'] as String),
                  ),
                  if (o['tracking'] != null)
                    Text(
                      'Trip: ${(o['tracking'] as Map)['status']} · ${(o['tracking'] as Map)['held'] == true ? 'Operations hold' : 'Status update'}',
                    ),
                  ...((o['history'] as List?) ?? []).map(
                    (h) => Text(
                      '${(h['type'] as String).replaceAll('_', ' ')} · ${h['at']} · ${h['reason']}',
                    ),
                  ),
                  if (o['status'] == 'deferred')
                    Text(
                      '${o['deferralReason'] ?? 'Capacity deferral'} · proposed ${o['proposedDate'] ?? 'Awaiting operations'}',
                    ),
                ],
              ),
              onTap: () => context.push('/store/orders/${o['orderId']}'),
            ),
          ),
        ),
        const Text(
          'Unconfirmed local requests and receipts appear in Sync Centre.',
        ),
      ],
    ),
  );
}

class StoreOrderDetailPage extends ConsumerWidget {
  const StoreOrderDetailPage({super.key, required this.orderId});
  final String orderId;
  Future<void> acknowledge(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> order,
  ) async {
    try {
      await ref
          .read(operationalProvider)
          .queue(
            ref.read(sessionProvider)!,
            PendingOperation(
              id: const Uuid().v4(),
              entityId: orderId,
              type: 'update_acknowledged',
              orderId: orderId,
              observedAt: DateTime.now(),
              concurrency: {'updateVersion': order['updateVersion'] ?? 0},
              payload: {},
            ),
          );
      ref.read(dataRevisionProvider.notifier).state++;
      await ref.read(syncWorkerProvider).run(manual: true);
      if (context.mounted) {
        notice(
          context,
          'Acknowledgment saved. Check Sync Centre for acceptance.',
        );
      }
    } catch (e) {
      if (context.mounted) notice(context, apiMessage(e));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) => RemoteContent(
    query: ('store/orders/$orderId', 'order/$orderId'),
    builder: (read) {
      final o = read.data;
      return PageBody(
        children: [
          PageHeading(
            'Order $orderId',
            'Requested ${o['requestedDate'] ?? o['planDate']}',
          ),
          StatusChip(
            statusLabel(o['status'] as String),
            tone: statusTone(o['status'] as String),
          ),
          if (read.fromCache) Text('Saved view · ${read.savedAt.toLocal()}'),
          const Text('Requested quantities'),
          ...((o['lines'] as List?) ?? []).map(
            (l) => Text(
              '${l['name'] ?? l['productId']}: ${l['quantity']} ${l['unit']}',
            ),
          ),
          if (o['approvedLines'] != null) ...[
            const Text('Approved after loading'),
            ...(o['approvedLines'] as List).map(
              (l) => Text(
                '${l['name'] ?? l['productId']}: ${l['quantity']} ${l['unit']}',
              ),
            ),
          ],
          if (o['status'] == 'deferred')
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Capacity deferral · sorry, this request could not be carried as planned.',
                  ),
                  Text('Reason: ${o['deferralReason']}'),
                  Text('Proposed date: ${o['proposedDate']}'),
                  PrimaryButton(
                    label: 'Acknowledge update',
                    onPressed: () => acknowledge(context, ref, o),
                  ),
                ],
              ),
            ),
          if (o['deliveredLines'] != null) ...[
            const Text('Server-confirmed delivered goods'),
            ...(o['deliveredLines'] as List).map(
              (l) => Text('${l['lineId']}: ${l['deliveredQty']} ${l['unit']}'),
            ),
          ],
          if (['delivered', 'partial'].contains(o['status']) &&
              o['receiptId'] == null)
            PrimaryButton(
              label: 'Review and confirm receipt',
              onPressed: () => context.push('/store/orders/$orderId/receipt'),
            ),
          if (o['receiptId'] != null)
            PrimaryButton(
              label: 'Open digital delivery note',
              onPressed: () => context.push('/store/orders/$orderId/note'),
            ),
          OutlinedButton(
            onPressed: () => context.push('/store/orders/$orderId/issue'),
            child: const Text('Report issue or business impact'),
          ),
          OutlinedButton(
            onPressed: () => ref.invalidate(
              remoteReadProvider(('store/orders/$orderId', 'order/$orderId')),
            ),
            child: const Text('Refresh status'),
          ),
        ],
      );
    },
  );
}

class StoreComposerPage extends ConsumerStatefulWidget {
  const StoreComposerPage({super.key, this.correctionId});
  final String? correctionId;
  @override
  ConsumerState<StoreComposerPage> createState() => _StoreComposerState();
}

class _StoreComposerState extends ConsumerState<StoreComposerPage> {
  Principal? owner;
  final quantities = <String, TextEditingController>{};
  final note = TextEditingController();
  Map<String, dynamic>? catalogue;
  String? date, error;
  String search = '';
  bool busy = false, review = false;
  bool changedProductsReviewed = false;
  List<String> changedProducts = [];
  Map<String, dynamic> draft = {};
  Future<void> saving = Future.value();
  String get draftId => 'cart/${owner!.outletId}';
  @override
  void initState() {
    super.initState();
    Future.microtask(load);
  }

  Future<void> load() async {
    try {
      final p = ref.read(sessionProvider)!;
      owner = p;
      final repo = ref.read(operationalProvider);
      final read = await repo.read('store/catalogue', 'catalogue', p);
      final saved = await repo.loadForm(p, draftId);
      if (!mounted) return;
      catalogue = read.data;
      draft =
          saved ??
          {'operationId': const Uuid().v4(), 'draftId': const Uuid().v4()};
      if (widget.correctionId != null) {
        final original = await repo.store.read(
          LocalTable.outbox,
          p.userId,
          widget.correctionId!,
        );
        if (!mounted) return;
        if (original == null || original['status'] != 'rejected') {
          throw StateError(
            'Only a rejected request can be corrected. Retry uncertain responses with their original ID in Sync Centre.',
          );
        }
        final payload = (original['request'] as Map)['payload'] as Map;
        draft = {
          ...payload,
          'operationId': const Uuid().v4(),
          'draftId': const Uuid().v4(),
          'quantities': {
            for (final line in payload['lines'] as List)
              line['productId']: line['quantity'],
          },
        };
        final products = catalogue!['products'] as List;
        for (final line in payload['lines'] as List) {
          if (!products.any(
            (product) =>
                product['productId'] == line['productId'] &&
                product['unit'] == line['unit'],
          )) {
            changedProducts.add(
              '${line['productId']} · ${line['quantity']} ${line['unit']}',
            );
            (draft['quantities'] as Map)[line['productId']] = 0;
          }
        }
      }
      if (draft['submitted'] == true) {
        draft = {
          'operationId': const Uuid().v4(),
          'draftId': const Uuid().v4(),
        };
      }
      final dates =
          ((catalogue!['serviceOptions'] as Map)['serviceDates'] as List)
              .cast<String>();
      date = dates.contains(draft['requestedDate'])
          ? draft['requestedDate'] as String
          : draft['requestedDate'] == null
          ? dates.firstOrNull
          : null;
      note.text = draft['note'] as String? ?? '';
      for (final item in catalogue!['products'] as List) {
        quantities[item['productId'] as String] = TextEditingController(
          text: '${(draft['quantities'] as Map?)?[item['productId']] ?? 0}',
        );
      }
      setState(() {});
    } catch (e) {
      if (mounted) setState(() => error = apiMessage(e));
    }
  }

  Future<void> persist() {
    final p = owner!;
    final repo = ref.read(operationalProvider);
    final id = draftId;
    final data = {
      ...draft,
      'requestedDate': date,
      'note': note.text,
      'quantities': {
        for (final e in quantities.entries)
          e.key: int.tryParse(e.value.text) ?? 0,
      },
    };
    saving = saving
        .catchError((Object _) {})
        .then((_) => repo.saveForm(p, id, id, data));
    return saving;
  }

  Future<void> submit() async {
    if (busy) return;
    setState(() => busy = true);
    try {
      if (changedProducts.isNotEmpty && !changedProductsReviewed) {
        throw StateError(
          'Review unavailable products or changed units before saving a corrected request.',
        );
      }
      final options = catalogue!['serviceOptions'] as Map;
      final products = catalogue!['products'] as List;
      final lines = <Map<String, dynamic>>[];
      for (final product in products) {
        final q = int.tryParse(quantities[product['productId']]!.text);
        if (q == null ||
            q < 0 ||
            q > (product['maxQuantity'] as int? ?? 10000)) {
          throw StateError(
            'Review whole product quantities within the allowed maximum.',
          );
        }
        if (q > 0) {
          lines.add({
            'productId': product['productId'],
            'quantity': q,
            'unit': product['unit'],
          });
        }
      }
      if (lines.isEmpty || date == null) {
        throw StateError('Select a service date and at least one product.');
      }
      await persist();
      final p = ref.read(sessionProvider)!;
      await ref
          .read(operationalProvider)
          .queue(
            p,
            PendingOperation(
              id: draft['operationId'] as String,
              entityId: draft['draftId'] as String,
              type: 'store_order_created',
              observedAt: DateTime.now(),
              payload: {
                'requestedDate': date,
                'catalogueRevision': catalogue!['revision'],
                'serviceOptionsVersion': options['version'],
                'lines': lines,
                'note': note.text,
              },
            ),
          );
      draft['submitted'] = true;
      await persist();
      ref.read(dataRevisionProvider.notifier).state++;
      if (mounted) {
        notice(
          context,
          'Order request saved on this phone. A server order reference appears after acceptance.',
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
    if (catalogue != null) persist();
    for (final c in quantities.values) {
      c.dispose();
    }
    note.dispose();
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
    if (catalogue == null) {
      return const Center(child: CircularProgressIndicator());
    }
    final options = catalogue!['serviceOptions'] as Map;
    return PageBody(
      children: [
        PageHeading(
          review ? 'Review request' : 'Create order',
          'Receiving dates and units come from the shared service.',
        ),
        if (date == null)
          const Text(
            'The saved date is no longer eligible. Select an available date explicitly.',
          ),
        if (changedProducts.isNotEmpty) ...[
          Text(
            'Original unavailable products or changed units: ${changedProducts.join(', ')}',
          ),
          CheckboxListTile(
            value: changedProductsReviewed,
            onChanged: (v) =>
                setState(() => changedProductsReviewed = v ?? false),
            title: const Text(
              'I reviewed these changes and the new quantities below.',
            ),
          ),
        ],
        Text('Cut-off ${options['cutoff']} · Asia/Colombo'),
        Text('Receiving window ${options['window']}'),
        const Text(
          'An order request does not reserve fleet capacity. Operations confirms the service plan.',
        ),
        Text(
          '${quantities.values.where((q) => (int.tryParse(q.text) ?? 0) > 0).length} products in your cart',
        ),
        DropdownButtonFormField<String>(
          initialValue: date,
          decoration: const InputDecoration(
            labelText: 'Requested service date',
          ),
          items: (options['serviceDates'] as List)
              .map((d) => DropdownMenuItem(value: d as String, child: Text(d)))
              .toList(),
          onChanged: (d) {
            setState(() => date = d);
            persist();
          },
        ),
        if (!review)
          TextField(
            decoration: const InputDecoration(labelText: 'Search products'),
            onChanged: (s) => setState(() => search = s.toLowerCase()),
          ),
        ...(catalogue!['products'] as List)
            .where(
              (p) => review
                  ? (int.tryParse(quantities[p['productId']]!.text) ?? 0) > 0
                  : (p['name'] as String).toLowerCase().contains(search),
            )
            .map(
              (p) => SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${p['name']} · ${p['unit']}'),
                    Text(
                      'Handling: ${p['temperature'] ?? 'See product instructions'}',
                    ),
                    Row(
                      children: [
                        if (!review)
                          IconButton(
                            tooltip: 'Decrease ${p['name']}',
                            onPressed: () {
                              final controller = quantities[p['productId']]!;
                              final value = int.tryParse(controller.text) ?? 0;
                              if (value > 0) {
                                controller.text = '${value - 1}';
                                persist();
                                setState(() {});
                              }
                            },
                            icon: const Icon(LucideIcons.minus),
                          ),
                        Expanded(
                          child: TextField(
                            controller: quantities[p['productId']],
                            readOnly: review,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Quantity (${p['unit']})',
                            ),
                            onChanged: (_) {
                              persist();
                              setState(() {});
                            },
                          ),
                        ),
                        if (!review)
                          IconButton(
                            tooltip: 'Increase ${p['name']}',
                            onPressed: () {
                              final controller = quantities[p['productId']]!;
                              final value = int.tryParse(controller.text) ?? 0;
                              if (value < (p['maxQuantity'] as int? ?? 10000)) {
                                controller.text = '${value + 1}';
                                persist();
                                setState(() {});
                              }
                            },
                            icon: const Icon(LucideIcons.plus),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
        TextField(
          controller: note,
          maxLength: 1000,
          decoration: const InputDecoration(labelText: 'Receiving note'),
          onChanged: (_) => persist(),
        ),
        if (!review)
          PrimaryButton(
            label: 'Review order',
            onPressed: () {
              persist();
              setState(() => review = true);
            },
          )
        else ...[
          PrimaryButton(
            label: 'Save order request',
            busy: busy,
            onPressed: submit,
          ),
          TextButton(
            onPressed: () => setState(() => review = false),
            child: const Text('Edit'),
          ),
        ],
      ],
    );
  }
}

class StoreReceiptIssuePage extends ConsumerStatefulWidget {
  const StoreReceiptIssuePage({
    super.key,
    required this.orderId,
    this.issue = false,
  });
  final String orderId;
  final bool issue;
  @override
  ConsumerState<StoreReceiptIssuePage> createState() =>
      _StoreReceiptIssueState();
}

class _StoreReceiptIssueState extends ConsumerState<StoreReceiptIssuePage> {
  Principal? owner;
  Map<String, dynamic>? order;
  Map<String, dynamic> draft = {};
  final quantities = <String, TextEditingController>{},
      reasons = <String, TextEditingController>{};
  final note = TextEditingController();
  String category = 'damaged';
  final selectedLines = <String>{};
  String? error;
  bool busy = false, review = false;
  Future<void> saving = Future.value();
  String get draftId =>
      '${widget.issue ? 'issue' : 'receipt'}/${widget.orderId}';
  List<String> get photos =>
      ((draft['evidenceIds'] as List?) ?? []).cast<String>();
  @override
  void initState() {
    super.initState();
    Future.microtask(load);
  }

  Future<void> load() async {
    try {
      final p = ref.read(sessionProvider)!,
          repo = ref.read(operationalProvider);
      owner = p;
      final read = await repo.read(
        'store/orders/${widget.orderId}',
        'order/${widget.orderId}',
        p,
      );
      final saved = await repo.loadForm(p, draftId);
      if (!mounted) return;
      order = read.data;
      if (!widget.issue &&
          (!['delivered', 'partial'].contains(order!['status']) ||
              order!['receiptId'] != null)) {
        throw StateError(
          'A server-confirmed delivery without a receipt is required.',
        );
      }
      draft =
          saved ??
          {
            'operationId': const Uuid().v4(),
            'evidenceIds': <String>[],
            'concurrency': {
              'receiptVersion': order!['receiptVersion'] ?? 0,
              'proofVersion': order!['proofVersion'],
            },
          };
      final prior = await repo.operations(p);
      if (prior.any(
        (o) => o['id'] == draft['operationId'] && o['status'] != 'rejected',
      )) {
        throw StateError('This action is already saved. Check Sync Centre.');
      }
      if (prior.any(
        (o) => o['id'] == draft['operationId'] && o['status'] == 'rejected',
      )) {
        draft['correctsOperationId'] = draft['operationId'];
        draft['operationId'] = const Uuid().v4();
        draft['concurrency'] = {
          'receiptVersion': order!['receiptVersion'] ?? 0,
          'proofVersion': order!['proofVersion'],
        };
      }
      note.text = draft['note'] as String? ?? '';
      selectedLines.addAll(((draft['lineIds'] as List?) ?? []).cast<String>());
      category = draft['category'] as String? ?? category;
      for (final l in (order!['deliveredLines'] as List?) ?? []) {
        quantities[l['lineId'] as String] = TextEditingController(
          text:
              '${(draft['quantities'] as Map?)?[l['lineId']] ?? l['deliveredQty']}',
        );
        reasons[l['lineId'] as String] = TextEditingController(
          text: (draft['reasons'] as Map?)?[l['lineId']] as String? ?? '',
        );
      }
      setState(() {});
    } catch (e) {
      if (mounted) setState(() => error = apiMessage(e));
    }
  }

  Future<void> persist() {
    final p = owner!, repo = ref.read(operationalProvider), id = draftId;
    final data = {
      ...draft,
      'note': note.text,
      'category': category,
      'lineIds': selectedLines.toList(),
      'quantities': {
        for (final e in quantities.entries)
          e.key: int.tryParse(e.value.text) ?? -1,
      },
      'reasons': {for (final e in reasons.entries) e.key: e.value.text},
    };
    saving = saving
        .catchError((Object _) {})
        .then((_) => repo.saveForm(p, id, widget.orderId, data));
    return saving;
  }

  Future<void> capture() async {
    if (busy || photos.length >= 3) return;
    setState(() => busy = true);
    try {
      await persist();
      final p = ref.read(sessionProvider)!, storage = ref.read(storageProvider);
      await EvidenceCapture(
        storage.store!,
        storage.media!,
      ).capture(p, draftId, widget.orderId);
      final saved = await ref.read(operationalProvider).loadForm(p, draftId);
      if (mounted) {
        setState(() => draft['evidenceIds'] = saved?['evidenceIds'] ?? photos);
      }
    } catch (e) {
      if (mounted) notice(context, apiMessage(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> submit() async {
    if (busy) return;
    setState(() => busy = true);
    try {
      final lines = <Map<String, dynamic>>[];
      if (widget.issue) {
        if (note.text.trim().isEmpty) throw StateError('Explain the issue.');
        if (!['other', 'business_impact'].contains(category) &&
            selectedLines.isEmpty) {
          throw StateError('Select the affected order lines.');
        }
      } else {
        for (final l in order!['deliveredLines'] as List) {
          final q = int.tryParse(quantities[l['lineId']]!.text),
              r = reasons[l['lineId']]!.text.trim();
          if (q == null || q < 0 || q > (l['deliveredQty'] as int)) {
            throw StateError(
              'Accepted quantities cannot exceed actual delivered goods.',
            );
          }
          if (q != l['deliveredQty'] && r.isEmpty) {
            throw StateError('Explain each receipt difference.');
          }
          lines.add({
            'lineId': l['lineId'],
            'receivedQty': q,
            'unit': l['unit'],
            'reason': r,
          });
        }
      }
      await persist();
      final p = ref.read(sessionProvider)!;
      final payload = widget.issue
          ? {
              'category': category,
              'reason': note.text.trim(),
              'lineIds': selectedLines.toList(),
              'evidenceIds': photos,
            }
          : {'lines': lines, 'note': note.text, 'evidenceIds': photos};
      await ref
          .read(operationalProvider)
          .queue(
            p,
            PendingOperation(
              id: draft['operationId'] as String,
              entityId: widget.orderId,
              type: widget.issue ? 'store_issue' : 'receipt_recorded',
              orderId: widget.orderId,
              observedAt: DateTime.now(),
              concurrency: widget.issue
                  ? {}
                  : Map<String, dynamic>.from(draft['concurrency'] as Map),
              payload: payload,
              evidenceIds: photos,
            ),
          );
      ref.read(dataRevisionProvider.notifier).state++;
      if (mounted) {
        notice(
          context,
          'Saved on this phone. The delivery note is available only after the receipt is accepted.',
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
    if (order != null) persist();
    for (final c in [...quantities.values, ...reasons.values]) {
      c.dispose();
    }
    note.dispose();
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
    if (order == null) return const Center(child: CircularProgressIndicator());
    return PageBody(
      children: [
        PageHeading(
          widget.issue ? 'Report store issue' : 'Confirm actual receipt',
          widget.orderId,
        ),
        if (draft['correctsOperationId'] != null)
          const Text(
            'Review this new correction against the current delivery. The rejected original remains in Activity.',
          ),
        if (widget.issue)
          DropdownButtonFormField<String>(
            initialValue: category,
            decoration: const InputDecoration(labelText: 'Issue category'),
            items:
                [
                      'missing',
                      'quantity',
                      'damaged',
                      'temperature',
                      'business_impact',
                      'other',
                    ]
                    .map(
                      (c) => DropdownMenuItem(
                        value: c,
                        child: Text(c.replaceAll('_', ' ')),
                      ),
                    )
                    .toList(),
            onChanged: (c) {
              setState(() => category = c!);
              persist();
            },
          ),
        if (widget.issue)
          ...((order!['lines'] as List?) ?? []).map(
            (l) => CheckboxListTile(
              title: Text(
                '${l['name'] ?? l['productId']} · ${l['quantity']} ${l['unit']}',
              ),
              value: selectedLines.contains(l['lineId']),
              onChanged: (value) {
                setState(() {
                  if (value == true) {
                    selectedLines.add(l['lineId'] as String);
                  } else {
                    selectedLines.remove(l['lineId']);
                  }
                });
                persist();
              },
            ),
          ),
        if (!widget.issue)
          ...(order!['deliveredLines'] as List).map(
            (l) => SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${l['lineId']} · delivered ${l['deliveredQty']} ${l['unit']}',
                  ),
                  TextField(
                    controller: quantities[l['lineId']],
                    readOnly: review,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Accepted quantity',
                    ),
                    onChanged: (_) => persist(),
                  ),
                  TextField(
                    controller: reasons[l['lineId']],
                    maxLength: 500,
                    decoration: const InputDecoration(
                      labelText: 'Reason for difference',
                    ),
                    onChanged: (_) => persist(),
                  ),
                ],
              ),
            ),
          ),
        TextField(
          controller: note,
          maxLines: 3,
          maxLength: 1000,
          decoration: InputDecoration(
            labelText: widget.issue
                ? 'Explain issue / business impact'
                : 'Receipt note',
          ),
          onChanged: (_) => persist(),
        ),
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
          label: 'Take supporting photo',
          busy: busy,
          onPressed: photos.length < 3 ? capture : null,
        ),
        if (!review)
          PrimaryButton(
            label: 'Review',
            onPressed: () {
              persist();
              setState(() => review = true);
            },
          )
        else ...[
          const Text(
            'Confirm the quantities and explanation above. Your original saved operation remains immutable.',
          ),
          PrimaryButton(
            label: widget.issue ? 'Save issue' : 'Save receipt confirmation',
            busy: busy,
            onPressed: submit,
          ),
          TextButton(
            onPressed: () => setState(() => review = false),
            child: const Text('Edit'),
          ),
        ],
      ],
    );
  }
}

class DeliveryNotePage extends ConsumerWidget {
  const DeliveryNotePage({super.key, required this.orderId});
  final String orderId;
  @override
  Widget build(BuildContext context, WidgetRef ref) => RemoteContent(
    query: ('store/orders/$orderId/delivery-note', 'note/$orderId'),
    builder: (read) => PageBody(
      children: [
        PageHeading('Delivery note', read.data['reference'] as String),
        Text(
          'Issued ${read.data['issuedAt']} · revision ${read.data['revision']}',
        ),
        for (final key in [
          'orderedLines',
          'approvedLines',
          'deliveredLines',
          'acceptedLines',
        ]) ...[
          Text(
            {
              'orderedLines': 'Ordered',
              'approvedLines': 'Approved',
              'deliveredLines': 'Delivered',
              'acceptedLines': 'Accepted',
            }[key]!,
          ),
          ...((read.data[key] as List?) ?? []).map(
            (l) => Text(
              '${l['name'] ?? l['lineId']}: ${l['quantity'] ?? l['deliveredQty'] ?? l['receivedQty']} ${l['unit']}',
            ),
          ),
        ],
        if (read.data['discrepancy'] == true)
          const StatusChip(
            'Receipt difference reported',
            tone: StatusTone.attention,
          ),
        ...((read.data['evidenceIds'] as List?) ?? []).indexed.map(
          (entry) => OutlinedButton(
            onPressed: () => showWaypointSheet<void>(
              context,
              title: 'Authorized delivery photo ${entry.$1 + 1}',
              child: EvidenceViewer(evidenceId: entry.$2 as String),
            ),
            child: Text('View delivery photo ${entry.$1 + 1}'),
          ),
        ),
      ],
    ),
  );
}
