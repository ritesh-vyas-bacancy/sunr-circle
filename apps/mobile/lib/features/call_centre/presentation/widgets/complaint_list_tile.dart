import 'package:flutter/material.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/extensions/datetime_ext.dart';
import '../../../../complaint/domain/entities/complaint.dart';
import '../../../../complaint/presentation/widgets/complaint_status_chip.dart';

// Re-export from shared for convenience
export '../../../../complaint/presentation/widgets/complaint_status_chip.dart';

class ComplaintListTile extends StatelessWidget {
  const ComplaintListTile({
    super.key,
    required this.complaint,
    required this.onTap,
  });

  final Complaint complaint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      complaint.displayNumber,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  ComplaintStatusChip(status: complaint.status),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                complaint.consumerName,
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              Text(
                complaint.natureOfComplaint,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 6),
              Text(
                complaint.createdAt.formattedDateTime,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textDisabled),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
