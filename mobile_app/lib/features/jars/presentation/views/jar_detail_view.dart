import 'package:Hoga/features/jars/presentation/widgets/payment_method_contribution_item.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_images.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/animated_number_text.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/contribution_chart.dart';
import 'package:Hoga/core/widgets/contribution_list_item.dart';
import 'package:Hoga/core/widgets/user_avatar_small.dart';
import 'package:Hoga/core/widgets/goal_progress_card.dart';
import 'package:Hoga/core/widgets/icon_button.dart';
import 'package:Hoga/core/widgets/notification_icon_button.dart';
import 'package:Hoga/core/widgets/scrollable_background_image.dart';
import 'package:Hoga/core/widgets/small_button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/feedback_action_button.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/collaborators/presentation/views/collectors_view.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/views/jars_list_view.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_balance_breakdown.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_more_menu.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_completion_alert.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/core/services/fcm_service.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';

class JarDetailView extends StatefulWidget {
  const JarDetailView({super.key});

  @override
  State<JarDetailView> createState() => _JarDetailViewState();
}

class _JarDetailViewState extends State<JarDetailView> {
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0.0;
  bool _walkthroughTriggered =
      false; // Flag to prevent multiple walkthrough navigations

  @override
  void initState() {
    super.initState();
    // Trigger jar summary request when page loads for the first time
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());

    // Listen to scroll changes
    _scrollController.addListener(_scrollListener);

    _requestFCMPermissionAndUpdateToken();
    _fetchUserNotifications();
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

  /// Request FCM permissions and update user token
  Future<void> _requestFCMPermissionAndUpdateToken() async {
    try {
      // Request FCM permissions first
      FCMService.requestPermission();

      // Get the FCM token
      final String? token = await FCMService.getToken();

      // Update user with the token if available and widget is still mounted
      if (token != null && mounted) {
        context.read<UserAccountBloc>().add(
          UpdatePersonalDetails(fcmToken: token),
        );
      }
    } catch (e) {
      // Handle any errors silently or log them
      print('Error requesting FCM permission or updating token: $e');
    }
  }

