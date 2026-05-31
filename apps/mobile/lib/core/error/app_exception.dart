sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  const NetworkException([super.message = 'No internet connection']);
}

class AuthException extends AppException {
  const AuthException([super.message = 'Authentication failed']);
}

class ServerException extends AppException {
  const ServerException([super.message = 'Server error. Please try again.']);

  factory ServerException.fromCode(int statusCode) =>
      ServerException('Server returned $statusCode. Please try again.');
}

class NotFoundException extends AppException {
  const NotFoundException([super.message = 'Record not found']);
}

class ValidationException extends AppException {
  const ValidationException([super.message = 'Invalid input']);
}

class PermissionException extends AppException {
  const PermissionException(
      [super.message = 'You do not have permission to perform this action']);
}

class UnknownException extends AppException {
  const UnknownException([super.message = 'An unexpected error occurred']);
}
