import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import '../../logic/bloc/media_bloc.dart';

/// A bottom sheet widget for selecting and uploading images (camera or gallery)
/// The uploaded image data can be accessed via MediaBloc state
/// Alt text is automatically generated from the image filename
///
/// Usage example:
/// ```dart
/// ImageUploaderBottomSheet.show(context, context: MediaUploadContext.userPhoto);
/// ```
class ImageUploaderBottomSheet extends StatefulWidget {
  final MediaUploadContext uploadContext;
  final int maxImages;

  /// Target Payload collection endpoint. Defaults to `media`. Pass
  /// `business-documents` to upload to the private business documents
  /// collection instead.
  final String collection;

  /// Optional identifier for the specific upload slot, echoed back on
  /// [MediaLoaded] so the caller can tell which upload finished.
  final String? contextId;

  /// When true, also offer a "Choose file" option (PDF or image) via the
  /// system file picker. Used for document uploads (e.g. KYB). Default false.
  final bool allowFiles;

  const ImageUploaderBottomSheet({
    super.key,
    this.uploadContext = MediaUploadContext.general,
    this.maxImages = 1,
    this.collection = 'media',
    this.contextId,
    this.allowFiles = false,
  });

  static void show(
    BuildContext context, {
    MediaUploadContext uploadContext = MediaUploadContext.general,
    int maxImages = 1,
    String collection = 'media',
    String? contextId,
    bool allowFiles = false,
  }) {
    HapticUtils.light();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => ImageUploaderBottomSheet(
            uploadContext: uploadContext,
            maxImages: maxImages,
            collection: collection,
            contextId: contextId,
            allowFiles: allowFiles,
          ),
    );
  }

  @override
  State<ImageUploaderBottomSheet> createState() =>
      _ImageUploaderBottomSheetState();
}

class _ImageUploaderBottomSheetState extends State<ImageUploaderBottomSheet> {
  MediaUploadContext get uploadContext => widget.uploadContext;
  int get maxImages => widget.maxImages;
  String get collection => widget.collection;
  String? get contextId => widget.contextId;
  bool get allowFiles => widget.allowFiles;

  /// The file being uploaded, shown in the progress row.
  XFile? _picked;

  void _upload(BuildContext context, XFile file, String alt) {
    if (mounted) setState(() => _picked = file);
    context.read<MediaBloc>().add(
      RequestUploadMedia(
        imageFile: file,
        alt: alt,
        context: uploadContext,
        collection: collection,
        contextId: contextId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return BlocListener<MediaBloc, MediaState>(
      listener: (context, state) {
        if (state is MediaLoaded) {
          Navigator.pop(context);
          // MediaModel can be accessed via BlocProvider.of<MediaBloc>(context).state
        } else if (state is MediaError) {
          Navigator.pop(context);
          AppSnackBar.showError(
            context,
            message: '${l10n.uploadFailed}: ${state.errorMessage}',
          );
        }
      },
      child: BlocBuilder<MediaBloc, MediaState>(
        builder: (context, state) {
          final uploading = state is MediaLoading;
          final isImage =
              _picked != null &&
              RegExp(
                r'\.(jpe?g|png|heic|webp)$',
                caseSensitive: false,
              ).hasMatch(_picked!.name);
          return AccSheet(
            children: [
              Text(
                allowFiles ? l10n.uploadImage : 'Add photo',
                style: AccText.h2,
              ),
              IgnorePointer(
                ignoring: uploading,
                child: Opacity(
                  opacity: uploading ? 0.5 : 1,
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.cream,
                      borderRadius: BorderRadius.circular(AppRadius.radiusCard),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        _buildOptionTile(
                          context,
                          icon: Icons.photo_camera_outlined,
                          title: 'Take photo',
                          onTap:
                              () => _handleImageSelection(
                                context,
                                ImageSource.camera,
                              ),
                        ),
                        const Divider(height: 1, color: AppColors.line),
                        _buildOptionTile(
                          context,
                          icon: Icons.image_outlined,
                          title: 'Choose from library',
                          onTap:
                              () => _handleImageSelection(
                                context,
                                ImageSource.gallery,
                              ),
                        ),
                        if (allowFiles) ...[
                          const Divider(height: 1, color: AppColors.line),
                          _buildOptionTile(
                            context,
                            icon: Icons.insert_drive_file_outlined,
                            title: 'Upload file',
                            onTap: () => _handleFileSelection(context),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              if (uploading)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.cream,
                          borderRadius: BorderRadius.circular(9),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child:
                            isImage
                                ? Image.file(
                                  File(_picked!.path),
                                  fit: BoxFit.cover,
                                  errorBuilder:
                                      (_, __, ___) => const Icon(
                                        Icons.image_outlined,
                                        size: 18,
                                        color: AppColors.navy,
                                      ),
                                )
                                : const Icon(
                                  Icons.insert_drive_file_outlined,
                                  size: 18,
                                  color: AppColors.navy,
                                ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _picked != null
                                  ? '${_picked!.name} · ${l10n.uploadingImage}'
                                  : l10n.uploadingImage,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: DsText.caption,
                            ),
                            const SizedBox(height: 4),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: const LinearProgressIndicator(
                                minHeight: 6,
                                backgroundColor: AppColors.cream,
                                color: AppColors.navy,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _handleImageSelection(BuildContext context, ImageSource source) async {
    HapticUtils.light();
    try {
      final picker = ImagePicker();

      if (source == ImageSource.gallery && maxImages > 1) {
        final images = await picker.pickMultiImage(
          imageQuality: 85,
          limit: maxImages,
        );

        if (images.isNotEmpty && context.mounted) {
          Navigator.pop(context);
          for (final image in images) {
            String altText = image.name.replaceAll(' ', '-');
            if (altText.contains('.')) {
              altText = altText.substring(0, altText.lastIndexOf('.'));
            }
            if (context.mounted) {
              context.read<MediaBloc>().add(
                RequestUploadMedia(
                  imageFile: image,
                  alt: altText,
                  context: uploadContext,
                  collection: collection,
                  contextId: contextId,
                ),
              );
            }
          }
        } else if (context.mounted) {
          Navigator.pop(context);
        }
      } else {
        final XFile? image = await picker.pickImage(
          source: source,
          imageQuality: 85,
          maxWidth: 1920,
          maxHeight: 1920,
        );

        if (image != null && context.mounted) {
          String generatedAltText = image.name.replaceAll(' ', '-');
          if (generatedAltText.contains('.')) {
            generatedAltText = generatedAltText.substring(
              0,
              generatedAltText.lastIndexOf('.'),
            );
          }
          _upload(context, image, generatedAltText);
        } else if (context.mounted) {
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        AppSnackBar.showError(context, message: 'Error selecting image: $e');
      }
    }
  }

  /// Pick a PDF or image file via the system file picker and upload it.
  void _handleFileSelection(BuildContext context) async {
    HapticUtils.light();
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        withData: false,
      );

      final path = result?.files.single.path;
      if (path == null) {
        if (context.mounted) Navigator.pop(context);
        return;
      }

      final file = XFile(path);
      String altText = file.name.replaceAll(' ', '-');
      if (altText.contains('.')) {
        altText = altText.substring(0, altText.lastIndexOf('.'));
      }
      if (context.mounted) _upload(context, file, altText);
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        AppSnackBar.showError(context, message: 'Error selecting file: $e');
      }
    }
  }

  Widget _buildOptionTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return DsRow(
      leading: AccRowIcon(icon, background: AppColors.surfaceWhite),
      title: title,
      subtitle: subtitle,
      onTap: onTap,
    );
  }
}
