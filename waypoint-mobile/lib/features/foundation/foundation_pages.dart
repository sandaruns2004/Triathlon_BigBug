import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../app/providers.dart';
import '../../core/storage/local_database.dart';
import '../../core/storage/media_store.dart';
import '../../core/theme/waypoint_theme.dart';
import '../../core/widgets/waypoint_widgets.dart';
import '../../domain/models.dart';
import '../authentication/sign_in_page.dart';

class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => SafeArea(
    top: false,
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children
                .expand((w) => [w, const SizedBox(height: 18)])
                .toList(),
          ),
        ),
      ),
    ),
  );
}

class PageHeading extends StatelessWidget {
  const PageHeading(this.title, this.subtitle, {super.key});
  final String title, subtitle;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(title, style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 8),
      Text(subtitle, style: TextStyle(color: context.tokens.muted)),
    ],
  );
}

class WelcomePage extends ConsumerWidget {
  const WelcomePage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(configProvider);
    if (!config.fixtureMode) return const ConnectedSignInPage();
    return Scaffold(
      body: PageBody(
        children: [
          const SizedBox(height: 20),
          SvgPicture.asset(
            'assets/brand/waypoint-flow-mark.svg',
            width: 48,
            height: 48,
            semanticsLabel: 'Waypoint Flow',
          ),
          const PageHeading(
            'A clear route.\nA connected handoff.',
            'Waypoint Flow · mobile companion',
          ),
          Image.asset(
            'assets/mobile/driver-onboarding-route-ready.png',
            height: 220,
            excludeFromSemantics: true,
          ),
          if (config.fixtureMode) ...[
            const StatusChip(
              'Phase 1 · fixture preview',
              tone: StatusTone.attention,
            ),
            const Text(
              'Explore the native design and storage foundation. These sample accounts do not sign in to the website.',
            ),
            PrimaryButton(
              label: 'Explore Driver',
              icon: LucideIcons.truck,
              onPressed: () =>
                  ref.read(sessionProvider.notifier).state = fixtureDriver,
            ),
            PrimaryButton(
              label: 'Explore Store Manager',
              icon: LucideIcons.store,
              onPressed: () =>
                  ref.read(sessionProvider.notifier).state = fixtureStore,
            ),
          ] else
            const EmptyState(
              title: 'Connected sign-in needs Phase 2',
              message:
                  'This foundation never substitutes a sample account for verified authentication. Configure the identity bridge before connecting.',
            ),
          if (ref.watch(storageProvider).error case final String error)
            Text(error),
        ],
      ),
    );
  }
}

