import 'package:flutter/material.dart';

@immutable
class GymColors extends ThemeExtension<GymColors> {
  const GymColors({
    required this.isLiquidGlass,
    required this.pageBg,
    required this.bg,
    required this.bgRaised,
    required this.bgRaised2,
    required this.border,
    required this.navBg,
    required this.text,
    required this.textSecondary,
    required this.textTertiary,
    required this.ember,
    required this.emberDeep,
    required this.onEmber,
    required this.emberSoft,
    required this.emberShadow,
    required this.accent,
    required this.accentSoft,
    required this.brass,
    required this.sage,
    required this.sageSoft,
    required this.mutedFill,
    required this.heatEmpty,
    required this.info,
    required this.warn,
    required this.danger,
  });

  /// Enables translucent, refractive surfaces across the interface.
  final bool isLiquidGlass;
  final Color pageBg;
  final Color bg;
  final Color bgRaised;
  final Color bgRaised2;
  final Color border;
  final Color navBg;
  final Color text;
  final Color textSecondary;
  final Color textTertiary;
  final Color ember;
  final Color emberDeep;
  final Color onEmber;
  final Color emberSoft;
  final Color emberShadow;
  final Color accent;
  final Color accentSoft;
  final Color brass;
  final Color sage;
  final Color sageSoft;
  final Color mutedFill;
  final Color heatEmpty;
  final Color info;
  final Color warn;
  final Color danger;

  static const dark = GymColors(
    isLiquidGlass: false,
    pageBg: Color(0xFF080808),
    bg: Color(0xFF090909),
    bgRaised: Color(0xFF151515),
    bgRaised2: Color(0xFF232323),
    border: Color(0xFF383838),
    navBg: Color(0xE6090909),
    text: Color(0xFFFFFFFF),
    textSecondary: Color(0xFF9A9A9A),
    textTertiary: Color(0xFF666666),
    ember: Color(0xFFE31B23),
    emberDeep: Color(0xFFAD1018),
    onEmber: Color(0xFFFFFFFF),
    emberSoft: Color(0x26E31B23),
    emberShadow: Color(0x80A30C12),
    accent: Color(0xFFFF545C),
    accentSoft: Color(0x2EFD5961),
    brass: Color(0xFFFF9094),
    sage: Color(0xFF8FA377),
    sageSoft: Color(0x298FA377),
    mutedFill: Color(0xFF252525),
    heatEmpty: Color(0xFF202020),
    info: Color(0xFF7FA8C9),
    warn: Color(0xFFE0B15A),
    danger: Color(0xFFE5674C),
  );

  static const amoled = GymColors(
    isLiquidGlass: false,
    pageBg: Color(0xFF000000),
    bg: Color(0xFF000000),
    bgRaised: Color(0xFF121212),
    bgRaised2: Color(0xFF212121),
    border: Color(0xFF343434),
    navBg: Color(0xEB000000),
    text: Color(0xFFFFFFFF),
    textSecondary: Color(0xFF9A9A9A),
    textTertiary: Color(0xFF666666),
    ember: Color(0xFFE31B23),
    emberDeep: Color(0xFFAD1018),
    onEmber: Color(0xFFFFFFFF),
    emberSoft: Color(0x26E31B23),
    emberShadow: Color(0x80A30C12),
    accent: Color(0xFFFF545C),
    accentSoft: Color(0x2EFD5961),
    brass: Color(0xFFFF9094),
    sage: Color(0xFF8FA377),
    sageSoft: Color(0x298FA377),
    mutedFill: Color(0xFF181818),
    heatEmpty: Color(0xFF171717),
    info: Color(0xFF7FA8C9),
    warn: Color(0xFFE0B15A),
    danger: Color(0xFFE5674C),
  );

  static const light = GymColors(
    isLiquidGlass: false,
    pageBg: Color(0xFFFFF9F9),
    bg: Color(0xFFF6F4F4),
    bgRaised: Color(0xFFFFFFFF),
    bgRaised2: Color(0xFFEDE7E7),
    border: Color(0xFFE4DADA),
    navBg: Color(0xF2FFF9F9),
    text: Color(0xFF191011),
    textSecondary: Color(0xFF655356),
    textTertiary: Color(0xFF927D80),
    ember: Color(0xFFD71920),
    emberDeep: Color(0xFFAE1017),
    onEmber: Color(0xFFFFFFFF),
    emberSoft: Color(0x20D71920),
    emberShadow: Color(0x26A70D14),
    accent: Color(0xFFE31B23),
    accentSoft: Color(0x20E31B23),
    brass: Color(0xFFD64B52),
    sage: Color(0xFF3D7A52),
    sageSoft: Color(0x1F3D7A52),
    mutedFill: Color(0xFFEDE7E7),
    heatEmpty: Color(0xFFE9E1E2),
    info: Color(0xFF3268A0),
    warn: Color(0xFF9A6A12),
    danger: Color(0xFFC0392B),
  );

