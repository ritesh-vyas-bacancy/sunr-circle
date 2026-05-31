class AppConstants {
  const AppConstants._();

  static const String orgName = 'SUNR Circle';
  static const String orgShortName = 'SUNR';
  static const String appName = 'SUNR Circle';

  // Secure storage keys
  static const String keyUserRole = 'user_role';
  static const String keyUserId = 'user_id';
  static const String keyOrgId = 'org_id';
  static const String keySubDivisionId = 'sub_division_id';
  static const String keyUserFullName = 'user_full_name';
  static const String keyLocale = 'locale';

  // Pagination
  static const int defaultPageSize = 20;

  // Session
  static const int sessionTimeoutHours = 8;

  // Roles
  static const String roleCallCentre = 'call_centre';
  static const String roleLineman = 'line_man';
  static const String roleTopManagement = 'top_management';
  static const String roleBackOffice = 'back_office';

  // Complaint statuses
  static const String statusOpen = 'open';
  static const String statusAssigned = 'assigned';
  static const String statusInProgress = 'in_progress';
  static const String statusClosed = 'closed';
  static const String statusRejected = 'rejected';
}
