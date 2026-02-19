import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/select_options.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

class PersonalDetailsView extends StatefulWidget {
  const PersonalDetailsView({super.key});

  @override
  State<PersonalDetailsView> createState() => _PersonalDetailsViewState();
}

class _PersonalDetailsViewState extends State<PersonalDetailsView> {
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();

  String selectedCountry = 'ghana';
  bool _hasPopulatedData = false;
  bool _hasExistingUsername = false;

  // Track original values to detect changes
  String _originalFullName = '';
  String _originalCountry = 'ghana';

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneNumberController.dispose();
    super.dispose();
  }

  void _populateUserData(User user) {
    if (_hasPopulatedData) return; // Only populate once

    _fullNameController.text = user.fullName;
    _usernameController.text = user.username;
    _emailController.text = user.email;
    _phoneNumberController.text = user.phoneNumber;

    // Store original values
    _originalFullName = user.fullName;
    _hasExistingUsername = user.username.isNotEmpty;

    // Add listener to full name controller to trigger rebuilds
    _fullNameController.addListener(() {
      setState(() {}); // Trigger rebuild when full name changes
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
    return _fullNameController.text.trim() != _originalFullName ||
        selectedCountry != _originalCountry;
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<UserAccountBloc, UserAccountState>(
      listener: (context, userAccountState) {
        if (userAccountState is UserAccountSuccess) {
          // Show success message - using fallback for now until translations are regenerated
          context.read<AuthBloc>().add(
            UpdateUserData(
              updatedUser: userAccountState.updatedUser,
              token: userAccountState.token,
            ),
          );

          // Check if critical fields were changed
          final criticalFieldsChanged = _hasChangedCriticalFields();

          AppSnackBar.showSuccess(
            context,
            message:
                AppLocalizations.of(
                  context,
                )!.personalDetailsUpdatedSuccessfully,
          );

          if (criticalFieldsChanged) {
            // Navigate to KYC view to re-verify identity and clear entire navigation stack
            context.go(AppRoutes.kycView);
          } else {
            // Just go back to previous screen if no critical fields changed
            context.pop();
          }
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

                return Scaffold(
                  appBar: AppBar(elevation: 0),
                  body: SingleChildScrollView(
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 15),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Show KYC lock warning when KYC is in_review or verified
                          if (state.user.kycStatus == 'in_review' || state.user.kycStatus == 'verified') ...[
                            AppCard(
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.lock_outline, color: Theme.of(context).colorScheme.primary),
                                  const SizedBox(width: AppSpacing.spacingXs),
                                  Expanded(
                                    child: Text(
                                      AppLocalizations.of(
                                        context,
                                      )!.kycVerifiedDetailsLocked,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                          ]
                          // Show warning only when critical fields are changed and KYC is none
                          else if (_hasChangedCriticalFields()) ...[
                            AppCard(
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.info, color: Theme.of(context).colorScheme.onSurface),
                                  const SizedBox(width: AppSpacing.spacingXs),
                                  Expanded(
                                    child: Text(
                                      AppLocalizations.of(
                                        context,
                                      )!.reVerificationWarning,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],
                          // Header with back button and profile
                          _buildHeader(state.user),
                          const SizedBox(height: 38),
                          // Personal information section
                          _buildPersonalInformationSection(isLoading, state.user.kycStatus),
                          const SizedBox(height: 40), // Add bottom padding
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          }

          // Show loading or error state
          return Scaffold(
            body: Center(
              child: CircularProgressIndicator(
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(User user) {
    final localizations = AppLocalizations.of(context)!;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Title and profile
        Expanded(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(localizations.editProfile, style: AppTextStyles.titleBoldLg),

              ContributorAvatar(
                contributorName: user.fullName,
                backgroundColor: Theme.of(context).colorScheme.primary,
                radius: 30,
                avatarUrl: user.photo?.thumbnailURL,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPersonalInformationSection(bool isLoading, String kycStatus) {
    final localizations = AppLocalizations.of(context)!;
    // Only allow editing if KYC status is 'none'
    final canEdit = kycStatus == 'none';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section title
        Text(
          localizations.personalInformation,
          style: AppTextStyles.titleMedium,
        ),
        const SizedBox(height: 17),
        // Full name input
        AppTextInput(
          label: localizations.fullName,
          controller: _fullNameController,
          enabled: !isLoading && canEdit,
        ),
        const SizedBox(height: 17),
        // Username input - always disabled, cannot be changed
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppTextInput(
              label: 'Username',
              controller: _usernameController,
              enabled: false,
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Text(
                'Username cannot be changed once set',
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 17),
        // Email input
        AppTextInput(
          label: localizations.email,
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          enabled: !isLoading && canEdit,
        ),
        const SizedBox(height: 17),
        // Country selector
        SelectInput<String>(
          label: localizations.country,
          value: selectedCountry,
          options: AppSelectOptions.getCountryOptions(localizations),
          enabled: !isLoading && canEdit,
          onChanged: (value) {
            setState(() {
              selectedCountry = value;
            });
          },
        ),
        const SizedBox(height: 17),
        // Update button - show only when KYC is none
        if (canEdit)
          AppButton.filled(
            text: localizations.updateAccount,
            isLoading: isLoading,
            onPressed: isLoading ? null : _handleUpdateAccount,
          ),
      ],
    );
  }

  void _handleUpdateAccount() {
    final localizations = AppLocalizations.of(context)!;

    // Validate form
    if (_fullNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(localizations.pleaseEnterFullName)),
      );
      return;
    }

    // Validate username (required if not already set)
    final username = _usernameController.text.trim();
    if (!_hasExistingUsername) {
      if (username.isEmpty) {
        AppSnackBar.showError(
          context,
          message: 'Please enter a username',
        );
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
          message: 'Username can only contain letters, numbers, and underscores',
        );
        return;
      }
    }

    // Trigger user account update
    context.read<UserAccountBloc>().add(
      UpdatePersonalDetails(
        fullName: _fullNameController.text.trim(),
        username: username.isNotEmpty ? username : null,
        email: _emailController.text.trim(),
        country: selectedCountry,
      ),
    );
  }
}
