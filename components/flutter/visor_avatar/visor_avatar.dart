import 'dart:developer';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:visor_core/visor_core.dart';

/// A circular avatar that displays a user photo, name initials, or a default
/// user icon — in that priority order.
///
/// ## Display priority
/// 1. [photoUrl] — loaded via `CachedNetworkImage`; cached on device.
/// 2. [name] (no photo) — renders initials derived from the name.
/// 3. Neither — renders a `PhosphorIcons.user` icon.
///
/// ## Loading state
/// When [isLoading] is `true` (e.g. during a photo upload), a
/// [CircularProgressIndicator] overlay is drawn on top of the current avatar.
/// The overlay is suppressed when `MediaQuery.disableAnimations` is `true`;
/// a static circular border is shown instead.
///
/// Tapping is opt-in via [onTap]. When `null` the widget is non-interactive and
/// no `GestureDetector` is inserted into the tree.
///
/// ## Accessibility
/// When [onTap] is provided the widget is wrapped in a
/// `Semantics(button: true)` node so screen readers announce it as an
/// interactive control. Supply [semanticLabel] to override the default label
/// (`'Avatar'`).
///
/// ```dart
/// // Photo avatar with tap handler
/// VisorAvatar(
///   photoUrl: user.photoUrl,
///   radius: 28,
///   onTap: _openProfile,
///   semanticLabel: 'View profile',
/// )
///
/// // Initials fallback
/// VisorAvatar(
///   name: 'Jordan Smith',
///   radius: 22,
/// )
///
/// // Default user icon
/// const VisorAvatar(radius: 22)
///
/// // Loading overlay during photo upload
/// VisorAvatar(
///   photoUrl: currentPhotoUrl,
///   radius: 28,
///   isLoading: true,
///   onTap: _pickPhoto,
/// )
/// ```
class VisorAvatar extends StatelessWidget {
  /// Creates a [VisorAvatar].
  const VisorAvatar({
    super.key,
    this.photoUrl,
    this.radius = 22,
    this.name,
    this.onTap,
    this.isLoading = false,
    this.semanticLabel,
  });

  /// URL of the user's photo. When non-null, the image is fetched and cached
  /// via `CachedNetworkImage`. On load error the fallback ([name] initials or
  /// default icon) is shown automatically.
  final String? photoUrl;

  /// Avatar radius in logical pixels. Defaults to `22`.
  ///
  /// The rendered bounding box is `radius × 2` on each side.
  final double radius;

  /// The user's name, used to derive initials when no [photoUrl] is available.
  ///
  /// Initials are extracted as follows:
  /// - Single word (e.g. `'Madonna'`) → up to 3 leading characters (`'MAD'`).
  /// - Multiple words → first letter of the first 3 words (`'John Paul George'`
  ///   → `'JPG'`).
  final String? name;

  /// Callback invoked when the avatar is tapped. When `null`, the avatar is
  /// purely decorative and no `GestureDetector` is added.
  final VoidCallback? onTap;

  /// When `true`, draws a [CircularProgressIndicator] overlay on top of the
  /// current avatar content. Useful when a photo upload is in progress.
  ///
  /// Has no effect when [onTap] is `null` — the overlay stack is only inserted
  /// when the widget is interactive.
  final bool isLoading;

  /// Accessibility label announced by TalkBack and VoiceOver when the avatar
  /// is interactive ([onTap] is set). Defaults to `'Avatar'` when `null`.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final opacity = context.visorOpacity;

    final resolvedImage = photoUrl != null
        ? CachedNetworkImageProvider(
            photoUrl!,
            errorListener: (e) => log('VisorAvatar: error loading photo: $e'),
          )
        : null;

    final circle = SizedBox(
      width: radius * 2,
      height: radius * 2,
      child: CircleAvatar(
        radius: radius,
        backgroundColor: colors.surfaceMuted,
        backgroundImage: resolvedImage,
        child: resolvedImage == null
            ? _buildFallback(context, colors, opacity)
            : null,
      ),
    );

    if (onTap == null) return circle;

    final disableAnimations = MediaQuery.of(context).disableAnimations;

    final interactive = Semantics(
      button: true,
      label: semanticLabel ?? 'Avatar',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Stack(
          children: [
            circle,
            if (isLoading)
              Positioned.fill(
                child: disableAnimations
                    ? DecoratedBox(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: colors.interactivePrimaryBg,
                            width: context.visorStrokeWidths.medium,
                          ),
                        ),
                      )
                    : Center(
                        child: CircularProgressIndicator(
                          strokeCap: StrokeCap.round,
                          strokeWidth: context.visorStrokeWidths.medium,
                          color: colors.interactivePrimaryBg
                              .withValues(alpha: opacity.alpha80),
                        ),
                      ),
              ),
          ],
        ),
      ),
    );

    return interactive;
  }

  Widget _buildFallback(
    BuildContext context,
    VisorColorsData colors,
    VisorOpacityData opacity,
  ) {
    if (name != null && name!.isNotEmpty) {
      return Center(
        child: Text(
          _getInitials(name!),
          style: context.visorTextStyles.labelMedium.copyWith(
            color: colors.textSecondary,
          ),
        ),
      );
    }

    return Icon(
      PhosphorIconsBold.user,
      size: radius,
      color: colors.textTertiary,
    );
  }

  /// Extracts initials from [name].
  ///
  /// - Single word → up to the first 3 characters, uppercased (`'Tim'` → `'TIM'`).
  /// - Multiple words → first character of the first 3 words, uppercased
  ///   (`'Tim Cook Jr'` → `'TCJ'`).
  ///
  /// Note: the single-word vs multi-word asymmetry (e.g. `'Tim'` → `'TIM'` but
  /// `'Tim Cook'` → `'TC'`) is intentional and matches the established pattern
  /// from the ENTR and Veronica source apps.
  String _getInitials(String name) {
    if (name.isEmpty) return '';

    final parts = name.trim().split(RegExp(r'\s+'));

    if (parts.length == 1) {
      final word = parts[0];
      return word.substring(0, word.length > 3 ? 3 : word.length).toUpperCase();
    }

    return parts
        .where((p) => p.isNotEmpty)
        .take(3)
        .map((p) => p[0])
        .join()
        .toUpperCase();
  }
}
