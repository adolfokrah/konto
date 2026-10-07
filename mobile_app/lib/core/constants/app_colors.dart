import 'package:flutter/material.dart';

/// One set of brand colors. The app has a light and a dark set; [AppColors]
/// hands out whichever is active.
class _Palette {
  final Color navy; // text, primary buttons
  final Color limeSoft; // tips, insight cards
  final Color cream; // app background
  final Color beige; // chart bars, muted fills
  final Color fill; // input / segment fills
  final Color line; // hairlines
  final Color ink2; // secondary text
  final Color muted; // tertiary text
  final Color faint; // pesewas, disabled
  final Color surfaceWhite; // cards
  final Color onPrimaryWhite; // text and icons on navy fills
  final Color primaryLight;
  final Color primaryDark;
  final Color black;
  final Color inkFill; // primary buttons, tab bar, snackbars
  final Color onInkFill; // text and icons on inkFill
  final Color positive;
  final Color positiveSoft;
  final Color negative;
  final Color negativeSoft;
  final Color pending;
  final Color pendingSoft;
  final Color info;
  final Color infoSoft;

  const _Palette({
    required this.navy,
    required this.limeSoft,
    required this.cream,
    required this.beige,
    required this.fill,
    required this.line,
    required this.ink2,
    required this.muted,
    required this.faint,
    required this.surfaceWhite,
    required this.onPrimaryWhite,
    required this.primaryLight,
    required this.primaryDark,
    required this.black,
    required this.inkFill,
    required this.onInkFill,
    required this.positive,
    required this.positiveSoft,
    required this.negative,
    required this.negativeSoft,
    required this.pending,
    required this.pendingSoft,
    required this.info,
    required this.infoSoft,
  });
}

const _light = _Palette(
  navy: Color(0xFF1B232E),
  limeSoft: Color(0xFFF4FDDF),
  cream: Color(0xFFFBF6EE),
  beige: Color(0xFFEBE2D7),
  fill: Color(0xFFF3ECE2),
  line: Color(0xFFEDE5D9),
  ink2: Color(0xFF4A5463),
  muted: Color(0xFF8B8F96),
  faint: Color(0xFFBFB7AB),
  surfaceWhite: Color(0xFFFFFFFF),
  onPrimaryWhite: Color(0xFFFFFFFF),
  primaryLight: Color(0xFFFDF7EC),
  primaryDark: Color(0xFF2D3849),
  black: Color(0xFF000000),
  inkFill: Color(0xFF1B232E),
  onInkFill: Color(0xFFFFFFFF),
  positive: Color(0xFF0F9F61),
  positiveSoft: Color(0xFFE6F7EE),
  negative: Color(0xFFE5483D),
  negativeSoft: Color(0xFFFDECEA),
  pending: Color(0xFFD9840A),
  pendingSoft: Color(0xFFFFF4E2),
  info: Color(0xFF2E7CF6),
  infoSoft: Color(0xFFEAF2FF),
);

// Dark flips the roles: navy becomes the light ink, cream and white become
// the dark canvas and cards. Lime and the status hues stay recognisable.
const _dark = _Palette(
  navy: Color(0xFFF3EEE6),
  limeSoft: Color(0xFF263119),
  cream: Color(0xFF11161D),
  beige: Color(0xFF2E3743),
  fill: Color(0xFF242C37),
  line: Color(0xFF29313C),
  ink2: Color(0xFFB8BFC9),
  muted: Color(0xFF8A919B),
  faint: Color(0xFF59616C),
  surfaceWhite: Color(0xFF1B222B),
  onPrimaryWhite: Color(0xFF11161D),
  primaryLight: Color(0xFF1B222B),
  primaryDark: Color(0xFF2D3849),
  black: Color(0xFFF3EEE6),
  // A step below the 0xFF11161D canvas, same blue-grey hue, so the tab bar,
  // quick actions and amount card stay darker than the background without
  // going neutral black.
  inkFill: Color(0xFF0B1016),
  onInkFill: Color(0xFFF3EEE6),
  positive: Color(0xFF34C27F),
  positiveSoft: Color(0xFF14301F),
  negative: Color(0xFFFF6B5F),
  negativeSoft: Color(0xFF3A1E1C),
  pending: Color(0xFFF0A23A),
  pendingSoft: Color(0xFF392A14),
  info: Color(0xFF5B9BFF),
  infoSoft: Color(0xFF172539),
);

