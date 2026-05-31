import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../complaint/application/complaint_list_notifier.dart';
import '../../widgets/complaint_list_tile.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/error_view.dart';
import '../../../../../shared/widgets/empty_state_view.dart';

class ComplaintHistoryScreen extends ConsumerWidget {
  const ComplaintHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(complaintListProvider);

    return AppScaffold(
      title: context.tr('nav.history'),
      showBack: true,
      body: RefreshIndicator(
        onRefresh: () => ref.read(complaintListProvider.notifier).refresh(),
        child: state.isLoading && state.complaints.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.error != null
                ? ErrorView(
                    message: state.error!,
                    onRetry: () =>
                        ref.read(complaintListProvider.notifier).refresh(),
                  )
                : state.complaints.isEmpty
                    ? EmptyStateView(
                        icon: Icons.inbox_outlined,
                        title: context.tr('complaint.messages.no_history'),
                      )
                    : ListView.builder(
                        itemCount: state.complaints.length,
                        itemBuilder: (context, i) => ComplaintListTile(
                          complaint: state.complaints[i],
                          onTap: () => context
                              .push('/cc/complaints/${state.complaints[i].id}'),
                        ),
                      ),
      ),
    );
  }
}
