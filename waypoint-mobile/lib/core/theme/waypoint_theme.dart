import 'package:flutter/material.dart';

@immutable
class WaypointTokens extends ThemeExtension<WaypointTokens> {
  const WaypointTokens({
    this.deepGreen = const Color(0xff146b45),
    this.actionGreen = const Color(0xff1f8a5b),
    this.paleGreen = const Color(0xffeaf6ef),
    this.ink = const Color(0xff17221d),
    this.muted = const Color(0xff63716a),
    this.border = const Color(0xffdce5df),
    this.canvas = const Color(0xfff6f8f7),
  });
  final Color deepGreen, actionGreen, paleGreen, ink, muted, border, canvas;
  static const double touchTarget = 48, cardRadius = 14, gap = 16;
  @override
  WaypointTokens copyWith({
    Color? deepGreen,
    Color? actionGreen,
    Color? paleGreen,
    Color? ink,
    Color? muted,
    Color? border,
    Color? canvas,
  }) => WaypointTokens(
    deepGreen: deepGreen ?? this.deepGreen,
    actionGreen: actionGreen ?? this.actionGreen,
    paleGreen: paleGreen ?? this.paleGreen,
    ink: ink ?? this.ink,
    muted: muted ?? this.muted,
    border: border ?? this.border,
    canvas: canvas ?? this.canvas,
  );
  @override
  WaypointTokens lerp(covariant WaypointTokens? other, double t) =>
      other == null
      ? this
      : WaypointTokens(
          deepGreen: Color.lerp(deepGreen, other.deepGreen, t)!,
          actionGreen: Color.lerp(actionGreen, other.actionGreen, t)!,
          paleGreen: Color.lerp(paleGreen, other.paleGreen, t)!,
          ink: Color.lerp(ink, other.ink, t)!,
          muted: Color.lerp(muted, other.muted, t)!,
          border: Color.lerp(border, other.border, t)!,
          canvas: Color.lerp(canvas, other.canvas, t)!,
        );
}

extension WaypointTheme on BuildContext {
  WaypointTokens get tokens => Theme.of(this).extension<WaypointTokens>()!;
}

ThemeData buildWaypointTheme() {
  const tokens = WaypointTokens();
  TextStyle style(double size, double weight) => TextStyle(
    fontFamily: 'Inter',
    fontSize: size,
    color: tokens.ink,
    fontVariations: [FontVariation('wght', weight)],
    height: 1.4,
  );
  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Inter',
    scaffoldBackgroundColor: tokens.canvas,
    colorScheme: ColorScheme.fromSeed(
      seedColor: tokens.deepGreen,
      primary: tokens.deepGreen,
      surface: Colors.white,
      error: const Color(0xffb42318),
    ),
    extensions: const [tokens],
    textTheme: TextTheme(
      bodyLarge: style(16, 400),
      bodyMedium: style(16, 400),
      bodySmall: style(16, 400),
      labelLarge: style(16, 600),
      labelMedium: style(16, 600),
      labelSmall: style(16, 500),
      titleSmall: style(18, 600),
      titleMedium: style(20, 600),
      titleLarge: style(24, 650),
      headlineSmall: style(28, 650),
      headlineMedium: style(30, 650),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.all(16),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xffdce5df)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 52),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        textStyle: style(16, 600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 52),
        textStyle: style(16, 600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(minimumSize: const Size(48, 48)),
    ),
  );
}
