import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_images.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/widgets/alert_bottom_sheet.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/operation_complete_modal.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/features/jars/presentation/widgets/jar_group_picker.dart';
import 'package:konto/route.dart';
import 'package:konto/l10n/app_localizations.dart';

class JarInfoView extends StatefulWidget {
  const JarInfoView({super.key});

  @override
  State<JarInfoView> createState() => _JarInfoViewState();
}

class _JarInfoViewState extends State<JarInfoView> {
  final ScrollController _scrollController = ScrollController();
  bool _showTitle = false;
  bool _isBreakingJar = false;

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
              Navigator.pop(context);
            }
          },
        ),
        BlocListener<UpdateJarBloc, UpdateJarState>(
          listener: (context, state) {
            if (state is UpdateJarSuccess) {
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
                    Navigator.pop(context); // Go back to previous screen
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
              body: const Center(child: CircularProgressIndicator()),
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
            body: SingleChildScrollView(
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
                            color: Theme.of(context).textTheme.bodyLarge?.color,
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
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.spacingM,
                            ),
                            child: Column(
                              children: [
                                ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  onTap:
                                      () => _showJarGroupPicker(
                                        jarData.jarGroup ?? localizations.other,
                                        jarData.id,
                                      ),
                                  dense: true,
                                  title: Text(
                                    localizations.jarGroup,
                                    style: AppTextStyles.titleMediumS.copyWith(
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
                                    style: AppTextStyles.titleMediumS.copyWith(
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
                                    style: AppTextStyles.titleMediumS.copyWith(
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
                                      color: _getStatusColor(jarData.status),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      jarData.statusDisplayName,
                                      style: AppTextStyles.titleMediumS
                                          .copyWith(
                                            color: Colors.white,
                                            fontSize: 10,
                                          ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: AppSpacing.spacingXs),

                          // Description
                          AppCard(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.spacingM,
                            ),
                            child: Column(
                              children: [
                                ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  onTap: () {
                                    Navigator.pushNamed(
                                      context,
                                      AppRoutes.jarDescriptionEdit,
                                    );
                                  },
                                  dense: true,
                                  title: Text(
                                    localizations.description,
                                    style: AppTextStyles.titleMediumS.copyWith(
                                      color: Theme.of(context)
                                          .textTheme
                                          .bodySmall!
                                          .color
                                          ?.withValues(alpha: 0.5),
                                    ),
                                  ),
                                  subtitle: Text(
                                    jarData.description ??
                                        localizations.noDescriptionAvailable,
                                    style: AppTextStyles.titleMediumS,
                                  ),
                                  trailing: Icon(Icons.chevron_right),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: AppSpacing.spacingXs),

                          AppCard(
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
                                    style: AppTextStyles.titleMediumS.copyWith(
                                      color: Theme.of(context)
                                          .textTheme
                                          .bodySmall!
                                          .color
                                          ?.withValues(alpha: 0.5),
                                    ),
                                  ),
                                  trailing: CupertinoSwitch(
                                    value: jarData.isFixedContribution,
                                    onChanged: (value) {
                                      if (state is UpdateJarInProgress) return;
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
                                      Navigator.pushNamed(
                                        context,
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
                                    ),
                                    trailing: Icon(Icons.chevron_right),
                                  ),
                              ],
                            ),
                          ),

                          const SizedBox(height: AppSpacing.spacingXs),

                          AppCard(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.spacingM,
                            ),
                            child: Column(
                              children: [
                                ListTile(
                                  onTap: () {
                                    final isCurrentlyClosed =
                                        jarData.status == JarStatus.sealed;
                                    AlertBottomSheet.show(
                                      context: context,
                                      title:
                                          isCurrentlyClosed
                                              ? localizations.reopenJar
                                              : localizations.sealJar,
                                      message:
                                          isCurrentlyClosed
                                              ? localizations.reopenJarMessage
                                              : localizations.sealJarMessage,
                                      confirmText:
                                          isCurrentlyClosed
                                              ? localizations.reopen
                                              : localizations.seal,
                                      onConfirm: () {
                                        // Handle jar closing/reopening logic
                                        final newStatus =
                                            jarData.status == JarStatus.sealed
                                                ? 'open'
                                                : 'sealed';

                                        context.read<UpdateJarBloc>().add(
                                          UpdateJarRequested(
                                            jarId: jarData.id,
                                            updates: {'status': newStatus},
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

                          const SizedBox(height: AppSpacing.spacingXs),

                          AppCard(
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
                                      confirmText: localizations.breakButton,
                                      onConfirm: () {
                                        _isBreakingJar = true;
                                        context.read<UpdateJarBloc>().add(
                                          UpdateJarRequested(
                                            jarId: jarData.id,
                                            updates: {'status': 'broken'},
                                          ),
                                        );
                                      },
                                    );
                                  },
                                  contentPadding: EdgeInsets.zero,
                                  dense: true,
                                  title: Text(
                                    localizations.breakJar,
                                    style: AppTextStyles.titleMediumS.copyWith(
                                      color: AppColors.errorRed,
                                    ),
                                  ),
                                  trailing: Icon(Icons.chevron_right),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
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
      case JarStatus.broken:
        return Colors.red;
      case JarStatus.sealed:
        return Colors.grey;
    }
  }
}
