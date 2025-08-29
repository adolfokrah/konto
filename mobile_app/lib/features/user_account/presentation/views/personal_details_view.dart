import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/select_options.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/contributor_avatar.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/core/widgets/select_input.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/authentication/data/models/user.dart';
import 'package:konto/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

class PersonalDetailsView extends StatefulWidget {
  const PersonalDetailsView({super.key});

  @override
  State<PersonalDetailsView> createState() => _PersonalDetailsViewState();
}

class _PersonalDetailsViewState extends State<PersonalDetailsView> {
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneNumberController = TextEditingController();

  String selectedCountry = 'ghana';
  bool _hasPopulatedData = false;

  // Track original values to detect changes
  String _originalFullName = '';
  String _originalCountry = 'ghana';

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneNumberController.dispose();
    super.dispose();
  }

  void _populateUserData(User user) {
    if (_hasPopulatedData) return; // Only populate once

    _fullNameController.text = user.fullName;
    _emailController.text = user.email;
    _phoneNumberController.text = user.phoneNumber;

    // Store original values
    _originalFullName = user.fullName;

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
        } else if (userAccountState is UserAccountError) {
          // Show error message
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(userAccountState.message)));
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
                  body: SafeArea(
                    child: SingleChildScrollView(
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 15),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Show warning only when critical fields are changed
                            if (_hasChangedCriticalFields()) ...[
                              AppCard(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(Icons.info),
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
                            _buildPersonalInformationSection(isLoading),
                            const SizedBox(height: 40), // Add bottom padding
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            );
          }

          // Show loading or error state
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
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
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPersonalInformationSection(bool isLoading) {
    final localizations = AppLocalizations.of(context)!;

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
          enabled: !isLoading,
        ),
        const SizedBox(height: 17),
        // Email input
        AppTextInput(
          label: localizations.email,
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          enabled: !isLoading,
        ),
        const SizedBox(height: 17),
        // Country selector
        SelectInput<String>(
          label: localizations.country,
          value: selectedCountry,
          options: AppSelectOptions.getCountryOptions(localizations),
          enabled: !isLoading,
          onChanged: (value) {
            setState(() {
              selectedCountry = value;
            });
          },
        ),
        const SizedBox(height: 17),
        // Update button
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

    // Trigger user account update
    context.read<UserAccountBloc>().add(
      UpdatePersonalDetails(
        fullName: _fullNameController.text.trim(),
        email: _emailController.text.trim(),
        country: selectedCountry,
      ),
    );
  }
}
