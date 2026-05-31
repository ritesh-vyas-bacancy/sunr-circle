import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../../shared/widgets/app_scaffold.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final reportTypes = [
      'Daily Report',
      'Weekly Report',
      'Monthly Report',
      'Six-Monthly Report',
      'Annual Report',
      'Custom Date Range',
    ];

    return AppScaffold(
      title: context.tr('nav.reports'),
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Icon(Icons.description_outlined,
              size: 64, color: AppColors.textDisabled),
          const SizedBox(height: 16),
          const Text(
            'Reports',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Full reporting with charts and PDF/Excel export will be available in the next update. Contact Back Office for current reports via the Admin Portal.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5),
          ),
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 8),
          const Text('Available in next update:',
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                  fontSize: 13)),
          const SizedBox(height: 8),
          ...reportTypes.map(
            (r) => ListTile(
              leading: const Icon(Icons.lock_outline,
                  color: AppColors.textDisabled, size: 20),
              title: Text(r,
                  style: const TextStyle(
                      fontSize: 14, color: AppColors.textDisabled)),
              dense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }
}
