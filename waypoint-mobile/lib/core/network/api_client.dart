import 'package:dio/dio.dart';
import '../../app/environment.dart';

abstract interface class TokenSource {
  Future<String?> idToken();
}

abstract interface class RefreshableTokenSource implements TokenSource {
  Future<String?> refreshIdToken();
  String? get currentUserId;
}

class ApiClient {
  ApiClient(AppConfig config, TokenSource tokens)
    : dio = Dio(
        BaseOptions(
          baseUrl: config.apiBaseUrl.toString(),
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
          headers: {'Accept': 'application/json'},
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final expectedUser =
              options.extra['expectedUserId'] ??
              (tokens is RefreshableTokenSource ? tokens.currentUserId : null);
          options.extra['expectedUserId'] = expectedUser;
          final token = await tokens.idToken();
          if (token == null ||
              (tokens is RefreshableTokenSource &&
                  expectedUser != tokens.currentUserId)) {
            handler.reject(
              DioException(
                requestOptions: options,
                response: Response(
                  requestOptions: options,
                  statusCode: 401,
                  data: {
                    'error': {
                      'code': 'identity_changed',
                      'message':
                          'Sign in as the original account to sync saved work.',
                    },
                  },
                ),
                type: DioExceptionType.cancel,
                error: 'Sign in before requesting protected data.',
              ),
            );
            return;
          }
          options.headers['Authorization'] = 'Bearer $token';
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              error.type != DioExceptionType.cancel &&
              error.requestOptions.extra['refreshed'] != true &&
              tokens is RefreshableTokenSource) {
            try {
              await tokens.refreshIdToken();
              error.requestOptions.extra['refreshed'] = true;
              final response = await dio.fetch<dynamic>(error.requestOptions);
              handler.resolve(response);
              return;
            } catch (_) {
              /* Preserve authentication failure for caller. */
            }
          }
          handler.next(error);
        },
      ),
    );
  }
  final Dio dio;
}
