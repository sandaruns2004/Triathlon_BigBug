import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:waypoint_mobile/app/environment.dart';
import 'package:waypoint_mobile/core/auth/authentication_repository.dart';
import 'package:waypoint_mobile/core/data/operational_repository.dart';
import 'package:waypoint_mobile/core/network/api_client.dart';
import 'package:waypoint_mobile/core/storage/key_vault.dart';
import 'package:waypoint_mobile/core/storage/local_database.dart';
import 'package:waypoint_mobile/core/storage/local_store.dart';
import 'package:waypoint_mobile/core/storage/payload_cipher.dart';
import 'package:waypoint_mobile/domain/models.dart';

class FailingTokens implements TokenSource {
  @override
  Future<String?> idToken() async => throw StateError('SDK unavailable');
}

class OrderTokens implements TokenSource {
  @override
  Future<String?> idToken() async => 'test-token';
}

class OrderAdapter implements HttpClientAdapter {
  bool offline = false;
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async => ResponseBody.fromString(
    offline
        ? '{}'
        : '{"order":{"orderId":"ORDER-A","status":"delivered","lines":[]},"exceptions":[]}',
    offline ? 503 : 200,
    headers: {
      Headers.contentTypeHeader: ['application/json'],
    },
  );
  @override
  void close({bool force = false}) {}
}

class TestUser extends Fake implements User {
  @override
  String get uid => 'firebase-a';
  @override
  Future<String?> getIdToken([bool forceRefresh = false]) async => 'test-token';
}

class TestAuth extends Fake implements FirebaseAuth {
  User? user = TestUser();
  @override
  User? get currentUser => user;
  @override
  Stream<User?> authStateChanges() => Stream.value(user);
  @override
  Future<void> signOut() async {
    user = null;
  }
}

class RejectAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async => ResponseBody.fromString(
    '{}',
    403,
    headers: {
      Headers.contentTypeHeader: ['application/json'],
    },
  );
  @override
  void close({bool force = false}) {}
}

class TestRepository extends FirebaseAuthenticationRepository {
  TestRepository(super.config, super.firebase, super.storage);
  @override
  ApiClient createClient() =>
      super.createClient()..dio.httpClientAdapter = RejectAdapter();
}

AppConfig config({
  String path = '/api/mobile/v1',
  String project = 'working-project',
  String emulator = '',
}) => AppConfig(
  environment: AppEnvironment.development,
  fixtureMode: false,
  apiBaseUrl: Uri.parse('http://localhost$path'),
  socketUrl: Uri.parse('http://localhost'),
  firebaseProjectId: project,
  firebaseApiKey: 'client-key',
  firebaseAppId: 'client-app',
  firebaseSenderId: '123',
  authEmulatorHost: emulator,
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test(
    'shared order envelope remains usable online and from encrypted offline cache',
    () async {
      final db = LocalDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final store = LocalStore(db, PayloadCipher(MemoryKeyVault()));
      final principal = Principal(
        userId: 'store-a',
        name: 'A',
        role: MobileRole.store,
        depot: 'A',
        outletId: 'OUT-A',
        offlineExpiresAt: DateTime.now().add(const Duration(hours: 1)),
      );
      final adapter = OrderAdapter();
      final client = ApiClient(config(), OrderTokens())
        ..dio.httpClientAdapter = adapter;
      final repo = OperationalRepository(client, store, () => principal);
      final online = await repo.read(
        'store/orders/ORDER-A',
        'order/ORDER-A',
        principal,
      );
      expect(online.data['status'], 'delivered');
      expect(online.data['orderId'], 'ORDER-A');
      adapter.offline = true;
      final saved = await repo.read(
        'store/orders/ORDER-A',
        'order/ORDER-A',
        principal,
      );
      expect(saved.fromCache, isTrue);
      expect(saved.data, online.data);
    },
  );
  test('API path normalized and website/emulator mismatches rejected', () {
    expect(config().apiEndpoint, 'http://localhost/api/mobile/v1/');
    config().validate(releaseBuild: false);
    expect(
      () => config(path: '/').validate(releaseBuild: false),
      throwsStateError,
    );
    expect(
      () =>
          config(project: 'demo-waypoint-mobile').validate(releaseBuild: false),
      throwsStateError,
    );
    expect(
      () => config(emulator: 'localhost').validate(releaseBuild: false),
      throwsStateError,
    );
  });
  test(
    'SDK token failure completes request rather than hanging interceptor',
    () async {
      await expectLater(
        ApiClient(
          config(),
          FailingTokens(),
        ).dio.get<dynamic>('me').timeout(const Duration(seconds: 2)),
        throwsA(isA<DioException>()),
      );
    },
  );
  test('Firebase mismatch is actionable without revealing raw credentials', () {
    expect(
      signInFailureMessage(
        FirebaseAuthException(code: 'custom-token-mismatch'),
      ),
      contains('does not match'),
    );
  });
  test('provider network failure identifies the unavailable service', () {
    expect(
      signInFailureMessage(
        FirebaseAuthException(code: 'network-request-failed'),
      ),
      contains('Cannot reach Firebase authentication'),
    );
  });
  test(
    'server role rejection deletes offline grant and signs out SDK',
    () async {
      FlutterSecureStorage.setMockInitialValues({
        'waypoint.profile': 'old-grant',
      });
      const vault = FlutterSecureStorage();
      final firebase = TestAuth();
      final repo = TestRepository(config(), firebase, vault);
      await expectLater(repo.revalidate(), throwsA(isA<DioException>()));
      expect(await vault.read(key: 'waypoint.profile'), isNull);
      expect(firebase.currentUser, isNull);
      expect(await repo.restore(), isNull);
    },
  );
  test(
    'saved forms cannot cross depot or outlet scopes and remain retained',
    () async {
      final db = LocalDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final store = LocalStore(db, PayloadCipher(MemoryKeyVault()));
      Principal owner(String depot) => Principal(
        userId: 'same-user',
        name: 'Test',
        role: MobileRole.driver,
        depot: depot,
        offlineExpiresAt: DateTime.now().add(const Duration(hours: 1)),
      );
      var current = owner('A');
      final repo = OperationalRepository(
        ApiClient(config(), FailingTokens()),
        store,
        () => current,
      );
      await repo.saveForm(current, 'proof/stop', 'stop', {
        'note': 'retained proof',
      });
      current = owner('B');
      await expectLater(repo.loadForm(current, 'proof/stop'), throwsStateError);
      await expectLater(
        repo.saveForm(current, 'proof/stop', 'stop', {'note': 'overwrite'}),
        throwsStateError,
      );
      current = owner('A');
      expect(
        (await repo.loadForm(current, 'proof/stop'))?['note'],
        'retained proof',
      );
    },
  );
}
