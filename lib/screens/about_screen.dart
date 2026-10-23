import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app/apex_brand.dart';
import '../catalog/exercise_catalog.dart';
import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/ui_kit.dart';

const _kVersion = ApexBrand.version;

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return RiseScope(
      id: 'about',
      once: false,
      child: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          clipBehavior: Clip.none,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: riseAll([
              ScreenHeader(title: t.about, onBack: fit.backFromAbout, titleSize: 18, titleSpacing: 1),
              const SizedBox(height: 18),
              _hero(gc),
              const SizedBox(height: 20),
              _sectionLabel(gc, 'APEX FITNESS GYM'),
              const SizedBox(height: 8),
              _group(gc, [
                (PhosphorIconsRegular.crown, 'GYM OWNER', ApexBrand.gymOwner),
                (PhosphorIconsRegular.facebookLogo, 'FACEBOOK PAGE', ApexBrand.facebookPage),
                (PhosphorIconsRegular.code, 'DEVELOPER', ApexBrand.developer),
              ]),
              const SizedBox(height: 18),
              _sectionLabel(gc, t.whatsInside),
              const SizedBox(height: 8),
              _group(gc, [
                (PhosphorIconsRegular.barbell, t.exercisesInside(kExercises.length), t.exercisesInsideWhy),
                (PhosphorIconsRegular.calculator, t.calculatorsInside, t.calculatorsInsideWhy),
                (PhosphorIconsRegular.chartLineUp, t.mathInside, t.mathInsideWhy),
              ]),
              const SizedBox(height: 22),
              Text(
                'Apex Fitness Gym is built for fast, focused strength training — from your first set to your next personal best.',
                textAlign: TextAlign.center,
                style: AppTheme.f(12.5, weight: FontWeight.w500, color: gc.textTertiary, height: 1.6),
              ),
              const SizedBox(height: 20),
              _legalNotices(gc),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _sectionLabel(GymColors gc, String label) => Text(
    label.toUpperCase(),
    style: AppTheme.f(10.5, weight: FontWeight.w700, color: gc.textTertiary, letterSpacing: 1.3),
  );

  Widget _hero(GymColors gc) {
    return Container(
      height: 184,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color.lerp(gc.emberDeep, gc.bgRaised, 0.54)!, gc.bgRaised, gc.bg],
        ),
        border: Border.all(color: gc.border.withValues(alpha: 0.82)),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Stack(
        children: [
          Positioned(
            left: -62,
            top: -86,
            child: Container(
              width: 214,
              height: 214,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [gc.ember.withValues(alpha: 0.42), Colors.transparent]),
              ),
            ),
          ),
          Positioned(
            left: 18,
            right: 18,
            top: 0,
            child: Container(height: 2, color: gc.accent.withValues(alpha: 0.76)),
          ),
          Positioned(
            right: 14,
            top: 18,
            child: SizedBox(
              width: 144,
              height: 144,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.26),
                  border: Border.all(color: gc.text.withValues(alpha: 0.14)),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.28),
                      blurRadius: 22,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(8),
                child: Image.asset(
                  'assets/img/apex_logo_square.jpg',
                  fit: BoxFit.contain,
                  filterQuality: FilterQuality.high,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 24, 158, 22),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'YOUR TRAINING. YOUR APEX.',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTheme.f(9.5, weight: FontWeight.w800, color: gc.accent, letterSpacing: 1.25),
                ),
                const SizedBox(height: 8),
                Text(
                  ApexBrand.wordmark,
                  style: AppTheme.f(
                    35,
                    weight: FontWeight.w900,
                    color: gc.text,
                    letterSpacing: 2.8,
                    height: 0.95,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  'FITNESS GYM',
                  style: AppTheme.f(
                    10.5,
                    weight: FontWeight.w800,
                    color: gc.textSecondary,
                    letterSpacing: 2.1,
                  ),
                ),
                const SizedBox(height: 15),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [gc.ember.withValues(alpha: 0.28), gc.bgRaised2.withValues(alpha: 0.74)],
                    ),
                    border: Border.all(color: gc.accent.withValues(alpha: 0.30)),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    t.version(_kVersion),
                    style: AppTheme.f(11.5, weight: FontWeight.w700, color: gc.text),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _group(GymColors gc, List<(IconData, String, String)> rows) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: gc.bgRaised,
        border: Border.all(color: gc.border.withValues(alpha: 0.6)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          for (int i = 0; i < rows.length; i++)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
              decoration: BoxDecoration(
                border: i < rows.length - 1
                    ? Border(bottom: BorderSide(color: gc.border.withValues(alpha: 0.6)))
                    : null,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 1, right: 14),
                    child: SizedBox(width: 22, child: Icon(rows[i].$1, size: 19, color: gc.accent)),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          rows[i].$2,
                          style: AppTheme.f(12, weight: FontWeight.w800, color: gc.text, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          rows[i].$3,
                          style: AppTheme.f(
                            12.5,
                            weight: FontWeight.w500,
                            color: gc.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _legalNotices(GymColors gc) {
    final rows = <(IconData, String, String)>[
      (PhosphorIconsRegular.scales, 'GPLv3 ATTRIBUTION', ApexBrand.requiredAttribution),
      (
        PhosphorIconsRegular.githubLogo,
        'UPSTREAM PROJECT',
        '${ApexBrand.upstreamName} by ${ApexBrand.upstreamAuthor}',
      ),
      (
        PhosphorIconsRegular.palette,
        'EXERCISE ILLUSTRATIONS',
        'CC BY-SA 4.0 artwork credits are retained in this app’s source distribution.',
      ),
    ];
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: gc.bgRaised,
        border: Border.all(color: gc.border.withValues(alpha: 0.6)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          for (int i = 0; i < rows.length; i++)
            Semantics(
              button: true,
              link: true,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => _open(ApexBrand.upstreamRepository),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    border: i < rows.length - 1
                        ? Border(bottom: BorderSide(color: gc.border.withValues(alpha: 0.6)))
                        : null,
                  ),
                  child: Row(
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 14),
                        child: SizedBox(
                          width: 22,
                          child: Icon(rows[i].$1, size: 19, color: gc.textSecondary),
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              rows[i].$2,
                              style: AppTheme.f(
                                10,
                                weight: FontWeight.w700,
                                color: gc.textTertiary,
                                letterSpacing: 1.3,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              rows[i].$3,
                              style: AppTheme.f(14.5, weight: FontWeight.w700, color: gc.text),
                            ),
                          ],
                        ),
                      ),
                      Icon(PhosphorIconsRegular.arrowUpRight, size: 15, color: gc.textTertiary),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _open(String url) async {
    try {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } catch (_) {}
  }
}
