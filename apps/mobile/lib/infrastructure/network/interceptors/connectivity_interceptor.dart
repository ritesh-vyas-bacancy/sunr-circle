import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';

import '../../../core/error/app_exception.dart';

class ConnectivityInterceptor extends Interceptor {
  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final result = await Connectivity().checkConnectivity();
    if (result.contains(ConnectivityResult.none)) {
      return handler.reject(
        DioException(
          requestOptions: options,
          error: const NetworkException(),
          type: DioExceptionType.connectionError,
        ),
      );
    }
    super.onRequest(options, handler);
  }
}
