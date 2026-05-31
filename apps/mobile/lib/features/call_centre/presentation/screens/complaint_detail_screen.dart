import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/extensions/datetime_ext.dart';
import '../../../../complaint/application/complaint_detail_notifier.dart';
import '../../../../complaint/domain/entities/complaint_log.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/complaint_status_chip.dart';
import '../../../../../shared/widgets/error_view.dart';

class ComplaintDetailScreen extends ConsumerWidget {
  const ComplaintDetailScreen({super.key, required this.complaintId});

  final String complaintId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(complaintDetailProvider(complaintId));

    return AppScaffold(
      title: state.complaint?.displayNumber ?? 'Complaint',
      showBack: true,
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? ErrorView(message: state.error!)
              : state.complaint == null
                  ? ErrorView(message: 'Complaint not found')
                  : _Body(state: state),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.state});
  final ComplaintDetailState state;

  @override
  Widget build(BuildContext context) {
    final c = state.complaint!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status
        Row(
          children: [
            ComplaintStatusChip(status: c.status),
            const Spacer(),
            Text(c.createdAt.formattedDateTime,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
        const SizedBox(height: 16),

        // Consumer
        _Card(
          title: 'Consumer Details',
          children: [
            _Row('Name', c.consumerName),
            _Row('Mobile', c.consumerMobile),
          ],
        ),
        const SizedBox(height: 12),

        // Complaint
        _Card(
          title: 'Complaint Details',
          children: [
            _Row('Complaint #', c.displayNumber),
            _Row('Nature', c.natureOfComplaint),
            if (c.complaintRemarks != null)
              _Row('Remarks', c.complaintRemarks!),
          ],
        ),
        const SizedBox(height: 12),

        // Assignment
        _Card(
          title: 'Assignment',
          children: [
            _Row('Created By', c.createdByName ?? '—'),
            _Row('Assigned To', c.assignedToName ?? 'Not Assigned'),
            if (c.attendRemarks != null)
              _Row('Attend Remarks', c.attendRemarks!),
          ],
        ),
        const SizedBox(height: 12),

        // Timeline
        if (state.logs.isNotEmpty) ...[
          const Text('Activity Timeline',
              style:
                  TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ...state.logs
              .map((log) => _TimelineItem(log: log))
              .toList(),
        ],
      ],
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary)),
            const Divider(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  const _TimelineItem({required this.log});
  final ComplaintLog log;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: const BoxDecoration(
              color: AppColors.secondary,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.circle, size: 8, color: AppColors.primary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(log.transitionLabel,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
                if (log.remarks != null)
                  Text(log.remarks!,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                Text(
                  '${log.changedByName ?? 'System'} · ${log.loggedAt.formattedDateTime}',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textDisabled),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
