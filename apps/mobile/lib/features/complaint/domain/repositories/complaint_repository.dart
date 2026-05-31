import '../entities/complaint.dart';
import '../entities/complaint_log.dart';

abstract class ComplaintRepository {
  Future<List<Complaint>> getComplaints({
    String? status,
    String? search,
    int page = 1,
    int pageSize = 20,
  });

  Future<Complaint> getComplaintById(String id);

  Future<List<ComplaintLog>> getComplaintLogs(String complaintId);

  Future<Complaint> createComplaint({
    required String subDivisionId,
    required String rawComplaintNumber,
    required String consumerName,
    required String consumerMobile,
    required String natureOfComplaint,
    String? complaintRemarks,
  });

  Future<Complaint> acceptComplaint(String id);

  Future<Complaint> updateComplaintStatus(
    String id,
    String newStatus, {
    String? attendRemarks,
  });
}
