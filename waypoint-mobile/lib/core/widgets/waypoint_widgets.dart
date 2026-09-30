import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/models.dart';
import '../theme/waypoint_theme.dart';

enum StatusTone { success, attention, blocked, neutral }

class StatusChip extends StatelessWidget {
  const StatusChip(
    this.label, {
    super.key,
    this.tone = StatusTone.neutral,
    this.onDark = false,
  });
  final String label;
  final StatusTone tone;
  final bool onDark;
  @override
  Widget build(BuildContext context) {
    final (color, background, icon) = switch (tone) {
      StatusTone.success => (
        const Color(0xff146b45),
        const Color(0xffeaf6ef),
        LucideIcons.circleCheck,
      ),
      StatusTone.attention => (
        const Color(0xff874c0a),
        const Color(0xfffff4da),
        LucideIcons.clock,
      ),
      StatusTone.blocked => (
        const Color(0xffb42318),
        const Color(0xffffecea),
        LucideIcons.circleAlert,
      ),
      StatusTone.neutral => (
        const Color(0xff47564d),
        const Color(0xffedf1ee),
        LucideIcons.info,
      ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: onDark ? Colors.white.withValues(alpha: .12) : background,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: onDark ? Colors.white : color),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                color: onDark ? Colors.white : color,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.busy = false,
  });
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool busy;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    child: FilledButton(
      onPressed: busy ? null : onPressed,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 20),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Text(
              busy ? 'Please wait…' : label,
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    ),
  );
}

class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
  });
  final Widget child;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: padding,
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border.all(color: context.tokens.border),
      borderRadius: BorderRadius.circular(14),
    ),
    child: child,
  );
}

class ConnectionBanner extends StatelessWidget {
  const ConnectionBanner({
    super.key,
    required this.label,
    required this.onTap,
    this.offline = false,
  });
  final String label;
  final VoidCallback onTap;
  final bool offline;
  @override
  Widget build(BuildContext context) => Material(
    color: offline ? const Color(0xfffff4da) : context.tokens.paleGreen,
    child: InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              offline ? LucideIcons.wifiOff : LucideIcons.database,
              size: 22,
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(label)),
            const Icon(LucideIcons.chevronRight, size: 20),
          ],
        ),
      ),
    ),
  );
}

class TripCard extends StatelessWidget {
  const TripCard({super.key, required this.trip, required this.onView});
  final RouteSnapshot trip;
  final VoidCallback onView;
  @override
  Widget build(BuildContext context) {
    final narrow = MediaQuery.sizeOf(context).width <= 360;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.tokens.deepGreen,
        borderRadius: BorderRadius.circular(16),
      ),
      child: DefaultTextStyle(
        style: Theme.of(
          context,
        ).textTheme.bodyMedium!.copyWith(color: Colors.white),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('YOUR CURRENT TRIP'),
            const SizedBox(height: 12),
            StatusChip(
              trip.driverId == null
                  ? 'Fixture · ready to review'
                  : trip.held
                  ? 'Operations hold'
                  : trip.status.replaceAll('_', ' '),
              tone: trip.held ? StatusTone.attention : StatusTone.success,
              onDark: true,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${trip.vehicleId} / Trip ${trip.tripNumber}',
                    style: Theme.of(
                      context,
                    ).textTheme.headlineSmall!.copyWith(color: Colors.white),
                  ),
                ),
                const SizedBox(width: 8),
                Transform.translate(
                  offset: const Offset(0, 9),
                  child: ExcludeSemantics(
                    child: SizedBox(
                      width: narrow ? 88 : 104,
                      height: 78,
                      child: ClipRect(
                        child: OverflowBox(
                          maxWidth: 172,
                          maxHeight: 172,
                          child: Image.asset(
                            'assets/mobile/no-assigned-trip.png',
                            width: 172,
                            height: 172,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text('${trip.depot} → ${trip.district}'),
            const SizedBox(height: 20),
            Wrap(
              spacing: 28,
              runSpacing: 16,
              children: [
                _Stat(
                  trip.stops.length.toString().padLeft(2, '0'),
                  'delivery stops',
                ),
                _Stat(trip.finish, 'estimated finish'),
                _Stat(
                  '${trip.stops.where((s) => ['delivered', 'partial', 'failed', 'refused', 'skipped'].contains(s.status)).length}',
                  'resolved stops',
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: context.tokens.deepGreen,
                ),
                onPressed: onView,
                child: const Text('View your route'),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(LucideIcons.package, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text(trip.handling)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.value, this.label);
  final String value, label;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        value,
        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
      ),
      Text(label),
    ],
  );
}

class StopCard extends StatelessWidget {
  const StopCard({
    super.key,
    required this.stop,
    required this.number,
    this.onTap,
  });
  final RouteStop stop;
  final int number;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => SurfaceCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: context.tokens.paleGreen,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(number.toString().padLeft(2, '0')),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    stop.name,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 6),
                  Text('${stop.outletId} · ${stop.window}'),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(stop.instruction),
        if (onTap != null) ...[
          const SizedBox(height: 12),
          OutlinedButton(onPressed: onTap, child: const Text('View manifest')),
        ],
      ],
    ),
  );
}

class QuantityStepper extends StatelessWidget {
  const QuantityStepper({
    super.key,
    required this.value,
    required this.onChanged,
    required this.label,
    this.maximum = 999,
  });
  final int value, maximum;
  final String label;
  final ValueChanged<int> onChanged;
  @override
  Widget build(BuildContext context) => Semantics(
    label: '$label quantity',
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          tooltip: 'Decrease $label',
          onPressed: value > 0 ? () => onChanged(value - 1) : null,
          icon: const Icon(LucideIcons.minus),
        ),
        Semantics(
          liveRegion: true,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text('$value'),
          ),
        ),
        IconButton(
          tooltip: 'Increase $label',
          onPressed: value < maximum ? () => onChanged(value + 1) : null,
          icon: const Icon(LucideIcons.plus),
        ),
      ],
    ),
  );
}

class EvidenceThumbnail extends StatelessWidget {
  const EvidenceThumbnail({super.key, required this.bytes, this.onRemove});
  final Uint8List bytes;
  final VoidCallback? onRemove;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.memory(
          bytes,
          width: 150,
          height: 110,
          fit: BoxFit.cover,
          semanticLabel: 'Saved evidence preview',
        ),
      ),
      if (onRemove != null)
        TextButton(onPressed: onRemove, child: const Text('Remove image')),
    ],
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
    this.asset,
    this.action,
  });
  final String title, message;
  final String? asset;
  final Widget? action;
  @override
  Widget build(BuildContext context) => SurfaceCard(
    child: Column(
      children: [
        if (asset != null)
          Image.asset(asset!, height: 140, excludeFromSemantics: true),
        const SizedBox(height: 12),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 10),
        Text(message, textAlign: TextAlign.center),
        if (action != null) ...[const SizedBox(height: 20), action!],
      ],
    ),
  );
}

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => EmptyState(
    title: 'Something needs attention',
    message: message,
    action: PrimaryButton(
      label: 'Try again',
      icon: LucideIcons.refreshCw,
      onPressed: onRetry,
    ),
  );
}

Future<T?> showWaypointSheet<T>(
  BuildContext context, {
  required String title,
  required Widget child,
}) => showModalBottomSheet<T>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  builder: (sheetContext) => SingleChildScrollView(
    padding: EdgeInsets.fromLTRB(
      20,
      0,
      20,
      24 + MediaQuery.viewInsetsOf(sheetContext).bottom,
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(sheetContext).textTheme.titleLarge),
        const SizedBox(height: 20),
        child,
      ],
    ),
  ),
);
