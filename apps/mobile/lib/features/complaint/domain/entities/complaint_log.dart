class ComplaintLog {
  const ComplaintLog({
    required this.id,
    required this.complaintId,
    this.oldStatus,
    required this.newStatus,
    this.remarks,
    required this.changedBy,
    this.changedByName,
    this.changedByRole,
    required this.loggedAt,
  });

  final String id;
  final String complaintId;
  final String? oldStatus;
  final String newStatus;
  final String? remarks;
  final String changedBy;
  final String? changedByName;
  final String? changedByRole;
  final DateTime loggedAt;

  String get transitionLabel {
    if (oldStatus == null) return 'Complaint Created';
    return '${_label(oldStatus!)} → ${_label(newStatus)}';
  }

  String _label(String s) {
    const labels = {
      'open': 'Open',
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'closed': 'Closed',
      'rejected': 'Rejected',
    };
    return labels[s] ?? s;
  }
}
