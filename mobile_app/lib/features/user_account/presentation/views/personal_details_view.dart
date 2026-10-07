import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/select_options.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class PersonalDetailsView extends StatefulWidget {
  const PersonalDetailsView({super.key});

  @override
  State<PersonalDetailsView> createState() => _PersonalDetailsViewState();
}

class _PersonalDetailsViewState extends State<PersonalDetailsView> {
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();
  final TextEditingController _fullNameController = TextEditingController();

  String selectedCountry = 'ghana';
  bool _hasPopulatedData = false;
  bool _hasExistingUsername = false;

  // Track original values to detect changes
  String _originalFirstName = '';
  String _originalLastName = '';
  String _originalCountry = 'ghana';

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneNumberController.dispose();
    _fullNameController.dispose();
    super.dispose();
  }

  void _populateUserData(User user) {
    if (_hasPopulatedData) return; // Only populate once

    _firstNameController.text = user.firstName;
    _lastNameController.text = user.lastName;
    _usernameController.text = user.username;
    _emailController.text = user.email;
    _phoneNumberController.text = user.phoneNumber;
    _fullNameController.text = user.fullName;

    // Store original values
    _originalFirstName = user.firstName;
    _originalLastName = user.lastName;
    _hasExistingUsername = user.username.isNotEmpty;

    // Add listeners to name controllers to trigger rebuilds
    _firstNameController.addListener(() {
      setState(() {});
    });
    _lastNameController.addListener(() {
      setState(() {});
    });

    // Set country based on user's country
    final countryValue = user.country.toLowerCase();
    // Check if the country exists in our options
    final localizations = AppLocalizations.of(context)!;
    final countryExists = AppSelectOptions.getCountryOptions(
      localizations,
    ).any((option) => option.value == countryValue);
    if (countryExists) {
      setState(() {
        selectedCountry = countryValue;
        _originalCountry = countryValue; // Store original country
      });
    }

    _hasPopulatedData = true; // Mark as populated
  }

  bool _hasChangedCriticalFields() {
    return _firstNameController.text.trim() != _originalFirstName ||
        _lastNameController.text.trim() != _originalLastName ||
        selectedCountry != _originalCountry;
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<UserAccountBloc, UserAccountState>(
      listener: (context, userAccountState) {
        if (userAccountState is UserAccountSuccess) {
          context.read<AuthBloc>().add(
            UpdateUserData(
              updatedUser: userAccountState.updatedUser,
              token: userAccountState.token,
            ),
          );

          AppSnackBar.showSuccess(
            context,
            message:
                AppLocalizations.of(
                  context,
                )!.personalDetailsUpdatedSuccessfully,
          );

          context.pop();
        } else if (userAccountState is UserAccountError) {
          AppSnackBar.showError(context, message: userAccountState.message);
        }
      },
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is AuthAuthenticated) {
            // Populate form data when user is available
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _populateUserData(state.user);
            });

            return BlocBuilder<UserAccountBloc, UserAccountState>(
              builder: (context, userAccountState) {
                final isLoading = userAccountState is UserAccountLoading;
                // Only allow editing if KYC status is 'none'
                final canEdit = state.user.kycStatus == 'none';
                final localizations = AppLocalizations.of(context)!;

                return Scaffold(
                  appBar: AppBar(
                    title: Text(localizations.personalDetails),
                    actions: [
                      if (canEdit)
                        Padding(
                          padding: const EdgeInsets.only(right: 16),
                          child: Center(
                            child:
                                isLoading
                                    ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: AppColors.navy,
                                      ),
                                    )
                                    : DsLink(
                                      localizations.save,
                                      onTap: _handleUpdateAccount,
                                    ),
                          ),
                        ),
                    ],
                  ),
                  body: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    children: _buildFields(
                      state.user,
                      isLoading: isLoading,
                      canEdit: canEdit,
                    ),
                  ),
                );
              },
            );
          }

          // Show loading or error state
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: AppColors.navy),
            ),
          );
        },
      ),
    );
  }

  List<Widget> _buildFields(
    User user, {
    required bool isLoading,
    required bool canEdit,
  }) {
    final localizations = AppLocalizations.of(context)!;
    final locked =
        user.kycStatus == 'in_review' || user.kycStatus == 'verified';
    final countryOptions = AppSelectOptions.getCountryOptions(localizations);
    final countryLabel =
        countryOptions
            .where((o) => o.value == selectedCountry)
            .map((o) => o.label)
            .firstOrNull;
    final usernameLocked = _hasExistingUsername || !canEdit;

    return [
      // Show warning only when critical fields are changed and KYC is none
      if (!locked && _hasChangedCriticalFields()) ...[
        DsNote(
          tone: DsTone.pending,
          icon: Icons.warning_amber_rounded,
          title: 'Name changes need a new ID check',
          text: localizations.reVerificationWarning,
        ),
        const SizedBox(height: 12),
      ],
      if (canEdit)
        AccFieldGroup(
          children: [
            AccField(
              label: 'First name',
              controller: _firstNameController,
              enabled: !isLoading,
              grouped: true,
              textCapitalization: TextCapitalization.words,
            ),
            AccField(
              label: 'Last name',
              controller: _lastNameController,
              enabled: !isLoading,
              grouped: true,
              textCapitalization: TextCapitalization.words,
            ),
          ],
        )
      else
        AccFieldGroup(
          children: [
            AccField(
              label: 'Full name',
              controller: _fullNameController,
              locked: true,
              grouped: true,
            ),
          ],
        ),
      const SizedBox(height: 12),
      AccField(
        label: 'Username',
        controller: _usernameController,
        locked: usernameLocked,
        enabled: !isLoading && !usernameLocked,
        hint: 'Choose a username',
      ),
      const SizedBox(height: 8),
      AccHelp(
        locked
            ? localizations.kycVerifiedDetailsLocked
            : 'Username cannot be changed once set',
      ),
      const SizedBox(height: 12),
      AccFieldGroup(
        children: [
          AccField(
            label: localizations.email,
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            enabled: !isLoading && canEdit,
            locked: !canEdit,
            grouped: true,
          ),
          AccSelectField(
            label: localizations.country,
            value: countryLabel,
            grouped: true,
            showChevron: canEdit,
            onTap:
                !isLoading && canEdit
                    ? () async {
                      final picked = await showAccOptionSheet<String>(
                        context,
                        title: localizations.country,
                        selected: selectedCountry,
                        options: [
                          for (final o in countryOptions)
                            AccOption(value: o.value, label: o.label),
                        ],
                      );
                      if (picked != null && mounted) {
                        setState(() => selectedCountry = picked);
                      }
                    }
                    : null,
          ),
        ],
      ),
    ];
  }

  void _handleUpdateAccount() {
    // Validate form
    if (_firstNameController.text.trim().isEmpty) {
      AppSnackBar.showError(context, message: 'Please enter your first name');
      return;
    }

    if (_lastNameController.text.trim().isEmpty) {
      AppSnackBar.showError(context, message: 'Please enter your last name');
      return;
    }

    // Validate username (required if not already set)
    final username = _usernameController.text.trim();
    if (!_hasExistingUsername) {
      if (username.isEmpty) {
        AppSnackBar.showError(context, message: 'Please enter a username');
        return;
      }
      if (username.length < 3 || username.length > 30) {
        AppSnackBar.showError(
          context,
          message: 'Username must be between 3 and 30 characters',
        );
        return;
      }
      if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(username)) {
        AppSnackBar.showError(
          context,
          message:
              'Username can only contain letters, numbers, and underscores',
        );
        return;
      }
    }

    // Trigger user account update
    context.read<UserAccountBloc>().add(
      UpdatePersonalDetails(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        username: username.isNotEmpty ? username : null,
        email: _emailController.text.trim(),
        country: selectedCountry,
      ),
    );
  }
}
