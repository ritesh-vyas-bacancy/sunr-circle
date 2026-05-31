import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/extensions/datetime_ext.dart';
import '../../../../complaint/application/complaint_detail_notifier.dart';
import '../../../../complaint/domain/entities/complaint.dart';
import '../../../../../shared/widgets/complaint_status_chip.dart';

class ComplaintActionCard extends ConsumerWidget {
  const ComplaintActionCard({
    super.key,
    required this.complaint,
    this.onAccept,
    this.onUpdateStatus,
    required this.onViewDetail,
  });

  final Complaint complaint;
  final VoidCallback? onAccept;
  final VoidCallback? onUpdateStatus;
  final VoidCallback onViewDetail;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
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
            Text(complaint.consumerName,
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600)),
            Text(complaint.natureOfComplaint,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary)),
            const SizedBox(height: 4),
            Text(complaint.createdAt.formattedDateTime,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textDisabled)),
            const Divider(height: 16),
            Row(
              children: [
                TextButton(
                  onPressed: onViewDetail,
                  child: const Text('View Details'),
                ),
                const Spacer(),
                if (complaint.isOpen && onAccept != null)
                  ElevatedButton(
                    onPressed: onAccept,
                    style: ElevatedButton.styleFrom(
                        minimumSize: const Size(100, 36)),
                    child: const Text('Accept'),
                  )
                else if (complaint.isAssigned && onUpdateStatus != null)
                  ElevatedButton(
                    onPressed: onUpdateStatus,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      minimumSize: const Size(110, 36),
                    ),
                    child: const Text('Start Work'),
                  )
                else if (complaint.isInProgress && onUpdateStatus != null)
                  ElevatedButton(
                    onPressed: onUpdateStatus,
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        minimumSize: const Size(100, 36)),
                    child: const Text('Close'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
