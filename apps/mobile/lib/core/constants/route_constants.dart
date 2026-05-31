class RouteConstants {
  const RouteConstants._();

  // Auth
  static const String login = '/login';
  static const String forgotPassword = '/forgot-password';

  // Call Centre
  static const String ccDashboard = '/cc/dashboard';
  static const String ccCreateComplaint = '/cc/complaints/new';
  static const String ccHistory = '/cc/complaints/history';
  static const String ccSearch = '/cc/complaints/search';

  // Line Man
  static const String lmDashboard = '/lm/dashboard';
  static const String lmOpenComplaints = '/lm/complaints/open';
  static const String lmAssigned = '/lm/complaints/assigned';

  // Top Management
  static const String tmDashboard = '/tm/dashboard';
  static const String tmStatistics = '/tm/statistics';
  static const String tmReports = '/tm/reports';

  // Settings (shared)
  static const String settings = '/settings';
  static const String profile = '/settings/profile';
}
