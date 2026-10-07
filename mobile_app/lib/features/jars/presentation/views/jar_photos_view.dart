import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/media/data/models/media_model.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';

/// Upload slot id for the cover photo (the jar's `image`); uploads without it
/// go to the extra photos (`images`, up to [JarPhotosView.maxPhotos]).
const String jarCoverUploadId = 'jarCover';

/// Jar photos, opened from Jar settings: the cover with "Change", and up to
/// three more photos that can be removed and dragged to reorder.
class JarPhotosView extends StatefulWidget {
  static const int maxPhotos = 3;

  const JarPhotosView({super.key});

  @override
  State<JarPhotosView> createState() => _JarPhotosViewState();
}

class _JarPhotosViewState extends State<JarPhotosView> {
  List<MediaModel>? _photos;

  List<MediaModel> _fromJar(JarSummaryState state) {
    if (state is! JarSummaryLoaded) return [];
    return state.jarData.images
        .map(
          (m) => MediaModel(
            id: m.id,
            alt: m.alt,
            url: m.url,
            filename: m.filename,
            updatedAt: m.updatedAt ?? DateTime.now(),
            createdAt: m.createdAt ?? DateTime.now(),
          ),
        )
        .toList();
  }

  void _savePhotos(String jarId, List<MediaModel> photos) {
    setState(() => _photos = photos);
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(
        jarId: jarId,
        updates: {
          'images': photos.map((m) => {'image': m.id}).toList(),
        },
      ),
    );
  }

  void _addPhotos(int count) {
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.jarImage,
      maxImages: JarPhotosView.maxPhotos - count,
    );
  }

  void _changeCover() {
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.jarImage,
      contextId: jarCoverUploadId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<MediaBloc, MediaState>(
      listener: (context, state) {
        if (state is! MediaLoaded ||
            state.context != MediaUploadContext.jarImage) {
          return;
        }
        final jarState = context.read<JarSummaryBloc>().state;
        if (jarState is! JarSummaryLoaded) return;
        final jarId = jarState.jarData.id;
        if (state.contextId == jarCoverUploadId) {
          context.read<UpdateJarBloc>().add(
            UpdateJarRequested(
              jarId: jarId,
              updates: {'imageId': state.media.id},
            ),
          );
          return;
        }
        final photos = _photos ?? _fromJar(jarState);
        if (photos.length < JarPhotosView.maxPhotos) {
          _savePhotos(jarId, [...photos, state.media]);
        }
      },
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          final jarData = state is JarSummaryLoaded ? state.jarData : null;
          final photos = _photos ?? _fromJar(state);
          final coverUrl =
              jarData?.image?.url != null
                  ? ImageUtils.constructImageUrl(jarData!.image!.url!)
                  : null;

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: JarTopBar(
              title: 'Photos',
              actions: [
                JarBarLink('Done', onTap: () => Navigator.of(context).pop()),
              ],
            ),
            body:
                jarData == null
                    ? const DsSkeletonPage(
                      padding: EdgeInsets.fromLTRB(16, 4, 16, 32),
                      children: [
                        DsSkeletonLabel(width: 50),
                        SizedBox(height: 2),
                        DsSkeletonBox(height: 170, radius: 20),
                        SizedBox(height: 16),
                        DsSkeletonLabel(width: 120),
                        SizedBox(height: 2),
                        Row(
                          children: [
                            DsSkeletonBox(width: 100, height: 100, radius: 16),
                            SizedBox(width: 8),
                            DsSkeletonBox(width: 100, height: 100, radius: 16),
                            SizedBox(width: 8),
                            DsSkeletonBox(width: 100, height: 100, radius: 16),
                          ],
                        ),
                      ],
                    )
                    : Stack(
                      children: [
                        ListView(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                          children: [
                            const DsGroupLabel('Cover'),
                            const SizedBox(height: 12),
                            _Cover(imageUrl: coverUrl, onChange: _changeCover),
                            const SizedBox(height: 12),
                            DsGroupLabel(
                              'More photos · ${photos.length} of ${JarPhotosView.maxPhotos}',
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              height: 100,
                              child: ReorderableListView.builder(
                                scrollDirection: Axis.horizontal,
                                buildDefaultDragHandles: false,
                                proxyDecorator:
                                    (child, _, __) => Material(
                                      color: Colors.transparent,
                                      child: child,
                                    ),
                                itemCount: photos.length,
                                onReorder: (oldIndex, newIndex) {
                                  if (newIndex > oldIndex) newIndex--;
                                  final next = [...photos];
                                  next.insert(
                                    newIndex,
                                    next.removeAt(oldIndex),
                                  );
                                  _savePhotos(jarData.id, next);
                                },
                                itemBuilder: (context, i) {
                                  final photo = photos[i];
                                  return ReorderableDelayedDragStartListener(
                                    key: ValueKey(photo.id),
                                    index: i,
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: _PhotoTile(
                                        imageUrl:
                                            photo.url != null
                                                ? '${BackendConfig.imageBaseUrl}${photo.url}'
                                                : null,
                                        onRemove:
                                            () => _savePhotos(
                                              jarData.id,
                                              [...photos]..removeAt(i),
                                            ),
                                      ),
                                    ),
                                  );
                                },
                                footer:
                                    photos.length < JarPhotosView.maxPhotos
                                        ? _AddTile(
                                          onTap:
                                              () => _addPhotos(photos.length),
                                        )
                                        : null,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                              ),
                              child: Text(
                                'Photos show on your contribution page. Hold and drag to reorder.',
                                style: DsText.caption,
                              ),
                            ),
                          ],
                        ),
                        // Busy overlay while chosen photos upload and save.
                        BlocBuilder<MediaBloc, MediaState>(
                          builder: (context, media) {
                            return BlocBuilder<UpdateJarBloc, UpdateJarState>(
                              builder: (context, update) {
                                final busy =
                                    media is MediaLoading ||
                                    update is UpdateJarInProgress;
                                if (!busy) return const SizedBox.shrink();
                                return const JarBusyOverlay(
                                  label: 'Updating photos…',
                                );
                              },
                            );
                          },
                        ),
                      ],
                    ),
          );
        },
      ),
    );
  }
}

