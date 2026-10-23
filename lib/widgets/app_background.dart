import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class AppBackground extends StatelessWidget {
  const AppBackground({
    super.key,
    required this.pattern,
    this.photo,
    this.dim = 0.55,
  });

  final String pattern;
  final String? photo;
  final double dim;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    if (pattern == 'photo') {
      final path = photo;
      if (path == null) return const SizedBox.shrink();
      final media = MediaQuery.of(context);
      final cacheWidth = (media.size.width * media.devicePixelRatio).round();
      return IgnorePointer(
        child: RepaintBoundary(
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.file(
                File(path),
                fit: BoxFit.cover,
                cacheWidth: cacheWidth,
                filterQuality: FilterQuality.medium,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      gc.bg.withValues(alpha: dim),
                      gc.bg.withValues(alpha: (dim + 0.18).clamp(0.0, 1.0)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }
    if (pattern != 'dots' && pattern != 'grid') return const SizedBox.shrink();
    return IgnorePointer(
      child: RepaintBoundary(
        child: CustomPaint(
          size: Size.infinite,
          painter: _BgPainter(pattern: pattern, color: gc.border),
        ),
      ),
    );
  }
}

/// A lightweight, iOS-inspired colour field that sits behind every screen
/// while the Liquid Glass theme is selected. Surfaces above it are translucent
/// and blurred by the shared glass widgets.
class LiquidGlassBackdrop extends StatelessWidget {
  const LiquidGlassBackdrop({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return IgnorePointer(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [gc.pageBg, const Color(0xFF121A2C), gc.bg],
            stops: const [0, 0.48, 1],
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Align(
              alignment: const Alignment(-0.82, -0.78),
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFCE2035).withValues(alpha: 0.28),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFE51D34).withValues(alpha: 0.20),
                      blurRadius: 96,
                      spreadRadius: 28,
                    ),
                  ],
                ),
              ),
            ),
            Align(
              alignment: const Alignment(0.95, 0.12),
              child: Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF749DFF).withValues(alpha: 0.18),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF92A7FF).withValues(alpha: 0.16),
                      blurRadius: 84,
                      spreadRadius: 24,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BgPainter extends CustomPainter {
  _BgPainter({required this.pattern, required this.color});

  final String pattern;
  final Color color;
  static const _gap = 26.0;

  @override
  void paint(Canvas canvas, Size size) {
    if (pattern == 'dots') {
      canvas.drawPoints(
        ui.PointMode.points,
        [
          for (double y = _gap; y < size.height; y += _gap)
            for (double x = _gap; x < size.width; x += _gap) Offset(x, y),
        ],
        Paint()
          ..color = color.withValues(alpha: 0.5)
          ..strokeWidth = 2.2
          ..strokeCap = StrokeCap.round,
      );
    } else {
      canvas.drawPoints(
        ui.PointMode.lines,
        [
          for (double x = _gap; x < size.width; x += _gap) ...[
            Offset(x, 0),
            Offset(x, size.height),
          ],
          for (double y = _gap; y < size.height; y += _gap) ...[
            Offset(0, y),
            Offset(size.width, y),
          ],
        ],
        Paint()
          ..color = color.withValues(alpha: 0.35)
          ..strokeWidth = 1,
      );
    }
  }

  @override
  bool shouldRepaint(_BgPainter old) =>
      old.pattern != pattern || old.color != color;
}
