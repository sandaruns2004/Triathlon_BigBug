import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/data/operational_repository.dart';
import '../../core/storage/local_database.dart';
import '../../core/widgets/waypoint_widgets.dart';
import '../../domain/models.dart';
import '../foundation/foundation_pages.dart';
import 'connected_pages.dart';

final notificationsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  ref.watch(dataRevisionProvider);
  final p = ref.watch(sessionProvider)!;
  final repo = ref.watch(operationalProvider);
  try {
    await repo.refreshNotifications(p);
  } catch (_) {
    /* Saved notifications remain labelled below. */
  }
  final rows = await repo.store.list(p.userId, LocalTable.notifications);
  return rows
      .where(
        (n) =>
            n['recipientRole'] ==
                (p.role == MobileRole.driver ? 'driver' : 'store_manager') &&
            (p.role == MobileRole.driver
                ? n['recipientDepot'] == p.depot
                : n['recipientOutletId'] == p.outletId),
      )
      .toList()
    ..sort(
      (a, b) =>
          (b['sequence'] as num? ?? 0).compareTo(a['sequence'] as num? ?? 0),
    );
});

class ConnectedNotificationsPage extends ConsumerWidget {
  const ConnectedNotificationsPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => PageBody(
    children: [
      const PageHeading(
        'Updates',
        'Saved updates from the shared service · refresh for current status.',
      ),
      OutlinedButton(
        onPressed: () => ref.invalidate(notificationsProvider),
        child: const Text('Refresh updates'),
      ),
      ref
          .watch(notificationsProvider)
          .when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => ErrorState(
              message: apiMessage(e),
              onRetry: () => ref.invalidate(notificationsProvider),
            ),
            data: (rows) => Column(
              children: [
                Text('${rows.where((n) => n['read'] != true).length} unread'),
                if (rows.isEmpty)
                  const EmptyState(
                    title: 'No saved updates',
                    message:
                        'Connect to receive committed order and route updates.',
                  ),
                ...rows.map(
                  (n) => SurfaceCard(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        (n['message'] ??
                                n['title'] ??
                                (n['type'] as String).replaceAll('_', ' '))
                            as String,
                      ),
                      subtitle: Text(
                        '${n['createdAt']} · ${n['read'] != true ? 'Unread' : 'Read'}',
                      ),
                      onTap: () async {
                        try {
                          await ref
                              .read(apiProvider)
                              .dio
                              .post(
                                'notifications/${n['notificationId']}/read',
                                data: {},
                              );
                          ref.invalidate(notificationsProvider);
                          if (context.mounted) {
                            if (ref.read(sessionProvider)!.role ==
                                    MobileRole.store &&
                                n['entityId'] != null) {
                              context.push('/store/orders/${n['entityId']}');
                            } else {
                              context.go('/driver/route');
                            }
                          }
                        } catch (e) {
                          if (context.mounted) notice(context, apiMessage(e));
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
    ],
  );
}

class ConnectedProfilePage extends ConsumerWidget {
  const ConnectedProfilePage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = ref.watch(sessionProvider)!;
    return PageBody(
      children: [
        PageHeading(
          p.name,
          p.role == MobileRole.driver ? 'Driver' : 'Store Manager',
        ),
        Text(p.depot ?? p.outletId ?? ''),
        Text('Offline access until ${p.offlineExpiresAt?.toLocal()}'),
        const Text(
          'Operations provisions roles and handles account recovery. Signing out locks saved work without deleting it.',
        ),
        PrimaryButton(
          label: 'Open Sync Centre',
          onPressed: () => context.push(
            p.role == MobileRole.driver
                ? '/driver/activity/sync'
                : '/store/profile/sync',
          ),
        ),
        if (p.role == MobileRole.driver)
          OutlinedButton(
            onPressed: () => context.push('/driver/profile/updates'),
            child: const Text('Route and operations updates'),
          ),
        OutlinedButton(
          onPressed: () async {
            final count = await ref
                .read(storageProvider)
                .store!
                .queuedCount(p.userId);
            if (!context.mounted) return;
            final yes = await showWaypointSheet<bool>(
              context,
              title: 'Sign out?',
              child: Column(
                children: [
                  Text(
                    '$count saved operations remain protected for this account. Sign in as the same user to resume them.',
                  ),
                  PrimaryButton(
                    label: 'Sign out and retain saved work',
                    onPressed: () => context.pop(true),
                  ),
                ],
              ),
            );
            if (yes != true) return;
            await ref.read(authProvider)!.signOut();
            ref.read(sessionProvider.notifier).state = null;
          },
          child: const Text('Sign out'),
        ),
      ],
    );
  }
}
