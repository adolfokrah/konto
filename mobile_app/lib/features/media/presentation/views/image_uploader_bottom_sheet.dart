import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/haptic_utils.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/drag_handle.dart';
import 'package:konto/l10n/app_localizations.dart';
import '../../logic/bloc/media_bloc.dart';

/// A bottom sheet widget for selecting and uploading images (camera or gallery)
/// The uploaded image data can be accessed via MediaBloc state
/// Alt text is automatically generated from the image filename
///
/// Usage example:
/// ```dart
/// ImageUploaderBottomSheet.show(context);
/// ```
class ImageUploaderBottomSheet extends StatelessWidget {
  const ImageUploaderBottomSheet({super.key});

  static void show(BuildContext context) {
    HapticUtils.light();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => const ImageUploaderBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BlocListener<MediaBloc, MediaState>(
      listener: (context, state) {
        if (state is MediaLoaded) {
          Navigator.pop(context);
          // MediaModel can be accessed via BlocProvider.of<MediaBloc>(context).state
        } else if (state is MediaError) {
          Navigator.pop(context);
          // Show error message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '${AppLocalizations.of(context)!.uploadFailed}: ${state.errorMessage}',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      },
      child: BlocBuilder<MediaBloc, MediaState>(
        builder: (context, state) {
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
                DragHandle(),

                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.spacingM,
                    vertical: AppSpacing.spacingXs,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          AppLocalizations.of(context)!.uploadImage,
                          style: TextStyles.titleMediumLg.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (state is MediaLoading)
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                    ],
                  ),
                ),

                if (state is! MediaLoading) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.spacingM,
                    ),
                    child: Column(
                      children: [
                        _buildOptionTile(
                          context,
                          icon: Icons.camera_alt_outlined,
                          title: AppLocalizations.of(context)!.takePhoto,
                          subtitle:
                              AppLocalizations.of(
                                context,
                              )!.useCameraToTakePhoto,
                          onTap:
                              () => _handleImageSelection(
                                context,
                                ImageSource.camera,
                              ),
                        ),

                        const SizedBox(height: AppSpacing.spacingS),

                        _buildOptionTile(
                          context,
                          icon: Icons.photo_library_outlined,
                          title:
                              AppLocalizations.of(context)!.chooseFromGallery,
                          subtitle:
                              AppLocalizations.of(
                                context,
                              )!.selectImageFromGallery,
                          onTap:
                              () => _handleImageSelection(
                                context,
                                ImageSource.gallery,
                              ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  Padding(
                    padding: EdgeInsets.all(AppSpacing.spacingL),
                    child: Column(
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: AppSpacing.spacingM),
                        Text(AppLocalizations.of(context)!.uploadingImage),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: AppSpacing.spacingL),
              ],
            ),
          );
        },
      ),
    );
  }

  void _handleImageSelection(BuildContext context, ImageSource source) async {
    HapticUtils.light();
    try {
      final picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );

      if (image != null && context.mounted) {
        // Generate alt text from image filename by replacing spaces with dashes
        String generatedAltText = image.name.replaceAll(' ', '-');
        // Remove file extension from alt text
        if (generatedAltText.contains('.')) {
          generatedAltText = generatedAltText.substring(
            0,
            generatedAltText.lastIndexOf('.'),
          );
        }

        // Trigger the upload using MediaBloc
        context.read<MediaBloc>().add(
          RequestUploadMedia(imageFile: image, alt: generatedAltText),
        );
      } else if (context.mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error selecting image: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
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
