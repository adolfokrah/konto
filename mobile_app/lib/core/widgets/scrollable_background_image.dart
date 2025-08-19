import 'package:flutter/material.dart';

/// A reusable background image widget that fades out as the user scrolls
/// Used in screens with SliverAppBar for dynamic background effects
class ScrollableBackgroundImage extends StatelessWidget {
  /// The image URL to display as background (optional - widget returns empty if null)
  final String? imageUrl;

  /// The current scroll offset to calculate opacity
  final double scrollOffset;

  /// The height of the background image container
  final double height;

  /// The maximum scroll distance for opacity calculation
  final double maxScrollForOpacity;

  /// The base opacity of the image (before scroll fade)
  final double baseOpacity;

  const ScrollableBackgroundImage({
    super.key,
    required this.imageUrl,
    required this.scrollOffset,
    this.height = 450.0,
    this.maxScrollForOpacity = 200.0,
    this.baseOpacity = 0.30,
  });

  @override
  Widget build(BuildContext context) {
    // Return empty positioned widget if no image URL is provided
    if (imageUrl == null || imageUrl!.isEmpty) {
      return const SizedBox();
    }

    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      height: height,
      child: Opacity(
        opacity: (1.0 - (scrollOffset / maxScrollForOpacity)).clamp(0.0, 1.0),
        child: Container(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: NetworkImage(imageUrl!),
              fit: BoxFit.cover,
              opacity: baseOpacity,
              colorFilter: ColorFilter.mode(
                Theme.of(context).colorScheme.surface.withValues(alpha: 0.8),
                BlendMode.overlay,
              ),
            ),
          ),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.transparent,
                  Theme.of(context).colorScheme.surface.withValues(alpha: 0.3),
                  Theme.of(context).colorScheme.surface.withValues(alpha: 0.8),
                  Theme.of(context).colorScheme.surface,
                ],
                stops: const [0.0, 0.6, 0.8, 0.95, 1.0],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
