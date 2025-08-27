import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/select_options.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/number_input.dart';
import 'package:konto/core/widgets/select_input.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/route.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  String _phoneNumber = '';
  String _countryCode = '+233'; // Default to Ghana
  String _selectedPhoneCountry = 'Ghana';
  String _selectedCountry = 'ghana';
  final _isLoading = false;

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
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
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
            if (state is PhoneNumberAvailable) {
              AppSnackBar.showError(
                context,
                message: localizations.accountAlreadyExists,
              );
            } else if (state is PhoneNumberNotAvailable) {
              Navigator.pushNamed(
                context,
                AppRoutes.otp,
                arguments: {
                  'phoneNumber': _phoneNumber,
                  'countryCode': _countryCode,
                },
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
              const SizedBox(height: AppSpacing.spacingS),
              AppTextInput(
                key: const Key('email'),
                label: localizations.email,
                keyboardType: TextInputType.emailAddress,
                controller: _emailController,
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
                              // Handle Terms & Conditions tap
                              print('Terms & Conditions tapped');
                              // TODO: Navigate to Terms & Conditions page
                            },
                    ),
                    TextSpan(text: localizations.and),
                    TextSpan(
                      text: localizations.privacyPolicy,
                      style: TextStyle(decoration: TextDecoration.underline),
                      recognizer:
                          TapGestureRecognizer()
                            ..onTap = () {
                              // Handle Privacy Policy tap
                              print('Privacy Policy tapped');
                              // TODO: Navigate to Privacy Policy page
                            },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSpacing.spacingL),

              // Action Buttons Section
              Column(
                children: [
                  // Create Account Button
                  AppButton.filled(
                    text: localizations.createAccount,
                    isLoading: _isLoading,
                    onPressed:
                        _isLoading
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
                      // Handle login navigation
                      Navigator.pop(context);
                    },
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.spacingS),
            ],
          ),
        ),
      ),
    );
  }
}