  /// Fetch User Notificatiosn
  Future<void> _fetchUserNotifications() async {
    try {
      // Use NotificationsBloc from context
      final notificationsBloc = context.read<NotificationsBloc>();

      // Fetch notifications with default pagination
      notificationsBloc.add(FetchNotifications(limit: 20, page: 1));
    } catch (e) {
      // Handle any errors silently or log them
      print('Error fetching user notifications: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return MultiBlocListener(
      listeners: [
        BlocListener<JarSummaryBloc, JarSummaryState>(
          listener: (context, state) {
            if (state is JarSummaryLoaded) {
              context.read<JarListBloc>().add(LoadJarList());
              // Request FCM permissions and update token
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
            // if (state is UpdateJarSuccess) {
            context.read<JarSummaryReloadBloc>().add(
              ReloadJarSummaryRequested(),
            );
            // }
          },
        ),
        BlocListener<OnboardingBloc, OnboardingState>(
          listener: (context, state) {
            if (state is OnboardingPageState && !_walkthroughTriggered) {
              // User hasn't completed onboarding, show walkthrough with delay
              _walkthroughTriggered =
                  true; // Set flag to prevent multiple calls
              Future.delayed(const Duration(seconds: 1), () {
                if (mounted && _walkthroughTriggered) {
                  Navigator.pushNamed(context, AppRoutes.walkthrough).then((_) {
                    // Reset flag when user returns from walkthrough
                    if (mounted) {
                      setState(() {
                        _walkthroughTriggered = false;
                      });
                    }
                  });
                }
              });
            }
            // If state is OnboardingCompleted, reset flag and do nothing (user has completed walkthrough)
            if (state is OnboardingCompleted) {
              _walkthroughTriggered = false;
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
                    height: 500.0,
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
                            const FeedbackActionButton(),
                            const NotificationIconButton(),
                            if (state is JarSummaryLoaded)
                              BlocBuilder<AuthBloc, AuthState>(
                                builder: (context, authState) {
                                  bool isKYCVerified = false;
                                  if (authState is AuthAuthenticated) {
                                    isKYCVerified =
                                        authState.user.isKYCVerified;
                                  }

                                  return AppIconButton(
                                    key: const Key('request_button_qr_code'),
                                    opacity: 0.8,
                                    onPressed: () {
                                      // Check KYC verification before allowing request
                                      if (!isKYCVerified) {
                                        Navigator.pushNamed(
                                          context,
                                          AppRoutes.kycView,
                                        );
                                        return;
                                      }

                                      Navigator.pushNamed(
                                        context,
                                        AppRoutes.contributionRequest,
                                        arguments: {
                                          'paymentLink': state.jarData.link,
                                          'jarName': state.jarData.name,
                                        },
                                      );
                                    },
                                    icon: Icons.qr_code,
                                    enabled:
                                        state.jarData.status !=
                                        JarStatus.sealed,
                                    size: const Size(40, 40),
                                  );
                                },
                              ),
                            Padding(
                              padding: const EdgeInsets.only(
                                left: AppSpacing.spacingXs,
                                right: AppSpacing.spacingM,
                              ),
                              child: BlocBuilder<AuthBloc, AuthState>(
                                builder: (context, authState) {
                                  return BlocBuilder<
                                    UserAccountBloc,
                                    UserAccountState
                                  >(
                                    builder: (context, uaState) {
                                      return UserAvatarSmall(
                                        backgroundColor:
                                            isDark
                                                ? Theme.of(context)
                                                    .colorScheme
                                                    .primary
                                                    .withValues(alpha: 0.5)
                                                : Colors.white.withValues(
                                                  alpha: 0.5,
                                                ),
                                        radius: 20,
                                      );
                                    },
                                  );
                                },
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (state is JarSummaryLoading) {
      return SliverFillRemaining(
        child: Center(
          child: CircularProgressIndicator(
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
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
        child: Stack(
          children: [
            /// CTA Banner Here
            Padding(
              padding: const EdgeInsets.only(top: 80),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(jarData.name, style: TextStyles.titleMediumM),
                  const SizedBox(height: 2),
                  GestureDetector(
                    onTap: () {
                      if (jarData.isCreator) {
                        JarBalanceBreakdown.show(context);
                      }
                    },
                    child: RevolutStyleCounterWithCurrency(
                      value:
                          CurrencyUtils.getCurrencySymbol(jarData.currency) +
                          jarData.balanceBreakDown.totalContributedAmount
                              .toString(),
                      style: TextStyles.titleBoldXl,
                      duration: const Duration(milliseconds: 1000),
                    ),
                  ),
                  const SizedBox(height: 2),
                  // Only show amount to be transferred if user is the creator
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, authState) {
                      final isCreator =
                          authState is AuthAuthenticated &&
                          jarData.creator.id == authState.user.id;
                      if (!isCreator) {
                        return const SizedBox(height: AppSpacing.spacingXs);
                      }
                      return Column(
                        children: [
                          Text(
                            localizations.amountToBeTransferred(
                              CurrencyUtils.getCurrencySymbol(jarData.currency),
                              jarData
                                  .balanceBreakDown
                                  .totalAmountTobeTransferred
                                  .toString(),
                            ),
                            style: TextStyles.titleRegularXs,
                          ),
                          const SizedBox(height: AppSpacing.spacingXs),
                        ],
                      );
                    },
                  ),
                  AppSmallButton(
                    opacity: 0.8,
                    child: Text(
                      localizations.jars,
                      style: TextStyles.titleMedium,
                    ),
                    onPressed: () {
                      JarsListView.showModal(context);
                    },
                  ),
                  const SizedBox(height: 45),

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
                                opacity: 0.8,
                              ),
                              const SizedBox(height: AppSpacing.spacingXs),
                              Text(
                                localizations.contribute,
                                style: TextStyles.titleMediumS.copyWith(
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
                          child: BlocBuilder<AuthBloc, AuthState>(
                            builder: (context, authState) {
                              bool isKYCVerified = false;
                              if (authState is AuthAuthenticated) {
                                isKYCVerified = authState.user.isKYCVerified;
                              }

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  AppIconButton(
                                    key: const Key('request_button'),
                                    enabled: jarData.status != JarStatus.sealed,
                                    onPressed: () {
                                      // Check KYC verification before allowing request
                                      if (!isKYCVerified) {
                                        Navigator.pushNamed(
                                          context,
                                          AppRoutes.kycView,
                                        );
                                        return;
                                      }

                                      Navigator.pushNamed(
                                        context,
                                        AppRoutes.contributionRequest,
                                        arguments: {
                                          'paymentLink': state.jarData.link,
                                          'jarName': state.jarData.name,
                                        },
                                      );
                                    },
                                    icon: Icons.call_received,
                                    opacity: 0.8,
                                  ),
                                  const SizedBox(height: AppSpacing.spacingXs),
                                  Text(
                                    localizations.request,
                                    style: TextStyles.titleMediumS.copyWith(
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
                              );
                            },
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
                                        opacity: 0.8,
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
                                style: TextStyles.titleMediumS,
                              ),
                            ],
                          ),
                        ),
                        Expanded(child: JarMoreMenu(jarId: jarData.id)),
                      ],
                    ),
                  ),

                  /// Dynamic CTA Banner Based on Missing Information
                  JarCompletionAlert(jarData: jarData),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      BlocBuilder<AuthBloc, AuthState>(
                        builder: (context, authState) {
                          final isCreator =
                              authState is AuthAuthenticated &&
                              jarData.creator.id == authState.user.id;
                          if (!isCreator) {
                            return Container();
                          }
                          return Expanded(
                            child: GestureDetector(
                              onTap: () {
                                CollectorsView.show(context);
                              },
                              child: AppCard(
                                margin: EdgeInsets.only(
                                  left: AppSpacing.spacingXs,
                                ),
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
                                                ? Theme.of(
                                                  context,
                                                ).colorScheme.surface
                                                : Theme.of(
                                                  context,
                                                ).colorScheme.primary,
                                        foregroundColor:
                                            Theme.of(
                                              context,
                                            ).colorScheme.onSurface,
                                      ),
                                    ),
                                    const SizedBox(height: AppSpacing.spacingL),
                                    Text(
                                      localizations.collectors,
                                      style: TextStyles.titleRegularM,
                                    ),
                                    const SizedBox(
                                      height: AppSpacing.spacingXs,
                                    ),
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
                                      duration: const Duration(
                                        milliseconds: 600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
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
                                    jarData
                                        .balanceBreakDown
                                        .totalContributedAmount
                                        .toString(),
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
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      final isCreator =
                          state is AuthAuthenticated &&
                          state.user.id == jarData.creator.id;
                      if (!isCreator) {
                        return Container();
                      }
                      return GoalProgressCard(
                        currentAmount:
                            jarData.balanceBreakDown.totalContributedAmount,
                        goalAmount: jarData.goalAmount,
                        currency: jarData.currency,
                        deadline: jarData.deadline,
                        variant: CardVariant.primary,
                      );
                    },
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
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              localizations.recentContributions,
                              style: TextStyles.titleMediumLg,
                            ),
                            InkWell(
                              onTap: () {
                                // Clear all contribution filters before navigating
                                try {
                                  context.read<FilterContributionsBloc>().add(
                                    ClearAllFilters(),
                                  );
                                } catch (_) {
                                  // Bloc not found in context; ignore.
                                }
                                Navigator.pushNamed(
                                  context,
                                  AppRoutes.contributionsList,
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
                      SizedBox(
                        width: double.infinity,
                        child: AppCard(
                          margin: EdgeInsets.symmetric(
                            horizontal: AppSpacing.spacingXs,
                          ),
                          variant: CardVariant.primary,
                          child:
                              jarData.contributions.isEmpty
                                  ? Column(
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
                                      const SizedBox(
                                        height: AppSpacing.spacingM,
                                      ),
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
                                      const SizedBox(
                                        height: AppSpacing.spacingL,
                                      ),
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
                                                        : 'Konto'),
                                                amount:
                                                    contribution
                                                        .amountContributed,
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
                                                isTransfer:
                                                    contribution.isTransfer,
                                              ),
                                            ],
                                          )
                                          .expand((list) => list),
                                    ],
                                  ),
                        ),
                      ),
                    ],
                  ),

                  // balance breakdown section (only for jar creators)
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, authState) {
                      final isCreator =
                          authState is AuthAuthenticated &&
                          jarData.creator.id == authState.user.id;
                      if (!isCreator) {
                        return Container();
                      }
                      return Column(
                        children: [
                          const SizedBox(height: AppSpacing.spacingM),
                          AppCard(
                            margin: EdgeInsets.symmetric(
                              horizontal: AppSpacing.spacingXs,
                            ),
                            padding: EdgeInsets.all(0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    JarBalanceBreakdown.show(context);
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.only(
                                      left: AppSpacing.spacingM,
                                      right: AppSpacing.spacingM,
                                      top: AppSpacing.spacingM,
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(
                                              'Contribution Breakdown',
                                              style:
                                                  AppTextStyles.titleMediumXs,
                                            ),
                                            const SizedBox(width: 4),
                                            Icon(Icons.chevron_right, size: 16),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          "${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${jarData.balanceBreakDown.totalContributedAmount}",
                                          style: AppTextStyles.titleBoldXl,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                PaymentMethodContributionItem(
                                  title: localizations.cash,
                                  subtitle: localizations.contributionsCount(
                                    jarData.cashContributionCount,
                                  ),
                                  amount:
                                      jarData.balanceBreakDown.cash.totalAmount,
                                  currency: jarData.currency,
                                  icon: Icons.money,
                                  backgroundColor:
                                      Theme.of(context).colorScheme.surface,
                                ),
                                PaymentMethodContributionItem(
                                  title: localizations.bankTransfer,
                                  subtitle: localizations.contributionsCount(
                                    jarData.bankTransferContributionCount,
                                  ),
                                  amount:
                                      jarData
                                          .balanceBreakDown
                                          .bankTransfer
                                          .totalAmount,
                                  currency: jarData.currency,
                                  icon: Icons.account_balance,
                                  backgroundColor:
                                      Theme.of(context).colorScheme.surface,
                                ),
                                PaymentMethodContributionItem(
                                  title: localizations.mobileMoney,
                                  subtitle: localizations.contributionsCount(
                                    jarData.mobileMoneyContributionCount,
                                  ),
                                  amount:
                                      jarData
                                          .balanceBreakDown
                                          .mobileMoney
                                          .totalAmount,
                                  currency: jarData.currency,
                                  icon: Icons.phone_android,
                                  backgroundColor:
                                      Theme.of(context).colorScheme.surface,
                                ),
                                PaymentMethodContributionItem(
                                  title: localizations.cardPayment,
                                  subtitle: localizations.contributionsCount(
                                    jarData.balanceBreakDown.card.totalCount,
                                  ),
                                  amount:
                                      jarData.balanceBreakDown.card.totalAmount,
                                  currency: jarData.currency,
                                  icon: Icons.credit_card,
                                  backgroundColor:
                                      Theme.of(context).colorScheme.surface,
                                ),
                                PaymentMethodContributionItem(
                                  title: localizations.applePayPayment,
                                  subtitle: localizations.contributionsCount(
                                    jarData
                                        .balanceBreakDown
                                        .applePay
                                        .totalCount,
                                  ),
                                  amount:
                                      jarData
                                          .balanceBreakDown
                                          .applePay
                                          .totalAmount,
                                  currency: jarData.currency,
                                  icon: Icons.apple,
                                  backgroundColor:
                                      Theme.of(context).colorScheme.surface,
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: AppSpacing.spacingM),
                ],
              ),
            ),
          ],
        ),
      );
    }
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
