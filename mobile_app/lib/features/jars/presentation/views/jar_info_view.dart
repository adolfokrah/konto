import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_images.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/alert_bottom_sheet.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/custom_cupertino_switch.dart';
import 'package:Hoga/core/widgets/operation_complete_modal.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart'
    hide MediaModel;
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_group_picker.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/media/data/models/media_model.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class JarInfoView extends StatefulWidget {
  const JarInfoView({super.key});

  @override
  State<JarInfoView> createState() => _JarInfoViewState();
}

class _JarInfoViewState extends State<JarInfoView> {
  final ScrollController _scrollController = ScrollController();
  bool _showTitle = false;
  bool _isBreakingJar = false;
  List<MediaModel> _photos = [];
  bool _photosInitialized = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Show title when user has scrolled past the header (around 80px)
    const threshold = 80.0;
    if (_scrollController.offset > threshold && !_showTitle) {
      setState(() {
        _showTitle = true;
      });
    } else if (_scrollController.offset <= threshold && _showTitle) {
      setState(() {
        _showTitle = false;
      });
    }
  }

  void _showImageUploaderSheet() {
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.jarImage,
      maxImages: 3 - _photos.length,
    );
  }

  void _removePhoto(int index, String jarId) {
    final newPhotos = List<MediaModel>.from(_photos)..removeAt(index);
    setState(() => _photos = newPhotos);
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(
        jarId: jarId,
        updates: {
          'images': newPhotos.map((m) => {'image': m.id}).toList(),
        },
      ),
    );
  }

  void _showJarGroupPicker(String currentJarGroup, String jarId) {
    JarGroupPicker.show(
      context,
      currentJarGroup: currentJarGroup,
      onJarGroupSelected: (String selectedGroup) {
        context.read<UpdateJarBloc>().add(
          UpdateJarRequested(
            jarId: jarId,
            updates: {'jarGroup': selectedGroup},
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    return MultiBlocListener(
      listeners: [
        BlocListener<JarSummaryBloc, JarSummaryState>(
          listener: (context, state) {
            if (_isBreakingJar) {
              context.pop();
            }
          },
        ),
        BlocListener<MediaBloc, MediaState>(
          listener: (context, state) {
            if (state is MediaLoaded &&
                state.context == MediaUploadContext.jarImage) {
              if (_photos.length < 3) {
                final jarState = context.read<JarSummaryBloc>().state;
                if (jarState is JarSummaryLoaded) {
                  final newPhotos = <MediaModel>[..._photos, state.media];
                  setState(() => _photos = newPhotos);
                  context.read<UpdateJarBloc>().add(
                    UpdateJarRequested(
                      jarId: jarState.jarData.id,
                      updates: {
                        'images':
                            newPhotos.map((m) => {'image': m.id}).toList(),
                      },
                    ),
                  );
                }
              }
            } else if (state is MediaError) {
              AppSnackBar.showError(context, message: state.errorMessage);
            }
          },
        ),
        BlocListener<UpdateJarBloc, UpdateJarState>(
          listener: (context, state) {
            if (state is UpdateJarSuccess) {
              // Skip refresh for silent updates (e.g. photo uploads — UI already updated locally)
              if (!state.silent) {
                context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
              }
              // If we were breaking a jar, show success modal and then navigate
              if (_isBreakingJar) {
                _isBreakingJar = false;
                // Show success modal
                OperationCompleteModal.show(
                  context,
                  image: ColorFiltered(
                    colorFilter: ColorFilter.mode(
                      Theme.of(context).brightness == Brightness.dark
                          ? Colors.white
                          : Colors.black,
                      BlendMode.srcIn,
                    ),
                    child: Image.asset(
                      AppImages.brokenJar,
                      width: 220,
                      height: 220,
                      fit: BoxFit.contain,
                    ),
                  ),
                  title: localizations.jarBroken,
                  subtitle: localizations.jarBrokenDescription,
                  buttonText: localizations.okay,
                  onButtonPressed: () {
                    context.read<JarSummaryBloc>().add(
                      ClearCurrentJarRequested(),
                    );
                    Navigator.of(context).pop();
                    context.pop(); // Go back to previous screen
                  },
                );
              }
            } else if (state is UpdateJarFailure) {
              AppSnackBar.showError(context, message: state.errorMessage);
              _isBreakingJar = false; // Reset the flag on failure too
            }
          },
        ),
      ],
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is JarSummaryLoading) {
            return Scaffold(
              body: Center(
                child: CircularProgressIndicator(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            );
          }

          if (state is JarSummaryError) {
            return Scaffold(
              body: Center(
                child: Text('${localizations.error}: ${state.message}'),
              ),
            );
          }

          if (state is! JarSummaryLoaded) {
            return Scaffold(
              body: Center(child: Text(localizations.noJarDataAvailable)),
            );
          }

          final jarData = state.jarData;

          return Scaffold(
            appBar: AppBar(
              title:
                  _showTitle
                      ? Text(
                        jarData.name,
                        style: TextStyle(
                          color: Theme.of(context).textTheme.bodyLarge?.color,
                          fontSize: 16,
                        ),
                      )
                      : null,
            ),
            body: Stack(
              children: [
                SingleChildScrollView(
                  controller: _scrollController,
                  child: Column(
                    children: [
                      // Collapsible app bar that shows jar name when scrolled
                      Container(
                        color: Theme.of(context).scaffoldBackgroundColor,
                        padding: const EdgeInsets.only(
                          left: AppSpacing.spacingXs,
                          right: AppSpacing.spacingXs,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Title and amount - Large when expanded
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Flexible(
                                    child: Text(
                                      jarData.name,
                                      style: TextStyles.titleMedium,
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Flexible(
                                    child: Text(
                                      '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${jarData.balanceBreakDown.totalContributedAmount.toStringAsFixed(2)}',
                                      style: TextStyles.titleBoldXl,
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            CircleAvatar(
                              radius: 30,
                              backgroundColor:
                                  Theme.of(context).colorScheme.primary,
                              child: Icon(
                                Icons.wallet,
                                size: 18,
                                color:
                                    Theme.of(
                                      context,
                                    ).textTheme.bodyLarge?.color,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Content as slivers
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 40,
                        ),
                        child: Container(
                          child: Column(
                            children: <Widget>[
                              // Jar group and Currency info
                              AppCard(
                                variant: CardVariant.secondary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.spacingM,
                                ),
                                child: Column(
                                  children: [
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      onTap:
                                          () => _showJarGroupPicker(
                                            jarData.jarGroup ??
                                                localizations.other,
                                            jarData.id,
                                          ),
                                      dense: true,
                                      title: Text(
                                        localizations.jarGroup,
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      subtitle: Text(
                                        jarData.jarGroup ??
                                            localizations.notAvailable,
                                        style: AppTextStyles.titleMediumS,
                                      ),
                                      trailing: Icon(Icons.chevron_right),
                                    ),
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      title: Text(
                                        localizations.currency,
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      trailing: Text(
                                        jarData.currency.toUpperCase(),
                                        style: AppTextStyles.titleMediumS,
                                      ),
                                    ),
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      title: Text(
                                        localizations.status,
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      trailing: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(
                                            jarData.status,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                        ),
                                        child: Text(
                                          jarData.statusDisplayName,
                                          style: AppTextStyles.titleMediumS
                                              .copyWith(
                                                color: Colors.white,
                                                fontSize: 10,
                                              ),
                                          overflow: TextOverflow.ellipsis,
                                          maxLines: 1,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: AppSpacing.spacingXs),

                              // Initialize photos from jar data on first build
                              Builder(
                                builder: (context) {
                                  if (!_photosInitialized) {
                                    WidgetsBinding.instance
                                        .addPostFrameCallback((_) {
                                          if (mounted) {
                                            setState(() {
                                              _photos =
                                                  jarData.images
                                                      .map(
                                                        (m) => MediaModel(
                                                          id: m.id,
                                                          alt: m.alt,
                                                          url: m.url,
                                                          filename: m.filename,
                                                          updatedAt:
                                                              m.updatedAt ??
                                                              DateTime.now(),
                                                          createdAt:
                                                              m.createdAt ??
                                                              DateTime.now(),
                                                        ),
                                                      )
                                                      .toList();
                                              _photosInitialized = true;
                                            });
                                          }
                                        });
                                  }
                                  return const SizedBox.shrink();
                                },
                              ),

                              AppCard(
                                variant: CardVariant.secondary,
                                padding: const EdgeInsets.symmetric(
                                  vertical: AppSpacing.spacingM,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppSpacing.spacingM,
                                      ),
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'Additional Photos',
                                            style: AppTextStyles.titleMedium,
                                          ),
                                          Icon(
                                            Icons.chevron_right,
                                            color: Theme.of(context)
                                                .textTheme
                                                .bodySmall!
                                                .color
                                                ?.withValues(alpha: 0.4),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: AppSpacing.spacingS),
                                    SingleChildScrollView(
                                      scrollDirection: Axis.horizontal,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppSpacing.spacingM,
                                      ),
                                      child: Row(
                                        children: [
                                          ..._photos.asMap().entries.map((
                                            entry,
                                          ) {
                                            final i = entry.key;
                                            final photo = entry.value;
                                            final photoUrl =
                                                photo.url != null
                                                    ? '${BackendConfig.imageBaseUrl}${photo.url}'
                                                    : null;
                                            return Padding(
                                              padding: const EdgeInsets.only(
                                                right: 8,
                                              ),
                                              child: Stack(
                                                clipBehavior: Clip.none,
                                                children: [
                                                  ClipRRect(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          8,
                                                        ),
                                                    child:
                                                        photoUrl != null
                                                            ? Image.network(
                                                              photoUrl,
                                                              width: 44,
                                                              height: 44,
                                                              fit: BoxFit.cover,
                                                              errorBuilder:
                                                                  (
                                                                    _,
                                                                    __,
                                                                    ___,
                                                                  ) => Container(
                                                                    width: 44,
                                                                    height: 44,
                                                                    decoration: BoxDecoration(
                                                                      color:
                                                                          Theme.of(
                                                                            context,
                                                                          ).colorScheme.surfaceContainerHighest,
                                                                      borderRadius:
                                                                          BorderRadius.circular(
                                                                            8,
                                                                          ),
                                                                    ),
                                                                    child: Icon(
                                                                      Icons
                                                                          .broken_image_outlined,
                                                                      size: 28,
                                                                      color:
                                                                          Theme.of(
                                                                            context,
                                                                          ).colorScheme.outline,
                                                                    ),
                                                                  ),
                                                            )
                                                            : Container(
                                                              width: 110,
                                                              height: 110,
                                                              decoration: BoxDecoration(
                                                                color:
                                                                    Theme.of(
                                                                          context,
                                                                        )
                                                                        .colorScheme
                                                                        .surfaceContainerHighest,
                                                                borderRadius:
                                                                    BorderRadius.circular(
                                                                      8,
                                                                    ),
                                                              ),
                                                            ),
                                                  ),
                                                  Positioned(
                                                    top: -8,
                                                    right: -8,
                                                    child: GestureDetector(
                                                      onTap:
                                                          () => _removePhoto(
                                                            i,
                                                            jarData.id,
                                                          ),
                                                      child: Container(
                                                        width: 26,
                                                        height: 26,
                                                        decoration:
                                                            BoxDecoration(
                                                              color:
                                                                  Colors
                                                                      .black87,
                                                              shape:
                                                                  BoxShape
                                                                      .circle,
                                                            ),
                                                        child: Icon(
                                                          Icons.close,
                                                          size: 14,
                                                          color: Colors.white,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            );
                                          }),
                                          if (_photos.length < 3)
                                            GestureDetector(
                                              onTap: _showImageUploaderSheet,
                                              child: Container(
                                                width: 44,
                                                height: 44,
                                                decoration: BoxDecoration(
                                                  color:
                                                      Theme.of(context)
                                                          .colorScheme
                                                          .surfaceContainerHighest,
                                                  borderRadius:
                                                      BorderRadius.circular(8),
                                                  border: Border.all(
                                                    color: Theme.of(context)
                                                        .colorScheme
                                                        .outline
                                                        .withValues(alpha: 0.3),
                                                    width: 1.5,
                                                  ),
                                                ),
                                                child: Icon(
                                                  Icons.add,
                                                  size: 16,
                                                  color:
                                                      Theme.of(
                                                        context,
                                                      ).colorScheme.outline,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: AppSpacing.spacingXs),

                              AppCard(
                                variant: CardVariant.secondary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.spacingM,
                                ),
                                child: Column(
                                  children: [
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      onTap: () {
                                        context.push(
                                          AppRoutes.jarThankYouMessageEdit,
                                        );
                                      },
                                      dense: true,
                                      title: Text(
                                        'Thank You Message',
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      subtitle: Text(
                                        jarData.thankYouMessage?.isNotEmpty ==
                                                true
                                            ? jarData.thankYouMessage!
                                            : 'No thank you message',
                                        style: AppTextStyles.titleMediumS,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      trailing: Icon(Icons.chevron_right),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: AppSpacing.spacingXs),

                              AppCard(
                                variant: CardVariant.secondary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.spacingM,
                                ),
                                child: Column(
                                  children: [
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      onTap: () {
                                        context.push(
                                          AppRoutes.jarDescriptionEdit,
                                        );
                                      },
                                      dense: true,
                                      title: Text(
                                        localizations.description,
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      subtitle: Text(
                                        jarData.description ??
                                            localizations
                                                .noDescriptionAvailable,
                                        style: AppTextStyles.titleMediumS,
                                        overflow: TextOverflow.ellipsis,
                                        maxLines: 2,
                                      ),
                                      trailing: Icon(Icons.chevron_right),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: AppSpacing.spacingXs),
                              AppCard(
                                variant: CardVariant.secondary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.spacingM,
                                ),
                                child: Column(
                                  children: [
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      title: Text(
                                        localizations.isFixedContribution,
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      trailing: CustomCupertinoSwitch(
                                        defaultValue:
                                            jarData.isFixedContribution,
                                        onChanged: (value) {
                                          if (state is UpdateJarInProgress)
                                            return;
                                          final updates = <String, dynamic>{
                                            'isFixedContribution': value,
                                          };

                                          // Only set acceptedContributionAmount when enabling fixed contribution
                                          if (value) {
                                            // Set to current amount if it exists, otherwise a default
                                            updates['acceptedContributionAmount'] =
                                                jarData.acceptedContributionAmount >
                                                        0
                                                    ? jarData
                                                        .acceptedContributionAmount
                                                    : 10.0; // Reasonable default
                                          } else {
                                            // When disabling fixed contribution, clear the amount
                                            updates['acceptedContributionAmount'] =
                                                null;
                                          }

                                          context.read<UpdateJarBloc>().add(
                                            UpdateJarRequested(
                                              jarId: jarData.id,
                                              updates: updates,
                                            ),
                                          );
                                        },
                                      ),
                                    ),

                                    if (jarData.isFixedContribution)
                                      ListTile(
                                        contentPadding: EdgeInsets.zero,
                                        onTap: () {
                                          context.push(
                                            AppRoutes
                                                .jarFixedContributionAmountEdit,
                                          );
                                        },
                                        dense: true,
                                        title: Text(
                                          localizations.fixedContributionAmount,
                                          style: AppTextStyles.titleMediumS
                                              .copyWith(
                                                color: Theme.of(context)
                                                    .textTheme
                                                    .bodySmall!
                                                    .color
                                                    ?.withValues(alpha: 0.5),
                                              ),
                                        ),
                                        subtitle: Text(
                                          '${CurrencyUtils.getCurrencySymbol(jarData.currency)}${jarData.acceptedContributionAmount.toStringAsFixed(2)}',
                                          style: AppTextStyles.titleMediumS,
                                          overflow: TextOverflow.ellipsis,
                                          maxLines: 1,
                                        ),
                                        trailing: Icon(Icons.chevron_right),
                                      ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: AppSpacing.spacingXs),
                              AppCard(
                                variant: CardVariant.secondary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.spacingM,
                                ),
                                child: Column(
                                  children: [
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      title: Text(
                                        "Show jar Goal",
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      subtitle: Text(
                                        'Display jar goal on payment page',
                                      ),
                                      trailing: CustomCupertinoSwitch(
                                        defaultValue: jarData.showGoal ?? false,
                                        onChanged: (value) {
                                          if (state is UpdateJarInProgress) {
                                            return;
                                          }

                                          final updates = <String, dynamic>{
                                            'showGoal': value,
                                          };

                                          context.read<UpdateJarBloc>().add(
                                            UpdateJarRequested(
                                              jarId: jarData.id,
                                              updates: updates,
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      title: Text(
                                        "Allow Anonymous Contributions",
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      subtitle: Text(
                                        'Allow people to contribute without providing their name and phone number',
                                      ),
                                      trailing: CustomCupertinoSwitch(
                                        defaultValue:
                                            jarData
                                                .allowAnonymousContributions ??
                                            false,
                                        onChanged: (value) {
                                          if (state is UpdateJarInProgress) {
                                            return;
                                          }

                                          final updates = <String, dynamic>{
                                            'allowAnonymousContributions':
                                                value,
                                          };

                                          context.read<UpdateJarBloc>().add(
                                            UpdateJarRequested(
                                              jarId: jarData.id,
                                              updates: updates,
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      title: Text(
                                        "Show Recent Contributions",
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      subtitle: Text(
                                        'Display jar recent contributions on payment page',
                                      ),
                                      trailing: CustomCupertinoSwitch(
                                        defaultValue:
                                            jarData.showRecentContributions ??
                                            false,
                                        onChanged: (value) {
                                          if (state is UpdateJarInProgress) {
                                            return;
                                          }

                                          final updates = <String, dynamic>{
                                            'showRecentContributions': value,
                                          };

                                          context.read<UpdateJarBloc>().add(
                                            UpdateJarRequested(
                                              jarId: jarData.id,
                                              updates: updates,
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                    ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      dense: true,
                                      title: Text(
                                        'Collection Fee Paid By',
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      subtitle: Text(
                                        jarData.collectionFeePaidBy == 'jar-creator'
                                            ? 'Jar Creator'
                                            : 'Contributor',
                                      ),
                                      trailing: CustomCupertinoSwitch(
                                        defaultValue:
                                            jarData.collectionFeePaidBy ==
                                            'jar-creator',
                                        onChanged: (value) {
                                          if (state is UpdateJarInProgress) {
                                            return;
                                          }

                                          context.read<UpdateJarBloc>().add(
                                            UpdateJarRequested(
                                              jarId: jarData.id,
                                              updates: {
                                                'collectionFeePaidBy':
                                                    value ? 'jar-creator' : 'contributor',
                                              },
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Custom Fields
                              if (jarData.isCreator) ...[
                                const SizedBox(height: AppSpacing.spacingXs),
                                AppCard(
                                  variant: CardVariant.secondary,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: AppSpacing.spacingM,
                                  ),
                                  child: ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    dense: true,
                                    onTap: () => context.push(
                                      '${AppRoutes.jarCustomFields}?jarId=${jarData.id}',
                                    ),
                                    title: Text(
                                      'Custom Fields',
                                      style: AppTextStyles.titleMediumS,
                                    ),
                                    subtitle: Text(
                                      '${jarData.customFields?.length ?? 0} field${(jarData.customFields?.length ?? 0) == 1 ? '' : 's'}',
                                    ),
                                    trailing: const Icon(Icons.chevron_right),
                                  ),
                                ),
                              ],

                              // Required Approvals — only show when jar has admin collectors
                              // if ((jarData.invitedCollectors ?? []).any(
                              //   (ic) =>
                              //       ic.role == 'admin' &&
                              //       ic.status == 'accepted',
                              // )) ...[
                              //   const SizedBox(height: AppSpacing.spacingXs),
                              //   AppCard(
                              //     variant: CardVariant.secondary,
                              //     padding: const EdgeInsets.symmetric(
                              //       horizontal: AppSpacing.spacingM,
                              //     ),
                              //     child: ListTile(
                              //       contentPadding: EdgeInsets.zero,
                              //       dense: true,
                              //       title: Text(
                              //         'Required Approvals',
                              //         style: AppTextStyles.titleMediumS
                              //             .copyWith(
                              //               color: Theme.of(context)
                              //                   .textTheme
                              //                   .bodySmall!
                              //                   .color
                              //                   ?.withValues(alpha: 0.5),
                              //             ),
                              //       ),
                              //       subtitle: Text(
                              //         'Number of admin approvals needed before a payout is processed',
                              //       ),
                              //       trailing: Row(
                              //         mainAxisSize: MainAxisSize.min,
                              //         children: [
                              //           IconButton(
                              //             icon: Icon(Icons.remove_circle_outline),
                              //             onPressed:
                              //                 jarData.requiredApprovals <= 1
                              //                     ? null
                              //                     : () {
                              //                       context
                              //                           .read<UpdateJarBloc>()
                              //                           .add(
                              //                             UpdateJarRequested(
                              //                               jarId: jarData.id,
                              //                               updates: {
                              //                                 'requiredApprovals':
                              //                                     jarData.requiredApprovals -
                              //                                         1,
                              //                               },
                              //                             ),
                              //                           );
                              //                     },
                              //           ),
                              //           Text(
                              //             '${jarData.requiredApprovals}',
                              //             style: AppTextStyles.titleMediumS
                              //                 .copyWith(
                              //                   fontWeight: FontWeight.w600,
                              //                 ),
                              //           ),
                              //           IconButton(
                              //             icon: Icon(Icons.add_circle_outline),
                              //             onPressed: () {
                              //               final adminCount =
                              //                   (jarData.invitedCollectors ?? [])
                              //                       .where(
                              //                         (ic) =>
                              //                             ic.role == 'admin' &&
                              //                             ic.status ==
                              //                                 'accepted',
                              //                       )
                              //                       .length;
                              //               if (jarData.requiredApprovals >=
                              //                   adminCount) {
                              //                 AppSnackBar.showError(
                              //                   context,
                              //                   message:
                              //                       'Cannot exceed $adminCount — you only have $adminCount admin collector${adminCount == 1 ? '' : 's'}',
                              //                 );
                              //                 return;
                              //               }
                              //               context.read<UpdateJarBloc>().add(
                              //                 UpdateJarRequested(
                              //                   jarId: jarData.id,
                              //                   updates: {
                              //                     'requiredApprovals':
                              //                         jarData.requiredApprovals +
                              //                             1,
                              //                   },
                              //                 ),
                              //               );
                              //             },
                              //           ),
                              //         ],
                              //       ),
                              //     ),
                              //   ),
                              // ],
                              const SizedBox(height: AppSpacing.spacingXs),

                              Opacity(
                                opacity: jarData.isJarFrozen ? 0.4 : 1.0,
                                child: IgnorePointer(
                                  ignoring: jarData.isJarFrozen,
                                  child: AppCard(
                                    variant: CardVariant.secondary,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.spacingM,
                                    ),
                                    child: Column(
                                      children: [
                                        ListTile(
                                          onTap: () {
                                            final isCurrentlyClosed =
                                                jarData.status ==
                                                JarStatus.sealed;
                                            AlertBottomSheet.show(
                                              context: context,
                                              title:
                                                  isCurrentlyClosed
                                                      ? localizations.reopenJar
                                                      : localizations.sealJar,
                                              message:
                                                  isCurrentlyClosed
                                                      ? localizations
                                                          .reopenJarMessage
                                                      : localizations
                                                          .sealJarMessage,
                                              confirmText:
                                                  isCurrentlyClosed
                                                      ? localizations.reopen
                                                      : localizations.seal,
                                              onConfirm: () {
                                                // Handle jar closing/reopening logic
                                                final newStatus =
                                                    jarData.status ==
                                                            JarStatus.sealed
                                                        ? 'open'
                                                        : 'sealed';

                                                context
                                                    .read<UpdateJarBloc>()
                                                    .add(
                                                      UpdateJarRequested(
                                                        jarId: jarData.id,
                                                        updates: {
                                                          'status': newStatus,
                                                        },
                                                      ),
                                                    );
                                              },
                                            );
                                          },
                                          contentPadding: EdgeInsets.zero,
                                          dense: true,
                                          title: Text(
                                            jarData.status == JarStatus.sealed
                                                ? localizations.reopenJar
                                                : localizations.sealJar,
                                            style: AppTextStyles.titleMediumS,
                                          ),
                                          trailing: Icon(Icons.chevron_right),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),

                              const SizedBox(height: AppSpacing.spacingXs),

                              Opacity(
                                opacity: jarData.isJarFrozen ? 0.4 : 1.0,
                                child: IgnorePointer(
                                  ignoring: jarData.isJarFrozen,
                                  child: AppCard(
                                    variant: CardVariant.secondary,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.spacingM,
                                    ),
                                    child: Column(
                                      children: [
                                        ListTile(
                                          onTap: () {
                                            AlertBottomSheet.show(
                                              context: context,
                                              title: localizations.breakJar,
                                              message:
                                                  localizations
                                                      .breakJarConfirmationMessage,
                                              confirmText:
                                                  localizations.breakButton,
                                              onConfirm: () {
                                                _isBreakingJar = true;
                                                context
                                                    .read<UpdateJarBloc>()
                                                    .add(
                                                      UpdateJarRequested(
                                                        jarId: jarData.id,
                                                        updates: {
                                                          'status': 'broken',
                                                        },
                                                      ),
                                                    );
                                              },
                                            );
                                          },
                                          contentPadding: EdgeInsets.zero,
                                          dense: true,
                                          title: Text(
                                            localizations.breakJar,
                                            style: AppTextStyles.titleMediumS
                                                .copyWith(
                                                  color: AppColors.errorRed,
                                                ),
                                          ),
                                          trailing: Icon(Icons.chevron_right),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // Loading overlay during jar update
                BlocBuilder<UpdateJarBloc, UpdateJarState>(
                  builder: (context, updateState) {
                    if (updateState is UpdateJarInProgress) {
                      return Positioned.fill(
                        child: Container(
                          color: Colors.black.withOpacity(0.35),
                          alignment: Alignment.center,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircularProgressIndicator(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                localizations.updatingJar,
                                style: Theme.of(context).textTheme.bodyLarge
                                    ?.copyWith(fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Get appropriate color for jar status
  Color _getStatusColor(JarStatus status) {
    switch (status) {
      case JarStatus.open:
        return Colors.green;
      case JarStatus.frozen:
        return Colors.blue;
      case JarStatus.broken:
        return Colors.red;
      case JarStatus.sealed:
        return Colors.grey;
    }
  }
}
