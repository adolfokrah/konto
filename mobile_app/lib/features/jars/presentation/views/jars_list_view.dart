import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/services/jar_expansion_state_service.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/category_translation_utils.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/icon_button.dart';
import 'package:Hoga/core/widgets/small_button.dart';
import 'package:Hoga/features/jars/data/models/jar_list_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class JarsListView extends StatefulWidget {
  const JarsListView({super.key});

  /// Show the jars list as a modal with blur background
  static Future<void> showModal(BuildContext context) {
    HapticUtils.heavy();
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close',
      barrierColor: Colors.transparent,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return BlocProvider(
          create: (context) => JarListBloc()..add(LoadJarList()),
          child: const JarsListView(),
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(opacity: animation, child: child);
      },
    );
  }

  @override
  State<JarsListView> createState() => _JarsListViewState();
}

class _JarsListViewState extends State<JarsListView> {
  Set<String> expandedGroupIds = <String>{};
  late JarExpansionStateService _expansionService;

  @override
  void initState() {
    super.initState();
    _loadExpansionState();
  }

  Future<void> _loadExpansionState() async {
    _expansionService = await JarExpansionStateService.getInstance();
    final savedExpandedIds = await _expansionService.getExpandedGroupIds();
    setState(() {
      expandedGroupIds = savedExpandedIds;
    });
  }

  Future<void> _toggleGroupExpansion(String groupId) async {
    setState(() {
      if (expandedGroupIds.contains(groupId)) {
        expandedGroupIds.remove(groupId);
      } else {
        expandedGroupIds.add(groupId);
      }
    });

    // Persist the change
    await _expansionService.setExpandedGroupIds(expandedGroupIds);
  }

