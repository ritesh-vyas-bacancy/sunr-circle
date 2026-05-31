import '../../../../../../core/constants/app_constants.dart';

class UserSession {
  const UserSession({
    required this.id,
    required this.email,
    required this.role,
    required this.organizationId,
    this.subDivisionId,
    required this.fullName,
  });

  final String id;
  final String email;
  final String role;
  final String organizationId;
  final String? subDivisionId;
  final String fullName;

  bool get isCallCentre => role == AppConstants.roleCallCentre;
  bool get isLineman => role == AppConstants.roleLineman;
  bool get isTopManagement => role == AppConstants.roleTopManagement;

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return fullName.isNotEmpty ? fullName[0].toUpperCase() : 'U';
  }

  UserSession copyWith({
    String? id,
    String? email,
    String? role,
    String? organizationId,
    String? subDivisionId,
    String? fullName,
  }) {
    return UserSession(
      id: id ?? this.id,
      email: email ?? this.email,
      role: role ?? this.role,
      organizationId: organizationId ?? this.organizationId,
      subDivisionId: subDivisionId ?? this.subDivisionId,
      fullName: fullName ?? this.fullName,
    );
  }
}
