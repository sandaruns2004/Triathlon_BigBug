import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/theme/waypoint_theme.dart';
import '../core/widgets/waypoint_widgets.dart';
import '../domain/models.dart';
import 'providers.dart';
import 'waypoint_app.dart';

class RoleShell extends ConsumerWidget {
  const RoleShell({super.key, required this.role, required this.shell});
  final MobileRole role;
  final StatefulNavigationShell shell;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final principal = ref.watch(sessionProvider);
    if (principal == null || principal.role != role) {
      return const SizedBox.shrink();
    }
    final driver = role == MobileRole.driver;
    final labels = driver
        ? ['Today', 'Route', 'Activity', 'Profile']
        : ['Home', 'Orders', 'Notifications', 'Profile'];
    final icons = driver
        ? [
            LucideIcons.house,
            LucideIcons.route,
            LucideIcons.listChecks,
            LucideIcons.userRound,
          ]
        : [
            LucideIcons.house,
            LucideIcons.package,
            LucideIcons.bell,
            LucideIcons.userRound,
          ];
    final largeText = MediaQuery.textScalerOf(context).scale(16) > 21;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            SvgPicture.asset(
              'assets/brand/waypoint-flow-mark.svg',
              width: 28,
              height: 28,
              semanticsLabel: 'Waypoint Flow',
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text('Waypoint Flow', style: TextStyle(fontSize: 20)),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          if (principal.fixture)
            ConnectionBanner(
              label: 'Fixture preview · no server actions',
              onTap: () =>
                  context.push(driver ? '/driver/activity/sync' : '/catalogue'),
            ),
          if (!principal.fixture &&
              ref.watch(connectionStateProvider).isNotEmpty)
            ConnectionBanner(
              label: ref.watch(connectionStateProvider),
              offline: ref
                  .watch(connectionStateProvider)
                  .toLowerCase()
                  .contains('offline'),
              onTap: () => context.push(
                driver ? '/driver/activity/sync' : '/store/profile/sync',
              ),
            ),
          Expanded(child: shell),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Material(
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Wrap(
              children: List.generate(
                4,
                (index) => SizedBox(
                  width:
                      (MediaQuery.sizeOf(context).width - 16) /
                      (largeText ? 2 : 4),
                  child: Semantics(
                    label: labels[index],
                    selected: shell.currentIndex == index,
                    button: true,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => shell.goBranch(
                        index,
                        initialLocation: index == shell.currentIndex,
                      ),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: shell.currentIndex == index
                              ? context.tokens.paleGreen
                              : null,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(icons[index], color: context.tokens.deepGreen),
                            const SizedBox(height: 4),
                            ExcludeSemantics(
                              child: Text(
                                !driver && index == 2
                                    ? 'Updates'
                                    : labels[index],
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: context.tokens.deepGreen,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
