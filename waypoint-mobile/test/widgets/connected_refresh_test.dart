import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:waypoint_mobile/app/providers.dart';
import 'package:waypoint_mobile/core/data/operational_repository.dart';
import 'package:waypoint_mobile/domain/models.dart';
import 'package:waypoint_mobile/features/connected/connected_pages.dart';

void main() {
  testWidgets('refresh preserves current data but an outlet switch hides it', (
    tester,
  ) async {
    const first = Principal(
      userId: 'store-a',
      role: MobileRole.store,
      name: 'A',
      outletId: 'OUT-A',
    );
    const second = Principal(
      userId: 'store-b',
      role: MobileRole.store,
      name: 'B',
      outletId: 'OUT-B',
    );
    final reads = <(ScopedReadKey, int), Completer<CachedRead>>{};
    final container = ProviderContainer(
      overrides: [
        sessionProvider.overrideWith((ref) => first),
        remoteReadProvider.overrideWith((ref, key) {
          ref.watch(sessionProvider);
          final revision = ref.watch(dataRevisionProvider);
          return reads.putIfAbsent((
            key,
            revision,
          ), Completer<CachedRead>.new).future;
        }),
      ],
    );
    addTearDown(container.dispose);
    CachedRead result(String label) => CachedRead(
      {'label': label},
      DateTime.utc(2026, 10, 9),
      fromCache: false,
    );
    const query = ('store/orders', 'store/orders');
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: Scaffold(
            body: RemoteContent(
              query: query,
              builder: (read) => Text(read.data['label'] as String),
            ),
          ),
        ),
      ),
    );
    reads[(scopedReadKey(query, first), 0)]!.complete(
      result('Outlet A orders'),
    );
    await tester.pump();
    await tester.pump();
    expect(find.text('Outlet A orders'), findsOneWidget);

    container.read(dataRevisionProvider.notifier).state++;
    await tester.pump();
    expect(find.text('Outlet A orders'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);
    reads[(scopedReadKey(query, first), 1)]!.complete(
      result('Refreshed A orders'),
    );
    await tester.pump();
    await tester.pump();
    expect(find.text('Refreshed A orders'), findsOneWidget);

    container.read(sessionProvider.notifier).state = second;
    await tester.pump();
    expect(find.text('Refreshed A orders'), findsNothing);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    reads[(scopedReadKey(query, second), 1)]!.complete(
      result('Outlet B orders'),
    );
    await tester.pump();
    await tester.pump();
    expect(find.text('Outlet B orders'), findsOneWidget);
  });
}
