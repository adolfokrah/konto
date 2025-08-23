import 'dart:async';
import 'package:flutter/material.dart';
import 'package:contacts_service/contacts_service.dart' as contacts_service;
import 'package:permission_handler/permission_handler.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/haptic_utils.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/drag_handle.dart';
import 'package:konto/core/widgets/searh_input.dart';
import 'package:konto/l10n/app_localizations.dart';

class Contact {
  final String name;
  final String phoneNumber;
  final String initials;

  Contact({
    required this.name,
    required this.phoneNumber,
    required this.initials,
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
    return InviteCollaboratorsView(
      selectedContacts: widget.selectedContacts,
      onContactsSelected: widget.onContactsSelected,
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

class _InviteCollaboratorsViewState extends State<InviteCollaboratorsView>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final GlobalKey<AnimatedListState> _animatedListKey =
      GlobalKey<AnimatedListState>();
  List<Contact> _selectedContacts = [];
  List<Contact> _phoneContacts = [];
  List<Contact> _filteredPhoneContacts = [];
  final List<Contact> _recentContacts = [];
  String _searchQuery = '';
  bool _isLoadingContacts = false;
  String? _errorMessage;
  bool _hasInitialized = false;
  Timer? _fallbackTimer;

  @override
  void initState() {
    super.initState();
    _selectedContacts = List.from(widget.selectedContacts);
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasInitialized) {
      _hasInitialized = true;
      _handlePermissionRequest();

      // Fallback timeout - if loading takes more than 15 seconds, stop it
      _fallbackTimer = Timer(const Duration(seconds: 15), () {
        if (mounted && _isLoadingContacts) {
          setState(() {
            _isLoadingContacts = false;
            _errorMessage = AppLocalizations.of(context)!.errorLoadingContacts;
          });
        }
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _fallbackTimer?.cancel();
    super.dispose();
  }

  Future<void> _handlePermissionRequest() async {
    try {
      // Try to directly request contacts permission
      final status = await Permission.contacts.request();

      if (status.isGranted) {
        await _loadContactsWithoutPermissionCheck();
      } else if (status.isPermanentlyDenied) {
        // iOS bug workaround: try to load contacts even if marked as permanently denied
        try {
          await _loadContactsWithoutPermissionCheck();
        } catch (e) {
          if (mounted) {
            setState(() {
              _isLoadingContacts = false;
              _errorMessage =
                  AppLocalizations.of(
                    context,
                  )!.contactsPermissionPermanentlyDenied;
            });
          }
        }
      } else {
        if (mounted) {
          setState(() {
            _isLoadingContacts = false;
            _errorMessage =
                AppLocalizations.of(context)!.contactsPermissionRequired;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingContacts = false;
          _errorMessage = AppLocalizations.of(
            context,
          )!.errorRequestingContactsPermission(e.toString());
        });
      }
    }
  }

  Future<void> _loadContactsWithoutPermissionCheck() async {
    if (!mounted) return;

    setState(() {
      _isLoadingContacts = true;
      _errorMessage = null;
    });

    try {
      final localizations = AppLocalizations.of(context)!;
      final unknownText = localizations.unknown;

      List<contacts_service.Contact> contacts = await contacts_service
              .ContactsService.getContacts()
          .timeout(const Duration(seconds: 10));

      List<Contact> phoneContacts = [];

      for (var contact in contacts) {
        if (contact.phones != null && contact.phones!.isNotEmpty) {
          String phoneNumber = contact.phones!.first.value!;
          phoneNumber = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');

          if (phoneNumber.isNotEmpty) {
            String name = _sanitizeString(contact.displayName ?? unknownText);
            String initials = _getInitials(name);

            phoneContacts.add(
              Contact(name: name, phoneNumber: phoneNumber, initials: initials),
            );
          }
        }
      }

      phoneContacts.sort((a, b) => a.name.compareTo(b.name));

      if (mounted) {
        setState(() {
          _phoneContacts = phoneContacts;
          _filteredPhoneContacts = phoneContacts;
          _isLoadingContacts = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingContacts = false;
          _errorMessage = AppLocalizations.of(context)!.errorLoadingContacts;
        });
      }
    }
  }

  String _sanitizeString(String input) {
    // Simple approach: keep only basic Latin characters, digits, and common punctuation
    String sanitized = '';
    for (int i = 0; i < input.length; i++) {
      int codeUnit = input.codeUnitAt(i);
      // Keep ASCII printable characters (32-126) and basic Latin (160-255)
      if ((codeUnit >= 32 && codeUnit <= 126) ||
          (codeUnit >= 160 && codeUnit <= 255)) {
        sanitized += input[i];
      } else {
        // Replace non-printable or problematic characters with space
        sanitized += ' ';
      }
    }
    return sanitized.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  String _getInitials(String name) {
    if (name.isEmpty) return '?';

    try {
      List<String> nameParts =
          name.trim().split(' ').where((part) => part.isNotEmpty).toList();
      if (nameParts.length >= 2) {
        return '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase();
      } else if (nameParts.isNotEmpty) {
        return nameParts[0][0].toUpperCase();
      }
    } catch (e) {
      // Handle error silently
    }
    return '?';
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text;
      if (_searchQuery.isEmpty) {
        _filteredPhoneContacts = _phoneContacts;
      } else {
        _filteredPhoneContacts =
            _phoneContacts
                .where(
                  (contact) => contact.name.toLowerCase().contains(
                    _searchQuery.toLowerCase(),
                  ),
                )
                .toList();
      }
    });
  }

  void _onContactTapped(Contact contact) {
    if (_isContactSelected(contact)) {
      // Find the index of the contact to remove
      int index = _selectedContacts.indexWhere(
        (c) => c.phoneNumber == contact.phoneNumber,
      );
      if (index != -1) {
        // Remove from the list
        final removedContact = _selectedContacts.removeAt(index);
        // Animate the removal
        _animatedListKey.currentState?.removeItem(
          index,
          (context, animation) => _buildSelectedContactItem(
            removedContact,
            animation,
            isRemoving: true,
          ),
          duration: const Duration(milliseconds: 300),
        );
      }
    } else {
      // Check if maximum selection limit is reached
      if (_selectedContacts.length >= 4) {
        // Show a snackbar to inform the user about the limit
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.maximumCollaboratorsSelected,
            ),
            duration: Duration(seconds: 2),
          ),
        );
        return;
      }

      // Add to the list
      _selectedContacts.add(contact);
      // Animate the addition
      _animatedListKey.currentState?.insertItem(
        _selectedContacts.length - 1,
        duration: const Duration(milliseconds: 300),
      );
    }
    setState(() {});
  }

  bool _isContactSelected(Contact contact) {
    return _selectedContacts.any((c) => c.phoneNumber == contact.phoneNumber);
  }

  Widget _buildSelectedContactItem(
    Contact contact,
    Animation<double> animation, {
    bool isRemoving = false,
  }) {
    String displayName = '';
    try {
      displayName = contact.name.split(' ').first;
    } catch (e) {
      displayName =
          contact.name.isNotEmpty
              ? contact.name
              : AppLocalizations.of(context)!.contact;
    }

    // Create a curved animation for smoother scaling
    final scaleAnimation = CurvedAnimation(
      parent: animation,
      curve: isRemoving ? Curves.easeInBack : Curves.elasticOut,
    );

    return ScaleTransition(
      scale: scaleAnimation,
      child: FadeTransition(
        opacity: animation,
        child: Padding(
          padding: const EdgeInsets.only(right: AppSpacing.spacingM, top: 8),
          child: Column(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  GestureDetector(
                    onTap: () => _onContactTapped(contact),
                    child: CircleAvatar(
                      radius: 25,
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      child: Text(
                        contact.initials,
                        style: TextStyles.titleMedium.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ),
                  if (!isRemoving)
                    Positioned(
                      top: -4,
                      right: -4,
                      child: GestureDetector(
                        onTap: () => _onContactTapped(contact),
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.error,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Theme.of(context).scaffoldBackgroundColor,
                              width: 1,
                            ),
                          ),
                          child: Icon(
                            Icons.close,
                            size: 14,
                            color: Theme.of(context).colorScheme.onError,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.spacingXs),
              SizedBox(
                width: 60,
                child: Text(
                  displayName,
                  style: TextStyles.titleMediumXs,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContactItem(Contact contact) {
    final isSelected = _isContactSelected(contact);
    final isMaxReached = _selectedContacts.length >= 4 && !isSelected;
    final isDark = Theme.of(context).colorScheme.brightness == Brightness.dark;
    return Opacity(
      opacity: isMaxReached ? 0.5 : 1.0,
      child: ListTile(
        contentPadding: const EdgeInsets.all(0),
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Checkbox(
              value: isSelected,
              onChanged: isMaxReached ? null : (_) => _onContactTapped(contact),
              activeColor:
                  isDark
                      ? Theme.of(context).colorScheme.surface
                      : Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: AppSpacing.spacingXs),
            CircleAvatar(
              radius: 20,
              backgroundColor:
                  isMaxReached
                      ? Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.3)
                      : isDark
                      ? Theme.of(context).colorScheme.surface
                      : Theme.of(context).colorScheme.onPrimary,
              child: Text(
                contact.initials,
                style: TextStyles.titleMediumS.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
          ],
        ),
        title: Text(
          contact.name,
          style: TextStyles.titleMedium.copyWith(
            fontWeight: FontWeight.w500,
            color:
                isMaxReached
                    ? Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.5)
                    : null,
          ),
        ),
        subtitle: Text(
          contact.phoneNumber,
          style: TextStyles.titleRegularM.copyWith(
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: isMaxReached ? 0.3 : 0.7),
          ),
        ),
        onTap: isMaxReached ? null : () => _onContactTapped(contact),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(AppRadius.radiusM),
              topRight: Radius.circular(AppRadius.radiusM),
            ),
          ),
          child: Column(
            children: [
              const Padding(
                padding: EdgeInsets.only(top: AppSpacing.spacingS),
                child: DragHandle(),
              ),

              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.spacingM,
                  vertical: AppSpacing.spacingS,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        AppLocalizations.of(context)!.inviteCollaborators,
                        style: TextStyles.titleMediumLg.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        widget.onContactsSelected?.call(_selectedContacts);
                        Navigator.pop(context);
                      },
                      child: Text(
                        '${AppLocalizations.of(context)!.done} (${_selectedContacts.length}/4)',
                        style: TextStyles.titleMedium.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.spacingM,
                ),
                child: SearchInput(
                  controller: _searchController,
                  hintText: AppLocalizations.of(context)!.searchContacts,
                ),
              ),
              const SizedBox(height: AppSpacing.spacingM),

              // Selected contacts display
              if (_selectedContacts.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.spacingM,
                  ),
                  child: SizedBox(
                    height: 90,
                    child: AnimatedList(
                      key: _animatedListKey,
                      scrollDirection: Axis.horizontal,
                      initialItemCount: _selectedContacts.length,
                      itemBuilder: (context, index, animation) {
                        if (index >= _selectedContacts.length) {
                          return const SizedBox.shrink();
                        }
                        final contact = _selectedContacts[index];
                        return _buildSelectedContactItem(contact, animation);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.spacingM),
              ],

              Expanded(
                child:
                    _isLoadingContacts
                        ? const Center(child: CircularProgressIndicator())
                        : _errorMessage != null
                        ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.contacts,
                                size: 48,
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withValues(alpha: 0.5),
                              ),
                              const SizedBox(height: AppSpacing.spacingM),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.spacingL,
                                ),
                                child: Text(
                                  _errorMessage!,
                                  style: TextStyles.titleRegularM.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withValues(alpha: 0.7),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.spacingM),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (_errorMessage!.contains('Settings'))
                                    ElevatedButton(
                                      onPressed: () => openAppSettings(),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor:
                                            Theme.of(
                                              context,
                                            ).colorScheme.primary,
                                        foregroundColor:
                                            Theme.of(
                                              context,
                                            ).colorScheme.onPrimary,
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: AppSpacing.spacingL,
                                          vertical: AppSpacing.spacingM,
                                        ),
                                      ),
                                      child: Text(
                                        AppLocalizations.of(
                                          context,
                                        )!.openSettings,
                                      ),
                                    )
                                  else
                                    ElevatedButton(
                                      onPressed: _handlePermissionRequest,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor:
                                            Theme.of(
                                              context,
                                            ).colorScheme.primary,
                                        foregroundColor:
                                            Theme.of(
                                              context,
                                            ).colorScheme.onPrimary,
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: AppSpacing.spacingL,
                                          vertical: AppSpacing.spacingM,
                                        ),
                                      ),
                                      child: Text(
                                        AppLocalizations.of(context)!.tryAgain,
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        )
                        : ListView(
                          controller: scrollController,
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.spacingM,
                          ),
                          children: [
                            if (_recentContacts.isNotEmpty) ...[
                              Text(
                                AppLocalizations.of(context)!.recent,
                                style: TextStyles.titleMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.spacingS),
                              AppCard(
                                variant: CardVariant.secondary,
                                padding: EdgeInsets.symmetric(
                                  horizontal: AppSpacing.spacingXs,
                                  vertical: AppSpacing.spacingXs,
                                ),
                                child: Column(
                                  children: [
                                    ..._recentContacts.map(_buildContactItem),
                                  ],
                                ),
                              ),
                              const SizedBox(height: AppSpacing.spacingM),
                            ],

                            if (_filteredPhoneContacts.isNotEmpty) ...[
                              Text(
                                AppLocalizations.of(context)!.otherContacts,
                                style: TextStyles.titleMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.spacingS),
                              AppCard(
                                variant: CardVariant.secondary,
                                padding: EdgeInsets.symmetric(
                                  horizontal: AppSpacing.spacingXs,
                                  vertical: AppSpacing.spacingXs,
                                ),
                                child: Column(
                                  children: [
                                    ..._filteredPhoneContacts.map(
                                      _buildContactItem,
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            if (_filteredPhoneContacts.isEmpty &&
                                _recentContacts.isEmpty &&
                                !_isLoadingContacts &&
                                _errorMessage == null) ...[
                              const SizedBox(height: AppSpacing.spacingL),
                              Center(
                                child: Text(
                                  _searchQuery.isNotEmpty
                                      ? AppLocalizations.of(
                                        context,
                                      )!.noContactsFoundFor(_searchQuery)
                                      : AppLocalizations.of(
                                        context,
                                      )!.noContactsFound,
                                  style: TextStyles.titleRegularM.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withValues(alpha: 0.6),
                                  ),
                                ),
                              ),
                            ],

                            const SizedBox(height: AppSpacing.spacingL),
                          ],
                        ),
              ),
            ],
          ),
        );
      },
    );
  }
}
