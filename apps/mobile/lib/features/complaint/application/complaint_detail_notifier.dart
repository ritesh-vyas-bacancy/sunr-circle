import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/complaint_repository_impl.dart';
import '../domain/entities/complaint.dart';
import '../domain/entities/complaint_log.dart';
import '../domain/repositories/complaint_repository.dart';

class ComplaintDetailState {
  const ComplaintDetailState({
    this.complaint,
    this.logs = const [],
    this.isLoading = false,
    this.error,
    this.isUpdating = false,
    this.updateError,
  });

  final Complaint? complaint;
  final List<ComplaintLog> logs;
  final bool isLoading;
  final String? error;
  final bool isUpdating;
  final String? updateError;

  ComplaintDetailState copyWith({
    Complaint? complaint,
    List<ComplaintLog>? logs,
    bool? isLoading,
    String? error,
    bool? isUpdating,
    String? updateError,
    bool clearUpdateError = false,
  }) {
    return ComplaintDetailState(
      complaint: complaint ?? this.complaint,
      logs: logs ?? this.logs,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      isUpdating: isUpdating ?? this.isUpdating,
      updateError: clearUpdateError ? null : (updateError ?? this.updateError),
    );
  }
}

class ComplaintDetailNotifier extends StateNotifier<ComplaintDetailState> {
  ComplaintDetailNotifier(this._repository)
      : super(const ComplaintDetailState());

  final ComplaintRepository _repository;

  Future<void> load(String id) async {
    state = state.copyWith(isLoading: true);
    try {
      final results = await Future.wait([
        _repository.getComplaintById(id),
        _repository.getComplaintLogs(id),
      ]);
      state = ComplaintDetailState(
        complaint: results[0] as Complaint,
        logs: results[1] as List<ComplaintLog>,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> accept() async {
    if (state.complaint == null) return false;
    state = state.copyWith(isUpdating: true, clearUpdateError: true);
    try {
      final updated = await _repository.acceptComplaint(state.complaint!.id);
      await load(updated.id);
      return true;
    } catch (e) {
      state = state.copyWith(isUpdating: false, updateError: e.toString());
      return false;
    }
  }

  Future<bool> updateStatus(String newStatus, {String? remarks}) async {
    if (state.complaint == null) return false;
    state = state.copyWith(isUpdating: true, clearUpdateError: true);
    try {
      final updated = await _repository.updateComplaintStatus(
        state.complaint!.id,
        newStatus,
        attendRemarks: remarks,
      );
      await load(updated.id);
      return true;
    } catch (e) {
      state = state.copyWith(isUpdating: false, updateError: e.toString());
      return false;
    }
  }
}

final complaintDetailProvider = StateNotifierProvider.family
    .autoDispose<ComplaintDetailNotifier, ComplaintDetailState, String>(
  (ref, id) {
    final n = ComplaintDetailNotifier(ref.read(complaintRepositoryProvider));
    n.load(id);
    return n;
  },
);
