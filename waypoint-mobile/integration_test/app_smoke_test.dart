import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:waypoint_mobile/app/environment.dart';
import 'package:waypoint_mobile/core/storage/local_database.dart';
import 'package:waypoint_mobile/core/storage/storage_runtime.dart';
import 'package:waypoint_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('connected native app signs in and renders its released route', (
    tester,
  ) async {
    final config = AppConfig.fromDefines();
    expect(config.firebaseProjectId, 'demo-waypoint-mobile');
    expect(config.authEmulatorHost, isNotEmpty);
    // These accounts belong solely to the isolated seed. Retain every other
    // identity's records, keys and files; do not run this against a hosted API.
    expect(config.apiBaseUrl.host, '10.0.2.2');
    final storage = await openStorage();
    expect(storage.error, isNull);
    for (final user in ['test-driver', 'test-store']) {
      for (final table in LocalTable.values) {
        await storage.store!.db.customStatement(
          'DELETE FROM ${table.sqlName} WHERE user_id=?',
          [user],
        );
      }
    }
    await storage.store!.db.close();
    await app.main();
    await tester.pumpAndSettle();
    if (find.text('Welcome to Waypoint Flow').evaluate().isNotEmpty) {
      await tester.enterText(
        find.byType(TextFormField).at(0),
        'test-driver@emulator.waypoint.test',
      );
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'local-emulator-only',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Sign in'));
    }
    for (var i = 0; i < 200; i++) {
      await tester.pump(const Duration(milliseconds: 250));
      if (find.text('Start route').evaluate().isNotEmpty) break;
    }
    expect(tester.takeException(), isNull);
    expect(
      find.text('Start route'),
      findsOneWidget,
      reason: tester
          .widgetList<Text>(find.byType(Text))
          .map((text) => text.data)
          .join(' | '),
    );
    await tester.tap(find.text('Route').last);
    await tester.pumpAndSettle();
    expect(find.text('Your route'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
