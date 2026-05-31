import 'package:supabase_flutter/supabase_flutter.dart';

class DashboardStats {
  const DashboardStats({
    required this.total,
    required this.open,
    required this.assigned,
    required this.inProgress,
    required this.closed,
    required this.rejected,
    required this.closedToday,
  });

  final int total;
  final int open;
  final int assigned;
  final int inProgress;
  final int closed;
  final int rejected;
  final int closedToday;
}

class GetDashboardStatsUseCase {
  GetDashboardStatsUseCase() : _db = Supabase.instance.client;

  final SupabaseClient _db;

  Future<DashboardStats> call(String organizationId) async {
    final today = DateTime.now();
    final todayStr =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    final results = await Future.wait([
      _count(organizationId),
      _countByStatus(organizationId, 'open'),
      _countByStatus(organizationId, 'assigned'),
      _countByStatus(organizationId, 'in_progress'),
      _countByStatus(organizationId, 'closed'),
      _countByStatus(organizationId, 'rejected'),
      _countClosedToday(organizationId, todayStr),
    ]);

    return DashboardStats(
      total: results[0],
      open: results[1],
      assigned: results[2],
      inProgress: results[3],
      closed: results[4],
      rejected: results[5],
      closedToday: results[6],
    );
  }

  Future<int> _count(String orgId) async {
    final r = await _db
        .from('complaints')
        .select('id', const FetchOptions(count: CountOption.exact, head: true))
        .eq('organization_id', orgId);
    return r.count ?? 0;
  }

  Future<int> _countByStatus(String orgId, String status) async {
    final r = await _db
        .from('complaints')
        .select('id', const FetchOptions(count: CountOption.exact, head: true))
        .eq('organization_id', orgId)
        .eq('status', status);
    return r.count ?? 0;
  }

  Future<int> _countClosedToday(String orgId, String todayStr) async {
    final r = await _db
        .from('complaints')
        .select('id', const FetchOptions(count: CountOption.exact, head: true))
        .eq('organization_id', orgId)
        .eq('status', 'closed')
        .gte('closed_at', todayStr);
    return r.count ?? 0;
  }
}
