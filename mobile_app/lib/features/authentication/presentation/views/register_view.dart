import 'package:Hoga/core/theme/text_styles.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_links.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/select_options.dart';
import 'package:Hoga/core/utils/url_launcher_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/number_input.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> {
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  String _phoneNumber = '';
  String _countryCode = '+233'; // Default to Ghana
  String _selectedPhoneCountry = 'Ghana';
  String _selectedCountry = 'ghana';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      // Set initial values from widget parameters
      setState(() {
        _countryCode = args?['initialCountryCode'] ?? '+233';
        _phoneNumber = args?['initialPhoneNumber'] ?? '';
        _selectedPhoneCountry =
            args?['initialSelectedCountry'] ?? 'Ghana'; // Fixed key name
      });
    });
  }

  void _handleCreateAccount(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    if (_nameController.text.isEmpty) {
      AppSnackBar.showError(
        context,
        message: localizations.pleaseEnterFullName,
      );
      return;
    }

    if (_emailController.text.isEmpty) {
      AppSnackBar.showError(
        context,
        message: localizations.pleaseEnterEmailAddress,
      );
      return;
    }

    // Validate email format
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    if (!emailRegex.hasMatch(_emailController.text.trim())) {
      AppSnackBar.showError(
        context,
        message: 'Please enter a valid email address',
      );
      return;
    }

    // Validate username (required)
    final username = _usernameController.text.trim();
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

    if (_phoneNumber.isEmpty) {
      AppSnackBar.showError(
        context,
        message: localizations.pleaseEnterPhoneNumberRegister,
      );
      return;
    }

    //check if user exists
    context.read<AuthBloc>().add(
      CheckUserExistence(
        phoneNumber: _phoneNumber,
        countryCode: _countryCode,
        email: _emailController.text.trim(),
        username: _usernameController.text.trim(),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return MultiBlocListener(
      listeners: [
        BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            if (state is AuthAuthenticated) {
              // Navigate to home on success
              Navigator.pushNamedAndRemoveUntil(
                context,
                AppRoutes.jarDetail,
                (route) => false,
              );
            }

            if (state is AuthError) {
              // Show error message from registration
              AppSnackBar.showError(
                context,
                message: state.error,
              );
            }

            if (state is PhoneNumberAvailable) {
              // Phone number is available for registration - proceed to OTP
              Navigator.pushNamed(
                context,
                AppRoutes.otp,
                arguments: {
                  'phoneNumber': _phoneNumber,
                  'countryCode': _countryCode,
                  'email': _emailController.text.trim(),
                  'isRegistering': true,
                },
              );
            } else if (state is PhoneNumberNotAvailable) {
              // Phone number already exists - show error
              AppSnackBar.showError(
                context,
                message: localizations.accountAlreadyExists,
              );
            }
          },
        ),
        BlocListener<VerificationBloc, VerificationState>(
          listener: (context, state) {
            if (state is VerificationSuccess) {
              context.read<AuthBloc>().add(
                RequestRegistration(
                  phoneNumber: _phoneNumber,
                  countryCode: _countryCode,
                  country: _selectedCountry,
                  fullName: _nameController.text.trim(),
                  username: _usernameController.text.trim(),
                  email: _emailController.text.trim(),
                ),
              );
            }
          },
        ),
      ],
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Text(
            localizations.register,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.spacingM),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.spacingL),
              AppTextInput(
                label: localizations.fullName,
                keyboardType: TextInputType.name,
                controller: _nameController,
                key: const Key('fullName'),
              ),
              const SizedBox(height: 3),
              const Text(
                'Your full name should match the name on your ID.',
                style: AppTextStyles.titleRegularXs,
              ),

              const SizedBox(height: AppSpacing.spacingS),
              AppTextInput(
                key: const Key('email'),
                label: localizations.email,
                keyboardType: TextInputType.emailAddress,
                controller: _emailController,
              ),
              const SizedBox(height: AppSpacing.spacingS),
              AppTextInput(
                key: const Key('username'),
                label: 'Username',
                keyboardType: TextInputType.text,
                controller: _usernameController,
                onChanged: (value) {
                  // Convert to lowercase for case-insensitive username
                  final cursorPosition = _usernameController.selection.baseOffset;
                  _usernameController.value = TextEditingValue(
                    text: value.toLowerCase(),
                    selection: TextSelection.collapsed(offset: cursorPosition),
                  );
                },
              ),
              const SizedBox(height: 3),
              const Text(
                'Username is required and could be name of organization, institution or unique name to identify you. It cannot be changed once set.',
                style: AppTextStyles.titleRegularXs,
              ),
              const SizedBox(height: AppSpacing.spacingS),
              SelectInput<String>(
                key: const Key('country'),
                label: localizations.country,
                options: AppSelectOptions.getCountryOptions(localizations),
                value: _selectedCountry,
                onChanged: (value) {
                  print(value);

                  setState(() {
                    _selectedCountry = value;
                  });
                },
              ),
              const SizedBox(height: AppSpacing.spacingS),

              NumberInput(
                key: const Key('phoneNumber'),
                selectedCountry: _selectedPhoneCountry,
                countryCode: _countryCode,
                phoneNumber: _phoneNumber, // Pre-fill with passed phone number
                placeholder: localizations.phoneNumberPlaceholder,
                onCountryChanged: (country, code) {
                  setState(() {
                    _selectedPhoneCountry = country;
                    _countryCode = code;
                  });
                },
                onPhoneNumberChanged: (phoneNumber) {
                  setState(() {
                    _phoneNumber = phoneNumber;
                  });
                },
              ),
              const SizedBox(height: AppSpacing.spacingL),

              // Terms & Conditions Section
              RichText(
                textAlign: TextAlign.left,
                text: TextSpan(
                  style: Theme.of(context).textTheme.bodySmall,
                  children: [
                    TextSpan(text: localizations.bySigningUpYouAgree),
                    TextSpan(
                      text: localizations.termsAndConditions,
                      style: TextStyle(decoration: TextDecoration.underline),
                      recognizer:
                          TapGestureRecognizer()
                            ..onTap = () {
                              UrlLauncherUtils.launch(AppLinks.terms);
                            },
                    ),
                    TextSpan(text: localizations.and),
                    TextSpan(
                      text: localizations.privacyPolicy,
                      style: TextStyle(decoration: TextDecoration.underline),
                      recognizer:
                          TapGestureRecognizer()
                            ..onTap = () {
                              UrlLauncherUtils.launch(AppLinks.privacy);
                            },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSpacing.spacingL),

              // Action Buttons Section
              BlocBuilder<AuthBloc, AuthState>(
                builder: (context, state) {
                  return Column(
                    children: [
                      // Create Account Button
                      AppButton.filled(
                        text: localizations.createAccount,
                        isLoading: state is AuthLoading,
                        onPressed:
                            state is AuthLoading
                                ? null
                                : () {
                                  _handleCreateAccount(context);
                                },
                      ),

                      const SizedBox(height: AppSpacing.spacingS),

                      // Login Button
                      AppButton.outlined(
                        key: const Key('login_button'),
                        text: localizations.login,
                        onPressed: () {
                          if (state is AuthLoading) return;
                          // Handle login navigation
                          Navigator.pop(context);
                        },
                      ),
                    ],
                  );
                },
              ),

              const SizedBox(height: AppSpacing.spacingS),
            ],
          ),
        ),
      ),
    );
  }
}
