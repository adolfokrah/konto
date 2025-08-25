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
import 'package:konto/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/features/jars/presentation/widgets/jar_group_picker.dart';

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
              context.read<JarSummaryReloadBloc>().add(
                ReloadJarSummaryRequested(),
              );

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
                  title: 'Jar Broken',
                  subtitle:
                      'The jar has been permanently broken and can no longer be accessed.',
                  buttonText: 'Okay',
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
              backgroundColor: const Color(0xFFEBE2D7),
              body: const Center(child: CircularProgressIndicator()),
            );
          }

          if (state is JarSummaryError) {
            return Scaffold(
              backgroundColor: const Color(0xFFEBE2D7),
              body: Center(child: Text('Error: ${state.message}')),
            );
          }

          if (state is! JarSummaryLoaded) {
            return Scaffold(
              backgroundColor: const Color(0xFFEBE2D7),
              body: const Center(child: Text('No jar data available')),
            );
          }

          final jarData = state.jarData;

          return Scaffold(
            body: CustomScrollView(
              controller: _scrollController,
              slivers: [
                // Collapsible app bar that shows jar name when scrolled
                SliverAppBar(
                  expandedHeight: 140.0,
                  floating: false,
                  pinned: true,
                  backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                  foregroundColor: Theme.of(context).textTheme.bodyLarge?.color,
                  elevation: 0,
                  title:
                      _showTitle
                          ? Text(
                            jarData.name,
                            style: TextStyle(
                              color:
                                  Theme.of(context).textTheme.bodyLarge?.color,
                              fontSize: 16,
                            ),
                          )
                          : null, // Only show title when scrolled
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      color: Theme.of(context).scaffoldBackgroundColor,
                      padding: const EdgeInsets.only(
                        top: 120,
                        left: 17,
                        right: 17,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title and amount - Large when expanded
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  jarData.name,
                                  style: TextStyles.titleMedium,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${jarData.totalContributedAmount.toStringAsFixed(2)}',
                                  style: TextStyles.titleBoldXl,
                                ),
                              ],
                            ),
                          ),

                          CircleAvatar(
                            radius: 30,
                            backgroundColor:
                                Theme.of(context).colorScheme.primary,
                            child: Icon(
                              Icons.local_drink,
                              size: 18,
                              color:
                                  Theme.of(context).textTheme.bodyLarge?.color,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Content as slivers
                SliverPadding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 40,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
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
                                    jarData.jarGroup ?? 'Other',
                                    jarData.id,
                                  ),
                              dense: true,
                              title: Text(
                                'Jar group',
                                style: AppTextStyles.titleMediumS.copyWith(
                                  color: Theme.of(context)
                                      .textTheme
                                      .bodySmall!
                                      .color
                                      ?.withValues(alpha: 0.5),
                                ),
                              ),
                              subtitle: Text(
                                jarData.jarGroup ?? 'N/A',
                                style: AppTextStyles.titleMediumS,
                              ),
                              trailing: Icon(Icons.chevron_right),
                            ),
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              dense: true,
                              title: Text(
                                'Currency',
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
                                'Status',
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
                                  style: AppTextStyles.titleMediumS.copyWith(
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
                              dense: true,
                              title: Text(
                                'Description',
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
                                    'No description available',
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
                                'is Fixed Contribution?',
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
                                        jarData.acceptedContributionAmount > 0
                                            ? jarData.acceptedContributionAmount
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
                                dense: true,
                                title: Text(
                                  'Fixed contribution Amount',
                                  style: AppTextStyles.titleMediumS.copyWith(
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
                                          ? 'Reopen jar'
                                          : 'Seal jar',
                                  message:
                                      isCurrentlyClosed
                                          ? 'People will be able to contribute to this jar again'
                                          : 'People will be no longer able to contribute to this jar until it is reopened',
                                  confirmText:
                                      isCurrentlyClosed ? 'Reopen' : 'Seal',
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
                                    ? 'Reopen jar'
                                    : 'Seal jar',
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
                                  title: 'Break jar',
                                  message:
                                      'Once the jar is broken, you will permanently lose access to it.',
                                  confirmText: 'Break',
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
                                'Brake jar',
                                style: AppTextStyles.titleMediumS.copyWith(
                                  color: AppColors.errorRed,
                                ),
                              ),
                              trailing: Icon(Icons.chevron_right),
                            ),
                          ],
                        ),
                      ),
                    ]),
                  ),
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
      case JarStatus.broken:
        return Colors.red;
      case JarStatus.sealed:
        return Colors.grey;
    }
  }
}
