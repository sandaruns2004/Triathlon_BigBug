import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:waypoint_mobile/core/storage/storage_runtime.dart';
import 'package:waypoint_mobile/domain/models.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets(
    'native SQLite and secure-storage key survive runtime reopening',
    (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: Text('Native storage verification')),
        ),
      );
      final userId = 'integration-${DateTime.now().microsecondsSinceEpoch}';
      final first = await openStorage();
      expect(first.error, isNull);
      expect(first.store, isNotNull);
      await first.drafts.saveDraft(
        userId,
        LocalDraft(
          id: 'restart-draft',
          entityId: 'integration-stop',
          note: 'Native retained draft',
          updatedAt: DateTime.now(),
        ),
      );
      await first.store!.db.close();
      final reopened = await openStorage();
      try {
        expect(reopened.error, isNull);
        expect(
          (await reopened.drafts.loadDraft(userId, 'restart-draft'))?.note,
          'Native retained draft',
        );
        expect(
          await reopened.drafts.loadDraft('integration-other', 'restart-draft'),
          isNull,
        );
      } finally {
        await reopened.store!.db.customStatement(
          'DELETE FROM drafts WHERE user_id=? AND id=?',
          [userId, 'restart-draft'],
        );
        await reopened.store!.db.close();
      }
    },
  );
}
