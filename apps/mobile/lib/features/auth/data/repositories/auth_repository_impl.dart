import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../core/error/app_exception.dart';
import '../../domain/entities/user_session.dart';
import '../../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl() : _supabase = Supabase.instance.client;

  final SupabaseClient _supabase;

  @override
  Future<UserSession> login(String email, String password) async {
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );

      final user = response.user;
      if (user == null) throw const AuthException();

      // Fetch user profile from public.users
      final profile = await _supabase
          .from('users')
          .select('role, organization_id, sub_division_id, full_name, is_active')
          .eq('id', user.id)
          .single();

      if (profile['is_active'] == false) {
        await _supabase.auth.signOut();
        throw const AuthException('Your account has been deactivated. Contact your administrator.');
      }

      return UserSession(
        id: user.id,
        email: user.email ?? email,
        role: profile['role'] as String,
        organizationId: profile['organization_id'] as String,
        subDivisionId: profile['sub_division_id'] as String?,
        fullName: profile['full_name'] as String,
      );
    } on AuthException {
      rethrow;
    } on AuthApiException catch (e) {
      throw AuthException(e.message);
    } catch (e) {
      throw AuthException(e.toString());
    }
  }

  @override
  Future<void> logout() async {
    await _supabase.auth.signOut();
  }

  @override
  Future<void> forgotPassword(String email) async {
    await _supabase.auth.resetPasswordForEmail(email.trim());
  }

  @override
  UserSession? get currentSession {
    final session = _supabase.auth.currentSession;
    final user = _supabase.auth.currentUser;
    if (session == null || user == null) return null;

    final meta = user.userMetadata;
    return UserSession(
      id: user.id,
      email: user.email ?? '',
      role: meta?['role'] as String? ?? '',
      organizationId: meta?['organization_id'] as String? ?? '',
      subDivisionId: meta?['sub_division_id'] as String?,
      fullName: meta?['full_name'] as String? ?? '',
    );
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepositoryImpl(),
);
