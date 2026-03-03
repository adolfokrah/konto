import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/core/widgets/scrollable_background_image.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';

/// Bottom sheet that shows jar info (image, description, organizer) for collectors.
class JarInfoSheet extends StatefulWidget {
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
  State<JarInfoSheet> createState() => _JarInfoSheetState();
}

class _JarInfoSheetState extends State<JarInfoSheet> {
  double _scrollOffset = 0.0;

  @override
  Widget build(BuildContext context) {
    final imageUrl = widget.jarData.image?.url;

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
        child: ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppRadius.radiusM),
            topRight: Radius.circular(AppRadius.radiusM),
          ),
          child: Stack(
            children: [
              // Background jar image (same style as jar detail view)
              if (imageUrl != null)
                ScrollableBackgroundImage(
                  imageUrl: ImageUtils.constructImageUrl(imageUrl),
                  scrollOffset: _scrollOffset,
                  height: 350,
                  maxScrollForOpacity: 150,
                  baseOpacity: 0.30,
                ),

              // Content
              Column(
                children: [
                  const Center(child: DragHandle()),
                  Expanded(
                    child: NotificationListener<ScrollNotification>(
                      onNotification: (notification) {
                        if (notification is ScrollUpdateNotification) {
                          setState(() {
                            _scrollOffset = notification.metrics.pixels;
                          });
                        }
                        return false;
                      },
                      child: ListView(
                        controller: scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.spacingL,
                        ),
                        children: [
                          // Spacer to push content below the background image
                          if (imageUrl != null)
                            const SizedBox(height: 170),

                          if (imageUrl == null)
                            const SizedBox(height: AppSpacing.spacingS),

                          // Jar name
                          Text(widget.jarData.name,
                              style: TextStyles.titleBoldLg),

                          // Jar description
                          if (widget.jarData.description != null &&
                              widget.jarData.description!.isNotEmpty) ...[
                            const SizedBox(height: AppSpacing.spacingXs),
                            Text(
                              widget.jarData.description!,
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
                                  widget.jarData.creator.fullName.isNotEmpty
                                      ? widget.jarData.creator.fullName[0]
                                          .toUpperCase()
                                      : '?',
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Organized by ${widget.jarData.creator.fullName}',
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
                  ),

                  // Report jar button
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.spacingL,
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      child: AppButton.outlined(
                        text: 'Report Jar',
                        onPressed: () => Navigator.of(context).pop('report'),
                        textColor: Colors.grey,
                        borderColor: Colors.grey,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingS),

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
            ],
          ),
        ),
      ),
    );
  }
}
