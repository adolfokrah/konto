import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/config/app_config.dart';

/// A reusable avatar widget for displaying contributor information
/// with optional status overlay icon
class ContributorAvatar extends StatelessWidget {
  /// The contributor's name (used for generating initials)
  final String contributorName;

  /// Optional avatar image URL or asset path
  final String? avatarUrl;

  /// Whether this contribution is anonymous
  final bool isAnonymous;

  /// Optional payment status for overlay icons
  final String? paymentStatus;

  /// Whether this contribution was via payment link
  final bool? viaPaymentLink;

  /// Avatar radius (defaults to 20)
  final double radius;

  /// Whether to show the status overlay icon (defaults to true)
  final bool showStatusOverlay;

  /// Custom background color (optional, defaults to theme-based color)
  final Color? backgroundColor;

  const ContributorAvatar({
    super.key,
    required this.contributorName,
    this.avatarUrl,
    this.isAnonymous = false,
    this.paymentStatus,
    this.viaPaymentLink,
    this.radius = 20,
    this.showStatusOverlay = true,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      children: [
        CircleAvatar(
          radius: radius,
          backgroundColor:
              backgroundColor ??
              (isDark
                  ? Theme.of(context).colorScheme.surface
                  : Theme.of(context).colorScheme.primary),
          backgroundImage:
              avatarUrl != null
                  ? NetworkImage(_resolveAvatarUrl(avatarUrl!))
                  : null,
          child:
              avatarUrl == null
                  ? Text(
                    _getInitials(contributorName),
                    style: TextStyles.titleBoldM.copyWith(
                      color:
                          isDark
                              ? Theme.of(context).colorScheme.onSurface
                              : AppColors.black,
                      fontSize: _getInitialsFontSize(),
                    ),
                  )
                  : null,
        ),
        // Status overlay icon
        if (showStatusOverlay &&
            (paymentStatus != null || viaPaymentLink != null))
          Positioned(
            right: radius * 0.1, // Position with some padding from edge
            bottom: radius * 0.1, // Position with some padding from edge
            child: Container(
              width: _getOverlaySize(),
              height: _getOverlaySize(),
              decoration: BoxDecoration(
                color:
                    paymentStatus?.toLowerCase() != 'failed'
                        ? isDark
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.primary
                        : AppColors.errorRed,
                shape: BoxShape.circle,
                border: Border.all(
                  color: Theme.of(context).colorScheme.surface,
                  width: 1.5,
                ),
              ),
              child: Icon(
                _getOverlayIcon(),
                size: _getOverlayIconSize(),
                color:
                    isDark
                        ? Theme.of(context).colorScheme.onPrimary
                        : Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ),
      ],
    );
  }

  /// Generate initials from contributor name
  String _getInitials(String name) {
    if (isAnonymous) return '?';

    final words =
        name.trim().split(' ').where((word) => word.isNotEmpty).toList();
    if (words.isEmpty) return '?';

    if (words.length == 1) {
      return words[0].isNotEmpty ? words[0][0].toUpperCase() : '?';
    } else {
      // Ensure both words have at least one character before accessing
      final firstInitial = words[0].isNotEmpty ? words[0][0].toUpperCase() : '';
      final secondInitial =
          words.length > 1 && words[1].isNotEmpty
              ? words[1][0].toUpperCase()
              : '';

      if (firstInitial.isEmpty && secondInitial.isEmpty) {
        return '?';
      } else if (secondInitial.isEmpty) {
        return firstInitial;
      } else {
        return '$firstInitial$secondInitial';
      }
    }
  }

  /// Get overlay icon based on payment status and via payment link
  IconData _getOverlayIcon() {
    if (paymentStatus == 'pending') {
      return Icons.info;
    }
    if (paymentStatus == 'failed') {
      return Icons.close;
    }
    if (viaPaymentLink == true) {
      return Icons.call_received;
    }
    if (paymentStatus == 'transferred') {
      return Icons.arrow_forward;
    }
    return Icons.add;
  }

  /// Get overlay size based on avatar radius
  double _getOverlaySize() {
    return radius * 0.6; // 60% of avatar radius for better visibility
  }

  /// Get overlay icon size based on overlay size
  double _getOverlayIconSize() {
    return _getOverlaySize() * 0.7; // 70% of overlay size for better visibility
  }

  /// Get initials font size based on avatar radius
  double _getInitialsFontSize() {
    if (radius <= 15) return 12;
    if (radius <= 20) return 14;
    if (radius <= 25) return 16;
    if (radius <= 30) return 18;
    return 20;
  }
}

/// Resolve the avatar URL by prefixing with image base when it's a relative path
String _resolveAvatarUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Guard against double slashes
  final base =
      AppConfig.imageBaseUrl.endsWith('/')
          ? AppConfig.imageBaseUrl.substring(
            0,
            AppConfig.imageBaseUrl.length - 1,
          )
          : AppConfig.imageBaseUrl;
  final cleaned = url.startsWith('/') ? url : '/$url';
  return '$base$cleaned';
}

/// Factory constructors for common use cases
class ContributorAvatarSizes {
  /// Small avatar (radius 15)
  static ContributorAvatar small({
    required String contributorName,
    String? avatarUrl,
    bool isAnonymous = false,
    String? paymentStatus,
    bool? viaPaymentLink,
    bool showStatusOverlay = true,
    Color? backgroundColor,
  }) {
    return ContributorAvatar(
      contributorName: contributorName,
      avatarUrl: avatarUrl,
      isAnonymous: isAnonymous,
      paymentStatus: paymentStatus,
      viaPaymentLink: viaPaymentLink,
      radius: 15,
      showStatusOverlay: showStatusOverlay,
      backgroundColor: backgroundColor,
    );
  }

