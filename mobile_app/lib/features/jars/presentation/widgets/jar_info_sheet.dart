import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';

/// Bottom sheet that shows jar info (image, description, organizer) for collectors.
class JarInfoSheet extends StatelessWidget {
  final JarSummaryModel jarData;

  const JarInfoSheet({super.key, required this.jarData});

  static Future<String?> show({
    required BuildContext context,
    required JarSummaryModel jarData,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      isScrollControlled: true,
      builder: (context) => JarInfoSheet(jarData: jarData),
    );
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = jarData.image?.url;

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppRadius.radiusM),
            topRight: Radius.circular(AppRadius.radiusM),
          ),
        ),
        child: Column(
          children: [
            const Center(child: DragHandle()),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.spacingL,
                ),
                children: [
                  const SizedBox(height: AppSpacing.spacingS),

                  // Jar image
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.radiusM),
                    child: SizedBox(
                      width: double.infinity,
                      height: 250,
                      child: imageUrl != null
                          ? Image.network(
                              ImageUtils.constructImageUrl(imageUrl),
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) =>
                                  _JarImagePlaceholder(),
                            )
                          : _JarImagePlaceholder(),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingM),

                  // Jar name
                  Text(jarData.name, style: TextStyles.titleBoldLg),

                  // Jar description
                  if (jarData.description != null &&
                      jarData.description!.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.spacingXs),
                    Text(
                      jarData.description!,
                      style: TextStyles.titleRegularM.copyWith(
                        color: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.color
                            ?.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.spacingS),

                  // Organizer row
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        child: Text(
                          jarData.creator.fullName.isNotEmpty
                              ? jarData.creator.fullName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Organized by ${jarData.creator.fullName}',
                        style: TextStyles.titleRegularSm.copyWith(
                          color: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.color
                              ?.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.spacingL),
                ],
              ),
            ),

            // Leave jar button pinned at bottom
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingL,
              ),
              child: SizedBox(
                width: double.infinity,
                child: AppButton.outlined(
                  text: 'Leave Jar',
                  onPressed: () => Navigator.of(context).pop('leave'),
                  textColor: Colors.red,
                  borderColor: Colors.red,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.spacingM),
          ],
        ),
      ),
    );
  }
}

class _JarImagePlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
      child: Center(
        child: Icon(
          Icons.wallet,
          size: 48,
          color:
              Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
        ),
      ),
    );
  }
}
