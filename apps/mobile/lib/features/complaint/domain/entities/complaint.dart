class Complaint {
  const Complaint({
    required this.id,
    required this.organizationId,
    required this.subDivisionId,
    required this.rawComplaintNumber,
    this.complaintNumber,
    required this.consumerName,
    required this.consumerMobile,
    required this.natureOfComplaint,
    this.complaintRemarks,
    required this.status,
    required this.createdBy,
    this.assignedTo,
    this.attendRemarks,
    required this.createdAt,
    this.assignedAt,
    this.inProgressAt,
    this.closedAt,
    this.subDivisionName,
    this.createdByName,
    this.assignedToName,
  });

  final String id;
  final String organizationId;
  final String subDivisionId;
  final String rawComplaintNumber;
  final String? complaintNumber;
  final String consumerName;
  final String consumerMobile;
  final String natureOfComplaint;
  final String? complaintRemarks;
  final String status;
  final String createdBy;
  final String? assignedTo;
  final String? attendRemarks;
  final DateTime createdAt;
  final DateTime? assignedAt;
  final DateTime? inProgressAt;
  final DateTime? closedAt;
  final String? subDivisionName;
  final String? createdByName;
  final String? assignedToName;

  String get displayNumber => complaintNumber ?? rawComplaintNumber;
  bool get isClosed => status == 'closed' || status == 'rejected';
  bool get isOpen => status == 'open';
  bool get isAssigned => status == 'assigned';
  bool get isInProgress => status == 'in_progress';

  Complaint copyWith({
    String? status,
    String? assignedTo,
    String? assignedToName,
    String? attendRemarks,
    DateTime? assignedAt,
    DateTime? inProgressAt,
    DateTime? closedAt,
  }) {
    return Complaint(
      id: id,
      organizationId: organizationId,
      subDivisionId: subDivisionId,
      rawComplaintNumber: rawComplaintNumber,
      complaintNumber: complaintNumber,
      consumerName: consumerName,
      consumerMobile: consumerMobile,
      natureOfComplaint: natureOfComplaint,
      complaintRemarks: complaintRemarks,
      status: status ?? this.status,
      createdBy: createdBy,
      assignedTo: assignedTo ?? this.assignedTo,
      attendRemarks: attendRemarks ?? this.attendRemarks,
      createdAt: createdAt,
      assignedAt: assignedAt ?? this.assignedAt,
      inProgressAt: inProgressAt ?? this.inProgressAt,
      closedAt: closedAt ?? this.closedAt,
      subDivisionName: subDivisionName,
      createdByName: createdByName,
      assignedToName: assignedToName ?? this.assignedToName,
    );
  }
}
