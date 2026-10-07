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
  String? _jarGroup;
  String? _creatorName;

  /// 'business' / 'person' when the organizer is verified, 'none' when not,
  /// null when the preview didn't say.
  String? _verification;

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
      final response = await getIt<JarApiProvider>().getJarPreview(
        jarId: jarId,
      );

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
        String? verification;
        final creator = jar['creator'];
        if (creator is Map<String, dynamic>) {
          final firstName = creator['firstName'] as String? ?? '';
          final lastName = creator['lastName'] as String? ?? '';
          creatorName = '$firstName $lastName'.trim();

          final isOrg = creator['accountType'] == 'organization';
          final status =
              (isOrg ? creator['kybStatus'] : creator['kycStatus']) as String?;
          if (status != null) {
            verification =
                status == 'verified' ? (isOrg ? 'business' : 'person') : 'none';
          }
        }

        if (mounted) {
          setState(() {
            _jarName = jar['name'] as String?;
            _jarImage = imageUrl;
            _jarGroup = jar['jarGroup'] as String?;
            _creatorName = creatorName;
            _verification = verification;
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
          DsSkeleton(
            onWhite: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    DsSkeletonBox(width: 56, height: 56, radius: 16),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          DsSkeletonLine(width: 160, height: 16),
                          SizedBox(height: 8),
                          DsSkeletonLine(width: 110, height: 11),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 20),
                DsSkeletonLine(height: 11),
                SizedBox(height: 6),
                DsSkeletonLine(width: 220, height: 11),
                SizedBox(height: 20),
                DsSkeletonBox(height: 52, radius: 14),
              ],
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
                    Text(
                      _jarGroup?.isNotEmpty == true
                          ? _jarGroup!
                          : 'Jar invitation',
                      style: DsText.caption,
                    ),
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
                DsKeyValue(
                  'Organizer',
                  _creatorName?.isNotEmpty == true ? _creatorName! : 'Someone',
                ),
                if (_verification != null) ...[
                  const Divider(height: 1, color: AppColors.line),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    child: Row(
                      children: [
                        Text(
                          'Status',
                          style: DsText.small.copyWith(color: AppColors.muted),
                        ),
                        const Spacer(),
                        switch (_verification) {
                          'business' => const DsTag(
                            'Verified business',
                            tone: DsTone.positive,
                          ),
                          'person' => const DsTag(
                            'Verified',
                            tone: DsTone.positive,
                          ),
                          _ => const DsTag('Not verified'),
                        },
                      ],
                    ),
                  ),
                ],
                const Divider(height: 1, color: AppColors.line),
                const DsKeyValue('Your role', 'Collector'),
              ],
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