class DriverTodayPage extends ConsumerWidget {
  const DriverTodayPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final principal = ref.watch(sessionProvider);
    if (principal == null) return const SizedBox.shrink();
    final route = ref.watch(routeProvider(principal));
    return PageBody(
      children: [
        PageHeading(
          'Good morning, ${principal.name}',
          'Peliyagoda depot · fixture morning shift',
        ),
        route.when(
          data: (trip) => trip == null
              ? const EmptyState(
                  title: 'No route assigned yet',
                  message: 'Operations assigns your route.',
                  asset: 'assets/mobile/no-assigned-trip.png',
                )
              : TripCard(trip: trip, onView: () => context.go('/driver/route')),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => ErrorState(
            message: 'Could not load the fixture route.',
            onRetry: () => ref.invalidate(routeProvider(principal)),
          ),
        ),
        const PageHeading(
          'Before you leave',
          'Safe departure starts with an approved manifest.',
        ),
        SurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const StatusChip(
                'Fixture · loading notes',
                tone: StatusTone.success,
              ),
              const SizedBox(height: 12),
              const Text(
                'Refrigerated load · check handling and receiving windows. Real release/start checks arrive in Phase 3.',
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => context.go('/driver/route'),
                child: const Text('View manifest'),
              ),
            ],
          ),
        ),
        const SurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Later today',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              SizedBox(height: 8),
              Text(
                'Trip 2 stays unavailable until server eligibility is implemented.',
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class DriverRoutePage extends ConsumerWidget {
  const DriverRoutePage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final principal = ref.watch(sessionProvider);
    if (principal == null) return const SizedBox.shrink();
    return ref
        .watch(routeProvider(principal))
        .when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => PageBody(
            children: [
              ErrorState(
                message: 'Route could not load.',
                onRetry: () => ref.invalidate(routeProvider(principal)),
              ),
            ],
          ),
          data: (trip) => PageBody(
            children: [
              const PageHeading(
                'Your route',
                'Review while safely parked. Fixed fixture · 30 September 2026.',
              ),
              if (trip == null)
                const EmptyState(
                  title: 'No assigned route',
                  message: 'Check again after planning.',
                )
              else
                ...trip.stops.indexed.map(
                  (entry) => StopCard(
                    stop: entry.$2,
                    number: entry.$1 + 1,
                    onTap: () => showWaypointSheet<void>(
                      context,
                      title: 'Approved manifest · fixture',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ...entry.$2.lines.map(
                            (line) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Text(
                                '${line.name} · ${line.quantity} ${line.unit}',
                              ),
                            ),
                          ),
                          const Text(
                            'POD, parked-mode confirmation and server updates are added in later phases.',
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
  }
}

class ActivityPage extends ConsumerWidget {
  const ActivityPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => PageBody(
    children: [
      const PageHeading(
        'Activity',
        'Delivery records and local work will appear here.',
      ),
      PrimaryButton(
        label: 'Open Sync Centre',
        icon: LucideIcons.refreshCw,
        onPressed: () => context.push('/driver/activity/sync'),
      ),
      const EmptyState(
        title: 'Your records stay with you',
        message:
            'Phase 1 provides the local schema. No deliveries or uploads are simulated.',
        asset: 'assets/mobile/offline-records-safe.png',
      ),
    ],
  );
}

class SyncCentrePage extends ConsumerWidget {
  const SyncCentrePage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final principal = ref.watch(sessionProvider);
    final store = ref.watch(storageProvider).store;
    return PageBody(
      children: [
        const PageHeading(
          'Sync Centre',
          'Saved locally and accepted by the server are different states.',
        ),
        FutureBuilder<int>(
          future: principal == null || store == null
              ? Future.value(0)
              : store.queuedCount(principal.userId),
          builder: (context, snapshot) => SurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  snapshot.hasError
                      ? 'Could not read the queue; records are retained.'
                      : '${snapshot.data ?? 0} pending operations',
                ),
                const SizedBox(height: 12),
                const Text('No upload worker is connected in Phase 1.'),
                const SizedBox(height: 12),
                const PrimaryButton(label: 'Sync available in Phase 4'),
              ],
            ),
          ),
        ),
        if (ref.watch(storageProvider).error case final String error)
          Text(error),
        OutlinedButton(
          onPressed: () => context.pop(),
          child: const Text('Back to Activity'),
        ),
      ],
    );
  }
}

class StoreHomePage extends StatelessWidget {
  const StoreHomePage({super.key});
  @override
  Widget build(BuildContext context) => PageBody(
    children: [
      const PageHeading('Waypoint Fresh', 'OUT005 · Colombo · fixture preview'),
      SurfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const StatusChip(
              'Planned · sample order',
              tone: StatusTone.success,
            ),
            const SizedBox(height: 12),
            Text(
              'Know what is arriving.',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text('FIXTURE-ORDER-01 · receiving window 04:00–07:45'),
            const SizedBox(height: 18),
            PrimaryButton(
              label: 'View sample order',
              onPressed: () => context.go('/store/orders'),
            ),
          ],
        ),
      ),
      const EmptyState(
        title: 'A smooth receiving day',
        message:
            'Order, tracking and receipt services are implemented in Phase 5.',
        asset: 'assets/mobile/store-onboarding-order-receipt.png',
      ),
    ],
  );
}

class StoreOrdersPage extends StatelessWidget {
  const StoreOrdersPage({super.key});
  @override
  Widget build(BuildContext context) => const PageBody(
    children: [
      PageHeading('Orders', 'Outlet-scoped order history and drafts.'),
      SurfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            StatusChip('Fixture · awaiting delivery'),
            SizedBox(height: 12),
            Text('FIXTURE-ORDER-01 · OUT005'),
            SizedBox(height: 8),
            Text('Fresh milk: 12 cases\nYoghurt: 8 trays'),
            SizedBox(height: 12),
            PrimaryButton(label: 'Ordering available in Phase 5'),
          ],
        ),
      ),
    ],
  );
}

