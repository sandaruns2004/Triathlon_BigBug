import 'package:flutter_test/flutter_test.dart';
import 'package:waypoint_mobile/core/theme/formatters.dart';

void main() {
  test('Sri Lankan business date advances before UTC midnight', () {
    expect(businessDate(DateTime.utc(2026, 9, 29, 20)), '2026-09-30');
    expect(businessTime(DateTime.utc(2026, 9, 29, 20)), '01:30');
    expect(quantityLabel(12, 'case'), '12 case');
  });
}
