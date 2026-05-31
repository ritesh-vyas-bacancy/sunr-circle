import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/constants/route_constants.dart';
import '../../../../auth/application/auth_notifier.dart';
import '../../../../complaint/application/complaint_list_notifier.dart';
import '../../widgets/complaint_list_tile.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/error_view.dart';

class CcDashboardScreen extends ConsumerWidget {
  const CcDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final session = authState.session;
    final name = session?.fullName ?? '';
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good Morning'
        : hour < 17
            ? 'Good Afternoon'
            : 'Good Evening';

    final complaintState = ref.watch(complaintListProvider);

    return AppScaffold(
      title: context.tr('call_centre.dashboard.title'),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(complaintListProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Greeting
            Text(
              '$greeting, $name',
              style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),

            // Quick actions
            _QuickActions(),
            const SizedBox(height: 20),

            // Recent complaints
            const Text(
              'Recent Complaints',
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),

            if (complaintState.isLoading && complaintState.complaints.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (complaintState.error != null)
              ErrorView(
                message: complaintState.error!,
                onRetry: () =>
                    ref.read(complaintListProvider.notifier).refresh(),
              )
            else if (complaintState.complaints.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No complaints yet',
                      style: TextStyle(color: AppColors.textSecondary)),
                ),
              )
            else
              ...complaintState.complaints.take(5).map(
                    (c) => ComplaintListTile(
                      complaint: c,
                      onTap: () => context.push('/cc/complaints/${c.id}'),
                    ),
                  ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          if (i == 1) context.push(RouteConstants.ccHistory);
          if (i == 2) context.push(RouteConstants.ccSearch);
          if (i == 3) context.push(RouteConstants.settings);
        },
        items: [
          BottomNavigationBarItem(
              icon: const Icon(Icons.dashboard_outlined),
              label: context.tr('nav.dashboard')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.history_outlined),
              label: context.tr('nav.history')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.search_outlined),
              label: context.tr('nav.search')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.settings_outlined),
              label: context.tr('nav.settings')),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(RouteConstants.ccCreateComplaint),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text(context.tr('complaint.actions.create'),
            style: const TextStyle(color: Colors.white)),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () => context.push(RouteConstants.ccCreateComplaint),
            icon: const Icon(Icons.add_circle_outline),
            label: Text(context.tr('call_centre.dashboard.create_new')),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => context.push(RouteConstants.ccHistory),
                icon: const Icon(Icons.history_outlined, size: 18),
                label: Text(context.tr('nav.history'),
                    style: const TextStyle(fontSize: 13)),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => context.push(RouteConstants.ccSearch),
                icon: const Icon(Icons.search_outlined, size: 18),
                label: Text(context.tr('nav.search'),
                    style: const TextStyle(fontSize: 13)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
