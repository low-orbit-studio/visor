import 'package:flutter/material.dart';
import 'package:visor_themes/visor_themes.dart';

/// Intro screen rendered before the user picks a use case.
///
/// Mirrors the docs site landing copy — what Visor is, what the widgetbook
/// is for, and how to start exploring. The Widgetbook chrome wraps this in
/// its own Scaffold; we render against `VisorColorsData.surfacePage` so the
/// background tracks the active chrome theme.
class VisorHome extends StatelessWidget {
  const VisorHome({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<VisorColorsData>();
    final textPrimary = colors?.textPrimary ?? Colors.white;
    final textSecondary = colors?.textSecondary ?? Colors.white70;
    final textTertiary = colors?.textTertiary ?? Colors.white54;
    final surfaceCard = colors?.surfaceCard ?? Colors.white10;
    final borderDefault = colors?.borderDefault ?? Colors.white12;

    // Wrap in Material so Flutter web doesn't render unmaterialized text with
    // yellow underline indicators (the "no Material ancestor" warning).
    return Material(
      color: colors?.surfacePage ?? Colors.black,
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Image.asset(
                  'assets/visor-logo.png',
                  width: 64,
                  height: 64,
                  filterQuality: FilterQuality.medium,
                ),
                const SizedBox(height: 24),
                Text(
                  'Visor.',
                  style: TextStyle(
                    fontFamily: 'Satoshi',
                    fontWeight: FontWeight.w700,
                    fontSize: 56,
                    letterSpacing: -2,
                    color: textPrimary,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Flutter Widgetbook',
                  style: TextStyle(
                    fontFamily: 'Satoshi',
                    fontWeight: FontWeight.w400,
                    fontSize: 24,
                    color: textTertiary,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  "Visor is Low Orbit Studio's shared design system — "
                  'components you own, tokens that keep you consistent.',
                  style: TextStyle(
                    fontFamily: 'Satoshi',
                    fontSize: 18,
                    color: textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 40),
                _SectionHeading('Getting Started', color: textPrimary),
                const SizedBox(height: 12),
                _Tile(
                  number: '1',
                  title: 'Pick a theme',
                  body: 'Use the dropdown in the sidebar to switch between the '
                      '11 Visor themes. The preview backdrop tracks the active '
                      "theme's surface color.",
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  surface: surfaceCard,
                  border: borderDefault,
                ),
                const SizedBox(height: 12),
                _Tile(
                  number: '2',
                  title: 'Toggle light or dark',
                  body: 'The sun/moon control next to the theme dropdown '
                      'switches the active brightness mode.',
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  surface: surfaceCard,
                  border: borderDefault,
                ),
                const SizedBox(height: 12),
                _Tile(
                  number: '3',
                  title: 'Browse widgets',
                  body: 'Open a use case in the navigation tree to see the '
                      'widget rendered with the active theme. Adjust knobs in '
                      'the right panel to explore variants.',
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  surface: surfaceCard,
                  border: borderDefault,
                ),
                const SizedBox(height: 40),
                _SectionHeading('Learn more', color: textPrimary),
                const SizedBox(height: 12),
                Text(
                  'Full docs, theme gallery, and the React component library '
                  'live at visor.design.',
                  style: TextStyle(
                    fontFamily: 'Satoshi',
                    fontSize: 15,
                    color: textTertiary,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


class _SectionHeading extends StatelessWidget {
  const _SectionHeading(this.text, {required this.color});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontFamily: 'Satoshi',
        fontWeight: FontWeight.w700,
        fontSize: 22,
        letterSpacing: -0.5,
        color: color,
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.number,
    required this.title,
    required this.body,
    required this.textPrimary,
    required this.textSecondary,
    required this.surface,
    required this.border,
  });

  final String number;
  final String title;
  final String body;
  final Color textPrimary;
  final Color textSecondary;
  final Color surface;
  final Color border;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              border: Border.all(color: border, width: 1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              number,
              style: TextStyle(
                fontFamily: 'Satoshi',
                fontWeight: FontWeight.w700,
                fontSize: 13,
                color: textPrimary,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontFamily: 'Satoshi',
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: TextStyle(
                    fontFamily: 'Satoshi',
                    fontSize: 14,
                    color: textSecondary,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
