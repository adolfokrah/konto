import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/collaborators/logic/bloc/reminder_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/collaborators/presentation/views/invite_collaborators_view.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

/// Team page: the owner, active collectors with their role, and invited
/// people who haven't accepted yet (with Remind).
class CollectorsView extends StatefulWidget {
  const CollectorsView({super.key});

  /// Opens the Team page (a full page in the mockups, not a sheet).
  static void show(BuildContext context) {
    Navigator.of(
      context,
      rootNavigator: true,
    ).push(MaterialPageRoute(builder: (_) => const CollectorsView()));
  }

  @override
  State<CollectorsView> createState() => _CollectorsViewState();
}

class _CollectorsViewState extends State<CollectorsView> {
  List<Map<String, dynamic>>? _pendingNewCollectors;

  bool _hasTeam(JarSummaryModel jarData) =>
      jarData.invitedCollectors?.any(
        (c) =>
            c.status == 'active' ||
            c.status == 'accepted' ||
            c.status == 'pending',
      ) ??
      false;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, state) {
        if (state is! JarSummaryLoaded) {
          return const Scaffold(
            backgroundColor: AppColors.cream,
            appBar: CollectTopBar(title: 'Team'),
            body: Center(
              child: CircularProgressIndicator(color: AppColors.navy),
            ),
          );
        }

        final jarData = state.jarData;
        final localizations = AppLocalizations.of(context)!;

        return Scaffold(
          backgroundColor: AppColors.cream,
          appBar: CollectTopBar(
            title: 'Team',
            actions: [
              if (_hasTeam(jarData))
                CollectBoxButton(
                  icon: Icons.add_rounded,
                  onTap: () => _openInvite(context, jarData),
                ),
            ],
          ),
          body: BlocListener<ReminderBloc, ReminderState>(
            listener: (context, state) {
              if (state is ReminderSuccess) {
                AppSnackBar.showSuccess(context, message: state.message);
              } else if (state is ReminderFailure) {
                AppSnackBar.showError(context, message: state.error);
              }
            },
            child: BlocConsumer<UpdateJarBloc, UpdateJarState>(
              listener: (context, state) {
                if (state is UpdateJarSuccess &&
                    _pendingNewCollectors != null) {
                  _pendingNewCollectors = null;
                }
              },
              builder: (context, updateState) {
                return Stack(
                  children: [
                    ListView(
                      padding: EdgeInsets.fromLTRB(
                        16,
                        4,
                        16,
                        MediaQuery.of(context).padding.bottom + 24,
                      ),
                      children: _buildBody(context, localizations, jarData),
                    ),
                    if (updateState is UpdateJarInProgress)
                      Positioned.fill(
                        child: Container(
                          color: AppColors.cream.withValues(alpha: 0.6),
                          child: const Center(
                            child: CircularProgressIndicator(
                              color: AppColors.navy,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------- data changes

  /// Count admin collectors in a list of collector maps
  int _countAdmins(List<Map<String, dynamic>> collectors) {
    return collectors
        .where((c) => c['role'] == 'admin' && c['status'] == 'accepted')
        .length;
  }

  /// Auto-cap requiredApprovals if it exceeds the new admin count
  Map<String, dynamic> _buildUpdates(
    JarSummaryModel jarData,
    List<Map<String, dynamic>> updatedCollectors,
  ) {
    final updates = <String, dynamic>{'invitedCollectors': updatedCollectors};
    final newAdminCount = _countAdmins(updatedCollectors);
    if (jarData.requiredApprovals > newAdminCount && newAdminCount >= 1) {
      updates['requiredApprovals'] = newAdminCount;
    }
    return updates;
  }

  /// Remove an invited collector from the jar
  void _removeInvitedCollector(
    BuildContext context,
    JarSummaryModel jarData,
    InvitedCollectorModel collectorToRemove,
  ) {
    final updatedCollectors =
        jarData.invitedCollectors
            ?.where((collector) {
              return collector.collector.id != collectorToRemove.collector.id;
            })
            .map(
              (collector) => {
                'collector': collector.collector.id,
                'status': collector.status,
                'role': collector.role,
              },
            )
            .toList() ??
        [];

    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(
        jarId: jarData.id,
        updates: _buildUpdates(jarData, updatedCollectors),
      ),
    );
  }

  void _sendReminder(
    BuildContext context,
    JarSummaryModel jarData,
    InvitedCollectorModel collector,
  ) {
    context.read<ReminderBloc>().add(
      SendReminderToCollector(
        jarId: jarData.id,
        collectorId: collector.collector.id,
      ),
    );
  }

  void _openInvite(BuildContext context, JarSummaryModel jarData) {
    InviteCollaboratorsSheet.show(
      context,
      onContactsSelected: (collectors) {
        // Convert contacts to invited collectors format
        final newInvitedCollectors =
            collectors
                .map(
                  (collector) => {
                    'collector': collector.id,
                    'status': 'pending',
                    'role': 'member',
                  },
                )
                .toList();

        // Get existing invited collectors
        final existingCollectors =
            jarData.invitedCollectors
                ?.map(
                  (collector) => {
                    'collector': collector.collector.id,
                    'status': collector.status,
                    'role': collector.role,
                  },
                )
                .toList() ??
            [];

        // Get existing ids to check for duplicates
        final existingPhoneNumbers =
            existingCollectors
                .map((collector) => collector['collector'])
                .where((collectorId) => collectorId != null)
                .cast<String>()
                .toSet();

        // Filter out new invites with duplicate collector IDs
        final filteredNewCollectors =
            newInvitedCollectors
                .where(
                  (newCollector) =>
                      !existingPhoneNumbers.contains(newCollector['collector']),
                )
                .toList();

        // Combine existing and new collectors (without duplicates)
        final allCollectors = [...existingCollectors, ...filteredNewCollectors];

        // Store the new collectors to send invitations after jar update
        _pendingNewCollectors = filteredNewCollectors;

        context.read<UpdateJarBloc>().add(
          UpdateJarRequested(
            jarId: jarData.id,
            updates: {'invitedCollectors': allCollectors},
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------- layout

  List<Widget> _buildBody(
    BuildContext context,
    AppLocalizations localizations,
    JarSummaryModel jarData,
  ) {
    final activeCollectors =
        jarData.invitedCollectors
            ?.where(
              (collector) =>
                  collector.status == 'active' ||
                  collector.status == 'accepted',
            )
            .toList() ??
        [];
    final pendingCollectors =
        jarData.invitedCollectors
            ?.where((collector) => collector.status == 'pending')
            .toList() ??
        [];

    final ownerRow = DsRow(
      leading: CollectAvatar(
        name: jarData.creator.fullName,
        photoUrl: jarData.creator.photo?.url,
      ),
      title: jarData.creator.fullName,
      subtitle: jarData.isCreator ? 'You' : null,
      trailing: const DsTag('Owner', tone: DsTone.dark),
    );

    if (activeCollectors.isEmpty && pendingCollectors.isEmpty) {
      return [
        DsListCard(children: [ownerRow]),
        const SizedBox(height: 12),
        DsCard(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
          child: Column(
            children: [
              const DsIconTile(
                Icons.groups_2_outlined,
                tone: DsTone.lime,
                size: 52,
              ),
              const SizedBox(height: 12),
              Text(
                'Collect with friends and family',
                style: DsText.section.copyWith(fontSize: 18),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              const Text(
                "Collectors share their own link and take MoMo or cash for this jar. They can't move money out.",
                style: DsText.small,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              DsSmallButton(
                label: 'Invite collectors',
                icon: Icons.add_rounded,
                onTap: () => _openInvite(context, jarData),
              ),
            ],
          ),
        ),
      ];
    }

    return [
      CollectCap('${localizations.active} · ${activeCollectors.length + 1}'),
      const SizedBox(height: 6),
      DsListCard(
        children: [
          ownerRow,
          for (final collector in activeCollectors)
            DsRow(
              onTap:
                  () => _showCollectorActions(
                    context,
                    jarData,
                    collector,
                    localizations,
                  ),
              leading: CollectAvatar(
                name: collector.collector.fullName,
                photoUrl: collector.collector.photo?.url,
              ),
              title: collector.collector.fullName,
              subtitle:
                  '${collector.collector.countryCode}${collector.collector.phoneNumber}',
              trailing:
                  collector.role == 'admin'
                      ? const DsTag('Admin', tone: DsTone.lime)
                      : const DsTag('Collector'),
            ),
        ],
      ),
      if (pendingCollectors.isNotEmpty) ...[
        const SizedBox(height: 16),
        CollectCap('Invited · ${pendingCollectors.length}'),
        const SizedBox(height: 6),
        DsListCard(
          children: [
            for (final collector in pendingCollectors)
              DsRow(
                onTap:
                    () => _showCollectorActions(
                      context,
                      jarData,
                      collector,
                      localizations,
                    ),
                leading: CollectAvatar(
                  name: collector.collector.fullName,
                  photoUrl: collector.collector.photo?.url,
                ),
                title: collector.collector.fullName,
                subtitle: 'Invited · not accepted',
                trailing: DsSmallButton(
                  label: localizations.remind,
                  secondary: true,
                  onTap: () => _sendReminder(context, jarData, collector),
                ),
              ),
          ],
        ),
      ],
    ];
  }

  /// Collector actions: remind / cancel an invitation, or remove access.
  void _showCollectorActions(
    BuildContext context,
    JarSummaryModel jarData,
    InvitedCollectorModel collector,
    AppLocalizations localizations,
  ) {
    final isPending = collector.status == 'pending';
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        Widget action(
          IconData icon,
          String label,
          VoidCallback onTap, {
          bool danger = false,
        }) {
          return DsRow(
            leading: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: danger ? AppColors.negativeSoft : AppColors.surfaceWhite,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                size: 17,
                color: danger ? AppColors.negative : AppColors.navy,
              ),
            ),
            title: label,
            titleColor: danger ? AppColors.negative : null,
            onTap: () {
              Navigator.pop(sheetContext);
              onTap();
            },
          );
        }

        final actions = [
          if (isPending)
            action(
              Icons.notifications_none_rounded,
              'Send a reminder',
              () => _sendReminder(context, jarData, collector),
            ),
          action(
            isPending ? Icons.close_rounded : Icons.block_rounded,
            isPending ? 'Cancel invitation' : 'Remove access',
            () => _removeInvitedCollector(context, jarData, collector),
            danger: true,
          ),
        ];

        return CollectSheet(
          children: [
            Row(
              children: [
                CollectAvatar(
                  name: collector.collector.fullName,
                  photoUrl: collector.collector.photo?.url,
                  size: 56,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        collector.collector.fullName,
                        style: DsText.title.copyWith(fontSize: 22),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isPending
                            ? 'Invited · not accepted'
                            : '${collector.role == 'admin' ? 'Admin' : 'Collector'} · ${collector.collector.countryCode}${collector.collector.phoneNumber}',
                        style: DsText.caption,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            Container(
              decoration: BoxDecoration(
                color: AppColors.cream,
                borderRadius: BorderRadius.circular(20),
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  for (var i = 0; i < actions.length; i++) ...[
                    if (i > 0) const Divider(height: 1, color: AppColors.line),
                    actions[i],
                  ],
                ],
              ),
            ),
            if (!isPending)
              const Text(
                'Their past payments stay in the jar.',
                style: DsText.caption,
              ),
          ],
        );
      },
    );
  }
}