class _Cover extends StatelessWidget {
  final String? imageUrl;
  final VoidCallback onChange;

  const _Cover({required this.imageUrl, required this.onChange});

  @override
  Widget build(BuildContext context) {
    final fallback = Center(
      child: Icon(Icons.image_outlined, size: 40, color: AppColors.muted),
    );
    return Container(
      height: 170,
      decoration: BoxDecoration(
        color: AppColors.fill,
        borderRadius: BorderRadius.circular(18),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (imageUrl == null)
            fallback
          else
            Image.network(
              imageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => fallback,
            ),
          Positioned(
            right: 10,
            bottom: 10,
            child: DsSmallButton(
              label: imageUrl == null ? 'Add' : 'Change',
              secondary: true,
              onTap: onChange,
            ),
          ),
        ],
      ),
    );
  }
}

class _PhotoTile extends StatelessWidget {
  final String? imageUrl;
  final VoidCallback onRemove;

  const _PhotoTile({required this.imageUrl, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    final fallback = Center(
      child: Icon(Icons.image_outlined, color: AppColors.muted),
    );
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        color: AppColors.fill,
        borderRadius: BorderRadius.circular(14),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (imageUrl == null)
            fallback
          else
            Image.network(
              imageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => fallback,
            ),
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: AppColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.close_rounded,
                  size: 14,
                  color: AppColors.navy,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddTile extends StatelessWidget {
  final VoidCallback onTap;
  const _AddTile({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFD0D4DB), width: 1.5),
        ),
        child: Icon(Icons.add_rounded, size: 26, color: AppColors.muted),
      ),
    );
  }
}
