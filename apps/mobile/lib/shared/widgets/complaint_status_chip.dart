import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

class ComplaintStatusChip extends StatelessWidget {
  const ComplaintStatusChip({super.key, required this.status});

  final String status;

  static const _config = {
    'open': (
      bg: AppColors.statusOpenBg,
      fg: AppColors.statusOpen,
      label: 'Open'
    ),
    'assigned': (
      bg: AppColors.statusAssignedBg,
      fg: AppColors.statusAssigned,
      label: 'Assigned'
    ),
    'in_progress': (
      bg: AppColors.statusInProgressBg,
      fg: AppColors.statusInProgress,
      label: 'In Progress'
    ),
    'closed': (
      bg: AppColors.statusClosedBg,
      fg: AppColors.statusClosed,
      label: 'Closed'
    ),
    'rejected': (
      bg: AppColors.statusRejectedBg,
      fg: AppColors.statusRejected,
      label: 'Rejected'
    ),
  };

  @override
  Widget build(BuildContext context) {
    final cfg = _config[status] ??
        (bg: AppColors.surfaceVariant, fg: AppColors.textSecondary, label: status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: cfg.bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: cfg.fg,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            cfg.label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: cfg.fg,
            ),
          ),
        ],
      ),
    );
  }
}
