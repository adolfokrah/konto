import 'dart:async';
import 'package:Hoga/core/widgets/button.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/core/widgets/searh_input.dart';
import 'package:Hoga/features/collaborators/data/models/collector_model.dart';
import 'package:Hoga/features/collaborators/logic/bloc/collectors_bloc.dart';

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
      create: (context) => CollectorsBloc(),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
        child: Column(
          children: [
            // Header
            const DragHandle(),

            // Search Bar
            SearchInput(
              controller: _searchController,
              hintText: 'Search by email, full name or phone number',
              onChanged: (value) {
                // Cancel previous timer
                _debounceTimer?.cancel();

                // Set up new timer for debouncing
                _debounceTimer = Timer(const Duration(milliseconds: 500), () {
                  context.read<CollectorsBloc>().add(SearchCollectors(value));
                });
              },
            ),

            if (_selectedCollectors.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.spacingS),
              SizedBox(
                height: 60,
                child: ListView.builder(
                  itemCount: _selectedCollectors.length,
                  itemBuilder: (context, index) {
                    final collector = _selectedCollectors[index];
                    return Padding(
                      padding: const EdgeInsets.all(2.0),
                      child: Stack(
                        children: [
                          ContributorAvatar(
                            backgroundColor:
                                Theme.of(context).colorScheme.primary,
                            contributorName: collector.displayName,
                            avatarUrl:
                                collector.hasProfilePicture
                                    ? collector.photo!.thumbnailURL
                                    : null,
                            radius: 30,
                            showStatusOverlay: false,
                          ),
                          Positioned(
                            right: -15,
                            top: -15,
                            child: IconButton(
                              icon: const Icon(Icons.cancel, size: 20),
                              color: isDark ? Colors.white : Colors.black,
                              onPressed: () {
                                _toggleCollectorSelection(collector);
                              },
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                  scrollDirection: Axis.horizontal,
                ),
              ),
            ],
            // Content Area
            Expanded(
              child: BlocBuilder<CollectorsBloc, CollectorsState>(
                builder: (context, state) {
                  if (state is CollectorsInitial ||
                      _searchController.text.isEmpty) {
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search, size: 64, color: AppColors.label),
                          const SizedBox(height: AppSpacing.spacingM),
                          Text(
                            'Search for users to invite',
                            style: AppTextStyles.titleRegularM.copyWith(
                              color: AppColors.label,
                            ),
                          ),
                        ],
                      ),
                    );
                  } else if (state is CollectorsLoading) {
                    return const Center(child: CircularProgressIndicator());
                  } else if (state is CollectorsLoaded) {
                    if (state.collectors.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.search_off,
                              size: 64,
                              color: AppColors.label,
                            ),
                            const SizedBox(height: AppSpacing.spacingM),
                            Text(
                              'No user found',
                              style: AppTextStyles.titleRegularM.copyWith(
                                color: AppColors.label,
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    return ListView.builder(
                      itemCount: state.collectors.length,
                      itemBuilder: (context, index) {
                        final collector = state.collectors[index];
                        return ListTile(
                          contentPadding: EdgeInsets.all(0),
                          leading: ContributorAvatar(
                            backgroundColor:
                                Theme.of(context).colorScheme.primary,
                            contributorName: collector.displayName,
                            avatarUrl:
                                collector.hasProfilePicture
                                    ? collector.photo!.bestImageUrl
                                    : null,
                            radius: 20,
                            showStatusOverlay: false,
                          ),
                          title: Text(
                            collector.displayName,
                            style: AppTextStyles.titleMediumM,
                          ),
                          subtitle: Text(
                            collector.fullPhoneNumber,
                            style: AppTextStyles.titleRegularSm.copyWith(
                              color: AppColors.label,
                            ),
                          ),
                          trailing: Checkbox(
                            value: _isCollectorSelected(collector),
                            onChanged: (bool? value) {
                              _toggleCollectorSelection(collector);
                            },
                            activeColor: Theme.of(context).primaryColor,
                          ),
                        );
                      },
                    );
                  } else if (state is CollectorsError) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.error_outline,
                            size: 64,
                            color: Colors.red,
                          ),
                          const SizedBox(height: AppSpacing.spacingM),
                          Text(
                            state.message,
                            style: AppTextStyles.titleRegularM.copyWith(
                              color: Colors.red,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  }

                  // Initial state
                  return Container();
                },
              ),
            ),
            Padding(
              padding: EdgeInsetsGeometry.symmetric(
                vertical: AppSpacing.spacingS,
              ),
              child: AppButton(
                text:
                    'Invite ${_selectedCollectors.length} Collaborator${_selectedCollectors.length == 1 ? '' : 's'}',
                onPressed:
                    _selectedCollectors.isEmpty
                        ? null
                        : () {
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
            ),
          ],
        ),
      ),
    );
  }
}
