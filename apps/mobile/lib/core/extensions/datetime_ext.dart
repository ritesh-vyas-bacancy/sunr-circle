import 'package:intl/intl.dart';

extension DateTimeExt on DateTime {
  String get formattedDate => DateFormat('dd/MM/yyyy').format(this);
  String get formattedDateTime => DateFormat('dd/MM/yyyy HH:mm').format(this);
  String get formattedTime => DateFormat('HH:mm').format(this);

  String get relativeTime {
    final diff = DateTime.now().difference(this);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return formattedDate;
  }
}

extension NullableDateTimeExt on DateTime? {
  String get orDash => this?.formattedDateTime ?? '—';
  String get dateOrDash => this?.formattedDate ?? '—';
}
