import 'package:flutter/material.dart';

class AppTheme {
  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF1DB954), // Music accent green
      secondary: Color(0xFF00ADB5),
      surface: Color(0xFF121212),
      background: Color(0xFF0F0F0F),
      onPrimary: Colors.black,
      onSurface: Colors.white,
    ),
    scaffoldBackgroundColor: const Color(0xFF0B0B0E),
    cardTheme: CardTheme(
      color: const Color(0xFF1E1E24),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF0B0B0E),
      elevation: 0,
      centerTitle: false,
    ),
  );

  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF10893E),
      secondary: Color(0xFF028090),
      surface: Color(0xFFF7F7F9),
      background: Colors.white,
      onPrimary: Colors.white,
    ),
    scaffoldBackgroundColor: Colors.white,
  );
}
