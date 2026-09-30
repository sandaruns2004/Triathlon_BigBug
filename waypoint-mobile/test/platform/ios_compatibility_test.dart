import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:waypoint_mobile/app/environment.dart';
import 'package:waypoint_mobile/app/router.dart';
import 'package:waypoint_mobile/core/media/evidence_capture.dart';
import 'package:waypoint_mobile/core/storage/key_vault.dart';
import 'package:waypoint_mobile/core/storage/local_database.dart';
import 'package:waypoint_mobile/core/storage/local_store.dart';
import 'package:waypoint_mobile/core/storage/media_store.dart';
import 'package:waypoint_mobile/core/storage/payload_cipher.dart';
import 'package:waypoint_mobile/core/storage/platform_secure_storage.dart';
import 'package:waypoint_mobile/domain/models.dart';

class DeniedCamera extends ImagePicker {
  int lostDataCalls = 0;
  bool? fullMetadata;
  @override
  Future<XFile?> pickImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    CameraDevice preferredCameraDevice = CameraDevice.rear,
    bool requestFullMetadata = true,
  }) async {
    fullMetadata = requestFullMetadata;
    throw PlatformException(code: 'camera_access_denied');
  }

  @override
  Future<LostDataResponse> retrieveLostData() async {
    lostDataCalls++;
    throw UnimplementedError('Android-only API called on iOS');
  }
}

class UnusedMedia extends Fake implements MediaStore {}

AppConfig connectedConfig({
  String appId = '1:123:ios:abc',
  String bundleId = 'lk.waypoint.waypointMobile',
}) => AppConfig(
  environment: AppEnvironment.production,
  fixtureMode: false,
  apiBaseUrl: Uri.parse('https://example.com/api/mobile/v1/'),
  socketUrl: Uri.parse('https://example.com/'),
  firebaseProjectId: 'waypoint',
  firebaseApiKey: 'test-client-config',
  firebaseAppId: appId,
  firebaseSenderId: '123',
  firebaseIosBundleId: bundleId,
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const principal = Principal(
    userId: 'driver-a',
    name: 'Synthetic Driver',
    role: MobileRole.driver,
  );
  test('iOS rejects Android Firebase options and wrong flavor/bundle', () {
    expect(
      () => connectedConfig(
        appId: '1:123:android:abc',
      ).validate(releaseBuild: true, targetPlatform: TargetPlatform.iOS),
      throwsStateError,
    );
    expect(
      () => connectedConfig(
        bundleId: 'lk.waypoint.waypointMobile.dev',
      ).validate(releaseBuild: true, targetPlatform: TargetPlatform.iOS),
      throwsStateError,
    );
    expect(
      () => connectedConfig().validate(
        releaseBuild: true,
        targetPlatform: TargetPlatform.iOS,
        buildFlavor: 'development',
      ),
      throwsStateError,
    );
    connectedConfig().validate(
      releaseBuild: true,
      targetPlatform: TargetPlatform.iOS,
      buildFlavor: 'production',
    );
  });
  test('native links normalize only local Driver/Store paths', () {
    expect(
      normalizeNativeDeepLink(
        Uri.parse('waypoint://store/orders/order-1/note'),
      )?.toString(),
      '/store/orders/order-1/note',
    );
    expect(
      normalizeNativeDeepLink(
        Uri.parse('waypoint-dev:///driver/activity/sync'),
      )?.toString(),
      '/driver/activity/sync',
    );
    for (final input in [
      'https://example.com/store/orders/order-1',
      'waypoint://evil.example/store/orders/order-1',
      'waypoint://name@store/orders/order-1',
      'waypoint://store:3000/orders/order-1',
      'waypoint:///dispatcher/operations',
      'waypoint:///store/home#external',
    ]) {
      expect(normalizeNativeDeepLink(Uri.parse(input)), isNull);
    }
  });
  test('Keychain evidence/profile keys are unlocked and device-bound', () {
    expect(
      deviceSecureStorage.iOptions.accessibility,
      KeychainAccessibility.unlocked_this_device,
    );
    expect(deviceSecureStorage.iOptions.synchronizable, isFalse);
  });

  late LocalDatabase db;
  late LocalStore store;
  late DeniedCamera camera;
  setUp(() async {
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    db = LocalDatabase(NativeDatabase.memory());
    store = LocalStore(db, PayloadCipher(MemoryKeyVault()));
    camera = DeniedCamera();
    await store.write(
      LocalTable.drafts,
      principal.userId,
      'draft-1',
      'stop-1',
      {
        'note': 'Retain this form',
        'evidenceIds': ['existing-photo'],
      },
    );
  });
  tearDown(() async {
    debugDefaultTargetPlatformOverride = null;
    await db.close();
  });
  test(
    'denied camera preserves draft and clears only capture checkpoint',
    () async {
      final capture = EvidenceCapture(store, UnusedMedia(), camera);
      await expectLater(
        capture.capture(principal, 'draft-1', 'stop-1'),
        throwsA(isA<StorageFailure>()),
      );
      final draft = await store.read(
        LocalTable.drafts,
        principal.userId,
        'draft-1',
      );
      expect(draft?['note'], 'Retain this form');
      expect(draft?['evidenceIds'], ['existing-photo']);
      expect(camera.fullMetadata, isFalse);
      expect(
        (await store.read(
          LocalTable.checkpoints,
          principal.userId,
          'camera-context',
        ))?['pending'],
        isFalse,
      );
    },
  );
  test(
    'interrupted iOS capture retains evidence without Android recovery',
    () async {
      await store.write(
        LocalTable.checkpoints,
        principal.userId,
        'camera-context',
        'stop-1',
        {'pending': true, 'draftId': 'draft-1', 'entityId': 'stop-1'},
      );
      final capture = EvidenceCapture(store, UnusedMedia(), camera);
      await expectLater(
        capture.recover(principal),
        throwsA(isA<StorageFailure>()),
      );
      expect(camera.lostDataCalls, 0);
      expect(
        (await store.read(
          LocalTable.drafts,
          principal.userId,
          'draft-1',
        ))?['evidenceIds'],
        ['existing-photo'],
      );
      // The interruption is acknowledged once; later refreshes are usable.
      await capture.recover(principal);
      expect(
        await store.read(LocalTable.drafts, 'driver-b', 'draft-1'),
        isNull,
      );
    },
  );
}
