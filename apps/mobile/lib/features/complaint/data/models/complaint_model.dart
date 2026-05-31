import '../../domain/entities/complaint.dart';

class ComplaintModel extends Complaint {
  const ComplaintModel({
    required super.id,
    required super.organizationId,
    required super.subDivisionId,
    required super.rawComplaintNumber,
    super.complaintNumber,
    required super.consumerName,
    required super.consumerMobile,
    required super.natureOfComplaint,
    super.complaintRemarks,
    required super.status,
    required super.createdBy,
    super.assignedTo,
    super.attendRemarks,
    required super.createdAt,
    super.assignedAt,
    super.inProgressAt,
    super.closedAt,
    super.subDivisionName,
    super.createdByName,
    super.assignedToName,
  });

  factory ComplaintModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic v) =>
        v != null ? DateTime.parse(v as String) : null;

    final subDiv = json['sub_division'] as Map<String, dynamic>?;
    final createdByUser = json['created_by_user'] as Map<String, dynamic>?;
    final assignedToUser = json['assigned_to_user'] as Map<String, dynamic>?;

    return ComplaintModel(
      id: json['id'] as String,
      organizationId: json['organization_id'] as String,
      subDivisionId: json['sub_division_id'] as String,
      rawComplaintNumber: json['raw_complaint_number'] as String,
      complaintNumber: json['complaint_number'] as String?,
      consumerName: json['consumer_name'] as String,
      consumerMobile: json['consumer_mobile'] as String,
      natureOfComplaint: json['nature_of_complaint'] as String,
      complaintRemarks: json['complaint_remarks'] as String?,
      status: json['status'] as String,
      createdBy: json['created_by'] as String,
      assignedTo: json['assigned_to'] as String?,
      attendRemarks: json['attend_remarks'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      assignedAt: parseDate(json['assigned_at']),
      inProgressAt: parseDate(json['in_progress_at']),
      closedAt: parseDate(json['closed_at']),
      subDivisionName: subDiv?['name'] as String?,
      createdByName: createdByUser?['full_name'] as String?,
      assignedToName: assignedToUser?['full_name'] as String?,
    );
  }
}
