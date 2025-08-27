import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_images.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/widgets/animated_number_text.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/contribution_chart.dart';
import 'package:konto/core/widgets/contribution_list_item.dart';
import 'package:konto/core/widgets/goal_progress_card.dart';
import 'package:konto/core/widgets/icon_button.dart';
import 'package:konto/core/widgets/scrollable_background_image.dart';
import 'package:konto/core/widgets/small_button.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/core/utils/image_utils.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/collaborators/presentation/views/collectors_view.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';
import 'package:konto/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/features/jars/presentation/views/jars_list_view.dart';
import 'package:konto/features/jars/presentation/widgets/jar_more_menu.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/route.dart';

class JarDetailView extends StatefulWidget {
  const JarDetailView({super.key});

  @override
  State<JarDetailView> createState() => _JarDetailViewState();
}

class _JarDetailViewState extends State<JarDetailView> {
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0.0;

  @override
  void initState() {
    super.initState();
    // Trigger jar summary request when page loads for the first time
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());

    // Listen to scroll changes
    _scrollController.addListener(_scrollListener);
  }

  void _scrollListener() {
    setState(() {
      _scrollOffset = _scrollController.offset;
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_scrollListener);
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    final localizations = AppLocalizations.of(context)!;
    final jarSummaryReloadBloc = context.read<JarSummaryReloadBloc>();

    // Trigger the reload and wait for completion
    // This should refresh data in the background without affecting UI state
    jarSummaryReloadBloc.add(ReloadJarSummaryRequested());

    try {
      // Wait for the reload to complete by listening for state changes
      await jarSummaryReloadBloc.stream
          .firstWhere(
            (state) =>
                state is JarSummaryReloaded || state is JarSummaryReloadError,
          )
          .timeout(
            const Duration(seconds: 20), // Add timeout to prevent hanging
          );
    } catch (e) {
      // Handle timeout or other errors
      if (context.mounted) {
        AppSnackBar.show(
          context,
          message: localizations.refreshTimedOut,
          type: SnackBarType.error,
        );
      }
    }
  }

  void _onRefetch() {
    // Trigger jar summary request with loading indicator
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return MultiBlocListener(
      listeners: [
        BlocListener<JarSummaryBloc, JarSummaryState>(
          listener: (context, state) {
            if (state is JarSummaryLoaded) {
              // Show error message
              context.read<JarListBloc>().add(LoadJarList());
            }
          },
        ),
        BlocListener<JarSummaryReloadBloc, JarSummaryReloadState>(
          listener: (context, state) {
            if (state is JarSummaryReloadError) {
              // Show error message
              AppSnackBar.show(
                context,
                message: state.message,
                type: SnackBarType.error,
              );
            }
            // JarSummaryReloaded state is handled automatically by the bloc
            // which calls UpdateJarSummaryRequested on the main bloc without flicker
          },
        ),
        BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            // Handle sign out - navigate to login
            if (state is AuthInitial) {
              Navigator.of(
                context,
              ).pushNamedAndRemoveUntil('/login', (route) => false);
            }
          },
        ),
        BlocListener<UpdateJarBloc, UpdateJarState>(
          listener: (context, state) {
            if (state is UpdateJarSuccess) {
              context.read<JarSummaryReloadBloc>().add(
                ReloadJarSummaryRequested(),
              );
            }
          },
        ),
      ],
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          return Scaffold(
            backgroundColor: Theme.of(context).colorScheme.surface,
            body: Stack(
              children: [
                // Background image positioned to cover upper section only
                if (state is JarSummaryLoaded &&
                    state.jarData.image?.url != null)
                  ScrollableBackgroundImage(
                    imageUrl: ImageUtils.constructImageUrl(
                      state.jarData.image!.url!,
                    ),
                    scrollOffset: _scrollOffset,
                    height: 450.0,
                    maxScrollForOpacity: 200.0,
                    baseOpacity: 0.30,
                  ),
                // Main content with custom scroll view
                NotificationListener<ScrollNotification>(
                  onNotification: (ScrollNotification notification) {
                    if (notification is ScrollUpdateNotification) {
                      setState(() {
                        _scrollOffset = notification.metrics.pixels;
                      });
                    }
                    return false;
                  },
                  child: RefreshIndicator(
                    onRefresh: _onRefresh,
                    child: CustomScrollView(
                      controller: _scrollController,
                      physics: const AlwaysScrollableScrollPhysics(),
                      slivers: [
                        SliverAppBar(
                          centerTitle: false,
                          title: BlocBuilder<AuthBloc, AuthState>(
                            builder: (context, state) {
                              String firstName = localizations.user;
                              if (state is AuthAuthenticated) {
                                // Extract first name from full name
                                final fullName = state.user.fullName;
                                firstName = fullName.split(' ').first;
                              }
                              return Text(
                                localizations.hiUser(firstName),
                                style: TextStyles.titleMediumLg,
                              );
                            },
                          ),
                          backgroundColor: Color.lerp(
                            Colors.transparent,
                            Theme.of(context).colorScheme.surface,
                            (_scrollOffset / 200).clamp(0.0, 1.0),
                          ),
                          surfaceTintColor: Colors.transparent,
                          elevation: 0,
                          floating: true,
                          snap: true,
                          pinned: true,
                          actions: [
                            if (state is JarSummaryLoaded)
                              AppIconButton(
                                key: const Key('request_button_qr_code'),
                                onPressed: () {
                                  Navigator.pushNamed(
                                    context,
                                    AppRoutes.contributionRequest,
                                    arguments: {
                                      'paymentLink': state.jarData.paymentLink,
                                      'jarName': state.jarData.name,
                                    },
                                  );
                                },
                                icon: Icons.qr_code,
                                enabled:
                                    state.jarData.status != JarStatus.sealed,
                                size: const Size(40, 40),
                              ),
                            Padding(
                              padding: const EdgeInsets.only(
                                left: AppSpacing.spacingXs,
                                right: AppSpacing.spacingM,
                              ),
                              child: AppIconButton(
                                onPressed: () {
                                  Navigator.of(
                                    context,
                                  ).pushNamed(AppRoutes.userAccountView);
                                },
                                icon: Icons.person,
                                size: const Size(40, 40),
                              ),
                            ),
                          ],
                        ),
                        _buildSliverBody(context, state),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSliverBody(BuildContext context, JarSummaryState state) {
    final localizations = AppLocalizations.of(context)!;

    if (state is JarSummaryLoading) {
      return SliverFillRemaining(
        child: const Center(child: CircularProgressIndicator()),
      );
    } else if (state is JarSummaryError) {
      return SliverFillRemaining(
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.8,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48),
                  const SizedBox(height: 16),
                  Text(state.message, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  AppButton.filled(
                    onPressed: _onRefetch,
                    text: localizations.retry,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    } else if (state is JarSummaryLoaded) {
      // Display jar details
      final jarData = state.jarData;
      bool isDark = Theme.of(context).brightness == Brightness.dark;
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.only(top: 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(jarData.name, style: TextStyles.titleMediumM),
              const SizedBox(height: AppSpacing.spacingXs),
              RevolutStyleCounterWithCurrency(
                value:
                    CurrencyUtils.getCurrencySymbol(jarData.currency) +
                    jarData.totalContributedAmount.toString(),
                style: TextStyles.titleBoldXl,
                duration: const Duration(milliseconds: 1000),
              ),
              const SizedBox(height: AppSpacing.spacingXs),
              AppSmallButton(
                child: Text(localizations.jars, style: TextStyles.titleMedium),
                onPressed: () {
                  JarsListView.showModal(context);
                },
              ),
              const SizedBox(height: AppSpacing.spacingL),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.spacingM,
                  vertical: AppSpacing.spacingL,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          AppIconButton(
                            key: const Key('contribute_button'),
                            enabled: jarData.status != JarStatus.sealed,
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                AppRoutes.addContribution,
                              );
                            },
                            icon: Icons.add,
                          ),
                          const SizedBox(height: AppSpacing.spacingXs),
                          Text(
                            localizations.contribute,
                            style: TextStyles.titleMedium.copyWith(
                              color: Theme.of(
                                context,
                              ).textTheme.bodyLarge?.color?.withValues(
                                alpha:
                                    jarData.status == JarStatus.sealed
                                        ? 0.4
                                        : 1.0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          AppIconButton(
                            key: const Key('request_button'),
                            enabled: jarData.status != JarStatus.sealed,
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                AppRoutes.contributionRequest,
                                arguments: {
                                  'paymentLink': state.jarData.paymentLink,
                                  'jarName': state.jarData.name,
                                },
                              );
                            },
                            icon: Icons.call_received,
                          ),
                          const SizedBox(height: AppSpacing.spacingXs),
                          Text(
                            localizations.request,
                            style: TextStyles.titleMedium.copyWith(
                              color: Theme.of(
                                context,
                              ).textTheme.bodyLarge?.color?.withValues(
                                alpha:
                                    jarData.status == JarStatus.sealed
                                        ? 0.4
                                        : 1.0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          BlocBuilder<AuthBloc, AuthState>(
                            builder: (context, authState) {
                              final isCreator =
                                  authState is AuthAuthenticated &&
                                  jarData.creator.id == authState.user.id;
                              return Column(
                                children: [
                                  AppIconButton(
                                    key: const Key('info_button'),
                                    enabled: isCreator,
                                    onPressed:
                                        isCreator
                                            ? () {
                                              Navigator.pushNamed(
                                                context,
                                                AppRoutes.jarInfo,
                                              );
                                            }
                                            : null,
                                    icon: Icons.info,
                                  ),
                                ],
                              );
                            },
                          ),
                          const SizedBox(height: AppSpacing.spacingXs),
                          Text(
                            localizations.info,
                            style: TextStyles.titleMedium,
                          ),
                        ],
                      ),
                    ),
                    Expanded(child: JarMoreMenu(jarId: jarData.id)),
                  ],
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        CollectorsView.show(context);
                      },
                      child: AppCard(
                        margin: EdgeInsets.only(left: AppSpacing.spacingXs),
                        variant: CardVariant.primary,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            IconButton(
                              onPressed: () {},
                              icon: const Icon(Icons.person),
                              style: IconButton.styleFrom(
                                backgroundColor:
                                    isDark
                                        ? Theme.of(context).colorScheme.surface
                                        : Theme.of(context).colorScheme.primary,
                                foregroundColor:
                                    Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.spacingL),
                            Text(
                              localizations.collectors,
                              style: TextStyles.titleRegularM,
                            ),
                            const SizedBox(height: AppSpacing.spacingXs),
                            AnimatedNumberTextScale(
                              value:
                                  (jarData.invitedCollectors
                                              ?.where(
                                                (collector) =>
                                                    collector.status ==
                                                    'accepted',
                                              )
                                              .length ??
                                          0)
                                      .toString(),
                              style: TextStyles.titleBoldLg,
                              duration: const Duration(milliseconds: 600),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.spacingXs),
                  Expanded(
                    child: AppCard(
                      margin: EdgeInsets.only(right: AppSpacing.spacingXs),
                      variant: CardVariant.primary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            localizations.contributions,
                            style: TextStyles.titleRegularM,
                          ),
                          const SizedBox(height: AppSpacing.spacingXs),
                          RevolutStyleCounterWithCurrency(
                            value:
                                CurrencyUtils.getCurrencySymbol(
                                  jarData.currency,
                                ) +
                                jarData.totalContributedAmount.toString(),
                            style: TextStyles.titleBoldLg,
                            duration: const Duration(milliseconds: 800),
                          ),
                          const SizedBox(height: AppSpacing.spacingM),
                          // Chart with real data from API
                          ContributionChart(
                            dataPoints: jarData.chartData ?? const [],
                            chartColor: Colors.green,
                            height: 50,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              //end of top section
              const SizedBox(height: AppSpacing.spacingXs),
              // Goal Progress Card
              GoalProgressCard(
                currentAmount: jarData.totalContributedAmount,
                goalAmount: jarData.goalAmount,
                currency: jarData.currency,
                deadline: jarData.deadline,
                variant: CardVariant.primary,
              ),

              // Recent Contributions Section
              const SizedBox(height: AppSpacing.spacingXs),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.spacingM,
                      vertical: AppSpacing.spacingXs,
                    ),
                    child: Text(
                      localizations.recentContributions,
                      style: TextStyles.titleMediumLg,
                    ),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: AppCard(
                      margin: EdgeInsets.symmetric(
                        horizontal: AppSpacing.spacingXs,
                      ),
                      variant: CardVariant.primary,
                      child:
                          jarData.contributions.isEmpty
                              ? Padding(
                                padding: const EdgeInsets.all(
                                  AppSpacing.spacingL,
                                ),
                                child: Column(
                                  children: [
                                    Image.asset(
                                      AppImages.onboardingSlide1,
                                      width: 80,
                                      height: 80,
                                      fit: BoxFit.contain,
                                      color:
                                          isDark
                                              ? Colors.white
                                              : AppColors.black,
                                      colorBlendMode: BlendMode.srcIn,
                                    ),
                                    const SizedBox(height: AppSpacing.spacingM),
                                    Text(
                                      localizations.noContributionsYet,
                                      style: TextStyles.titleMedium,
                                    ),
                                    const SizedBox(
                                      height: AppSpacing.spacingXs,
                                    ),
                                    Text(
                                      localizations.beTheFirstToContribute,
                                      style: TextStyles.titleRegularSm,
                                      textAlign: TextAlign.center,
                                    ),
                                    const SizedBox(height: AppSpacing.spacingL),
                                    AppButton.filled(
                                      text: localizations.contribute,
                                      onPressed: () {
                                        Navigator.pushNamed(
                                          context,
                                          AppRoutes.addContribution,
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              )
                              : Column(
                                children: [
                                  ...jarData.contributions
                                      .map(
                                        (contribution) => [
                                          ContributionListItem(
                                            contributionId: contribution.id,
                                            contributorName:
                                                contribution.contributor ??
                                                (contribution
                                                            .contributorPhoneNumber !=
                                                        null
                                                    ? localizations.userWithLastDigits(
                                                      contribution
                                                          .contributorPhoneNumber!
                                                          .substring(
                                                            contribution
                                                                    .contributorPhoneNumber!
                                                                    .length -
                                                                4,
                                                          ),
                                                    )
                                                    : localizations.anonymous),
                                            amount:
                                                contribution.amountContributed,
                                            currency: jarData.currency,
                                            timestamp:
                                                contribution.createdAt ??
                                                DateTime.now(),
                                            paymentMethod:
                                                contribution.paymentMethod,
                                            isAnonymous:
                                                contribution.contributor ==
                                                null,
                                            viaPaymentLink:
                                                contribution.viaPaymentLink,
                                            paymentStatus:
                                                contribution.paymentStatus,
                                          ),
                                        ],
                                      )
                                      .expand((list) => list),
                                  InkWell(
                                    onTap: () {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            localizations
                                                .viewAllContributionsComingSoon(
                                                  jarData.contributions.length,
                                                ),
                                          ),
                                        ),
                                      );
                                    },
                                    child: Text(
                                      localizations.seeAll,
                                      style: TextStyles.titleMedium,
                                    ),
                                  ),
                                ],
                              ),
                    ),
                  ),
                ],
              ),

              // Final bottom padding
              const SizedBox(height: AppSpacing.spacingL),
            ],
          ),
        ),
      );
    }
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SliverFillRemaining(
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.8,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Image.asset(
                  AppImages.onboardingSlide1,
                  width: 200,
                  height: 200,
                  fit: BoxFit.contain,
                  color: isDark ? Colors.white : Colors.black,
                  colorBlendMode: BlendMode.srcIn,
                ),
                Text(
                  localizations.createNewJarMessage,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.spacingM),
                AppButton.outlined(
                  text: localizations.createNewJar,
                  onPressed: () {
                    Navigator.pushNamed(context, AppRoutes.jarCreate);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
