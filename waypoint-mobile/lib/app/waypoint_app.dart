import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/media/evidence_capture.dart';
import '../domain/models.dart';
import '../core/theme/waypoint_theme.dart';
import 'providers.dart';
import 'router.dart';

final connectionStateProvider = StateProvider<String>((ref) => '');

class WaypointApp extends ConsumerStatefulWidget {
  const WaypointApp({super.key});
  @override
  ConsumerState<WaypointApp> createState() => _WaypointAppState();
}

class _WaypointAppState extends ConsumerState<WaypointApp>
    with WidgetsBindingObserver {
  Timer? timer;
  bool refreshing = false;
  int ticks = 0;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    timer = Timer.periodic(const Duration(seconds: 5), (_) {
      final p = ref.read(sessionProvider);
      if (p == null || p.fixture) return;
      if (p.offlineExpiresAt == null ||
          !DateTime.now().toUtc().isBefore(p.offlineExpiresAt!)) {
        ref.read(sessionProvider.notifier).state = null;
        return;
      }
      if (++ticks % 6 == 0) refresh();
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => refresh());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) refresh();
  }

  Future<void> refresh() async {
    final p = ref.read(sessionProvider);
    if (refreshing || p == null || p.fixture) return;
    refreshing = true;
    try {
      final current = await ref.read(authProvider)!.revalidate();
      if (!mounted || ref.read(sessionProvider)?.userId != p.userId) return;
      if (!DateTime.now().toUtc().isBefore(current.offlineExpiresAt!)) {
        ref.read(sessionProvider.notifier).state = null;
        return;
      }
      ref.read(sessionProvider.notifier).state = current;
      ref.read(connectionStateProvider.notifier).state = '';
      final storage = ref.read(storageProvider);
      await EvidenceCapture(storage.store!, storage.media!).recover(current);
      await ref.read(syncWorkerProvider).run();
      await ref.read(operationalProvider).refreshNotifications(current);
      ref.read(dataRevisionProvider.notifier).state++;
    } on DioException catch (e) {
      if (mounted && ref.read(sessionProvider)?.userId == p.userId) {
        if ([401, 403].contains(e.response?.statusCode)) {
          ref.read(sessionProvider.notifier).state = null;
        } else {
          ref.read(connectionStateProvider.notifier).state =
              'Offline or server unavailable · saved work stays on this phone';
        }
      }
    } on StorageFailure catch (error) {
      if (mounted && ref.read(sessionProvider)?.userId == p.userId) {
        ref.read(connectionStateProvider.notifier).state = error.message;
        ref.read(dataRevisionProvider.notifier).state++;
      }
    } catch (_) {
      if (mounted) {
        ref.read(connectionStateProvider.notifier).state =
            'Refresh needs attention · open Sync Centre';
      }
    } finally {
      refreshing = false;
    }
  }

  @override
  void dispose() {
    timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MaterialApp.router(
    title: 'Waypoint Flow',
    debugShowCheckedModeBanner: false,
    theme: buildWaypointTheme(),
    routerConfig: ref.watch(routerProvider),
  );
}
