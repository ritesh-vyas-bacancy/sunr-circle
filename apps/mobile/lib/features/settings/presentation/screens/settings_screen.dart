import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/config/app_config.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/constants/route_constants.dart';
import '../../../../auth/application/auth_notifier.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('settings.language.title')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(context.tr('settings.language.english')),
              leading: Radio<String>(
                value: 'en',
                groupValue: ctx.locale.languageCode,
                onChanged: (_) {
                  ctx.setLocale(const Locale('en'));
                  Navigator.pop(ctx);
                },
                activeColor: AppColors.primary,
              ),
              onTap: () {
                ctx.setLocale(const Locale('en'));
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              title: Text(context.tr('settings.language.gujarati')),
              leading: Radio<String>(
                value: 'gu',
                groupValue: ctx.locale.languageCode,
                onChanged: (_) {
                  ctx.setLocale(const Locale('gu'));
                  Navigator.pop(ctx);
                },
                activeColor: AppColors.primary,
              ),
              onTap: () {
                ctx.setLocale(const Locale('gu'));
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('nav.settings')),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        children: [
          const SizedBox(height: 8),
          _SectionHeader('Account'),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: Text(context.tr('settings.profile.title')),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteConstants.profile),
          ),
          ListTile(
            leading: const Icon(Icons.language_outlined),
            title: Text(context.tr('settings.language.title')),
            subtitle: Text(context.locale.languageCode == 'gu'
                ? context.tr('settings.language.gujarati')
                : context.tr('settings.language.english')),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showLanguageDialog(context),
          ),
          const Divider(),
          _SectionHeader('Application'),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('App Version'),
            trailing: Text(AppConfig.appVersion,
                style: const TextStyle(color: AppColors.textSecondary)),
          ),
          ListTile(
            leading: const Icon(Icons.email_outlined),
            title: const Text('Support'),
            subtitle: Text(AppConfig.supportEmail),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authNotifierProvider.notifier).logout();
                if (context.mounted) context.go(RouteConstants.login);
              },
              icon:
                  const Icon(Icons.logout, color: AppColors.error, size: 18),
              label: Text(
                context.tr('nav.logout'),
                style: const TextStyle(color: AppColors.error),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.error),
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
