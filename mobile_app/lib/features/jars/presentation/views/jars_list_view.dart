import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/config/app_config.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_images.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_list_model.dart';
import 'package:Hoga/features/notifications/data/models/notification_model.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/route.dart';

class JarsListView extends StatefulWidget {
  /// Shown as the Jars tab (full screen, no blur or close button) rather than
  /// the old full-screen switcher dialog.
  final bool asTab;

  const JarsListView({super.key, this.asTab = false});

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
        return BlocProvider.value(
          value: getIt<JarListBloc>()..add(LoadJarList()),
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
  String _searchQuery = '';

  /// Status tab on the Jars tab: 0 Active, 1 Sealed, 2 Closed.
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    if (widget.asTab) context.read<JarListBloc>().add(LoadJarList());
  }

  void _createJar() {
    HapticUtils.heavy();
    context.push(AppRoutes.jarCreate);
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BackdropFilter(
      filter: ImageFilter.blur(
        sigmaX: widget.asTab ? 0 : 10,
        sigmaY: widget.asTab ? 0 : 10,
      ),
      child: Scaffold(
        backgroundColor:
            widget.asTab
                ? AppColors.cream
                : AppColors.cream.withValues(alpha: 0.94),
        body: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                child: Row(
                  children: [
                    if (!widget.asTab) ...[
                      JarNavButton(
                        icon: Icons.close,
                        onTap: () {
                          HapticUtils.heavy();
                          context.pop();
                        },
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: Text(
                        localizations.jars,
                        style: widget.asTab ? DsText.display : DsText.title,
                      ),
                    ),
                    JarNavButton(icon: Icons.add, onTap: _createJar),
                  ],
                ),
              ),
              Expanded(
                child: BlocBuilder<JarListBloc, JarListState>(
                  builder:
                      (context, state) =>
                          _buildJarListContent(state, localizations),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _searchField(AppLocalizations localizations, int count) {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.search_rounded, size: 20, color: AppColors.muted),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              cursorColor: AppColors.navy,
              style: DsText.rowTitle,
              decoration: InputDecoration(
                isDense: true,
                filled: false,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.zero,
                hintText:
                    count > 0
                        ? 'Search $count ${count == 1 ? localizations.jar.toLowerCase() : localizations.jars.toLowerCase()}'
                        : localizations.searchOptions,
                hintStyle: DsText.rowTitle.copyWith(
                  color: AppColors.muted,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJarListContent(
    JarListState state,
    AppLocalizations localizations,
  ) {
    return switch (state) {
      JarListInitial() => Center(
        child: Text(localizations.tapToLoadYourJars, style: DsText.small),
      ),
      JarListLoading() => const JarLoading(),
      JarListError(message: final message) => Center(
        child: DsEmptyState(
          icon: Icons.error_outline,
          tone: DsTone.negative,
          title: localizations.errorLoadingJars,
          message: message,
          actionLabel: localizations.retry,
          onAction: () => context.read<JarListBloc>().add(LoadJarList()),
        ),
      ),
      JarListLoaded(jars: final jarList) => _buildJarGroups(
        jarList,
        localizations,
      ),
    };
  }

  Widget _buildEmpty(AppLocalizations localizations) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              AppImages.onboardingSlide1,
              width: 150,
              height: 150,
              fit: BoxFit.contain,
              color: AppColors.navy,
              colorBlendMode: BlendMode.srcIn,
            ),
            const SizedBox(height: 16),
            Text(
              'No jars yet',
              style: DsText.section.copyWith(fontSize: 20),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              'Start one for a wedding, funeral, church project or susu. Jars you\'re invited to also show up here.',
              style: DsText.small,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            DsSmallButton(
              label: localizations.createJar,
              icon: Icons.add,
              onTap: _createJar,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJarGroups(JarList jarList, AppLocalizations localizations) {
    if (jarList.groups.isEmpty || jarList.totalJarCount == 0) {
      return _buildEmpty(localizations);
    }

    // Filter groups by search query
    final query = _searchQuery.toLowerCase();
    final filteredGroups =
        jarList.groups
            .map((group) {
              final matchingJars =
                  query.isEmpty
                      ? group.jars
                      : group.jars
                          .where(
                            (jar) => jar.name.toLowerCase().contains(query),
                          )
                          .toList();
              if (matchingJars.isEmpty) return null;
              return JarGroup(
                id: group.id,
                name: group.name,
                description: group.description,
                jars: matchingJars,
                totalJars: matchingJars.length,
                totalGoalAmount: group.totalGoalAmount,
                totalContributions: group.totalContributions,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt,
              );
            })
            .whereType<JarGroup>()
            .toList();

    final authState = context.watch<AuthBloc>().state;
    final userId = authState is AuthAuthenticated ? authState.user.id : null;
    final allJars = [for (final group in filteredGroups) ...group.jars];

    // Status tabs (Jars tab only): sealed and frozen share "Sealed".
    bool isSealedTab(JarListItem j) =>
        !j.isClosed && (j.isSealed || j.isFrozen);
    final active =
        allJars.where((j) => !j.isClosed && !isSealedTab(j)).toList();
    final sealed = allJars.where(isSealedTab).toList();
    final closed = allJars.where((j) => j.isClosed).toList();
    final tabs = <(String, List<JarListItem>)>[
      ('Active · ${active.length}', active),
      ('Sealed · ${sealed.length}', sealed),
      if (closed.isNotEmpty) ('Closed · ${closed.length}', closed),
    ];
    final tab = _tab < tabs.length ? _tab : 0;
    final jars = widget.asTab ? tabs[tab].$2 : allJars;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
      children: [
        _searchField(localizations, jarList.totalJarCount),
        const SizedBox(height: 12),
        if (widget.asTab) ...[
          CollectTabs(
            labels: [for (final t in tabs) t.$1],
            index: tab,
            onChanged: (i) => setState(() => _tab = i),
          ),
          const SizedBox(height: 12),
        ],
        if (jars.isEmpty)
          DsEmptyState(
            icon:
                query.isEmpty
                    ? Icons.savings_outlined
                    : Icons.search_off_rounded,
            title:
                query.isEmpty
                    ? (tab == 1 ? 'No sealed jars' : 'No jars here')
                    : localizations.noJarsFound,
            message:
                query.isEmpty
                    ? (tab == 1
                        ? 'Seal a jar from its settings to stop new payments and keep the money.'
                        : 'Jars show up here as you create or join them.')
                    : 'Try a different name.',
          )
        else
          // One list of every jar, as in the mockup (no category headers).
          DsListCard(
            children: [
              for (final jar in jars)
                _buildJarItem(jar, context, userId, localizations),
            ],
          ),
        if (widget.asTab) ...[
          const SizedBox(height: 12),
          const _InvitationsCard(),
        ],
      ],
    );
  }

  Widget _buildJarItem(
    JarListItem jar,
    BuildContext context,
    String? userId,
    AppLocalizations localizations,
  ) {
    final imageUrl =
        jar.image != null ? _resolveJarImageUrl(jar.image!.url) : null;
    final isOwner = userId != null && jar.creator.id == userId;
    final hasGoal = jar.goalAmount > 0;

    return InkWell(
      onTap: () {
        HapticUtils.heavy();
        context.read<JarSummaryBloc>().add(
          SetCurrentJarRequested(jarId: jar.id),
        );
        if (widget.asTab) {
          context.push(AppRoutes.jarDetail);
        } else if (context.canPop()) {
          context.pop();
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            // Jar photo with a check badge on the current jar
            Stack(
              clipBehavior: Clip.none,
              children: [
                JarThumb(imageUrl: imageUrl, size: 44),
                if (!widget.asTab)
                  BlocBuilder<JarSummaryBloc, JarSummaryState>(
                    builder: (context, jarSummaryState) {
                      final isActiveJar =
                          jarSummaryState is JarSummaryLoaded &&
                          jarSummaryState.jarData.id == jar.id;
                      if (!isActiveJar) return const SizedBox.shrink();
                      return Positioned(
                        bottom: -3,
                        right: -3,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: AppColors.navy,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.surfaceWhite,
                              width: 2,
                            ),
                          ),
                          child: const Icon(
                            Icons.check,
                            size: 10,
                            color: AppColors.lime,
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    jar.name,
                    style: DsText.rowTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  if (hasGoal)
                    SizedBox(
                      width: 140,
                      child: DsProgress(
                        jar.totalContributions / jar.goalAmount,
                      ),
                    )
                  else
                    Text('No goal', style: DsText.caption),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${DsMoney.group(jar.totalContributions)}.${((jar.totalContributions.abs() * 100).round() % 100).toString().padLeft(2, '0')}',
                  style: const TextStyle(
                    fontFamily: 'Chillax',
                    fontWeight: FontWeight.w600,
                    fontSize: 15.5,
                    color: AppColors.navy,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  [
                    isOwner ? 'Owner' : localizations.collector,
                    if (jar.isFrozen) 'Frozen' else if (jar.isSealed) 'Sealed',
                  ].join(' · '),
                  style: DsText.caption,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// "1 invitation" card under the list: unread jar invites from the inbox,
/// with View opening the inbox. Hidden when there are none (or the inbox
/// hasn't loaded).
class _InvitationsCard extends StatelessWidget {
  const _InvitationsCard();

  @override
  Widget build(BuildContext context) {
    NotificationsBloc? bloc;
    try {
      bloc = context.read<NotificationsBloc>();
    } catch (_) {
      return const SizedBox.shrink();
    }
    return BlocBuilder<NotificationsBloc, NotificationsState>(
      bloc: bloc,
      builder: (context, state) {
        if (state is! NotificationsLoaded) return const SizedBox.shrink();
        final invites =
            state.notifications
                .where(
                  (n) =>
                      n.type == NotificationType.jarInvite &&
                      n.status == NotificationStatus.unread,
                )
                .toList();
        if (invites.isEmpty) return const SizedBox.shrink();
        return DsCard(
          color: AppColors.fill,
          padding: const EdgeInsets.all(14),
          onTap: () => context.push(AppRoutes.notifications),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.mail_outline_rounded,
                  size: 20,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      invites.length == 1
                          ? '1 invitation'
                          : '${invites.length} invitations',
                      style: DsText.rowTitle.copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      invites.first.message,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: DsText.caption,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              DsSmallButton(
                label: 'View',
                onTap: () => context.push(AppRoutes.notifications),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Resolve the jar image URL by prefixing with image base when it's a relative path
String _resolveJarImageUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Guard against double slashes
  final base =
      AppConfig.imageBaseUrl.endsWith('/')
          ? AppConfig.imageBaseUrl.substring(
            0,
            AppConfig.imageBaseUrl.length - 1,
          )
          : AppConfig.imageBaseUrl;
  final cleaned = url.startsWith('/') ? url : '/$url';
  return '$base$cleaned';
}
