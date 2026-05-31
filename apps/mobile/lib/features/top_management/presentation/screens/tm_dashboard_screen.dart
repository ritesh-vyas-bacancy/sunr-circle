import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/constants/route_constants.dart';
import '../../../../auth/application/auth_notifier.dart';
import '../../domain/usecases/get_dashboard_stats_usecase.dart';
import '../widgets/stat_card.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/error_view.dart';

class TmDashboardScreen extends ConsumerWidget {
  const TmDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authNotifierProvider).session;
    final orgId = session?.organizationId ?? '';

    return AppScaffold(
      title: context.tr('top_management.dashboard.title'),
      body: FutureBuilder<DashboardStats>(
        future: GetDashboardStatsUseCase().call(orgId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ErrorView(message: snapshot.error.toString());
          }
          final stats = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async {
              // Rebuild future
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: [
                    StatCard(
                      title: context.tr('top_management.dashboard.total'),
                      count: stats.total,
                      color: AppColors.primary,
                      icon: Icons.list_alt_outlined,
                    ),
                    StatCard(
                      title: context.tr('top_management.dashboard.open'),
                      count: stats.open,
                      color: AppColors.statusOpen,
                      icon: Icons.inbox_outlined,
                    ),
                    StatCard(
                      title: 'Assigned',
                      count: stats.assigned,
                      color: AppColors.statusAssigned,
                      icon: Icons.person_outline,
                    ),
                    StatCard(
                      title: context.tr('top_management.dashboard.in_progress'),
                      count: stats.inProgress,
                      color: AppColors.statusInProgress,
                      icon: Icons.construction_outlined,
                    ),
                    StatCard(
                      title: context.tr('top_management.dashboard.closed_today'),
                      count: stats.closedToday,
                      color: AppColors.statusClosed,
                      icon: Icons.check_circle_outline,
                    ),
                    StatCard(
                      title: 'Rejected',
                      count: stats.rejected,
                      color: AppColors.statusRejected,
                      icon: Icons.cancel_outlined,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            context.push(RouteConstants.tmStatistics),
                        icon: const Icon(Icons.bar_chart_outlined, size: 18),
                        label: Text(context.tr('nav.statistics'),
                            style: const TextStyle(fontSize: 13)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            context.push(RouteConstants.tmReports),
                        icon: const Icon(Icons.description_outlined, size: 18),
                        label: Text(context.tr('nav.reports'),
                            style: const TextStyle(fontSize: 13)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          if (i == 1) context.push(RouteConstants.tmStatistics);
          if (i == 2) context.push(RouteConstants.tmReports);
          if (i == 3) context.push(RouteConstants.settings);
        },
        items: [
          BottomNavigationBarItem(
              icon: const Icon(Icons.dashboard_outlined),
              label: context.tr('nav.dashboard')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.bar_chart_outlined),
              label: context.tr('nav.statistics')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.description_outlined),
              label: context.tr('nav.reports')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.settings_outlined),
              label: context.tr('nav.settings')),
        ],
      ),
    );
  }
}
