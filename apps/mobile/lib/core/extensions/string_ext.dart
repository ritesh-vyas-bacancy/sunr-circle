extension StringExt on String {
  String get capitalizeFirst =>
      isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';

  bool get isValidEmail => RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(this);

  bool get isValidIndianMobile => RegExp(r'^[6-9][0-9]{9}$').hasMatch(this);

  String get maskedMobile => length >= 10
      ? '${substring(0, 2)}****${substring(length - 4)}'
      : this;
}

extension NullableStringExt on String? {
  bool get isNullOrEmpty => this == null || this!.isEmpty;
  String get orEmpty => this ?? '';
  String get orDash => (this != null && this!.isNotEmpty) ? this! : '—';
}
