import 'package:dio/dio.dart';

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    assert(() {
      // ignore: avoid_print
      print('[HTTP] --> ${options.method} ${options.path}');
      return true;
    }());
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    assert(() {
      // ignore: avoid_print
      print('[HTTP] <-- ${response.statusCode} ${response.requestOptions.path}');
      return true;
    }());
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    assert(() {
      // ignore: avoid_print
      print('[HTTP] ERR ${err.requestOptions.path}: ${err.message}');
      return true;
    }());
    super.onError(err, handler);
  }
}
