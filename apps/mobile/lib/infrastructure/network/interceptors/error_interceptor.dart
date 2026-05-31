import 'package:dio/dio.dart';

import '../../../core/error/app_exception.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final AppException mapped;
    switch (err.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        mapped = const NetworkException();
      case DioExceptionType.badResponse:
        final status = err.response?.statusCode ?? 0;
        if (status == 401 || status == 403) {
          mapped = const AuthException();
        } else if (status == 404) {
          mapped = const NotFoundException();
        } else {
          mapped = ServerException.fromCode(status);
        }
      default:
        mapped = const UnknownException();
    }
    handler.reject(DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      error: mapped,
      type: err.type,
    ));
  }
}
