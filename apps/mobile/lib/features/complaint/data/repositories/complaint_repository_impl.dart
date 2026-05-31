import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../domain/entities/complaint.dart';
import '../../domain/entities/complaint_log.dart';
import '../../domain/repositories/complaint_repository.dart';
import '../models/complaint_log_model.dart';
import '../models/complaint_model.dart';

class ComplaintRepositoryImpl implements ComplaintRepository {
  ComplaintRepositoryImpl() : _db = Supabase.instance.client;

  final SupabaseClient _db;

  static const _select =
      '*, sub_division:sub_division_id(name), created_by_user:created_by(full_name), assigned_to_user:assigned_to(full_name)';

  @override
  Future<List<Complaint>> getComplaints({
    String? status,
    String? search,
    int page = 1,
    int pageSize = 20,
  }) async {
    var query = _db
        .from('complaints')
        .select(_select)
        .order('created_at', ascending: false)
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (status != null) query = query.eq('status', status) as dynamic;
    if (search != null && search.isNotEmpty) {
      query = query.or(
        'consumer_name.ilike.%$search%,raw_complaint_number.ilike.%$search%,consumer_mobile.ilike.%$search%',
      ) as dynamic;
    }

    final data = await query;
    return (data as List)
        .map((e) => ComplaintModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<Complaint> getComplaintById(String id) async {
    final data = await _db
        .from('complaints')
        .select(
          '*, sub_division:sub_division_id(name,code,parent:parent_id(name,code,parent:parent_id(name,code))), created_by_user:created_by(full_name,role), assigned_to_user:assigned_to(full_name,mobile_number)',
        )
        .eq('id', id)
        .single();
    return ComplaintModel.fromJson(data);
  }

  @override
  Future<List<ComplaintLog>> getComplaintLogs(String complaintId) async {
    final data = await _db
        .from('complaint_logs')
        .select('*, changed_by_user:changed_by(full_name,role)')
        .eq('complaint_id', complaintId)
        .order('logged_at', ascending: true);

    return (data as List)
        .map((e) => ComplaintLogModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<Complaint> createComplaint({
    required String subDivisionId,
    required String rawComplaintNumber,
    required String consumerName,
    required String consumerMobile,
    required String natureOfComplaint,
    String? complaintRemarks,
  }) async {
    final user = _db.auth.currentUser!;
    // Fetch org ID from profile
    final profile = await _db
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    final data = await _db
        .from('complaints')
        .insert({
          'organization_id': profile['organization_id'],
          'sub_division_id': subDivisionId,
          'raw_complaint_number': rawComplaintNumber.toUpperCase().trim(),
          'consumer_name': consumerName.trim(),
          'consumer_mobile': consumerMobile.trim(),
          'nature_of_complaint': natureOfComplaint.trim(),
          if (complaintRemarks != null && complaintRemarks.isNotEmpty)
            'complaint_remarks': complaintRemarks.trim(),
          'created_by': user.id,
          'status': 'open',
        })
        .select(_select)
        .single();

    return ComplaintModel.fromJson(data);
  }

  @override
  Future<Complaint> acceptComplaint(String id) async {
    final user = _db.auth.currentUser!;
    final now = DateTime.now().toIso8601String();
    final data = await _db
        .from('complaints')
        .update({
          'assigned_to': user.id,
          'status': 'assigned',
          'assigned_at': now,
        })
        .eq('id', id)
        .select(_select)
        .single();
    return ComplaintModel.fromJson(data);
  }

  @override
  Future<Complaint> updateComplaintStatus(
    String id,
    String newStatus, {
    String? attendRemarks,
  }) async {
    final now = DateTime.now().toIso8601String();
    final updates = <String, dynamic>{
      'status': newStatus,
      if (attendRemarks != null && attendRemarks.isNotEmpty)
        'attend_remarks': attendRemarks.trim(),
    };
    if (newStatus == 'in_progress') updates['in_progress_at'] = now;
    if (newStatus == 'closed' || newStatus == 'rejected') {
      updates['closed_at'] = now;
    }

    final data = await _db
        .from('complaints')
        .update(updates)
        .eq('id', id)
        .select(_select)
        .single();
    return ComplaintModel.fromJson(data);
  }
}

final complaintRepositoryProvider = Provider<ComplaintRepository>(
  (ref) => ComplaintRepositoryImpl(),
);