class StoreNotificationsPage extends StatelessWidget {
  const StoreNotificationsPage({super.key});
  @override
  Widget build(BuildContext context) => const PageBody(
    children: [
      PageHeading(
        'Notifications',
        'Clear, actionable updates for your outlet.',
      ),
      EmptyState(
        title: 'No connected updates yet',
        message:
            'Deferrals, loading adjustments and delivery updates will come from committed server records.',
      ),
    ],
  );
}

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final principal = ref.watch(sessionProvider);
    if (principal == null) return const SizedBox.shrink();
    return PageBody(
      children: [
        PageHeading(
          principal.name,
          principal.role == MobileRole.driver
              ? 'Driver · ${principal.depot}'
              : 'Store Manager · ${principal.outletId}',
        ),
        const StatusChip(
          'Fixture identity · no backend login',
          tone: StatusTone.attention,
        ),
        PrimaryButton(
          label: 'Local storage lab',
          icon: LucideIcons.hardDrive,
          onPressed: () => showWaypointSheet<void>(
            context,
            title: 'Durable draft check',
            child: DraftLab(
              key: ValueKey(principal.userId),
              principal: principal,
            ),
          ),
        ),
        OutlinedButton(
          onPressed: () => context.push('/catalogue'),
          child: const Text('Design catalogue'),
        ),
        OutlinedButton(
          onPressed: () async {
            final pending =
                await ref
                    .read(storageProvider)
                    .store
                    ?.queuedCount(principal.userId) ??
                0;
            if (!context.mounted) return;
            final confirmed = await showWaypointSheet<bool>(
              context,
              title: 'Leave this fixture account?',
              child: Column(
                children: [
                  Text(
                    '$pending pending records remain protected on this device. They will not move to another account.',
                  ),
                  const SizedBox(height: 16),
                  PrimaryButton(
                    label: 'Leave account',
                    onPressed: () => context.pop(true),
                  ),
                ],
              ),
            );
            if (confirmed == true && context.mounted) {
              ref.read(sessionProvider.notifier).state = null;
            }
          },
          child: const Text('Leave fixture account'),
        ),
      ],
    );
  }
}

class DraftLab extends ConsumerStatefulWidget {
  const DraftLab({super.key, required this.principal});
  final Principal principal;
  @override
  ConsumerState<DraftLab> createState() => _DraftLabState();
}

