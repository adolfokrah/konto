import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/features/jars/data/api_providers/jar_api_provider.dart';
import 'package:Hoga/features/notifications/data/models/notification_model.dart';

/// Bottom sheet that shows a jar preview before accepting/declining an invite.
///
/// Fetches jar data live using the jar ID from the notification.
/// Returns `'accept'`, `'decline'`, or `null` (dismissed).
class JarInvitePreviewSheet extends StatefulWidget {
  final NotificationModel notification;

  const JarInvitePreviewSheet({super.key, required this.notification});

  /// Shows the jar invite preview bottom sheet.
  static Future<String?> show({
    required BuildContext context,
    required NotificationModel notification,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      isScrollControlled: true,
      builder: (context) => JarInvitePreviewSheet(notification: notification),
    );
  }

  @override
  State<JarInvitePreviewSheet> createState() => _JarInvitePreviewSheetState();
}

class _JarInvitePreviewSheetState extends State<JarInvitePreviewSheet> {
  bool _isLoading = true;
  String? _jarName;
  String? _jarImage;
  String? _jarDescription;
  String? _creatorName;
  String? _creatorPhoto;

  @override
  void initState() {
    super.initState();
    _fetchJarData();
  }

  Future<void> _fetchJarData() async {
    final jarId = widget.notification.data?['jarId'] as String?;
    if (jarId == null || jarId.isEmpty) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final response =
          await getIt<JarApiProvider>().getJarPreview(jarId: jarId);

      if (response['success'] == true && response['data'] != null) {
        final jar = response['data'];

        // Resolve image URL from populated media object or string
        String? imageUrl;
        final image = jar['image'];
        if (image is Map<String, dynamic>) {
          imageUrl = image['url'] as String?;
        }

        // Resolve creator name and photo from populated creator object
        String? creatorName;
        String? creatorPhoto;
        final creator = jar['creator'];
        if (creator is Map<String, dynamic>) {
          final firstName = creator['firstName'] as String? ?? '';
          final lastName = creator['lastName'] as String? ?? '';
          creatorName = '$firstName $lastName'.trim();

          final photo = creator['photo'];
          if (photo is Map<String, dynamic>) {
            creatorPhoto = photo['url'] as String?;
          }
        }

        if (mounted) {
          setState(() {
            _jarName = jar['name'] as String?;
            _jarImage = imageUrl;
            _jarDescription = jar['description'] as String?;
            _creatorName = creatorName;
            _creatorPhoto = creatorPhoto;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
            if (_isLoading)
              Expanded(
                child: Center(
                  child: CircularProgressIndicator(
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              )
            else
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
                        child: _jarImage != null
                            ? Image.network(
                                ImageUtils.constructImageUrl(_jarImage!),
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) =>
                                    const _JarImagePlaceholder(),
                              )
                            : const _JarImagePlaceholder(),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.spacingM),

                    // Jar name (fetched) or fallback to notification message
                    Text(
                      _jarName ?? widget.notification.message,
                      style: TextStyles.titleBoldLg,
                    ),
                    const SizedBox(height: AppSpacing.spacingXs),

                    // Jar description
                    if (_jarDescription != null &&
                        _jarDescription!.isNotEmpty) ...[
                      Text(
                        _jarDescription!,
                        style: TextStyles.titleRegularM.copyWith(
                          color: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.color
                              ?.withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.spacingS),
                    ],

                    // Creator row
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundImage: _creatorPhoto != null
                              ? NetworkImage(
                                  ImageUtils.constructImageUrl(_creatorPhoto!),
                                )
                              : null,
                          child: _creatorPhoto == null
                              ? Text(
                                  (_creatorName ?? 'S')
                                      .characters
                                      .first
                                      .toUpperCase(),
                                  style: const TextStyle(fontSize: 14),
                                )
                              : null,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Invited by ${_creatorName ?? 'Someone'}',
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
                  ],
                ),
              ),

            // Action buttons pinned at bottom
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingL,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: AppButton.outlined(
                      text: 'Decline',
                      onPressed: () => Navigator.of(context).pop('decline'),
                      textColor: Colors.red,
                      borderColor: Colors.red,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.spacingM),
                  Expanded(
                    child: AppButton(
                      text: 'Accept',
                      onPressed: () => Navigator.of(context).pop('accept'),
                    ),
                  ),
                ],
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
  const _JarImagePlaceholder();

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
