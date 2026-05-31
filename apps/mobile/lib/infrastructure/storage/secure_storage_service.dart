import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/constants/app_constants.dart';

class SecureStorageService {
  const SecureStorageService(this._storage);
  final FlutterSecureStorage _storage;

  Future<void> saveUserRole(String role) =>
      _storage.write(key: AppConstants.keyUserRole, value: role);
  Future<String?> getUserRole() =>
      _storage.read(key: AppConstants.keyUserRole);

  Future<void> saveUserId(String id) =>
      _storage.write(key: AppConstants.keyUserId, value: id);
  Future<String?> getUserId() => _storage.read(key: AppConstants.keyUserId);

  Future<void> saveOrgId(String id) =>
      _storage.write(key: AppConstants.keyOrgId, value: id);
  Future<String?> getOrgId() => _storage.read(key: AppConstants.keyOrgId);

  Future<void> saveSubDivisionId(String? id) =>
      _storage.write(key: AppConstants.keySubDivisionId, value: id);
  Future<String?> getSubDivisionId() =>
      _storage.read(key: AppConstants.keySubDivisionId);

  Future<void> saveFullName(String name) =>
      _storage.write(key: AppConstants.keyUserFullName, value: name);
  Future<String?> getFullName() =>
      _storage.read(key: AppConstants.keyUserFullName);

  Future<void> saveLocale(String locale) =>
      _storage.write(key: AppConstants.keyLocale, value: locale);
  Future<String?> getLocale() => _storage.read(key: AppConstants.keyLocale);

  Future<void> clearSession() async {
    await Future.wait([
      _storage.delete(key: AppConstants.keyUserRole),
      _storage.delete(key: AppConstants.keyUserId),
      _storage.delete(key: AppConstants.keyOrgId),
      _storage.delete(key: AppConstants.keySubDivisionId),
      _storage.delete(key: AppConstants.keyUserFullName),
    ]);
  }
}

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  const storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
  return SecureStorageService(storage);
});
