import '../entities/user_session.dart';

abstract class AuthRepository {
  Future<UserSession> login(String email, String password);
  Future<void> logout();
  Future<void> forgotPassword(String email);
  UserSession? get currentSession;
}
