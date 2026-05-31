import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/constants/route_constants.dart';
import '../../../../auth/application/auth_notifier.dart';
import '../../../../complaint/application/complaint_list_notifier.dart';
import '../../widgets/complaint_action_card.dart';
import '../../../../../shared/widgets/app_scaffold.dart';

class LmDashboardScreen extends ConsumerWidget {
  const LmDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authNotifierProvider).session;
    final name = session?.fullName ?? '';
    final assignedState = ref.watch(assignedComplaintsProvider);

    return AppScaffold(
      title: context.tr('line_man.dashboard.title'),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(assignedComplaintsProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Welcome, $name',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        context.push(RouteConstants.lmOpenComplaints),
                    icon: const Icon(Icons.inbox_outlined, size: 18),
                    label: Text(context.tr('nav.open_complaints'),
                        style: const TextStyle(fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => context.push(RouteConstants.lmAssigned),
                    icon: const Icon(Icons.assignment_outlined, size: 18),
                    label: Text(context.tr('nav.assigned_complaints'),
                        style: const TextStyle(fontSize: 13)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text('My Assigned Complaints',
                style:
                    TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            if (assignedState.isLoading && assignedState.complaints.isEmpty)
              const Center(
                  child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator()))
            else if (assignedState.complaints.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text('No assigned complaints',
                    style: TextStyle(color: AppColors.textSecondary)),
              )
            else
              ...assignedState.complaints.take(5).map(
                    (c) => ComplaintActionCard(
                      complaint: c,
                      onViewDetail: () =>
                          context.push('/lm/complaints/${c.id}/update'),
                      onUpdateStatus: () =>
                          context.push('/lm/complaints/${c.id}/update'),
                    ),
                  ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          if (i == 1) context.push(RouteConstants.lmOpenComplaints);
          if (i == 2) context.push(RouteConstants.lmAssigned);
          if (i == 3) context.push(RouteConstants.settings);
        },
        items: [
          BottomNavigationBarItem(
              icon: const Icon(Icons.dashboard_outlined),
              label: context.tr('nav.dashboard')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.inbox_outlined),
              label: context.tr('nav.open_complaints')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.assignment_outlined),
              label: context.tr('nav.assigned_complaints')),
          BottomNavigationBarItem(
              icon: const Icon(Icons.settings_outlined),
              label: context.tr('nav.settings')),
        ],
      ),
    );
  }
}
