import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../auth/application/auth_notifier.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/error_view.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authNotifierProvider).session;

    return AppScaffold(
      title: context.tr('settings.profile.title'),
      showBack: true,
      body: FutureBuilder(
        future: session != null
            ? Supabase.instance.client
                .from('users')
                .select(
                    '*, office:sub_division_id(name,code), org:organization_id(name)')
                .eq('id', session.id)
                .single()
            : null,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ErrorView(message: snapshot.error.toString());
          }
          final data = snapshot.data as Map<String, dynamic>?;

          final initials = session?.initials ?? 'U';
          final fullName = session?.fullName ?? '';
          final role = session?.role ?? '';
          final email = Supabase.instance.client.auth.currentUser?.email ?? '';
          final employeeId = data?['employee_id'] as String?;
          final mobile = data?['mobile_number'] as String?;
          final subDiv = (data?['office'] as Map?)
              ?['name'] as String?;
          final orgName = (data?['org'] as Map?)?['name'] as String?;

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Avatar
              Center(
                child: CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    initials,
                    style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  fullName,
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w700),
                ),
              ),
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.secondary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _roleLabel(role),
                    style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _InfoCard(items: [
                _InfoItem(label: 'Email', value: email),
                if (employeeId != null)
                  _InfoItem(
                      label: context.tr('settings.profile.employee_id'),
                      value: employeeId),
                if (mobile != null)
                  _InfoItem(
                      label: context.tr('settings.profile.mobile'),
                      value: mobile),
                if (orgName != null)
                  _InfoItem(
                      label: context.tr('settings.profile.organisation'),
                      value: orgName),
                if (subDiv != null)
                  _InfoItem(
                      label: context.tr('settings.profile.sub_division'),
                      value: subDiv),
              ]),
            ],
          );
        },
      ),
    );
  }

  String _roleLabel(String role) {
    const labels = {
      'call_centre': 'Call Centre',
      'line_man': 'Line Man',
      'top_management': 'Top Management',
      'back_office': 'Back Office',
    };
    return labels[role] ?? role;
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.items});
  final List<_InfoItem> items;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          children: items
              .map((item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 110,
                          child: Text(item.label,
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary)),
                        ),
                        Expanded(
                          child: Text(item.value,
                              style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500)),
                        ),
                      ],
                    ),
                  ))
              .toList(),
        ),
      ),
    );
  }
}

class _InfoItem {
  const _InfoItem({required this.label, required this.value});
  final String label;
  final String value;
}
