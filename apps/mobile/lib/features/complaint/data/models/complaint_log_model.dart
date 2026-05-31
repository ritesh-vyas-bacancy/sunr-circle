import '../../domain/entities/complaint_log.dart';

class ComplaintLogModel extends ComplaintLog {
  const ComplaintLogModel({
    required super.id,
    required super.complaintId,
    super.oldStatus,
    required super.newStatus,
    super.remarks,
    required super.changedBy,
    super.changedByName,
    super.changedByRole,
    required super.loggedAt,
  });

  factory ComplaintLogModel.fromJson(Map<String, dynamic> json) {
    final user = json['changed_by_user'] as Map<String, dynamic>?;
    return ComplaintLogModel(
      id: json['id'] as String,
      complaintId: json['complaint_id'] as String,
      oldStatus: json['old_status'] as String?,
      newStatus: json['new_status'] as String,
      remarks: json['remarks'] as String?,
      changedBy: json['changed_by'] as String,
      changedByName: user?['full_name'] as String?,
      changedByRole: user?['role'] as String?,
      loggedAt: DateTime.parse(json['logged_at'] as String),
    );
  }
}
