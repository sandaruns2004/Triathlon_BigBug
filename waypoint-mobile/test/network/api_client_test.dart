import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:waypoint_mobile/app/environment.dart';
import 'package:waypoint_mobile/core/network/api_client.dart';

class Tokens implements RefreshableTokenSource {
  @override
  String? currentUserId = 'driver-a';
  bool switchOnRead = false, switchOnRefresh = false;
  int refreshes = 0;
  @override
  Future<String?> idToken() async {
    if (switchOnRead) currentUserId = 'driver-b';
    return 'test-token';
  }

  @override
  Future<String?> refreshIdToken() async {
    refreshes++;
    if (switchOnRefresh) currentUserId = 'driver-b';
    return 'test-refreshed-token';
  }
}

class Adapter implements HttpClientAdapter {
  int calls = 0;
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    calls++;
    return ResponseBody.fromString(
      '{"error":{"code":"expired"}}',
      401,
      headers: {
        Headers.contentTypeHeader: ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  ApiClient client(Tokens tokens, Adapter adapter) {
    final api = ApiClient(
      AppConfig(
        environment: AppEnvironment.development,
        fixtureMode: false,
        apiBaseUrl: Uri.parse('http://localhost/api/mobile/v1/'),
        socketUrl: Uri.parse('http://localhost'),
      ),
      tokens,
    );
    api.dio.httpClientAdapter = adapter;
    return api;
  }

  test(
    'account switch during token acquisition never sends a request',
    () async {
      final tokens = Tokens()..switchOnRead = true, adapter = Adapter();
      await expectLater(
        client(tokens, adapter).dio.get<dynamic>('driver/trips'),
        throwsA(isA<DioException>()),
      );
      expect(adapter.calls, 0);
      expect(tokens.refreshes, 0);
    },
  );
  test('401 refresh preserves the original account binding', () async {
    final tokens = Tokens()..switchOnRefresh = true, adapter = Adapter();
    await expectLater(
      client(tokens, adapter).dio.get<dynamic>('driver/trips'),
      throwsA(isA<DioException>()),
    );
    expect(adapter.calls, 1);
    expect(tokens.refreshes, 1);
  });
  test('expired token refresh is bounded to one retry', () async {
    final tokens = Tokens(), adapter = Adapter();
    await expectLater(
      client(tokens, adapter).dio.get<dynamic>('driver/trips'),
      throwsA(isA<DioException>()),
    );
    expect(adapter.calls, 2);
    expect(tokens.refreshes, 1);
  });
}