  /// Medium avatar (radius 20) - default
  static ContributorAvatar medium({
    required String contributorName,
    String? avatarUrl,
    bool isAnonymous = false,
    String? paymentStatus,
    bool? viaPaymentLink,
    bool showStatusOverlay = true,
    Color? backgroundColor,
  }) {
    return ContributorAvatar(
      contributorName: contributorName,
      avatarUrl: avatarUrl,
      isAnonymous: isAnonymous,
      paymentStatus: paymentStatus,
      viaPaymentLink: viaPaymentLink,
      radius: 20,
      showStatusOverlay: showStatusOverlay,
      backgroundColor: backgroundColor,
    );
  }

  /// Large avatar (radius 30)
  static ContributorAvatar large({
    required String contributorName,
    String? avatarUrl,
    bool isAnonymous = false,
    String? paymentStatus,
    bool? viaPaymentLink,
    bool showStatusOverlay = true,
    Color? backgroundColor,
  }) {
    return ContributorAvatar(
      contributorName: contributorName,
      avatarUrl: avatarUrl,
      isAnonymous: isAnonymous,
      paymentStatus: paymentStatus,
      viaPaymentLink: viaPaymentLink,
      radius: 30,
      showStatusOverlay: showStatusOverlay,
      backgroundColor: backgroundColor,
    );
  }

  /// Extra large avatar (radius 40)
  static ContributorAvatar extraLarge({
    required String contributorName,
    String? avatarUrl,
    bool isAnonymous = false,
    String? paymentStatus,
    bool? viaPaymentLink,
    bool showStatusOverlay = false, // Usually no overlay for large avatars
    Color? backgroundColor,
  }) {
    return ContributorAvatar(
      contributorName: contributorName,
      avatarUrl: avatarUrl,
      isAnonymous: isAnonymous,
      paymentStatus: paymentStatus,
      viaPaymentLink: viaPaymentLink,
      radius: 40,
      showStatusOverlay: showStatusOverlay,
      backgroundColor: backgroundColor,
    );
  }
}
