import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/complaint_repository_impl.dart';
import '../domain/entities/complaint.dart';
import '../domain/repositories/complaint_repository.dart';

class ComplaintListState {
  const ComplaintListState({
    this.complaints = const [],
    this.isLoading = false,
    this.error,
    this.hasMore = true,
    this.page = 1,
    this.statusFilter,
    this.searchQuery,
  });

  final List<Complaint> complaints;
  final bool isLoading;
  final String? error;
  final bool hasMore;
  final int page;
  final String? statusFilter;
  final String? searchQuery;

  ComplaintListState copyWith({
    List<Complaint>? complaints,
    bool? isLoading,
    String? error,
    bool? hasMore,
    int? page,
    String? statusFilter,
    String? searchQuery,
    bool clearError = false,
  }) {
    return ComplaintListState(
      complaints: complaints ?? this.complaints,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      hasMore: hasMore ?? this.hasMore,
      page: page ?? this.page,
      statusFilter: statusFilter ?? this.statusFilter,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

class ComplaintListNotifier extends StateNotifier<ComplaintListState> {
  ComplaintListNotifier(this._repository) : super(const ComplaintListState()) {
    load();
  }

  final ComplaintRepository _repository;
  static const _pageSize = 20;

  Future<void> load({bool refresh = false}) async {
    if (state.isLoading) return;
    if (!refresh && !state.hasMore) return;

    final page = refresh ? 1 : state.page;
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final items = await _repository.getComplaints(
        status: state.statusFilter,
        search: state.searchQuery,
        page: page,
        pageSize: _pageSize,
      );
      state = state.copyWith(
        complaints: refresh ? items : [...state.complaints, ...items],
        isLoading: false,
        hasMore: items.length == _pageSize,
        page: page + 1,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> refresh() => load(refresh: true);

  Future<void> applyFilter(String? status) async {
    state = ComplaintListState(statusFilter: status);
    await load();
  }

  Future<void> search(String query) async {
    state = ComplaintListState(
      searchQuery: query.isEmpty ? null : query,
      statusFilter: state.statusFilter,
    );
    await load();
  }
}

final complaintListProvider = StateNotifierProvider.autoDispose<
    ComplaintListNotifier, ComplaintListState>((ref) {
  return ComplaintListNotifier(ref.read(complaintRepositoryProvider));
});

final openComplaintsProvider = StateNotifierProvider.autoDispose<
    ComplaintListNotifier, ComplaintListState>((ref) {
  final n = ComplaintListNotifier(ref.read(complaintRepositoryProvider));
  n.applyFilter('open');
  return n;
});

final assignedComplaintsProvider = StateNotifierProvider.autoDispose<
    ComplaintListNotifier, ComplaintListState>((ref) {
  final n = ComplaintListNotifier(ref.read(complaintRepositoryProvider));
  n.applyFilter('assigned');
  return n;
});
