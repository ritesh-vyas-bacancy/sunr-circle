import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../constants/route_constants.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/call_centre/presentation/screens/cc_dashboard_screen.dart';
import '../../features/call_centre/presentation/screens/create_complaint_screen.dart';
import '../../features/call_centre/presentation/screens/complaint_history_screen.dart';
import '../../features/call_centre/presentation/screens/search_complaint_screen.dart';
import '../../features/call_centre/presentation/screens/complaint_detail_screen.dart';
import '../../features/line_man/presentation/screens/lm_dashboard_screen.dart';
import '../../features/line_man/presentation/screens/open_complaints_screen.dart';
import '../../features/line_man/presentation/screens/assigned_complaints_screen.dart';
import '../../features/line_man/presentation/screens/update_status_screen.dart';
import '../../features/top_management/presentation/screens/tm_dashboard_screen.dart';
import '../../features/top_management/presentation/screens/statistics_screen.dart';
import '../../features/top_management/presentation/screens/reports_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/settings/presentation/screens/profile_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

String _roleHome(String? role) {
  switch (role) {
    case 'call_centre':
      return RouteConstants.ccDashboard;
    case 'line_man':
      return RouteConstants.lmDashboard;
    case 'top_management':
      return RouteConstants.tmDashboard;
    default:
      return RouteConstants.login;
  }
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final supabase = Supabase.instance.client;

  return GoRouter(
    initialLocation: RouteConstants.login,
    redirect: (context, state) {
      final session = supabase.auth.currentSession;
      final isLoggedIn = session != null;
      final location = state.matchedLocation;
      final isAuthRoute = location == RouteConstants.login ||
          location == RouteConstants.forgotPassword;

      if (!isLoggedIn && !isAuthRoute) return RouteConstants.login;
      if (isLoggedIn && isAuthRoute) {
        final role =
            supabase.auth.currentUser?.userMetadata?['role'] as String?;
        return _roleHome(role);
      }
      return null;
    },
    routes: [
      GoRoute(
        path: RouteConstants.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteConstants.forgotPassword,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      // Call Centre
      GoRoute(
        path: RouteConstants.ccDashboard,
        builder: (context, state) => const CcDashboardScreen(),
      ),
      GoRoute(
        path: RouteConstants.ccCreateComplaint,
        builder: (context, state) => const CreateComplaintScreen(),
      ),
      GoRoute(
        path: RouteConstants.ccHistory,
        builder: (context, state) => const ComplaintHistoryScreen(),
      ),
      GoRoute(
        path: RouteConstants.ccSearch,
        builder: (context, state) => const SearchComplaintScreen(),
      ),
      GoRoute(
        path: '/cc/complaints/:id',
        builder: (context, state) => ComplaintDetailScreen(
          complaintId: state.pathParameters['id']!,
        ),
      ),
      // Line Man
      GoRoute(
        path: RouteConstants.lmDashboard,
        builder: (context, state) => const LmDashboardScreen(),
      ),
      GoRoute(
        path: RouteConstants.lmOpenComplaints,
        builder: (context, state) => const OpenComplaintsScreen(),
      ),
      GoRoute(
        path: RouteConstants.lmAssigned,
        builder: (context, state) => const AssignedComplaintsScreen(),
      ),
      GoRoute(
        path: '/lm/complaints/:id/update',
        builder: (context, state) =>
            UpdateStatusScreen(complaintId: state.pathParameters['id']!),
      ),
      // Top Management
      GoRoute(
        path: RouteConstants.tmDashboard,
        builder: (context, state) => const TmDashboardScreen(),
      ),
      GoRoute(
        path: RouteConstants.tmStatistics,
        builder: (context, state) => const StatisticsScreen(),
      ),
      GoRoute(
        path: RouteConstants.tmReports,
        builder: (context, state) => const ReportsScreen(),
      ),
      // Settings
      GoRoute(
        path: RouteConstants.settings,
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: RouteConstants.profile,
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});