class _DraftLabState extends ConsumerState<DraftLab> {
  final controller = TextEditingController();
  String? message;
  bool busy = true;
  Uint8List? image;
  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final draft = await ref
          .read(storageProvider)
          .drafts
          .loadDraft(widget.principal.userId, 'foundation-draft');
      if (mounted) controller.text = draft?.note ?? '';
      final runtime = ref.read(storageProvider);
      if (runtime.store != null && runtime.media != null) {
        final records = await runtime.store!.list(
          widget.principal.userId,
          LocalTable.evidence,
        );
        if (records.isNotEmpty) {
          final record = records.first;
          final bytes = await runtime.media!.read(
            widget.principal.userId,
            EvidenceFile(
              id: record['id'] as String,
              path: record['path'] as String,
              bytes: record['bytes'] as int,
              mime: record['mime'] as String,
            ),
          );
          if (mounted) image = bytes;
        }
      }
    } catch (error) {
      if (mounted) message = error.toString();
    }
    if (mounted) setState(() => busy = false);
  }

  Future<void> _save() async {
    setState(() {
      busy = true;
      message = null;
    });
    try {
      await ref
          .read(storageProvider)
          .drafts
          .saveDraft(
            widget.principal.userId,
            LocalDraft(
              id: 'foundation-draft',
              entityId: widget.principal.role == MobileRole.driver
                  ? 'FIXTURE-STOP-01'
                  : '${widget.principal.outletId}/FIXTURE-ORDER-01',
              note: controller.text,
              updatedAt: DateTime.now(),
            ),
          );
      if (mounted) {
        setState(
          () => message = 'Saved on this phone. Close and reopen to verify.',
        );
      }
    } catch (error) {
      if (mounted) setState(() => message = error.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _capture() async {
    final runtime = ref.read(storageProvider);
    if (runtime.media == null || runtime.store == null) return;
    setState(() {
      busy = true;
      message = null;
    });
    try {
      final picked = await ImagePicker().pickImage(
        source: ImageSource.camera,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 75,
      );
      if (picked != null) {
        final evidence = await runtime.media!.importFile(
          widget.principal.userId,
          picked.path,
          mime: 'image/jpeg',
        );
        await runtime.store!.write(
          LocalTable.evidence,
          widget.principal.userId,
          evidence.id,
          'foundation-draft',
          {
            'id': evidence.id,
            'path': evidence.path,
            'mime': evidence.mime,
            'bytes': evidence.bytes,
          },
        );
        final bytes = await runtime.media!.read(
          widget.principal.userId,
          evidence,
        );
        if (mounted) {
          setState(() {
            image = bytes;
            message = 'Image encrypted and saved in app-owned storage.';
          });
        }
      }
    } catch (error) {
      if (mounted) {
        setState(() => message = 'Camera/file recovery needed: $error');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        'Use a fake note for this foundation test. Records are scoped to this fixture identity.',
      ),
      const SizedBox(height: 16),
      TextField(
        controller: controller,
        enabled: !busy,
        maxLines: 3,
        decoration: const InputDecoration(labelText: 'Test draft note'),
      ),
      const SizedBox(height: 16),
      PrimaryButton(label: 'Save test draft', busy: busy, onPressed: _save),
      if (!kIsWeb) ...[
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: busy ? null : _capture,
          child: const Text('Test camera storage'),
        ),
      ],
      if (image != null) ...[
        const SizedBox(height: 12),
        EvidenceThumbnail(bytes: image!),
      ],
      if (message != null) ...[
        const SizedBox(height: 12),
        Semantics(liveRegion: true, child: Text(message!)),
      ],
    ],
  );
}

class WidgetCataloguePage extends StatefulWidget {
  const WidgetCataloguePage({super.key});
  @override
  State<WidgetCataloguePage> createState() => _WidgetCataloguePageState();
}

class _WidgetCataloguePageState extends State<WidgetCataloguePage> {
  int quantity = 4;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Design catalogue')),
    body: PageBody(
      children: [
        const PageHeading(
          'Calm operational clarity',
          'Inter · Lucide outlines · accessible native controls',
        ),
        const Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            StatusChip('Ready', tone: StatusTone.success),
            StatusChip('Waiting', tone: StatusTone.attention),
            StatusChip('Blocked', tone: StatusTone.blocked),
            StatusChip('Saved on this phone'),
          ],
        ),
        SurfaceCard(
          child: Wrap(
            spacing: 16,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const Text('Cases'),
              QuantityStepper(
                label: 'cases',
                value: quantity,
                onChanged: (value) => setState(() => quantity = value),
              ),
            ],
          ),
        ),
        PrimaryButton(
          label: 'Confirm-sheet example',
          onPressed: () => showWaypointSheet<void>(
            context,
            title: 'Review before continuing',
            child: Column(
              children: [
                const Text(
                  'A keyboard-safe, scrollable sheet with a clear close action.',
                ),
                const SizedBox(height: 16),
                PrimaryButton(
                  label: 'Close example',
                  onPressed: () => context.pop(),
                ),
              ],
            ),
          ),
        ),
        OutlinedButton(
          onPressed: () => showWaypointSheet<void>(
            context,
            title: 'Report-sheet example',
            child: Column(
              children: [
                const TextField(
                  maxLines: 3,
                  decoration: InputDecoration(labelText: 'Example issue note'),
                ),
                const SizedBox(height: 16),
                PrimaryButton(
                  label: 'Close without submitting',
                  onPressed: () => context.pop(),
                ),
              ],
            ),
          ),
          child: const Text('Report-sheet example'),
        ),
        const EmptyState(
          title: 'No assignment',
          message: 'Empty states explain the next step.',
          asset: 'assets/mobile/no-assigned-trip.png',
        ),
        ErrorState(
          message: 'Example error; previous records are retained.',
          onRetry: () {},
        ),
      ],
    ),
  );
}
