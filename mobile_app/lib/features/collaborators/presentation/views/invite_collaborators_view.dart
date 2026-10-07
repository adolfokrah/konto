import 'dart:async';
import 'package:Hoga/core/widgets/button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/collaborators/data/models/collector_model.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/features/collaborators/logic/bloc/collectors_bloc.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';

class Contact {
  final String fullName;
  final String phoneNumber;
  final String email;
  final String? photo;
  final String id;

  Contact({
    required this.fullName,
    required this.phoneNumber,
    required this.email,
    this.photo,
    required this.id,
  });
}

class InviteCollaboratorsSheet extends StatefulWidget {
  final List<Contact> selectedContacts;
  final Function(List<Contact>)? onContactsSelected;

  const InviteCollaboratorsSheet({
    super.key,
    this.selectedContacts = const [],
    this.onContactsSelected,
  });

  static void show(
    BuildContext context, {
    List<Contact> selectedContacts = const [],
    Function(List<Contact>)? onContactsSelected,
  }) {
    HapticUtils.heavy();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => InviteCollaboratorsSheet(
            selectedContacts: selectedContacts,
            onContactsSelected: onContactsSelected,
          ),
    );
  }

  @override
  State<InviteCollaboratorsSheet> createState() =>
      _InviteCollaboratorsSheetState();
}

class _InviteCollaboratorsSheetState extends State<InviteCollaboratorsSheet> {
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<CollectorsBloc>(),
      child: InviteCollaboratorsView(
        selectedContacts: widget.selectedContacts,
        onContactsSelected: widget.onContactsSelected,
      ),
    );
  }
}

class InviteCollaboratorsView extends StatefulWidget {
  final List<Contact> selectedContacts;
  final Function(List<Contact>)? onContactsSelected;

  const InviteCollaboratorsView({
    super.key,
    this.selectedContacts = const [],
    this.onContactsSelected,
  });

  @override
  State<InviteCollaboratorsView> createState() =>
      _InviteCollaboratorsViewState();
}

class _InviteCollaboratorsViewState extends State<InviteCollaboratorsView> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  final Set<String> _selectedCollectorIds = <String>{};
  final List<CollectorModel> _selectedCollectors = <CollectorModel>[];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _toggleCollectorSelection(CollectorModel collector) {
    setState(() {
      if (_selectedCollectorIds.contains(collector.id)) {
        // Remove from selection
        _selectedCollectorIds.remove(collector.id);
        _selectedCollectors.removeWhere((c) => c.id == collector.id);
      } else {
        // Add to selection
        _selectedCollectorIds.add(collector.id);
        _selectedCollectors.add(collector);
      }
    });
  }

  bool _isCollectorSelected(CollectorModel collector) {
    return _selectedCollectorIds.contains(collector.id);
  }

  @override
  Widget build(BuildContext context) {
    final count = _selectedCollectors.length;
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: AppColors.cream,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CollectSheet.grab(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                CollectBoxButton(
                  icon: Icons.close_rounded,
                  onTap: () => Navigator.of(context).pop(),
                ),
                const Expanded(
                  child: Text(
                    'Invite collectors',
                    textAlign: TextAlign.center,
                    style: DsText.section,
                  ),
                ),
                const SizedBox(width: 40),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: CollectSearchField(
              controller: _searchController,
              hint: 'Name, email or phone number',
              autofocus: true,
              onChanged: (value) {
                setState(() {});
                // Cancel previous timer
                _debounceTimer?.cancel();

                // Set up new timer for debouncing
                _debounceTimer = Timer(const Duration(milliseconds: 500), () {
                  context.read<CollectorsBloc>().add(SearchCollectors(value));
                });
              },
            ),
          ),

          // Selected people, removable
          if (_selectedCollectors.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 34,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _selectedCollectors.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) {
                  final collector = _selectedCollectors[index];
                  return CollectChip(
                    label: collector.displayName,
                    selected: true,
                    trailingIcon: Icons.close_rounded,
                    onTap: () => _toggleCollectorSelection(collector),
                  );
                },
              ),
            ),
          ],
          const SizedBox(height: 12),

          // Content Area
          Expanded(
            child: BlocBuilder<CollectorsBloc, CollectorsState>(
              builder: (context, state) {
                if (_searchController.text.isEmpty ||
                    state is CollectorsInitial) {
                  return _scrollableCenter(
                    const DsEmptyState(
                      icon: Icons.person_search_outlined,
                      title: 'Search for people to invite',
                      message:
                          'Find people on Hogapay by name, email or phone number.',
                    ),
                  );
                } else if (state is CollectorsLoading) {
                  return const DsSkeletonPage(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
                    children: [
                      DsSkeletonListCard(rows: 3, circleLeading: true),
                    ],
                  );
                } else if (state is CollectorsLoaded) {
                  if (state.collectors.isEmpty) {
                    return _scrollableCenter(
                      const DsEmptyState(
                        icon: Icons.search_off_rounded,
                        title: 'No user found',
                        message: 'Try another name, email or number.',
                      ),
                    );
                  }
                  return ListView(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    children: [
                      DsListCard(
                        children: [
                          for (final collector in state.collectors)
                            DsRow(
                              onTap: () => _toggleCollectorSelection(collector),
                              leading: CollectAvatar(
                                name: collector.displayName,
                                photoUrl:
                                    collector.hasProfilePicture
                                        ? collector.photo!.bestImageUrl
                                        : null,
                              ),
                              title: collector.displayName,
                              subtitle: _maskedPhone(collector),
                              trailing: CollectCheck(
                                _isCollectorSelected(collector),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const DsNote(
                        tone: DsTone.neutral,
                        icon: Icons.info_outline_rounded,
                        text:
                            "Collectors can take payments for this jar. They can't move money out.",
                      ),
                    ],
                  );
                } else if (state is CollectorsError) {
                  return _scrollableCenter(
                    DsEmptyState(
                      icon: Icons.error_outline_rounded,
                      tone: DsTone.negative,
                      title: 'Something went wrong',
                      message: state.message,
                    ),
                  );
                }

                // Initial state
                return Container();
              },
            ),
          ),
          CollectFooter(
            children: [
              AppButton(
                text:
                    count == 0
                        ? 'Invite collectors'
                        : 'Invite $count ${count == 1 ? 'person' : 'people'}',
                onPressed:
                    _selectedCollectors.isEmpty
                        ? null
                        : () {
                          HapticUtils.light();
                          if (widget.onContactsSelected != null) {
                            final contacts =
                                _selectedCollectors
                                    .map(
                                      (c) => Contact(
                                        fullName: c.fullName,
                                        phoneNumber: c.fullPhoneNumber,
                                        email: c.email,
                                        id: c.id,
                                        photo:
                                            c.hasProfilePicture
                                                ? c.photo!.bestImageUrl ?? ''
                                                : '',
                                      ),
                                    )
                                    .toList();
                            widget.onContactsSelected!(contacts);
                          }
                          Navigator.of(context).pop();
                        },
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// "024 ••• 8812": enough to tell people apart without showing the number.
  String _maskedPhone(CollectorModel c) {
    var local = c.phoneNumber.replaceAll(RegExp(r'\D'), '');
    if (local.isEmpty) return c.fullPhoneNumber;
    if (!local.startsWith('0')) local = '0$local';
    if (local.length < 7) return local;
    return '${local.substring(0, 3)} ••• ${local.substring(local.length - 4)}';
  }

  Widget _scrollableCenter(Widget child) => LayoutBuilder(
    builder:
        (context, constraints) => SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Center(child: child),
          ),
        ),
  );
}
