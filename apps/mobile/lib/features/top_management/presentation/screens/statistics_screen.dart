import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:syncfusion_flutter_charts/charts.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../auth/application/auth_notifier.dart';
import '../../domain/usecases/get_dashboard_stats_usecase.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/error_view.dart';

class StatisticsScreen extends ConsumerWidget {
  const StatisticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authNotifierProvider).session;
    final orgId = session?.organizationId ?? '';

    return AppScaffold(
      title: context.tr('nav.statistics'),
      showBack: true,
      body: FutureBuilder<DashboardStats>(
        future: GetDashboardStatsUseCase().call(orgId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ErrorView(message: snapshot.error.toString());
          }
          final stats = snapshot.data!;
          return _StatisticsBody(stats: stats);
        },
      ),
    );
  }
}

class _ChartData {
  const _ChartData(this.label, this.count, this.color);
  final String label;
  final int count;
  final Color color;
}

class _StatisticsBody extends StatefulWidget {
  const _StatisticsBody({required this.stats});
  final DashboardStats stats;

  @override
  State<_StatisticsBody> createState() => _StatisticsBodyState();
}

class _StatisticsBodyState extends State<_StatisticsBody>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<_ChartData> get chartData {
    final s = widget.stats;
    return [
      _ChartData('Open', s.open, AppColors.statusOpen),
      _ChartData('Assigned', s.assigned, AppColors.statusAssigned),
      _ChartData('In Progress', s.inProgress, AppColors.statusInProgress),
      _ChartData('Closed', s.closed, AppColors.statusClosed),
      _ChartData('Rejected', s.rejected, AppColors.statusRejected),
    ].where((d) => d.count > 0).toList();
  }

  @override
  Widget build(BuildContext context) {
    final stats = widget.stats;
    final total = stats.total == 0 ? 1 : stats.total;

    return Column(
      children: [
        // Summary header
        Container(
          color: AppColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total Complaints',
                      style: TextStyle(color: Colors.white70, fontSize: 12)),
                  Text('${stats.total}',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w800)),
                ],
              ),
              const Spacer(),
              _MiniStat('Closed Today', stats.closedToday,
                  AppColors.statusClosed),
              const SizedBox(width: 16),
              _MiniStat('SLA Missed', stats.closedToday > 0 ? 0 : 0,
                  AppColors.statusRejected),
            ],
          ),
        ),

        // Tabs
        TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Pie Chart'),
            Tab(text: 'Bar Chart'),
          ],
        ),

        // Tab views
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _PieChartView(data: chartData),
              _BarChartView(data: chartData),
            ],
          ),
        ),

        // Progress bars
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            children: [
              _ProgressRow('Open', stats.open, stats.open / total, AppColors.statusOpen),
              _ProgressRow('Assigned', stats.assigned, stats.assigned / total, AppColors.statusAssigned),
              _ProgressRow('In Progress', stats.inProgress, stats.inProgress / total, AppColors.statusInProgress),
              _ProgressRow('Closed', stats.closed, stats.closed / total, AppColors.statusClosed),
              _ProgressRow('Rejected', stats.rejected, stats.rejected / total, AppColors.statusRejected),
            ],
          ),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(this.label, this.value, this.color);
  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$value',
            style: TextStyle(
                color: color, fontSize: 20, fontWeight: FontWeight.w700)),
        Text(label,
            style: const TextStyle(color: Colors.white70, fontSize: 10)),
      ],
    );
  }
}

class _PieChartView extends StatelessWidget {
  const _PieChartView({required this.data});
  final List<_ChartData> data;

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(child: Text('No data to display'));
    }
    return SfCircularChart(
      legend: const Legend(
        isVisible: true,
        position: LegendPosition.bottom,
        overflowMode: LegendItemOverflowMode.wrap,
      ),
      series: <CircularSeries>[
        PieSeries<_ChartData, String>(
          dataSource: data,
          xValueMapper: (d, _) => d.label,
          yValueMapper: (d, _) => d.count,
          pointColorMapper: (d, _) => d.color,
          dataLabelSettings: const DataLabelSettings(
            isVisible: true,
            labelPosition: ChartDataLabelPosition.outside,
          ),
          explode: true,
          explodeIndex: 0,
        ),
      ],
    );
  }
}

class _BarChartView extends StatelessWidget {
  const _BarChartView({required this.data});
  final List<_ChartData> data;

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(child: Text('No data to display'));
    }
    return SfCartesianChart(
      primaryXAxis: const CategoryAxis(
        labelStyle: TextStyle(fontSize: 11),
      ),
      primaryYAxis: const NumericAxis(
        labelStyle: TextStyle(fontSize: 10),
      ),
      series: <CartesianSeries>[
        ColumnSeries<_ChartData, String>(
          dataSource: data,
          xValueMapper: (d, _) => d.label,
          yValueMapper: (d, _) => d.count,
          pointColorMapper: (d, _) => d.color,
          dataLabelSettings: const DataLabelSettings(isVisible: true),
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow(this.label, this.count, this.percentage, this.color);
  final String label;
  final int count;
  final double percentage;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(label,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: percentage,
                backgroundColor: AppColors.border,
                valueColor: AlwaysStoppedAnimation<Color>(color),
                minHeight: 8,
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 32,
            child: Text(
              '$count',
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
