import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  const AppTextStyles._();

  // Headings
  static const TextStyle h1 = TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.textPrimary, height: 1.3);
  static const TextStyle h2 = TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1.3);
  static const TextStyle h3 = TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1.3);
  static const TextStyle h4 = TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1.4);

  // Body
  static const TextStyle bodyLarge  = TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.5);
  static const TextStyle bodyMedium = TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.5);
  static const TextStyle bodySmall  = TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.textSecondary, height: 1.5);

  // Labels
  static const TextStyle labelLarge  = TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary);
  static const TextStyle labelMedium = TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textSecondary);
  static const TextStyle labelSmall  = TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textSecondary, letterSpacing: 0.5);

  // Button
  static const TextStyle button = TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textOnPrimary, letterSpacing: 0.3);

  // Monospace (for complaint numbers)
  static const TextStyle mono = TextStyle(fontSize: 13, fontFamily: 'monospace', fontWeight: FontWeight.w500, color: AppColors.textPrimary);
}
