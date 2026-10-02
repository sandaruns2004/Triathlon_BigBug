import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/environment.dart';
import 'app/providers.dart';
import 'app/waypoint_app.dart';
import 'core/storage/storage_runtime.dart';
import 'core/auth/authentication_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final config = AppConfig.fromDefines();
    config.validate(
      releaseBuild: kReleaseMode,
      targetPlatform: kIsWeb ? null : defaultTargetPlatform,
      buildFlavor: appFlavor,
    );
    final storage = await openStorage();
    final auth = config.fixtureMode
        ? null
        : await FirebaseAuthenticationRepository.initialize(config);
    final principal = storage.durable ? await auth?.restore() : null;
    runApp(
      ProviderScope(
        overrides: [
          configProvider.overrideWithValue(config),
          storageProvider.overrideWithValue(storage),
          authProvider.overrideWithValue(auth),
          sessionProvider.overrideWith((ref) => principal),
        ],
        child: const WaypointApp(),
      ),
    );
  } catch (_) {
    runApp(
      const MaterialApp(
        home: Scaffold(
          body: SafeArea(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'App configuration needs attention. Check the environment file and HTTPS endpoints.',
              ),
            ),
          ),
        ),
      ),
    );
  }
}
