import 'package:flutter/material.dart';

class SignaturePad extends StatelessWidget {
  const SignaturePad({
    super.key,
    required this.points,
    required this.onChanged,
  });
  final List<List<double>?> points;
  final ValueChanged<List<List<double>?>> onChanged;
  @override
  Widget build(BuildContext context) => Semantics(
    label:
        'Drawn signature area. Optional unless required by the receiving policy.',
    child: LayoutBuilder(
      builder: (context, constraints) {
        void add(Offset position) {
          if (points.length >= 350) return;
          onChanged([
            ...points,
            [
              position.dx.clamp(0, constraints.maxWidth) / constraints.maxWidth,
              position.dy.clamp(0, 150) / 150,
            ],
          ]);
        }

        return GestureDetector(
          onPanStart: (details) => add(details.localPosition),
          onPanUpdate: (details) => add(details.localPosition),
          onPanEnd: (_) {
            if (points.isNotEmpty &&
                points.last != null &&
                points.length < 351) {
              onChanged([...points, null]);
            }
          },
          child: Container(
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(12),
            ),
            child: CustomPaint(painter: _SignaturePainter(points)),
          ),
        );
      },
    ),
  );
}

class _SignaturePainter extends CustomPainter {
  _SignaturePainter(this.points);
  final List<List<double>?> points;
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xff17221d)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    for (var index = 1; index < points.length; index++) {
      final a = points[index - 1], b = points[index];
      if (a != null && b != null) {
        canvas.drawLine(
          Offset(a[0] * size.width, a[1] * size.height),
          Offset(b[0] * size.width, b[1] * size.height),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) =>
      oldDelegate.points != points;
}
