import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/auth_repository_impl.dart';
import '../domain/entities/user_session.dart';
import '../domain/repositories/auth_repository.dart';

class AuthState {
  const AuthState({
    this.session,
    this.isLoading = false,
    this.error,
  });

  final UserSession? session;
  final bool isLoading;
  final String? error;

  bool get isAuthenticated => session != null;

  AuthState copyWith({
    UserSession? session,
    bool? isLoading,
    String? error,
    bool clearSession = false,
    bool clearError = false,
  }) {
    return AuthState(
      session: clearSession ? null : (session ?? this.session),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repository) : super(const AuthState()) {
    _init();
  }

  final AuthRepository _repository;

  void _init() {
    final existing = _repository.currentSession;
    if (existing != null) {
      state = AuthState(session: existing);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final session = await _repository.login(email, password);
      state = AuthState(session: session);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState();
  }

  Future<void> forgotPassword(String email) async {
    await _repository.forgotPassword(email);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});
