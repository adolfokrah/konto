import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/utils/haptic_utils.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/icon_button.dart';
import 'package:konto/core/widgets/small_button.dart';
import 'package:konto/features/jars/data/models/jar_list_model.dart';
import 'package:konto/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

class JarsListView extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
      child: Scaffold(
        backgroundColor: Theme.of(
          context,
        ).colorScheme.surface.withValues(alpha: 0.6),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.spacingS),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Close button positioned at top right
                Row(
                  children: [
                    AppIconButton(
                      onPressed: () {
                        HapticUtils.heavy();
                        Navigator.of(context).pop();
                      },
                      icon: Icons.close,
                      size: const Size(40, 40),
                    ),
                  ],
                ),

                // Content area - jar list
                Expanded(
                  child: BlocBuilder<JarListBloc, JarListState>(
                    builder: (context, state) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _buildJarListContent(state, localizations),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                Center(
                  child: AppSmallButton(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.add, size: 20),
                        const SizedBox(width: AppSpacing.spacingXs),
                        Text(
                          localizations.createJar,
                          style: TextStyles.titleMedium,
                        ),
                      ],
                    ),
                    onPressed: () {
                      HapticUtils.heavy();
                      Navigator.of(context).pushNamed('/jar_create');
                    },
                  ),
                ),
              ],
            ),
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
      JarListLoading() => const Center(child: CircularProgressIndicator()),
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
          return Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.spacingXs,
              vertical: AppSpacing.spacingS,
            ),
            child: Text(localizations.jars, style: TextStyles.titleMedium),
          );
        }

        // Adjust index for jar groups (subtract 1 because title takes index 0)
        final jarGroup = jarList.groups[index - 1];

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingXs),
          child: AppCard(
            isCollapsible: true,
            title: jarGroup.name,
            initiallyExpanded: true, // Expand all cards by default
            child: _buildJarGroupContent(jarGroup, context, localizations),
          ),
        );
      },
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
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingS),
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
            // Jar icon
            CircleAvatar(
              backgroundColor:
                  isDark
                      ? Theme.of(context).colorScheme.surface
                      : Theme.of(context).colorScheme.primary,
              foregroundColor: Theme.of(context).colorScheme.onSurface,
              child: const Icon(Icons.wallet),
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
