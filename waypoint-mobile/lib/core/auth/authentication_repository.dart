import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../app/environment.dart';
import '../../domain/models.dart';
import '../network/api_client.dart';
import '../storage/platform_secure_storage.dart';

abstract interface class AuthenticationRepository
    implements RefreshableTokenSource {
  Future<Principal?> restore();
  Future<Principal> signIn(String email, String password);
  Future<void> signOut();
  Future<Principal> revalidate();
  @override
  String? get currentUserId;
  bool get offline;
}

class FirebaseAuthenticationRepository implements AuthenticationRepository {
  FirebaseAuthenticationRepository(
    this.config,
    this.firebase, [
    FlutterSecureStorage? storage,
  ]) : vault = storage ?? deviceSecureStorage;
  final AppConfig config;
  final FirebaseAuth firebase;
  final FlutterSecureStorage vault;
  Principal? _principal;
  bool _offline = false;
  @override
  String? get currentUserId =>
      _principal?.firebaseUid == firebase.currentUser?.uid
      ? _principal?.userId
      : null;
  @override
  bool get offline => _offline;
  static Future<FirebaseAuthenticationRepository> initialize(
    AppConfig config,
  ) async {
    final app = await Firebase.initializeApp(
      options: FirebaseOptions(
        apiKey: config.firebaseApiKey,
        appId: config.firebaseAppId,
        messagingSenderId: config.firebaseSenderId,
        projectId: config.firebaseProjectId,
        iosBundleId: config.firebaseIosBundleId.isEmpty
            ? null
            : config.firebaseIosBundleId,
      ),
    );
    final sdk = FirebaseAuth.instanceFor(app: app);
    if (config.authEmulatorHost.isNotEmpty) {
      await sdk.useAuthEmulator(
        config.authEmulatorHost,
        config.authEmulatorPort,
      );
    }
    return FirebaseAuthenticationRepository(config, sdk);
  }

  @override
  Future<String?> idToken() =>
      firebase.currentUser?.getIdToken() ?? Future.value();
  @override
  Future<String?> refreshIdToken() =>
      firebase.currentUser?.getIdToken(true) ?? Future.value();

  Future<void> _remember(Principal principal) async {
    await vault.write(
      key: 'waypoint.profile',
      value: jsonEncode({
        'principal': principal.toJson(),
        'verifiedAt': DateTime.now().toUtc().toIso8601String(),
      }),
    );
  }

  ApiClient createClient() => ApiClient(config, this);

  @override
  Future<Principal> revalidate() async {
    final expectedUid = firebase.currentUser?.uid;
    final client = createClient();
    late Response<Map<String, dynamic>> result;
    try {
      result = await client.dio.get<Map<String, dynamic>>('me');
    } on DioException catch (error) {
      if ([401, 403].contains(error.response?.statusCode)) {
        await signOut();
      }
      rethrow;
    }
    final me = Principal.fromJson(result.data!);
    if (expectedUid == null ||
        me.firebaseUid != expectedUid ||
        firebase.currentUser?.uid != expectedUid) {
      throw StateError('Identity linking needs attention.');
    }
    await _remember(me);
    _principal = me;
    _offline = false;
    return me;
  }

  @override
  Future<Principal?> restore() async {
    // Wait for persisted SDK identity restoration; first launch cannot authenticate offline.
    await firebase.authStateChanges().first;
    if (firebase.currentUser == null) return null;
    try {
      final me = await revalidate();
      return me.offlineExpiresAt != null &&
              DateTime.now().toUtc().isBefore(me.offlineExpiresAt!)
          ? me
          : null;
    } on DioException catch (error) {
      if (error.response != null) {
        return null; // Explicit server rejection always locks access.
      }
      final saved = await vault.read(key: 'waypoint.profile');
      if (saved == null) return null;
      final cache = jsonDecode(saved) as Map<String, dynamic>;
      final principal = Principal.fromJson(
        cache['principal'] as Map<String, dynamic>,
      );
      final verifiedAt = DateTime.parse(cache['verifiedAt'] as String);
      final now = DateTime.now().toUtc();
      if (principal.firebaseUid != firebase.currentUser!.uid ||
          principal.offlineExpiresAt == null ||
          !now.isBefore(principal.offlineExpiresAt!) ||
          now.isBefore(verifiedAt.subtract(const Duration(minutes: 5)))) {
        return null;
      }
      _principal = principal;
      _offline = true;
      return principal;
    }
  }

  @override
  Future<Principal> signIn(String email, String password) async {
    try {
      final publicClient = Dio(
        BaseOptions(
          baseUrl: config.apiEndpoint,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
        ),
      );
      final result = await publicClient.post<Map<String, dynamic>>(
        'auth/login',
        data: {'email': email.trim(), 'password': password},
      );
      await firebase.signInWithCustomToken(
        result.data!['customToken'] as String,
      );
      return await revalidate();
    } catch (error) {
      if (kDebugMode) {
        final category = error is FirebaseAuthException
            ? error.code
            : error is DioException
            ? '${error.type.name}, HTTP ${error.response?.statusCode}'
            : error.runtimeType.toString();
        debugPrint('Waypoint sign-in failure: $category');
      }
      await signOut();
      throw StateError(signInFailureMessage(error));
    }
  }

  @override
  Future<void> signOut() async {
    _principal = null;
    _offline = false;
    try {
      await vault.delete(key: 'waypoint.profile');
    } finally {
      await firebase.signOut();
    }
    // Do not delete user-scoped proof, keys or cached records.
  }
}

String signInFailureMessage(Object error) {
  if (error is FirebaseAuthException &&
      error.code == 'network-request-failed') {
    return 'Cannot reach Firebase authentication. Check your connection and try again.';
  }
  if (error is FirebaseAuthException &&
      [
        'custom-token-mismatch',
        'invalid-api-key',
        'app-not-authorized',
        'invalid-custom-token',
      ].contains(error.code)) {
    return 'The app Firebase configuration does not match the sign-in service. '
        'Use the Firebase client settings for the working website backend.';
  }
  if (error is DioException) {
    if (error.response == null) {
      return 'Cannot reach the sign-in service. Check the API address and connection.';
    }
    if (error.response?.statusCode == 404) {
      return 'The mobile API was not found. Check the website address and /api/mobile/v1/ path.';
    }
    if (error.response?.statusCode == 429) {
      return 'Too many sign-in attempts. Wait 15 minutes before trying again.';
    }
  }
  return 'Sign-in could not be verified. Use your provisioned Driver or Store Manager account, or contact operations.';
}
