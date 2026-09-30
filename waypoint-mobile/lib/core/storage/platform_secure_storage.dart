import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Pending evidence must stay on its originating device, without iCloud key sync.
// Foreground access requires an unlocked phone; Android options remain unchanged.
const deviceSecureStorage = FlutterSecureStorage(
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.unlocked_this_device,
    synchronizable: false,
  ),
);
