import 'dart:io';

import 'package:flutter/material.dart';
import 'package:Hoga/features/contribution/presentation/views/contributions_list_view.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:Hoga/features/contribution/data/models/contribution_model.dart'
    as activity;
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/widgets/main_shell.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/enums/app_theme.dart' as theme_enum;
import 'package:Hoga/core/theme/theme_controller.dart';
import 'package:Hoga/core/services/fcm_service.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/widgets/user_avatar_small.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_list_model.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_actions.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/notifications/data/models/notification_model.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/route.dart';

enum _HomeAction { collect, request, transfer }

/// Home tab: an overview of all your jars (mockup "Home").
///
/// One total, four quick actions, jars as swipeable cards and the recent
/// activity of the jar you last used. Tapping a jar opens the jar screen.
class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  bool _walkthroughTriggered = false;

  @override
  void initState() {
    super.initState();
    context.read<JarListBloc>().add(LoadJarList());
    // The last-used jar feeds Recent activity and the Activity tab.
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
    // Preload payout accounts so Transfer can route to add-account when none exist.
    context.read<WithdrawalAccountsBloc>().add(LoadWithdrawalAccounts());
    _requestFCMPermissionAndUpdateToken();
    _fetchUserNotifications();
  }

  Future<void> _requestFCMPermissionAndUpdateToken() async {
    try {
      FCMService.requestPermission();
      final String? token = await FCMService.getToken();
      if (token != null && mounted) {
        context.read<UserAccountBloc>().add(
          UpdatePersonalDetails(
            fcmToken: token,
            platform: Platform.isAndroid ? 'android' : 'ios',
          ),
        );
      }
    } catch (e) {
      debugPrint('Error requesting FCM permission or updating token: $e');
    }
  }

  void _fetchUserNotifications() {
    try {
      context.read<NotificationsBloc>().add(
        FetchNotifications(limit: 20, page: 1),
      );
    } catch (e) {
      debugPrint('Error fetching user notifications: $e');
    }
  }

  final _activityKey = GlobalKey<_HomeRecentActivityState>();

  Future<void> _onRefresh() async {
    _activityKey.currentState?._load();
    final listBloc = context.read<JarListBloc>();
    listBloc.add(LoadJarList());
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
    try {
      await listBloc.stream
          .firstWhere((s) => s is JarListLoaded || s is JarListError)
          .timeout(const Duration(seconds: 20));
    } catch (_) {}
  }

  // ------------------------------------------------------------ data

  static List<JarListItem> _allJars(JarListState state) {
    if (state is! JarListLoaded) return const [];
    final seen = <String>{};
    return [
      for (final g in state.jars.groups)
        for (final j in g.jars)
          if (seen.add(j.id)) j,
    ];
  }

  // ------------------------------------------------------------ navigation

  void _openJar(JarListItem jar) {
    HapticUtils.light();
    context.read<JarSummaryBloc>().add(SetCurrentJarRequested(jarId: jar.id));
    context.push(AppRoutes.jarDetail);
  }

  void _openActivity() {
    try {
      context.read<FilterContributionsBloc>().add(ClearAllFilters());
    } catch (_) {}
    context.go(AppRoutes.contributionsList);
  }

  /// Collect, Request and Transfer first ask which jar (skipped when only one
  /// fits), then make it the current jar and run the jar action.
  Future<void> _runAction(
    _HomeAction action,
    List<JarListItem> jars,
    String? userId,
  ) async {
    final eligible =
        action == _HomeAction.transfer
            ? jars
                .where((j) => j.creator.id == userId && j.canTransfer)
                .toList()
            : jars.where((j) => j.canCollect).toList();
    if (eligible.isEmpty) {
      AppSnackBar.show(
        context,
        message:
            action == _HomeAction.transfer
                ? 'None of your jars can transfer right now.'
                : 'None of your jars is open for payments. Sealed and frozen jars can\'t collect.',
        type: SnackBarType.info,
      );
      return;
    }

    final summaryBloc = context.read<JarSummaryBloc>();

    JarListItem? picked;
    if (eligible.length == 1) {
      picked = eligible.first;
    } else {
      picked = await JarActions.pickJar(
        context,
        title: switch (action) {
          _HomeAction.collect => 'Collect for which jar?',
          _HomeAction.request => 'Request for which jar?',
          _HomeAction.transfer => 'Transfer from',
        },
        jars: eligible,
        asAction: true,
      );
    }
    if (picked == null || !mounted) return;

    JarSummaryModel? data;
    final state = summaryBloc.state;
    if (state is JarSummaryLoaded && state.jarData.id == picked.id) {
      data = state.jarData;
    } else {
      summaryBloc.add(SetCurrentJarRequested(jarId: picked.id));
      try {
        final loaded = await summaryBloc.stream
            .firstWhere(
              (s) =>
                  (s is JarSummaryLoaded && s.jarData.id == picked!.id) ||
                  s is JarSummaryError,
            )
            .timeout(const Duration(seconds: 20));
        if (loaded is JarSummaryLoaded) data = loaded.jarData;
      } catch (_) {}
    }
    if (!mounted) return;
    if (data == null) {
      AppSnackBar.show(
        context,
        message: 'Couldn\'t open that jar. Please try again.',
        type: SnackBarType.error,
      );
      return;
    }
    switch (action) {
      case _HomeAction.collect:
        JarActions.contribute(context, data);
      case _HomeAction.request:
        JarActions.request(context, data);
      case _HomeAction.transfer:
        JarActions.withdraw(context, data);
    }
  }

  static String? _imageUrl(JarListItem jar) => JarActions.imageUrl(jar);

  // ------------------------------------------------------------ build

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            // Signed out: back to the welcome screen.
            if (state is AuthInitial) context.go(AppRoutes.onboarding);
          },
        ),
        BlocListener<OnboardingBloc, OnboardingState>(
          listener: (context, state) {
            if (state is OnboardingPageState && !_walkthroughTriggered) {
              // User hasn't completed onboarding: show the walkthrough.
              _walkthroughTriggered = true;
              Future.delayed(const Duration(seconds: 1), () {
                if (mounted && _walkthroughTriggered) {
                  context.push(AppRoutes.walkthrough).then((_) {
                    if (mounted) setState(() => _walkthroughTriggered = false);
                  });
                }
              });
            }
            if (state is OnboardingCompleted) _walkthroughTriggered = false;
          },
        ),
      ],
      child: Scaffold(
        backgroundColor: AppColors.cream,
        body: SafeArea(
          bottom: false,
          child: BlocBuilder<AuthBloc, AuthState>(
            builder: (context, authState) {
              final user =
                  authState is AuthAuthenticated ? authState.user : null;
              return BlocBuilder<JarListBloc, JarListState>(
                builder: (context, listState) {
                  // Avatar, greeting and bell stay pinned; the rest scrolls
                  // underneath.
                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                        child: _HomeHeader(user: user),
                      ),
                      Expanded(
                        child: RefreshIndicator(
                          color: AppColors.navy,
                          backgroundColor: AppColors.surfaceWhite,
                          onRefresh: _onRefresh,
                          child: ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: EdgeInsets.fromLTRB(
                              16,
                              4,
                              16,
                              MainShell.scrollBottom(context),
                            ),
                            children: _body(context, listState, user),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  List<Widget> _body(BuildContext context, JarListState state, User? user) {
    if (state is JarListInitial ||
        (state is JarListLoading && _lastJars == null)) {
      return const [HomeSkeleton()];
    }
    if (state is JarListError && _lastJars == null) {
      return [
        const SizedBox(height: 40),
        DsCard(
          child: DsEmptyState(
            icon: Icons.error_outline_rounded,
            tone: DsTone.negative,
            title: 'Couldn\'t load your jars',
            message: state.message,
            actionLabel: 'Retry',
            onAction: () => context.read<JarListBloc>().add(LoadJarList()),
          ),
        ),
      ];
    }

    final jars = state is JarListLoaded ? _allJars(state) : _lastJars!;
    _lastJars = jars;
    final userId = user?.id;
    final own = jars.where((j) => j.creator.id == userId).toList();
    // Sealed and frozen jars still hold money, so they stay on Home (tagged);
    // only closed jars drop off.
    final openJars = jars.where((j) => !j.isClosed).toList();
    final ownOpen = own.where((j) => !j.isClosed).toList();
    // Open jars swipe as cards; sealed and frozen ones get their own list.
    final activeJars =
        openJars.where((j) => !j.isSealed && !j.isFrozen).toList();
    // Below Recent activity: sealed, frozen and closed jars.
    final sealedJars = [
      ...openJars.where((j) => j.isSealed || j.isFrozen),
      ...jars.where((j) => j.isClosed),
    ];

    if (jars.isEmpty) return _firstDay(context, user);
    // Onboarding gate: until every step is done (verified, profile photo,
    // payout account, own jar), Home shows only the checklist, in any order
    // the steps were skipped.
    JarActions.watchSetup(context);
    final onboarded =
        user != null &&
        user.photo != null &&
        own.isNotEmpty &&
        !JarActions.needsSetup(context);
    if (!onboarded) return [_getStarted(user, hasJar: own.isNotEmpty)];
    if (openJars.isEmpty) return _allClosed(context, jars);

    final collectorOnly = own.isEmpty;
    final shown = collectorOnly ? openJars : ownOpen;
    final total = shown.fold<double>(0, (sum, j) => sum + j.totalContributions);
    final currency =
        shown.isNotEmpty ? shown.first.currency.toUpperCase() : 'GHS';
    final noPaymentsYet = !collectorOnly && total == 0;

    return [
      _TotalBlock(
        label: collectorOnly ? 'In jars you collect for' : 'Total in your jars',
        amount: total,
        currency: currency,
        tag: shown.length == 1 ? '1 jar' : '${shown.length} jars',
        note: noPaymentsYet ? 'Waiting for the first payment' : null,
      ),
      const SizedBox(height: 14),
      _quickActions(context, jars, userId, collectorOnly),
      const SizedBox(height: 18),
      if (activeJars.isNotEmpty) ...[
        DsSectionHeader(
          collectorOnly ? 'Jars you collect for' : 'Your jars',
          action: 'See all',
          onAction: () => context.go(AppRoutes.jars),
        ),
        if (activeJars.length == 1)
          _JarRow(
            jar: activeJars.first,
            imageUrl: _imageUrl(activeJars.first),
            isOwner: activeJars.first.creator.id == userId,
            onTap: () => _openJar(activeJars.first),
          )
        else
          SizedBox(
            height: 168,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              itemCount: activeJars.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, i) {
                final jar = activeJars[i];
                return _JarCard(
                  jar: jar,
                  imageUrl: _imageUrl(jar),
                  isOwner: jar.creator.id == userId,
                  onTap: () => _openJar(jar),
                );
              },
            ),
          ),
      ],
      if (noPaymentsYet) ...[
        const SizedBox(height: 14),
        DsNote(
          icon: Icons.ios_share_rounded,
          title: 'Get your first payment',
          text:
              'Share your link on WhatsApp. Most jars get their first payment within an hour.',
          onTap: () => _runAction(_HomeAction.request, jars, userId),
        ),
      ],
      if (collectorOnly) ...[
        const SizedBox(height: 14),
        if (JarActions.needsSetup(context))
          const JarSetupCard()
        else
          DsCard(
            child: DsEmptyState(
              icon: Icons.savings_outlined,
              tone: DsTone.lime,
              title: 'No jars of your own',
              message:
                  'Start a jar for your own cause and money goes straight to your account.',
              actionLabel: 'Create a jar',
              onAction: () => JarActions.createJar(context),
            ),
          ),
      ],
      const SizedBox(height: 18),
      _recentActivity(context, jars, userId),
      if (sealedJars.isNotEmpty) ...[
        const SizedBox(height: 18),
        DsSectionHeader(
          sealedJars.any((j) => j.isClosed)
              ? 'Sealed & broken jars'
              : 'Sealed jars',
          action: 'All',
          onAction: () => context.go(AppRoutes.jars),
        ),
        DsListCard(
          children: [
            for (final jar in sealedJars)
              DsRow(
                leading: JarThumb(imageUrl: _imageUrl(jar), size: 40),
                title: jar.name,
                subtitle:
                    '${jar.currency.toUpperCase()} ${_short(jar.totalContributions)}'
                    '${jar.isClosed
                        ? ''
                        : jar.isFrozen
                        ? ' · Contact support'
                        : ' · No new payments'}',
                trailing: _statusTag(jar, jar.creator.id == userId),
                onTap: () => _openJar(jar),
              ),
          ],
        ),
      ],
    ];
  }

  List<JarListItem>? _lastJars;

  Widget _quickActions(
    BuildContext context,
    List<JarListItem> jars,
    String? userId,
    bool collectorOnly,
  ) {
    final canTransfer = jars.any(
      (j) => j.creator.id == userId && j.canTransfer,
    );
    final tiles = <Widget>[
      DsQuickAction(
        key: const Key('home_collect_button'),
        icon: Icons.add_rounded,
        label: 'Collect',
        primary: true,
        onTap: () => _runAction(_HomeAction.collect, jars, userId),
      ),
      DsQuickAction(
        key: const Key('home_request_button'),
        icon: JarActions.requestIcon,
        label: 'Request',
        onTap: () => _runAction(_HomeAction.request, jars, userId),
      ),
      if (!collectorOnly)
        DsQuickAction(
          key: const Key('home_transfer_button'),
          icon: JarActions.transferIcon,
          label: 'Transfer',
          onTap:
              canTransfer
                  ? () => _runAction(_HomeAction.transfer, jars, userId)
                  : null,
        ),
      DsQuickAction(
        key: const Key('home_new_jar_button'),
        icon: Icons.savings_outlined,
        label: 'New jar',
        onTap: () => JarActions.createJar(context),
      ),
      if (collectorOnly)
        DsQuickAction(
          icon: Icons.mail_outline_rounded,
          label: 'Invites',
          onTap: () => context.push(AppRoutes.notifications),
        ),
    ];
    return Row(
      children: [
        for (var i = 0; i < tiles.length; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          Expanded(child: tiles[i]),
        ],
      ],
    );
  }

  /// Latest payments across all your jars (not the jar last opened, which
  /// made this section change every time a jar was opened).
  Widget _recentActivity(
    BuildContext context,
    List<JarListItem> jars,
    String? userId,
  ) => _HomeRecentActivity(
    key: _activityKey,
    jars: jars,
    userId: userId,
    onSeeAll: _openActivity,
    onShare: () => _runAction(_HomeAction.request, jars, userId),
  );

  // ------------------------------------------------------------ states

  /// No jars yet: a get-started checklist.
  List<Widget> _firstDay(BuildContext context, User? user) {
    return [
      const _TotalBlock(
        label: 'Total in your jars',
        amount: 0,
        currency: 'GHS',
      ),
      const SizedBox(height: 14),
      _getStarted(user, hasJar: false),
    ];
  }

  /// Onboarding steps: verify, profile photo, payout account, first jar.
  Widget _getStarted(User? user, {required bool hasJar}) {
    final verified =
        user == null
            ? false
            : user.isOrganization
            ? user.kybStatus == 'approved'
            : user.kycStatus == 'verified';
    return BlocBuilder<WithdrawalAccountsBloc, WithdrawalAccountsState>(
      builder: (context, wa) {
        final hasPayout = wa.accounts.isNotEmpty;
        final steps = <_Step>[
          _Step(
            user?.isOrganization == true
                ? 'Verify your business'
                : 'Verify your ID',
            subtitle: 'About 3 minutes',
            done: verified,
            onStart:
                () => context.push(
                  user?.isOrganization == true
                      ? AppRoutes.businessKyb
                      : AppRoutes.kycView,
                ),
          ),
          _Step(
            'Set up your profile',
            subtitle: 'Add a photo so contributors know it\'s you',
            done: user?.photo != null,
            onStart: () => context.push(AppRoutes.userAccountView),
          ),
          _Step(
            'Add a payout account',
            subtitle: 'Where your money goes',
            done: hasPayout,
            onStart: () => context.push(AppRoutes.withdrawalAccounts),
          ),
          _Step(
            'Create your first jar',
            subtitle: 'Takes two minutes',
            done: hasJar,
            onStart: () => JarActions.createJar(context),
          ),
        ];
        return _GetStartedCard(steps: steps);
      },
    );
  }

  /// Every jar is closed: invite to start the next one, list the closed ones.
  List<Widget> _allClosed(BuildContext context, List<JarListItem> jars) {
    return [
      const _TotalBlock(
        label: 'Total in your jars',
        amount: 0,
        currency: 'GHS',
        note: 'No open jars',
      ),
      const SizedBox(height: 14),
      DsCard(
        child: DsEmptyState(
          icon: Icons.savings_outlined,
          tone: DsTone.lime,
          title: 'Start your next jar',
          message:
              'Your last jar, ${jars.first.name}, raised ${jars.first.currency.toUpperCase()} ${_short(jars.first.totalContributions)}.',
          actionLabel: 'New jar',
          onAction: () => JarActions.createJar(context),
        ),
      ),
      const SizedBox(height: 18),
      DsSectionHeader(
        'Broken jars',
        action: 'All',
        onAction: () => context.go(AppRoutes.jars),
      ),
      DsListCard(
        children: [
          for (final jar in jars.take(5))
            DsRow(
              leading: JarThumb(imageUrl: _imageUrl(jar), size: 40),
              title: jar.name,
              subtitle:
                  '${jar.currency.toUpperCase()} ${_short(jar.totalContributions)}',
              trailing: const DsTag('Broken'),
              onTap: () => _openJar(jar),
            ),
        ],
      ),
    ];
  }
}

String _short(double v) {
  final whole = v.round().toString();
  final b = StringBuffer();
  for (var i = 0; i < whole.length; i++) {
    if (i > 0 && (whole.length - i) % 3 == 0) b.write(',');
    b.write(whole[i]);
  }
  return b.toString();
}

// ---------------------------------------------------------------- pieces

class _HomeHeader extends StatelessWidget {
  final User? user;
  const _HomeHeader({this.user});

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    final greeting =
        hour < 12
            ? 'Good morning'
            : hour < 17
            ? 'Good afternoon'
            : 'Good evening';
    final name =
        user != null && user!.fullName.trim().isNotEmpty
            ? user!.fullName
            : 'Welcome';

    return Row(
      children: [
        GestureDetector(
          onTap: () => context.go(AppRoutes.userAccountView),
          child: UserAvatarSmall(
            radius: 20,
            backgroundColor: AppColors.surfaceWhite,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(greeting, style: DsText.caption),
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
        const _HomeThemeSwitch(),
        const SizedBox(width: 8),
        const _HomeBell(),
      ],
    );
  }
}

/// Flips the app between light and dark. Shows a moon in light mode and a
/// sun in dark mode, and saves the choice to the account.
class _HomeThemeSwitch extends StatelessWidget {
  const _HomeThemeSwitch();

  @override
  Widget build(BuildContext context) {
    final dark = AppColors.isDark;
    return JarNavButton(
      key: const Key('theme_switch_button'),
      icon: dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
      onTap: () {
        HapticUtils.light();
        final next =
            dark ? theme_enum.AppTheme.light : theme_enum.AppTheme.dark;
        themeOverride.value = next;
        context.read<UserAccountBloc>().add(
          UpdatePersonalDetails(appTheme: next),
        );
      },
    );
  }
}

/// Bell with an unread dot, driven by the notifications bloc when present.
class _HomeBell extends StatelessWidget {
  const _HomeBell();

  @override
  Widget build(BuildContext context) {
    void open() => context.push(AppRoutes.notifications);

    NotificationsBloc? bloc;
    try {
      bloc = context.read<NotificationsBloc>();
    } catch (_) {
      bloc = null;
    }
    if (bloc == null) {
      return JarNavButton(
        key: const Key('notifications_button'),
        icon: Icons.notifications_none_rounded,
        onTap: open,
      );
    }

    return BlocBuilder<NotificationsBloc, NotificationsState>(
      buildWhen: (prev, curr) => curr is NotificationsLoaded,
      builder: (context, state) {
        var unread = 0;
        if (state is NotificationsLoaded) {
          unread =
              state.notifications
                  .where((n) => n.status == NotificationStatus.unread)
                  .length;
        }
        return JarNavButton(
          key: const Key('notifications_button'),
          icon: Icons.notifications_none_rounded,
          dot: unread > 0,
          onTap: open,
        );
      },
    );
  }
}

/// "Total in your jars" with the big amount and a tag line.
class _TotalBlock extends StatelessWidget {
  final String label;
  final double amount;
  final String currency;
  final String? tag;
  final String? note;

  const _TotalBlock({
    required this.label,
    required this.amount,
    required this.currency,
    this.tag,
    this.note,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 6, 4, 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: DsText.caption),
          const SizedBox(height: 4),
          DsMoney(amount, currency: currency, size: 44),
          if (tag != null || note != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                if (tag != null) ...[DsTag(tag!), const SizedBox(width: 8)],
                if (note != null)
                  Flexible(child: Text(note!, style: DsText.caption)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// Sealed / Frozen when the jar isn't open, otherwise the user's role.
Widget _statusTag(JarListItem jar, bool isOwner) {
  if (jar.isClosed) return const DsTag('Broken');
  if (jar.isFrozen) return const DsTag('Frozen', tone: DsTone.negative);
  if (jar.isSealed) return const DsTag('Sealed', tone: DsTone.pending);
  return DsTag(isOwner ? 'Owner' : 'Collector');
}

String _daysLeft(String? deadline) {
  if (deadline == null) return '';
  final d = DateTime.tryParse(deadline);
  if (d == null) return '';
  final days = d.difference(DateTime.now()).inDays;
  if (days < 0) return 'Ended';
  if (days == 0) return 'Ends today';
  return days == 1 ? '1 day' : '$days days';
}

/// Swipeable jar account card (mockup "Your jars").
class _JarCard extends StatelessWidget {
  final JarListItem jar;
  final String? imageUrl;
  final bool isOwner;
  final VoidCallback onTap;

  const _JarCard({
    required this.jar,
    required this.imageUrl,
    required this.isOwner,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasGoal = jar.goalAmount > 0;
    final progress =
        hasGoal
            ? (jar.totalContributions / jar.goalAmount).clamp(0.0, 1.0)
            : 0.0;
    final left = _daysLeft(jar.deadline);
    return SizedBox(
      width: 220,
      child: DsCard(
        padding: const EdgeInsets.all(14),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                JarThumb(imageUrl: imageUrl, size: 34),
                const Spacer(),
                _statusTag(jar, isOwner),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              jar.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: DsText.rowTitle.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 2),
            DsMoney(jar.totalContributions, currency: null, size: 22),
            const Spacer(),
            if (hasGoal) ...[
              DsProgress(progress),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${(progress * 100).round()}% of ${_short(jar.goalAmount)}',
                      style: DsText.caption,
                    ),
                  ),
                  if (left.isNotEmpty) Text(left, style: DsText.caption),
                ],
              ),
            ] else
              Text(jar.currency.toUpperCase(), style: DsText.caption),
          ],
        ),
      ),
    );
  }
}

/// A single jar as a row (mockup "Home · jar, no payments yet").
class _JarRow extends StatelessWidget {
  final JarListItem jar;
  final String? imageUrl;
  final bool isOwner;
  final VoidCallback onTap;

  const _JarRow({
    required this.jar,
    required this.imageUrl,
    required this.isOwner,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cur = jar.currency.toUpperCase();
    final subtitle =
        jar.goalAmount > 0
            ? '$cur ${_short(jar.totalContributions)} of ${_short(jar.goalAmount)}'
            : '$cur ${_short(jar.totalContributions)}';
    return DsCard(
      padding: const EdgeInsets.all(14),
      onTap: onTap,
      child: Row(
        children: [
          JarThumb(imageUrl: imageUrl, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  jar.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.rowTitle.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(subtitle, style: DsText.caption),
              ],
            ),
          ),
          const SizedBox(width: 8),
          jar.isSealed || jar.isFrozen
              ? _statusTag(jar, isOwner)
              : DsTag(
                !isOwner
                    ? 'Collector'
                    : jar.totalContributions == 0
                    ? 'New'
                    : 'Owner',
              ),
        ],
      ),
    );
  }
}

class _Step {
  final String title;
  final String? subtitle;
  final bool done;
  final VoidCallback? onStart;
  _Step(this.title, {this.subtitle, required this.done, this.onStart});
}

/// "Get started" checklist (mockup "Home · first day").
class _GetStartedCard extends StatelessWidget {
  final List<_Step> steps;
  const _GetStartedCard({required this.steps});

  @override
  Widget build(BuildContext context) {
    final doneCount = steps.where((s) => s.done).length;
    final current = steps.indexWhere((s) => !s.done);
    return DsCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Get started',
                  style: DsText.section.copyWith(fontSize: 19),
                ),
              ),
              DsTag('$doneCount of ${steps.length}', tone: DsTone.lime),
            ],
          ),
          const SizedBox(height: 12),
          DsProgress(doneCount / steps.length),
          const SizedBox(height: 16),
          for (var i = 0; i < steps.length; i++)
            _StepRow(
              index: i,
              step: steps[i],
              isCurrent: i == current,
              isLast: i == steps.length - 1,
            ),
        ],
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  final int index;
  final _Step step;
  final bool isCurrent;
  final bool isLast;

  const _StepRow({
    required this.index,
    required this.step,
    required this.isCurrent,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final Color dotBg =
        step.done
            ? AppColors.positive
            : isCurrent
            ? AppColors.navy
            : AppColors.fill;
    final Color dotFg =
        step.done || isCurrent ? AppColors.surfaceWhite : AppColors.ink2;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 26,
            child: Column(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: dotBg,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child:
                      step.done
                          ? Icon(Icons.check_rounded, size: 15, color: dotFg)
                          : Text(
                            '${index + 1}',
                            style: TextStyle(
                              fontFamily: 'Supreme',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: dotFg,
                            ),
                          ),
                ),
                if (!isLast)
                  Expanded(child: Container(width: 2, color: AppColors.line)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(top: 3, bottom: isLast ? 0 : 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.title,
                    style: DsText.rowTitle.copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color:
                          step.done || isCurrent
                              ? AppColors.navy
                              : AppColors.muted,
                    ),
                  ),
                  if (isCurrent && step.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(step.subtitle!, style: DsText.caption),
                  ],
                  if (isCurrent && step.onStart != null) ...[
                    const SizedBox(height: 8),
                    DsSmallButton(label: 'Start', onTap: step.onStart),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Home's "Recent activity": the 5 latest payments across every jar the
/// user can see, each row naming its jar. Same access rule as Activity's
/// "All jars": everything on jars you own or co-manage, only your own
/// collections on the rest.
class _HomeRecentActivity extends StatefulWidget {
  final List<JarListItem> jars;
  final String? userId;
  final VoidCallback onSeeAll;
  final VoidCallback onShare;

  const _HomeRecentActivity({
    super.key,
    required this.jars,
    required this.userId,
    required this.onSeeAll,
    required this.onShare,
  });

  @override
  State<_HomeRecentActivity> createState() => _HomeRecentActivityState();
}

class _HomeRecentActivityState extends State<_HomeRecentActivity> {
  List<activity.ContributionModel>? _items;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// Refetch when the jars or their totals change (e.g. a new payment).
  String _signature(List<JarListItem> jars) =>
      [for (final j in jars) '${j.id}:${j.totalContributions}'].join('|');

  @override
  void didUpdateWidget(covariant _HomeRecentActivity old) {
    super.didUpdateWidget(old);
    if (_signature(old.jars) != _signature(widget.jars)) _load();
  }

  Future<void> _load() async {
    final full = <String>[];
    final mine = <String>[];
    for (final j in widget.jars) {
      final isAdmin =
          widget.userId != null &&
          j.invitedCollectors.any(
            (ic) =>
                ic.collector?.id == widget.userId &&
                ic.role == 'admin' &&
                ic.status == 'accepted',
          );
      (j.creator.id == widget.userId || isAdmin ? full : mine).add(j.id);
    }
    if (full.isEmpty && mine.isEmpty) {
      setState(() => _items = const []);
      return;
    }
    try {
      final result = await getIt<ContributionRepository>().getContributions(
        fullAccessJarIds: full,
        collectorOnlyJarIds: mine,
        limit: 5,
        page: 1,
      );
      if (!mounted) return;
      final docs = (result['data']?['docs'] as List?) ?? const [];
      final items = <activity.ContributionModel>[];
      for (final d in docs) {
        try {
          items.add(
            activity.ContributionModel.fromJson(d as Map<String, dynamic>),
          );
        } catch (_) {}
      }
      setState(() {
        _failed = result['success'] != true;
        _items = items;
      });
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  String _jarName(activity.ContributionModel c) {
    if (c.jar.name.isNotEmpty) return c.jar.name;
    for (final j in widget.jars) {
      if (j.id == c.jar.id) return j.name;
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DsSectionHeader(
          'Recent activity',
          action: (items?.isNotEmpty ?? false) ? 'All' : null,
          onAction: widget.onSeeAll,
        ),
        if (items == null && !_failed)
          const JarActivitySkeleton()
        else if (_failed && (items == null || items.isEmpty))
          DsCard(
            padding: EdgeInsets.zero,
            child: DsEmptyState(
              icon: Icons.wifi_off_rounded,
              title: 'Couldn\'t load recent activity',
              message: 'Pull down to try again.',
              actionLabel: 'Retry',
              onAction: () {
                setState(() => _failed = false);
                _load();
              },
            ),
          )
        else if (items!.isEmpty)
          DsCard(
            padding: EdgeInsets.zero,
            child: DsEmptyState(
              icon: Icons.receipt_long_outlined,
              title: 'No payments yet',
              message:
                  'Payments to any of your jars will show up here as they come in.',
              actionLabel: 'Share jar link',
              onAction: widget.onShare,
            ),
          )
        else
          DsListCard(
            children: [
              for (final c in items)
                ActivityRow(
                  contribution: c,
                  jarName: _jarName(c),
                  withDate: true,
                ),
            ],
          ),
      ],
    );
  }
}
