import 'package:intl/intl.dart';

String businessTime(DateTime instant) => DateFormat(
  'HH:mm',
).format(instant.toUtc().add(const Duration(hours: 5, minutes: 30)));
String businessDate(DateTime instant) => DateFormat(
  'yyyy-MM-dd',
).format(instant.toUtc().add(const Duration(hours: 5, minutes: 30)));
String quantityLabel(num value, String unit) => '$value $unit';