  /// iOS-inspired dark glass: translucent charcoal, bright hairlines and
  /// restrained red accents. Individual widgets use [isLiquidGlass] to turn
  /// their ordinary surfaces into blurred glass panels.
  static const liquidGlass = GymColors(
    isLiquidGlass: true,
    pageBg: Color(0xFF070A11),
    bg: Color(0xFF0A0E17),
    bgRaised: Color(0xC91A2130),
    bgRaised2: Color(0xB82D374A),
    border: Color(0x75FFFFFF),
    navBg: Color(0xD9111724),
    text: Color(0xFFF8FAFF),
    textSecondary: Color(0xFFB7C0D0),
    textTertiary: Color(0xFF77839A),
    ember: Color(0xFFF12635),
    emberDeep: Color(0xFFAF1020),
    onEmber: Color(0xFFFFFFFF),
    emberSoft: Color(0x38F12635),
    emberShadow: Color(0x8FA50B1A),
    accent: Color(0xFFFF707A),
    accentSoft: Color(0x3DFF7A83),
    brass: Color(0xFFFFB6BC),
    sage: Color(0xFF8CE0C0),
    sageSoft: Color(0x338CE0C0),
    mutedFill: Color(0x9B2A3344),
    heatEmpty: Color(0x8A252C3B),
    info: Color(0xFF83B6FF),
    warn: Color(0xFFFFCE78),
    danger: Color(0xFFFF826C),
  );

  @override
  GymColors copyWith({
    bool? isLiquidGlass,
    Color? pageBg,
    Color? bg,
    Color? bgRaised,
    Color? bgRaised2,
    Color? border,
    Color? navBg,
    Color? text,
    Color? textSecondary,
    Color? textTertiary,
    Color? ember,
    Color? emberDeep,
    Color? onEmber,
    Color? emberSoft,
    Color? emberShadow,
    Color? accent,
    Color? accentSoft,
    Color? brass,
    Color? sage,
    Color? sageSoft,
    Color? mutedFill,
    Color? heatEmpty,
    Color? info,
    Color? warn,
    Color? danger,
  }) {
    return GymColors(
      isLiquidGlass: isLiquidGlass ?? this.isLiquidGlass,
      pageBg: pageBg ?? this.pageBg,
      bg: bg ?? this.bg,
      bgRaised: bgRaised ?? this.bgRaised,
      bgRaised2: bgRaised2 ?? this.bgRaised2,
      border: border ?? this.border,
      navBg: navBg ?? this.navBg,
      text: text ?? this.text,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      ember: ember ?? this.ember,
      emberDeep: emberDeep ?? this.emberDeep,
      onEmber: onEmber ?? this.onEmber,
      emberSoft: emberSoft ?? this.emberSoft,
      emberShadow: emberShadow ?? this.emberShadow,
      accent: accent ?? this.accent,
      accentSoft: accentSoft ?? this.accentSoft,
      brass: brass ?? this.brass,
      sage: sage ?? this.sage,
      sageSoft: sageSoft ?? this.sageSoft,
      mutedFill: mutedFill ?? this.mutedFill,
      heatEmpty: heatEmpty ?? this.heatEmpty,
      info: info ?? this.info,
      warn: warn ?? this.warn,
      danger: danger ?? this.danger,
    );
  }

  @override
  GymColors lerp(GymColors? other, double t) {
    if (other == null) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    return GymColors(
      isLiquidGlass: t >= 0.5 ? other.isLiquidGlass : isLiquidGlass,
      pageBg: c(pageBg, other.pageBg),
      bg: c(bg, other.bg),
      bgRaised: c(bgRaised, other.bgRaised),
      bgRaised2: c(bgRaised2, other.bgRaised2),
      border: c(border, other.border),
      navBg: c(navBg, other.navBg),
      text: c(text, other.text),
      textSecondary: c(textSecondary, other.textSecondary),
      textTertiary: c(textTertiary, other.textTertiary),
      ember: c(ember, other.ember),
      emberDeep: c(emberDeep, other.emberDeep),
      onEmber: c(onEmber, other.onEmber),
      emberSoft: c(emberSoft, other.emberSoft),
      emberShadow: c(emberShadow, other.emberShadow),
      accent: c(accent, other.accent),
      accentSoft: c(accentSoft, other.accentSoft),
      brass: c(brass, other.brass),
      sage: c(sage, other.sage),
      sageSoft: c(sageSoft, other.sageSoft),
      mutedFill: c(mutedFill, other.mutedFill),
      heatEmpty: c(heatEmpty, other.heatEmpty),
      info: c(info, other.info),
      warn: c(warn, other.warn),
      danger: c(danger, other.danger),
    );
  }
}

extension GymColorsX on BuildContext {
  GymColors get gc => Theme.of(this).extension<GymColors>()!;
}
