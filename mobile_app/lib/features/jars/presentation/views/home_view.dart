import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/services/fcm_service.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
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
import 'package:Hoga/features/jars/presentation/widgets/jar_activity_row.dart';
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

  Future<void> _onRefresh() async {
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
            ? jars.where((j) => j.creator.id == userId).toList()
            : jars.where((j) => j.isActive).toList();
    if (eligible.isEmpty) return;

    final summaryBloc = context.read<JarSummaryBloc>();
    final current =
        summaryBloc.state is JarSummaryLoaded
            ? (summaryBloc.state as JarSummaryLoaded).jarData.id
            : null;

    JarListItem? picked;
    if (eligible.length == 1) {
      picked = eligible.first;
    } else {
      JarListItem? choice;
      await GenericPicker.showPickerDialog<JarListItem>(
        context,
        title: switch (action) {
          _HomeAction.collect => 'Collect for which jar?',
          _HomeAction.request => 'Request for which jar?',
          _HomeAction.transfer => 'Transfer from',
        },
        selectedValue:
            current != null && eligible.any((j) => j.id == current)
                ? current
                : eligible.first.id,
        items: eligible,
        showSearch: eligible.length > 6,
        searchFilter: (j) => j.name,
        isItemSelected: (j, sel) => j.id == sel,
        onItemSelected: (j) => choice = j,
        itemBuilder: (j, sel, onTap) => _pickerRow(j, sel, onTap, userId),
        recentItemBuilder: (j, sel, onTap) => _pickerRow(j, sel, onTap, userId),
        searchResultBuilder:
            (j, sel, onTap) => _pickerRow(j, sel, onTap, userId),
      );
      picked = choice;
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

  Widget _pickerRow(
    JarListItem jar,
    bool selected,
    VoidCallback onTap,
    String? userId,
  ) {
    return DsRow(
      leading: JarThumb(imageUrl: _imageUrl(jar), size: 40),
      title: jar.name,
      subtitle: jar.creator.id == userId ? 'Owner' : 'Collector',
      trailing: DsRadio(selected: selected),
      onTap: onTap,
    );
  }

  static String? _imageUrl(JarListItem jar) {
    final url = jar.image?.url;
    if (url == null || url.isEmpty) return null;
    return ImageUtils.constructImageUrl(url);
  }

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
                  return RefreshIndicator(
                    color: AppColors.navy,
                    backgroundColor: AppColors.surfaceWhite,
                    onRefresh: _onRefresh,
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 120),
                      children: [
                        _HomeHeader(user: user),
                        const SizedBox(height: 14),
                        ..._body(context, listState, user),
                      ],
                    ),
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
      return const [
        SizedBox(height: 120),
        Center(child: CircularProgressIndicator(color: AppColors.navy)),
      ];
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
    final openJars = jars.where((j) => j.isActive).toList();
    final ownOpen = own.where((j) => j.isActive).toList();

    if (jars.isEmpty) return _firstDay(context, user);
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
      _quickActions(context, jars, userId, collectorOnly, noPaymentsYet),
      const SizedBox(height: 18),
      DsSectionHeader(
        collectorOnly ? 'Jars you collect for' : 'Your jars',
        action: 'See all',
        onAction: () => context.go(AppRoutes.jars),
      ),
      if (openJars.length == 1)
        _JarRow(
          jar: openJars.first,
          imageUrl: _imageUrl(openJars.first),
          isOwner: openJars.first.creator.id == userId,
          onTap: () => _openJar(openJars.first),
        )
      else
        SizedBox(
          height: 168,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            itemCount: openJars.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final jar = openJars[i];
              return _JarCard(
                jar: jar,
                imageUrl: _imageUrl(jar),
                isOwner: jar.creator.id == userId,
                onTap: () => _openJar(jar),
              );
            },
          ),
        ),
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
        DsCard(
          child: DsEmptyState(
            icon: Icons.savings_outlined,
            tone: DsTone.lime,
            title: 'No jars of your own',
            message:
                'Start a jar for your own cause and money goes straight to your account.',
            actionLabel: 'Create a jar',
            onAction: () => context.push(AppRoutes.jarCreate),
          ),
        ),
      ],
      const SizedBox(height: 18),
      _recentActivity(context, jars, userId),
    ];
  }

  List<JarListItem>? _lastJars;

  Widget _quickActions(
    BuildContext context,
    List<JarListItem> jars,
    String? userId,
    bool collectorOnly,
    bool noPaymentsYet,
  ) {
    final canTransfer = !collectorOnly && !noPaymentsYet;
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
        icon: Icons.qr_code_2_rounded,
        label: 'Request',
        onTap: () => _runAction(_HomeAction.request, jars, userId),
      ),
      if (!collectorOnly)
        DsQuickAction(
          key: const Key('home_transfer_button'),
          icon: Icons.north_east_rounded,
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
        onTap: () => context.push(AppRoutes.jarCreate),
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

  /// Recent activity of the jar you last used (the feed is per jar).
  Widget _recentActivity(
    BuildContext context,
    List<JarListItem> jars,
    String? userId,
  ) {
    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, state) {
        final jar = state is JarSummaryLoaded ? state.jarData : null;
        final items = jar?.contributions.take(4).toList() ?? const [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DsSectionHeader(
              'Recent activity',
              action: items.isNotEmpty ? 'All' : null,
              onAction: _openActivity,
            ),
            if (jar != null && jars.length > 1)
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 8),
                child: Text(jar.name, style: DsText.caption),
              ),
            if (state is JarSummaryLoading)
              const DsCard(
                child: SizedBox(
                  height: 80,
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.navy),
                  ),
                ),
              )
            else if (items.isEmpty)
              DsCard(
                padding: EdgeInsets.zero,
                child: DsEmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: 'No payments yet',
                  message:
                      'Payments to your jar will show up here as they come in.',
                  actionLabel: 'Share jar link',
                  onAction: () => _runAction(_HomeAction.request, jars, userId),
                ),
              )
            else
              DsListCard(
                children: [
                  for (final c in items) JarActivityRow(contribution: c),
                ],
              ),
          ],
        );
      },
    );
  }

  // ------------------------------------------------------------ states

  /// No jars yet: a get-started checklist.
  List<Widget> _firstDay(BuildContext context, User? user) {
    final verified =
        user == null
            ? false
            : user.isOrganization
            ? user.kybStatus == 'approved'
            : user.kycStatus == 'verified';
    return [
      const _TotalBlock(
        label: 'Total in your jars',
        amount: 0,
        currency: 'GHS',
      ),
      const SizedBox(height: 14),
      BlocBuilder<WithdrawalAccountsBloc, WithdrawalAccountsState>(
        builder: (context, wa) {
          final hasPayout = wa.accounts.isNotEmpty;
          final steps = <_Step>[
            _Step('Create your account', done: true),
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
              'Create your first jar',
              subtitle: 'Takes two minutes',
              done: false,
              onStart: () => context.push(AppRoutes.jarCreate),
            ),
            _Step(
              'Add a payout account',
              subtitle: 'Where your money goes',
              done: hasPayout,
              onStart: () => context.push(AppRoutes.withdrawalAccounts),
            ),
          ];
          return _GetStartedCard(steps: steps);
        },
      ),
    ];
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
          onAction: () => context.push(AppRoutes.jarCreate),
        ),
      ),
      const SizedBox(height: 18),
      DsSectionHeader(
        'Closed jars',
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
              trailing: const DsTag('Closed'),
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
          child: const UserAvatarSmall(
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
        const _HomeBell(),
      ],
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
                DsTag(isOwner ? 'Owner' : 'Collector'),
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
          DsTag(
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
