import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:waypoint_mobile/core/storage/key_vault.dart';
import 'package:waypoint_mobile/core/storage/native_media_store.dart';
import 'package:waypoint_mobile/core/storage/payload_cipher.dart';

void main() {
  test(
    'lost media key cannot be replaced over existing encrypted images',
    () async {
      final directory = await Directory.systemTemp.createTemp(
        'waypoint-media-key-',
      );
      try {
        final source = File('${directory.path}/capture.png');
        await source.writeAsBytes([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 1]);
        final original = NativeMediaStore(
          directory,
          PayloadCipher(MemoryKeyVault()),
        );
        final evidence = await original.importFile(
          'user-a',
          source.path,
          mime: 'image/png',
        );
        final before = await File(evidence.path).readAsBytes();
        final missingKey = NativeMediaStore(
          directory,
          PayloadCipher(MemoryKeyVault()),
        );
        await expectLater(
          missingKey.importFile('user-a', source.path, mime: 'image/png'),
          throwsException,
        );
        expect(await File(evidence.path).readAsBytes(), before);
        expect(
          await original.read('user-a', evidence),
          await source.readAsBytes(),
        );
      } finally {
        await directory.delete(recursive: true);
      }
    },
  );
  test(
    'encrypted evidence survives removal of camera temp file and rejects another user',
    () async {
      final directory = await Directory.systemTemp.createTemp(
        'waypoint-media-',
      );
      try {
        final source = File('${directory.path}/capture.png');
        final bytes = [0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 1, 2, 3, 4];
        await source.writeAsBytes(bytes);
        final cipher = PayloadCipher(MemoryKeyVault());
        final media = NativeMediaStore(directory, cipher);
        final saved = await media.importFile(
          'user-a',
          source.path,
          mime: 'image/png',
        );
        await source.delete();
        expect(await media.read('user-a', saved), bytes);
        expect(await File(saved.path).readAsBytes(), isNot(bytes));
        await expectLater(media.read('user-b', saved), throwsException);
        expect(
          await NativeMediaStore(directory, cipher).read('user-a', saved),
          bytes,
        );
        final pending = directory
            .listSync(recursive: true)
            .whereType<File>()
            .where((f) => f.path.endsWith('.pending'));
        expect(pending, isEmpty);
      } finally {
        await directory.delete(recursive: true);
      }
    },
  );
  test(
    'unavailable source, wrong MIME and oversized files report failure',
    () async {
      final directory = await Directory.systemTemp.createTemp(
        'waypoint-media-',
      );
      try {
        final media = NativeMediaStore(
          directory,
          PayloadCipher(MemoryKeyVault()),
        );
        await expectLater(
          media.importFile(
            'user-a',
            '${directory.path}/missing.jpg',
            mime: 'image/jpeg',
          ),
          throwsException,
        );
        final text = File('${directory.path}/fake.jpg');
        await text.writeAsString('not a photo');
        await expectLater(
          media.importFile('user-a', text.path, mime: 'image/jpeg'),
          throwsException,
        );
        await text.writeAsBytes(List.filled(NativeMediaStore.maxBytes + 1, 0));
        await expectLater(
          media.importFile('user-a', text.path, mime: 'image/jpeg'),
          throwsException,
        );
      } finally {
        await directory.delete(recursive: true);
      }
    },
  );
}
