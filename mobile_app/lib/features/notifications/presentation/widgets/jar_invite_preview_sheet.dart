import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/button_variants.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
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
    if (_isLoading) {
      return const AccSheet(
        children: [
          SizedBox(
            height: 180,
            child: Center(
              child: CircularProgressIndicator(color: AppColors.navy),
            ),
          ),
        ],
      );
    }

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      child: AccSheet(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child:
                      _jarImage != null
                          ? Image.network(
                            ImageUtils.constructImageUrl(_jarImage!),
                            fit: BoxFit.cover,
                            errorBuilder:
                                (_, __, ___) => const DsIconTile(
                                  Icons.savings_outlined,
                                  tone: DsTone.lime,
                                  size: 56,
                                ),
                          )
                          : const DsIconTile(
                            Icons.savings_outlined,
                            tone: DsTone.lime,
                            size: 56,
                          ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _jarName ?? widget.notification.message,
                      style: AccText.h2,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    const Text('Jar invitation', style: DsText.caption),
                  ],
                ),
              ),
            ],
          ),
          Container(
            decoration: BoxDecoration(
              color: AppColors.cream,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  child: Row(
                    children: [
                      Text(
                        'Organizer',
                        style: DsText.small.copyWith(color: AppColors.muted),
                      ),
                      const Spacer(),
                      CircleAvatar(
                        radius: 11,
                        backgroundColor: AppColors.limeSoft,
                        backgroundImage:
                            _creatorPhoto != null
                                ? NetworkImage(
                                  ImageUtils.constructImageUrl(_creatorPhoto!),
                                )
                                : null,
                        child:
                            _creatorPhoto == null
                                ? Text(
                                  (_creatorName?.isNotEmpty == true
                                          ? _creatorName!
                                          : 'S')
                                      .characters
                                      .first
                                      .toUpperCase(),
                                  style: const TextStyle(
                                    fontFamily: 'Supreme',
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.navy,
                                  ),
                                )
                                : null,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          _creatorName?.isNotEmpty == true
                              ? _creatorName!
                              : 'Someone',
                          style: DsText.rowTitle.copyWith(fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: AppColors.line),
                const DsKeyValue('Your role', 'Collector'),
              ],
            ),
          ),
          if (_jarDescription != null && _jarDescription!.isNotEmpty)
            Flexible(
              child: SingleChildScrollView(
                child: Text(_jarDescription!, style: DsText.small),
              ),
            ),
          AccHelp(
            'Only accept if you know this organizer.',
            linkText: 'Report',
            onLink: () => Navigator.of(context).pop('report'),
          ),
          Row(
            spacing: 10,
            children: [
              Expanded(
                child: AppButton(
                  text: 'Decline',
                  backgroundColor: AppColors.surfaceWhite,
                  textColor: AppColors.navy,
                  borderColor: AppColors.line,
                  variant: ButtonVariant.outline,
                  onPressed: () => Navigator.of(context).pop('decline'),
                ),
              ),
              Expanded(
                child: AppButton(
                  text: 'Accept',
                  onPressed: () => Navigator.of(context).pop('accept'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
