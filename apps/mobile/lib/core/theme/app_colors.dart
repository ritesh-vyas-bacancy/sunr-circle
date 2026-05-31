import 'package:flutter/material.dart';

/// Government-grade colour palette. No dark mode — utility app.
class AppColors {
  const AppColors._();

  // Primary — PGVCL / government blue
  static const Color primary       = Color(0xFF1a3d7c);
  static const Color primaryLight  = Color(0xFF2a5db8);
  static const Color primaryDark   = Color(0xFF122a57);

  // Secondary — light blue tint
  static const Color secondary     = Color(0xFFf0f4ff);
  static const Color accent        = Color(0xFFe8eeff);

  // Surface
  static const Color background    = Color(0xFFf5f6fa);
  static const Color surface       = Color(0xFFffffff);
  static const Color surfaceVariant= Color(0xFFF0F0F5);

  // Text
  static const Color textPrimary   = Color(0xFF1a1a2e);
  static const Color textSecondary = Color(0xFF6b7280);
  static const Color textDisabled  = Color(0xFFadb5bd);
  static const Color textOnPrimary = Color(0xFFffffff);

  // Status — complaint workflow
  static const Color statusOpen       = Color(0xFF2563eb);
  static const Color statusAssigned   = Color(0xFFd97706);
  static const Color statusInProgress = Color(0xFFea580c);
  static const Color statusClosed     = Color(0xFF16a34a);
  static const Color statusRejected   = Color(0xFFdc2626);

  // Status backgrounds
  static const Color statusOpenBg       = Color(0xFFdbeafe);
  static const Color statusAssignedBg   = Color(0xFFfef3c7);
  static const Color statusInProgressBg = Color(0xFFffedd5);
  static const Color statusClosedBg     = Color(0xFFdcfce7);
  static const Color statusRejectedBg   = Color(0xFFfee2e2);

  // Semantic
  static const Color error    = Color(0xFFdc2626);
  static const Color success  = Color(0xFF16a34a);
  static const Color warning  = Color(0xFFd97706);
  static const Color info     = Color(0xFF2563eb);

  // Borders
  static const Color border        = Color(0xFFe2e8f0);
  static const Color borderFocused = Color(0xFF1a3d7c);

  // Shimmer
  static const Color shimmerBase     = Color(0xFFe2e8f0);
  static const Color shimmerHighlight= Color(0xFFf8fafc);
}
