import 'dart:convert';
import 'dart:typed_data';
import 'package:cryptography/cryptography.dart';
import 'key_vault.dart';

class PayloadCipher {
  PayloadCipher(this.vault);
  final KeyVault vault;
  final AesGcm _algorithm = AesGcm.with256bits();
  Future<Uint8List> seal(
    String userId,
    String context,
    List<int> bytes, {
    bool createKey = true,
  }) async {
    final box = await _algorithm.encrypt(
      bytes,
      secretKey: await vault.keyFor(userId, create: createKey),
      aad: utf8.encode('$userId|$context|1'),
    );
    return Uint8List.fromList(
      utf8.encode(
        jsonEncode({
          'v': 1,
          'nonce': base64Encode(box.nonce),
          'cipher': base64Encode(box.cipherText),
          'mac': base64Encode(box.mac.bytes),
        }),
      ),
    );
  }

  Future<Uint8List> open(String userId, String context, List<int> bytes) async {
    final encoded = jsonDecode(utf8.decode(bytes)) as Map<String, dynamic>;
    if (encoded['v'] != 1) throw StateError('Unsupported encryption version.');
    final box = SecretBox(
      base64Decode(encoded['cipher'] as String),
      nonce: base64Decode(encoded['nonce'] as String),
      mac: Mac(base64Decode(encoded['mac'] as String)),
    );
    return Uint8List.fromList(
      await _algorithm.decrypt(
        box,
        secretKey: await vault.keyFor(userId, create: false),
        aad: utf8.encode('$userId|$context|1'),
      ),
    );
  }
}
