import 'dart:convert';
import 'package:cryptography/cryptography.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'platform_secure_storage.dart';

abstract interface class KeyVault {
  Future<SecretKey> keyFor(String userId, {required bool create});
}

class SecureKeyVault implements KeyVault {
  SecureKeyVault([FlutterSecureStorage? storage])
    : _storage = storage ?? deviceSecureStorage;
  final FlutterSecureStorage _storage;
  final Map<String, Future<SecretKey>> _pending = {};
  @override
  Future<SecretKey> keyFor(String userId, {required bool create}) async {
    final pending = _pending.putIfAbsent(userId, () => _load(userId, create));
    try {
      return await pending;
    } catch (_) {
      _pending.remove(userId);
      rethrow;
    }
  }

  Future<SecretKey> _load(String userId, bool create) async {
    final digest = await Sha256().hash(utf8.encode(userId));
    final name = 'waypoint.key.${base64UrlEncode(digest.bytes)}';
    final saved = await _storage.read(key: name);
    if (saved != null) return SecretKey(base64Decode(saved));
    if (!create) {
      throw StateError(
        'Device key unavailable. Keep records and contact support.',
      );
    }
    final key = await AesGcm.with256bits().newSecretKey();
    await _storage.write(
      key: name,
      value: base64Encode(await key.extractBytes()),
    );
    return key;
  }
}

class MemoryKeyVault implements KeyVault {
  final Map<String, Future<SecretKey>> _keys = {};
  @override
  Future<SecretKey> keyFor(String userId, {required bool create}) async {
    if (_keys.containsKey(userId)) return _keys[userId]!;
    if (!create) throw StateError('Key missing.');
    return _keys.putIfAbsent(userId, () => AesGcm.with256bits().newSecretKey());
  }
}
