import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/haptic_utils.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/drag_handle.dart';

/// A bottom sheet widget for selecting image upload source (camera or gallery)
///
/// Usage example:
/// ```dart
/// ImageUploaderBottomSheet.show(
///   context,
///   onImageSelected: (image) {
///     if (image != null) {
///       // Handle selected image file
///       print('Selected image: ${image.path}');
///     }
///   },
/// );
/// ```
class ImageUploaderBottomSheet extends StatelessWidget {
  final Function(XFile?)? onImageSelected;
  final ImagePicker _picker = ImagePicker();

  ImageUploaderBottomSheet({super.key, this.onImageSelected});

  static void show(BuildContext context) {
    HapticUtils.light();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => ImageUploaderBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color:
            isDark
                ? Theme.of(context).colorScheme.surface
                : Theme.of(context).colorScheme.onPrimary,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppRadius.radiusM),
          topRight: Radius.circular(AppRadius.radiusM),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: AppSpacing.spacingS),
            child: DragHandle(),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.spacingM,
              vertical: AppSpacing.spacingXs,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Upload Image',
                    style: TextStyles.titleMediumLg.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.spacingM,
            ),
            child: Column(
              children: [
                _buildOptionTile(
                  context,
                  icon: Icons.camera_alt_outlined,
                  title: 'Take Photo',
                  subtitle: 'Use camera to take a photo',
                  onTap: () async {
                    HapticUtils.light();
                    try {
                      final XFile? image = await _picker.pickImage(
                        source: ImageSource.camera,
                        imageQuality: 85,
                        maxWidth: 1920,
                        maxHeight: 1920,
                      );
                      if (context.mounted) {
                        Navigator.pop(context);
                        onImageSelected?.call(image);
                      }
                    } catch (e) {
                      if (context.mounted) {
                        Navigator.pop(context);
                      }
                      // Handle error (could show snackbar)
                      debugPrint('Error picking image from camera: $e');
                    }
                  },
                ),

                const SizedBox(height: AppSpacing.spacingS),

                _buildOptionTile(
                  context,
                  icon: Icons.photo_library_outlined,
                  title: 'Choose from Gallery',
                  subtitle: 'Select an image from your gallery',
                  onTap: () async {
                    HapticUtils.light();
                    try {
                      final XFile? image = await _picker.pickImage(
                        source: ImageSource.gallery,
                        imageQuality: 85,
                        maxWidth: 1920,
                        maxHeight: 1920,
                      );
                      if (context.mounted) {
                        Navigator.pop(context);
                        onImageSelected?.call(image);
                      }
                    } catch (e) {
                      if (context.mounted) {
                        Navigator.pop(context);
                      }
                      // Handle error (could show snackbar)
                      debugPrint('Error picking image from gallery: $e');
                    }
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.spacingL),
        ],
      ),
    );
  }

  Widget _buildOptionTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12.0),
      child: AppCard(
        variant: CardVariant.secondary,
        padding: const EdgeInsets.all(AppSpacing.spacingM),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.spacingS),
              decoration: BoxDecoration(
                color:
                    isDark
                        ? Theme.of(context).colorScheme.surface
                        : Theme.of(context).colorScheme.onPrimary,
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Icon(
                icon,
                color: Theme.of(context).colorScheme.onSurface,
                size: 24,
              ),
            ),
            const SizedBox(width: AppSpacing.spacingM),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingXs),
                  Text(
                    subtitle,
                    style: TextStyles.titleRegularM.copyWith(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ],
        ),
      ),
    );
  }
}
