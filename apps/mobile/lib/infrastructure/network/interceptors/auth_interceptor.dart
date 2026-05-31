import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      options.headers['Authorization'] = 'Bearer ${session.accessToken}';
    }
    options.headers['apikey'] = Supabase.instance.client.supabaseKey;
    super.onRequest(options, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      try {
        await Supabase.instance.client.auth.refreshSession();
        final session = Supabase.instance.client.auth.currentSession;
        if (session != null) {
          err.requestOptions.headers['Authorization'] =
              'Bearer ${session.accessToken}';
          final retry = Dio();
          final response = await retry.fetch(err.requestOptions);
          return handler.resolve(response);
        }
      } catch (_) {
        // Refresh failed — propagate; router redirects to login
      }
    }
    super.onError(err, handler);
  }
}
