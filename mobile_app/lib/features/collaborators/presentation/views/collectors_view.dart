import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/collaborators/logic/bloc/reminder_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/invited_collector_item.dart';
import 'package:Hoga/core/widgets/small_button.dart';
import 'package:Hoga/features/collaborators/presentation/views/invite_collaborators_view.dart';
import 'package:Hoga/features/jars/data/models/jar_model.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:flutter_loading_overlay/flutter_loading_overlay.dart';

class CollectorsView extends StatefulWidget {
  const CollectorsView({super.key});

  /// Shows the collectors bottom sheet
  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const CollectorsView(),
    );
  }

  @override
  State<CollectorsView> createState() => _CollectorsViewState();
}

class _CollectorsViewState extends State<CollectorsView> {
  List<Map<String, dynamic>>? _pendingNewCollectors;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, state) {
        if (state is! JarSummaryLoaded) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.9,
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(AppRadius.radiusM),
                topRight: Radius.circular(AppRadius.radiusM),
              ),
            ),
            child: Center(
              child: CircularProgressIndicator(
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          );
        }

        final jarData = state.jarData;
        final localizations = AppLocalizations.of(context)!;

        return Container(
          height: MediaQuery.of(context).size.height * 0.9,
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(AppRadius.radiusM),
              topRight: Radius.circular(AppRadius.radiusM),
            ),
          ),
          child: BlocListener<UpdateJarBloc, UpdateJarState>(
            listener: (context, state) {
              if (state is UpdateJarSuccess && _pendingNewCollectors != null) {
                // Clear pending collectors
                _pendingNewCollectors = null;
              }

              if (state is UpdateJarInProgress) {
                startLoading();
              } else {
                stopLoading();
              }
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with close button
                _buildHeader(context),

                // Main content
                Expanded(
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title and Invite button
                          _buildTitleSection(localizations, context, jarData),
                          const SizedBox(height: 26),

                          // Active section
                          _buildActiveSection(context, localizations, jarData),
                          const SizedBox(height: 26),

                          // Pending section
                          _buildPendingSection(context, localizations, jarData),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Remove an invited collector from the jar
  void _removeInvitedCollector(
    BuildContext context,
    JarSummaryModel jarData,
    InvitedCollectorModel collectorToRemove,
  ) {
    // Filter out the collector to be removed
    final updatedCollectors =
        jarData.invitedCollectors
            ?.where((collector) {
              // Remove by matching collector ID
              return collector.collector.id != collectorToRemove.collector.id;
            })
            .map(
              (collector) => {
                'collector': collector.collector.id,
                'status': collector.status,
              },
            )
            .toList() ??
        [];

    // Update the jar with the filtered list
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(
        jarId: jarData.id,
        updates: {'invitedCollectors': updatedCollectors},
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: const Icon(Icons.close, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildTitleSection(
    AppLocalizations localizations,
    BuildContext context,
    JarSummaryModel jarData,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(localizations.collectors, style: AppTextStyles.titleBoldLg),
        const SizedBox(height: 13),
        AppSmallButton(
          onPressed: () {
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
                          },
                        )
                        .toList() ??
                    [];

                // Get existing phone numbers to check for duplicates
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
                              !existingPhoneNumbers.contains(
                                newCollector['collector'],
                              ),
                        )
                        .toList();

                // Combine existing and new collectors (without duplicates)
                final allCollectors = [
                  ...existingCollectors,
                  ...filteredNewCollectors,
                ];

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
          },
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.add),
              const SizedBox(width: 10),
              Text(localizations.invite),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActiveSection(
    BuildContext context,
    AppLocalizations localizations,
    JarSummaryModel jarData,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Get active/accepted collectors from jarData
    final activeCollectors =
        jarData.invitedCollectors
            ?.where(
              (collector) =>
                  collector.status == 'active' ||
                  collector.status == 'accepted',
            )
            .toList() ??
        [];

    if (activeCollectors.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(localizations.active, style: AppTextStyles.titleBoldLg),
        const SizedBox(height: 16),
        AppCard(
          child: Column(
            children:
                activeCollectors.asMap().entries.map((entry) {
                  final collector = entry.value;

                  return Column(
                    children: [
                      InvitedCollectorItem(
                        onCancel: () {
                          _removeInvitedCollector(context, jarData, collector);
                        },
                        isNew: false,
                        backgroundColor:
                            isDark
                                ? Theme.of(context).colorScheme.surface
                                : Theme.of(context).colorScheme.primary,
                        invitedCollector: InvitedCollector(
                          photo: collector.collector.photo?.url,
                          status: collector.status,
                          name: collector.collector.fullName,
                          phoneNumber:
                              "${collector.collector.countryCode}${collector.collector.phoneNumber}",
                        ),
                      ),
                    ],
                  );
                }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildPendingSection(
    BuildContext context,
    AppLocalizations localizations,
    JarSummaryModel jarData,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Get pending collectors from jarData
    final pendingCollectors =
        jarData.invitedCollectors
            ?.where((collector) => collector.status == 'pending')
            .toList() ??
        [];

    if (pendingCollectors.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(localizations.pending, style: TextStyles.titleBoldLg),
        const SizedBox(height: 16),
        AppCard(
          child: BlocListener<ReminderBloc, ReminderState>(
            listener: (context, state) {
              if (state is ReminderSuccess) {
                AppSnackBar.showSuccess(context, message: state.message);
              } else if (state is ReminderFailure) {
                AppSnackBar.showError(context, message: state.error);
              }
            },
            child: Column(
              children:
                  pendingCollectors.asMap().entries.map((entry) {
                    final collector = entry.value;

                    return Column(
                      children: [
                        InvitedCollectorItem(
                          onCancel: () {
                            _removeInvitedCollector(
                              context,
                              jarData,
                              collector,
                            );
                          },
                          onRemind:
                              collector.status == 'pending'
                                  ? () {
                                    // Send reminder to collector
                                    context.read<ReminderBloc>().add(
                                      SendReminderToCollector(
                                        jarId: jarData.id,
                                        collectorId: collector.collector.id,
                                      ),
                                    );
                                  }
                                  : null,
                          backgroundColor:
                              isDark
                                  ? Theme.of(context).colorScheme.surface
                                  : Theme.of(context).colorScheme.primary,
                          isNew: false,
                          invitedCollector: InvitedCollector(
                            status: collector.status,
                            name: collector.collector.fullName,
                            photo: collector.collector.photo?.url,
                            phoneNumber:
                                "${collector.collector.countryCode}${collector.collector.phoneNumber}",
                          ),
                        ),
                      ],
                    );
                  }).toList(),
            ),
          ),
        ),
      ],
    );
  }
}
