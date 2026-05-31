import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../complaint/application/complaint_list_notifier.dart';
import '../../widgets/complaint_action_card.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/empty_state_view.dart';
import '../../../../../shared/widgets/error_view.dart';

class AssignedComplaintsScreen extends ConsumerWidget {
  const AssignedComplaintsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(assignedComplaintsProvider);

    return AppScaffold(
      title: context.tr('nav.assigned_complaints'),
      showBack: true,
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(assignedComplaintsProvider.notifier).refresh(),
        child: state.isLoading && state.complaints.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.error != null
                ? ErrorView(message: state.error!)
                : state.complaints.isEmpty
                    ? EmptyStateView(
                        icon: Icons.assignment_outlined,
                        title: context.tr('complaint.messages.no_assigned'),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.complaints.length,
                        itemBuilder: (context, i) {
                          final c = state.complaints[i];
                          return ComplaintActionCard(
                            complaint: c,
                            onViewDetail: () =>
                                context.push('/lm/complaints/${c.id}/update'),
                            onUpdateStatus: () =>
                                context.push('/lm/complaints/${c.id}/update'),
                          );
                        },
                      ),
      ),
    );
  }
}
