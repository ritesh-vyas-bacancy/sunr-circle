import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/constants/app_constants.dart';
import '../../../../complaint/application/complaint_detail_notifier.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/complaint_status_chip.dart';
import '../../../../../shared/widgets/error_view.dart';

class UpdateStatusScreen extends ConsumerStatefulWidget {
  const UpdateStatusScreen({super.key, required this.complaintId});

  final String complaintId;

  @override
  ConsumerState<UpdateStatusScreen> createState() => _UpdateStatusScreenState();
}

class _UpdateStatusScreenState extends ConsumerState<UpdateStatusScreen> {
  String? _selectedStatus;
  final _remarksCtrl = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  static const _transitions = {
    'assigned': ['in_progress', 'rejected'],
    'in_progress': ['closed', 'rejected'],
  };

  static const _statusLabels = {
    'in_progress': 'Start Work (In Progress)',
    'closed': 'Mark as Closed',
    'rejected': 'Reject Complaint',
  };

  @override
  void dispose() {
    _remarksCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedStatus == null) {
      setState(() => _error = 'Please select a new status');
      return;
    }
    if (_selectedStatus == 'rejected' && _remarksCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Rejection reason is required');
      return;
    }
    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    final ok = await ref
        .read(complaintDetailProvider(widget.complaintId).notifier)
        .updateStatus(
          _selectedStatus!,
          remarks: _remarksCtrl.text.trim().isEmpty
              ? null
              : _remarksCtrl.text.trim(),
        );

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Status updated successfully')),
        );
        Navigator.of(context).pop();
      } else {
        setState(() => _error = ref
            .read(complaintDetailProvider(widget.complaintId))
            .updateError);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(complaintDetailProvider(widget.complaintId));
    final c = state.complaint;

    return AppScaffold(
      title: context.tr('complaint.actions.update_status'),
      showBack: true,
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : c == null
              ? ErrorView(message: state.error ?? 'Complaint not found')
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Complaint summary card
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(c.displayNumber,
                                  style: const TextStyle(
                                      fontFamily: 'monospace',
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.primary)),
                              const SizedBox(height: 4),
                              Text(c.consumerName,
                                  style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Text('Current: ',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary)),
                                  ComplaintStatusChip(status: c.status),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      const Text('Update To:',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 10),

                      // Status options
                      ...(_transitions[c.status] ?? []).map(
                        (status) => RadioListTile<String>(
                          value: status,
                          groupValue: _selectedStatus,
                          onChanged: (v) =>
                              setState(() => _selectedStatus = v),
                          title: Text(_statusLabels[status] ?? status),
                          activeColor: AppColors.primary,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),

                      if (_selectedStatus != null) ...[
                        const SizedBox(height: 14),
                        Text(
                          _selectedStatus == AppConstants.statusRejected
                              ? 'Rejection Reason *'
                              : 'Attend Remarks (optional)',
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _remarksCtrl,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            hintText: 'Enter remarks...',
                          ),
                        ),
                      ],

                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!,
                            style:
                                const TextStyle(color: AppColors.error)),
                      ],

                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed:
                              (_isSubmitting || state.isUpdating)
                                  ? null
                                  : _submit,
                          child: (_isSubmitting || state.isUpdating)
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white),
                                )
                              : Text(
                                  context.tr('complaint.actions.update_status')),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