class AppColors {
  static _Palette _p = _light;

  /// Whether the dark palette is active.
  static bool get isDark => identical(_p, _dark);

  /// Switches the palette. Returns true when it changed, so the caller can
  /// rebuild widgets that read these colors outside of Theme.
  static bool setBrightness(Brightness brightness) {
    final next = brightness == Brightness.dark ? _dark : _light;
    if (identical(next, _p)) return false;
    _p = next;
    return true;
  }

  // Brand
  static Color get navy => _p.navy;
  static const Color lime = Color(0xFFD9F57A); // active / highlight
  static Color get limeSoft => _p.limeSoft;
  static Color get cream => _p.cream;
  static Color get beige => _p.beige;
  static Color get fill => _p.fill;
  static Color get line => _p.line;
  static Color get ink2 => _p.ink2;
  static Color get muted => _p.muted;
  static Color get faint => _p.faint;

  /// Fill for primary actions and the tab bar: navy on light, a shade deeper
  /// than the background on dark. Pair with [onInkFill].
  static Color get inkFill => _p.inkFill;
  static Color get onInkFill => _p.onInkFill;

  /// Ink that stays dark in both themes, for text and icons on [lime].
  static const Color onLime = Color(0xFF1B232E);

  /// Lime on light, dark ink on dark: for icons and text drawn on a navy
  /// fill, which is the light ink in dark mode.
  static Color get limeOnInk => isDark ? onLime : lime;

  // Status: green and red only ever mean money in and money out / errors
  static Color get positive => _p.positive;
  static Color get positiveSoft => _p.positiveSoft;
  static Color get negative => _p.negative;
  static Color get negativeSoft => _p.negativeSoft;
  static Color get pending => _p.pending;
  static Color get pendingSoft => _p.pendingSoft;
  static Color get info => _p.info;
  static Color get infoSoft => _p.infoSoft;

  // Mobile money networks
  static const Color mtnYellow = Color(0xFFFFCB05);
  static const Color telecelRed = Color(0xFFE30613);

  // Existing names, kept so current screens compile; mapped to the new palette
  static Color get primaryLight => _p.primaryLight;
  static Color get primaryDark => _p.primaryDark;
  static Color get secondaryGreen => limeSoft;
  static Color get backgroundLight => beige;
  static Color get surfaceWhite => _p.surfaceWhite;
  static Color get errorRed => negative;
  static Color get warningOrange => pending;
  static Color get infoBlue => info;
  static Color get onPrimaryWhite => _p.onPrimaryWhite;
  static Color get onSurfaceDark => navy;
  static Color get label => muted;
  static Color get black => _p.black;

  // Roles as the widgets use them:
  // primary = card / input fill, onSurface = text and primary-button fill,
  // surface = screen background, secondary = soft lime, tertiary = lime.
  static ColorScheme _scheme(_Palette p, Brightness brightness) => ColorScheme(
    brightness: brightness,
    primary: p.surfaceWhite,
    onPrimary: p.surfaceWhite,
    secondary: p.limeSoft,
    onSecondary: p.navy,
    tertiary: lime,
    onTertiary: onLime,
    error: p.negative,
    onError: p.onPrimaryWhite,
    surface: p.cream,
    onSurface: p.navy,
    onSurfaceVariant: p.ink2,
    surfaceContainerHighest: p.fill,
    outline: p.line,
    outlineVariant: p.line,
  );

  static ColorScheme get lightColorScheme => _scheme(_light, Brightness.light);
  static ColorScheme get darkColorScheme => _scheme(_dark, Brightness.dark);
}