  /// Clean up stale expansion state for jar groups that no longer exist
  Future<void> _cleanupStaleExpansionState(JarList jarList) async {
    try {
      // Extract all valid group names from the current jar list
      final List<String> validGroupNames =
          jarList.groups.map((group) => group.name).toList();

      // Clean up the stored expansion state
      await _expansionService.cleanupStaleExpansionState(validGroupNames);

      // Also clean up our local state to match
      final Set<String> validGroupNamesSet = validGroupNames.toSet();
      final Set<String> cleanedLocalState =
          expandedGroupIds
              .where((groupId) => validGroupNamesSet.contains(groupId))
              .toSet();

      // Update local state if we had stale entries
      if (cleanedLocalState.length != expandedGroupIds.length) {
        setState(() {
          expandedGroupIds = cleanedLocalState;
        });
      }
    } catch (e) {
      // Silently handle cleanup errors - not critical to user experience
      debugPrint('Error cleaning up local expansion state: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor =
        isDark
            ? Theme.of(context).colorScheme.surface
            : Theme.of(context).colorScheme.onPrimary;

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
      child: Scaffold(
        backgroundColor: Theme.of(
          context,
        ).colorScheme.surface.withValues(alpha: 0.6),
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingS),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Close button positioned at top right
              const SizedBox(height: AppSpacing.spacingM),
              AppIconButton(
                onPressed: () {
                  HapticUtils.heavy();
                  Navigator.of(context).pop();
                },
                icon: Icons.close,
                size: const Size(40, 40),
              ),

              // Content area - jar list
              Expanded(
                child: Stack(
                  children: [
                    BlocBuilder<JarListBloc, JarListState>(
                      builder: (context, state) {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _buildJarListContent(state, localizations),
                            ),
                            // const SizedBox(height: 20),
                          ],
                        );
                      },
                    ),
                    Positioned(
                      bottom: 20,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: AppSmallButton(
                          backgroundColor:
                              isDark
                                  ? Theme.of(context).colorScheme.onSurface
                                  : AppColors.black,
                          padding: EdgeInsets.only(
                            left: AppSpacing.spacingS,
                            right: AppSpacing.spacingL,
                            top: AppSpacing.spacingS,
                            bottom: AppSpacing.spacingS,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.add, size: 20, color: textColor),
                              const SizedBox(width: AppSpacing.spacingXs),
                              Text(
                                localizations.createJar,
                                style: TextStyles.titleMedium.copyWith(
                                  color: textColor,
                                ),
                              ),
                            ],
                          ),
                          onPressed: () {
                            HapticUtils.heavy();
                            Navigator.of(context).pushNamed('/jar_create');
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // const SizedBox(height: AppSpacing.spacingM),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJarListContent(
    JarListState state,
    AppLocalizations localizations,
  ) {
    return switch (state) {
      JarListInitial() => Center(child: Text(localizations.tapToLoadYourJars)),
      JarListLoading() => Center(
        child: CircularProgressIndicator(
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
      JarListError(message: final message) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              color: AppColors.errorRed,
              size: 48,
            ),
            const SizedBox(height: AppSpacing.spacingXs),
            Text(localizations.errorLoadingJars, style: TextStyles.titleMedium),
            const SizedBox(height: AppSpacing.spacingXs),
            Text(
              message,
              style: TextStyles.titleRegularXs,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
      JarListLoaded(jars: final jarList) => _buildJarGroups(
        jarList,
        localizations,
      ),
    };
  }

  Widget _buildJarGroups(JarList jarList, AppLocalizations localizations) {
    // Clean up stale expansion state for deleted jar groups
    _cleanupStaleExpansionState(jarList);

    if (jarList.groups.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.savings_outlined, color: Colors.white70, size: 48),
            const SizedBox(height: 16),
            Text(localizations.noJarsFound),
            const SizedBox(height: 8),
            Text(localizations.createYourFirstJar),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: jarList.groups.length + 1, // +1 for the title
      itemBuilder: (context, index) {
        // First item is the title
        if (index == 0) {
          return Text(localizations.jars, style: TextStyles.titleMedium);
        }

        // Adjust index for jar groups (subtract 1 because title takes index 0)
        final jarGroup = jarList.groups[index - 1];
        final isLastItem = index == jarList.groups.length;

        return Padding(
          padding: EdgeInsets.only(
            top: AppSpacing.spacingXs,
            bottom:
                isLastItem
                    ? 50.0
                    : AppSpacing.spacingXs, // Extra bottom margin for last item
          ),
          child: _buildCollapsibleCard(jarGroup, context, localizations),
        );
      },
    );
  }

  Widget _buildCollapsibleCard(
    JarGroup jarGroup,
    BuildContext context,
    AppLocalizations localizations,
  ) {
    final isExpanded = expandedGroupIds.contains(jarGroup.name);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? theme.colorScheme.primary : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // Header
          GestureDetector(
            onTap: () => _toggleGroupExpansion(jarGroup.name),
            child: Container(
              padding: const EdgeInsets.all(AppSpacing.spacingS),
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(AppRadius.radiusM),
                  topRight: Radius.circular(AppRadius.radiusM),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          CategoryTranslationUtils.translateCategory(
                            context,
                            jarGroup.name,
                          ),
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: AppSpacing.spacingXs),
                        Text(
                          '${jarGroup.jars.length} ${jarGroup.jars.length == 1 ? localizations.jar : localizations.jars}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(
                              alpha: 0.7,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  AnimatedRotation(
                    turns: isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.expand_more,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Expandable Content
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 300),
            crossFadeState:
                isExpanded
                    ? CrossFadeState.showSecond
                    : CrossFadeState.showFirst,
            firstChild: const SizedBox.shrink(),
            secondChild: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: _buildJarGroupContent(jarGroup, context, localizations),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJarGroupContent(
    JarGroup jarGroup,
    BuildContext context,
    AppLocalizations localizations,
  ) {
    if (jarGroup.jars.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingS),
        child: Text(localizations.noJarsInThisGroup),
      );
    }

    return Column(
      children:
          jarGroup.jars
              .map<Widget>((jar) => _buildJarItem(jar, context))
              .toList(),
    );
  }

  Widget _buildJarItem(JarListItem jar, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingXs),
      child: InkWell(
        onTap: () {
          Navigator.pop(context);
          HapticUtils.heavy();
          context.read<JarSummaryBloc>().add(
            SetCurrentJarRequested(jarId: jar.id),
          );
        },
        child: Row(
          children: [
            // Jar icon with check mark indicator
            Stack(
              children: [
                CircleAvatar(
                  radius: 25,
                  backgroundColor:
                      isDark
                          ? Theme.of(context).colorScheme.surface
                          : Theme.of(context).colorScheme.primary,
                  foregroundColor: Theme.of(context).colorScheme.onSurface,
                  child: const Icon(Icons.wallet, size: 20),
                ),
                // Check mark indicator for active jar
                BlocBuilder<JarSummaryBloc, JarSummaryState>(
                  builder: (context, jarSummaryState) {
                    final isActiveJar =
                        jarSummaryState is JarSummaryLoaded &&
                        jarSummaryState.jarData.id == jar.id;

                    if (!isActiveJar) return const SizedBox.shrink();

                    return Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.onSurface,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Theme.of(context).colorScheme.surface,
                            width: 2,
                          ),
                        ),
                        child: Icon(
                          Icons.check,
                          size: 10,
                          color: isDark ? Colors.black : Colors.white,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(width: AppSpacing.spacingM),

            // Jar details
            Expanded(child: Text(jar.name, style: TextStyles.titleMedium)),

            // Total Contributions (actual amount contributed)
            Text(
              CurrencyUtils.formatAmountWhole(
                jar.totalContributions,
                jar.currency,
              ),
              style: TextStyles.titleMedium,
            ),
          ],
        ),
      ),
    );
  }
}
