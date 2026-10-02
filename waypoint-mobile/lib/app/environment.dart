import 'package:flutter/foundation.dart';

enum AppEnvironment { development, staging, production }

class AppConfig {
  const AppConfig({
    required this.environment,
    required this.fixtureMode,
    required this.apiBaseUrl,
    required this.socketUrl,
    this.socketPath = '/socket.io',
    this.firebaseProjectId = '',
    this.firebaseApiKey = '',
    this.firebaseAppId = '',
    this.firebaseSenderId = '',
    this.firebaseIosBundleId = '',
    this.authEmulatorHost = '',
    this.authEmulatorPort = 9099,
  });

  factory AppConfig.fromDefines() {
    const name = String.fromEnvironment('APP_ENV', defaultValue: 'development');
    return AppConfig(
      environment: AppEnvironment.values.byName(name),
      fixtureMode:
          const String.fromEnvironment('APP_MODE', defaultValue: 'fixture') ==
          'fixture',
      apiBaseUrl: Uri.parse(
        const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'http://10.0.2.2:3000/api/mobile/v1/',
        ),
      ),
      socketUrl: Uri.parse(
        const String.fromEnvironment(
          'SOCKET_URL',
          defaultValue: 'http://10.0.2.2:3000',
        ),
      ),
      socketPath: const String.fromEnvironment(
        'SOCKET_PATH',
        defaultValue: '/socket.io',
      ),
      firebaseProjectId: const String.fromEnvironment('FIREBASE_PROJECT_ID'),
      firebaseApiKey: const String.fromEnvironment('FIREBASE_API_KEY'),
      firebaseAppId: const String.fromEnvironment('FIREBASE_APP_ID'),
      firebaseSenderId: const String.fromEnvironment('FIREBASE_SENDER_ID'),
      firebaseIosBundleId: const String.fromEnvironment(
        'FIREBASE_IOS_BUNDLE_ID',
      ),
      authEmulatorHost: const String.fromEnvironment('AUTH_EMULATOR_HOST'),
      authEmulatorPort: const int.fromEnvironment(
        'AUTH_EMULATOR_PORT',
        defaultValue: 9099,
      ),
    );
  }
  final AppEnvironment environment;
  final bool fixtureMode;
  final Uri apiBaseUrl;
  final Uri socketUrl;
  final String socketPath;
  final String firebaseProjectId;
  final String firebaseIosBundleId;
  final String firebaseApiKey,
      firebaseAppId,
      firebaseSenderId,
      authEmulatorHost;
  final int authEmulatorPort;

  void validate({
    required bool releaseBuild,
    TargetPlatform? targetPlatform,
    String? buildFlavor,
  }) {
    if (buildFlavor != null && buildFlavor != environment.name) {
      throw StateError('Native flavor and APP_ENV must match.');
    }
    if (!fixtureMode && targetPlatform == TargetPlatform.iOS) {
      final suffix = switch (environment) {
        AppEnvironment.development => '.dev',
        AppEnvironment.staging => '.staging',
        AppEnvironment.production => '',
      };
      if (!firebaseAppId.contains(':ios:') ||
          firebaseIosBundleId != 'lk.waypoint.waypointMobile$suffix') {
        throw StateError(
          'Configure the Firebase Apple app for this iOS flavor.',
        );
      }
    }
    for (final uri in [apiBaseUrl, socketUrl]) {
      if (!uri.hasAuthority || !['http', 'https'].contains(uri.scheme)) {
        throw StateError('Configure an absolute HTTP(S) endpoint.');
      }
      if ((releaseBuild || environment != AppEnvironment.development) &&
          uri.scheme != 'https') {
        throw StateError('Staging and release endpoints require HTTPS.');
      }
    }
    if (!socketPath.startsWith('/')) {
      throw StateError('Socket path must start with /.');
    }
    if (environment == AppEnvironment.production && fixtureMode) {
      throw StateError('Production cannot use fixture identities.');
    }
    if (!fixtureMode &&
        [
          firebaseProjectId,
          firebaseApiKey,
          firebaseAppId,
          firebaseSenderId,
        ].any((value) => value.isEmpty)) {
      throw StateError(
        'Connected builds require Firebase client configuration.',
      );
    }
    if (authEmulatorHost.isNotEmpty &&
        (releaseBuild ||
            environment != AppEnvironment.development ||
            !firebaseProjectId.startsWith('demo-'))) {
      throw StateError(
        'Authentication emulators are allowed only in development demo projects.',
      );
    }
  }
}
