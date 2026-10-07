import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_links.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/presentation/widgets/auth_widgets.dart';
import 'package:Hoga/core/constants/select_options.dart';
import 'package:Hoga/core/utils/url_launcher_utils.dart';
import 'package:Hoga/core/utils/phone_validation_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/number_input.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _referralCodeController = TextEditingController();
  String _phoneNumber = '';
  String _countryCode = '+233'; // Default to Ghana
  String _selectedPhoneCountry = 'Ghana';
  String _selectedCountry = 'ghana';
  // 'individual' collects after KYC; 'organization' also needs business verification.
  String _accountType = 'individual';

  /// 0 = who you're collecting for, 1 = about you.
  int _step = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = GoRouterState.of(context).extra as Map<String, dynamic>?;
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

    if (_firstNameController.text.isEmpty) {
      AppSnackBar.showError(context, message: 'Please enter your first name');
      return;
    }

    if (_lastNameController.text.isEmpty) {
      AppSnackBar.showError(context, message: 'Please enter your last name');
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

    // Validate Ghana phone number format
    if (!PhoneValidationUtils.isValidGhanaPhoneNumber(_phoneNumber)) {
      AppSnackBar.showError(
        context,
        message: PhoneValidationUtils.getDetailedValidationError(_phoneNumber),
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

  /// Top progress: the account type is half the job, the details the rest.
  double get _progress {
    final filled =
        [
          _firstNameController.text,
          _lastNameController.text,
          _emailController.text,
          _usernameController.text,
          _phoneNumber,
        ].where((v) => v.trim().isNotEmpty).length;
    return _step == 0 ? 0.5 : 0.5 + 0.5 * filled / 5;
  }

  static const _linkStyle = TextStyle(
    fontWeight: FontWeight.w700,
    color: AppColors.navy,
    decoration: TextDecoration.underline,
    decorationColor: AppColors.lime,
    decorationThickness: 3,
  );

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _referralCodeController.dispose();
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
              context.go(AppRoutes.jarDetail);
            }

            if (state is AuthError) {
              // Show error message from registration
              AppSnackBar.showError(context, message: state.error);
            }

            if (state is PhoneNumberAvailable) {
              // Phone number is available for registration - proceed to OTP
              context.push(
                AppRoutes.otp,
                extra: {
                  'phoneNumber': _phoneNumber,
                  'countryCode': _countryCode,
                  'email': _emailController.text.trim(),
                  'isRegistering': true,
                  'country': _selectedCountry,
                  'firstName': _firstNameController.text.trim(),
                  'lastName': _lastNameController.text.trim(),
                  'username': _usernameController.text.trim(),
                  'referralCode': _referralCodeController.text.trim(),
                  'accountType': _accountType,
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
            // RequestRegistration is dispatched from the OTP view for the registration flow
          },
        ),
      ],
      child: PopScope(
        // Back on "About you" returns to the account type, not out of sign-up.
        canPop: _step == 0,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop && _step == 1) setState(() => _step = 0);
        },
        child: Scaffold(
          backgroundColor: AppColors.cream,
          appBar: AuthTopBar(
            progress: _progress,
            onBack: _step == 1 ? () => setState(() => _step = 0) : null,
          ),
          body: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_step == 0) ...[
                        const AuthHeader(
                          title: 'Who are you collecting for?',
                          subtitle:
                              'This sets how you get verified. You can upgrade later.',
                        ),
                        const SizedBox(height: 18),
                        AuthChoiceCard(
                          key: const Key('accountType'),
                          icon: Icons.person_outline_rounded,
                          title: 'Personal',
                          description:
                              'Weddings, funerals, birthdays and family causes',
                          tags: const ['Ghana Card', '~3 min'],
                          selected: _accountType == 'individual',
                          onTap:
                              () => setState(() => _accountType = 'individual'),
                        ),
                        const SizedBox(height: 10),
                        AuthChoiceCard(
                          key: const Key('accountType_organization'),
                          icon: Icons.account_balance_outlined,
                          title: 'Organization',
                          description:
                              'Churches, schools, associations, businesses',
                          tags: const ['Business docs', '2–3 days'],
                          selected: _accountType == 'organization',
                          onTap:
                              () =>
                                  setState(() => _accountType = 'organization'),
                        ),
                      ] else ...[
                        const AuthHeader(
                          title: 'About you',
                          subtitle: 'Use your name as it appears on your ID.',
                        ),
                        const SizedBox(height: 18),
                        AuthFieldGroup(
                          children: [
                            AuthField(
                              key: const Key('firstName'),
                              label: 'First name',
                              keyboardType: TextInputType.name,
                              textCapitalization: TextCapitalization.words,
                              controller: _firstNameController,
                              onChanged: (_) => setState(() {}),
                            ),
                            AuthField(
                              key: const Key('lastName'),
                              label: 'Last name',
                              keyboardType: TextInputType.name,
                              textCapitalization: TextCapitalization.words,
                              controller: _lastNameController,
                              onChanged: (_) => setState(() {}),
                            ),
                          ],
                        ),
                        const AuthHelp('As on your Ghana Card or ID'),
                        const SizedBox(height: 14),
                        AuthFieldGroup(
                          children: [
                            AuthField(
                              key: const Key('email'),
                              label: localizations.email,
                              keyboardType: TextInputType.emailAddress,
                              controller: _emailController,
                              onChanged: (_) => setState(() {}),
                            ),
                            AuthField(
                              key: const Key('username'),
                              label: 'Username',
                              prefixText: '@',
                              keyboardType: TextInputType.text,
                              controller: _usernameController,
                              onChanged: (value) {
                                // Convert to lowercase for case-insensitive username
                                final cursorPosition =
                                    _usernameController.selection.baseOffset;
                                _usernameController.value = TextEditingValue(
                                  text: value.toLowerCase(),
                                  selection: TextSelection.collapsed(
                                    offset: cursorPosition,
                                  ),
                                );
                                setState(() {});
                              },
                            ),
                          ],
                        ),
                        const AuthHelp(
                          'Your username identifies you or your organization. It can\'t be changed once set.',
                        ),
                        const SizedBox(height: 14),
                        SelectInput<String>(
                          key: const Key('country'),
                          label: localizations.country,
                          options: AppSelectOptions.getCountryOptions(
                            localizations,
                          ),
                          value: _selectedCountry,
                          onChanged: (value) {
                            setState(() {
                              _selectedCountry = value;
                            });
                          },
                        ),
                        const SizedBox(height: 10),
                        NumberInput(
                          key: const Key('phoneNumber'),
                          selectedCountry: _selectedPhoneCountry,
                          countryCode: _countryCode,
                          phoneNumber:
                              _phoneNumber, // Pre-fill with passed phone number
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
                        const AuthHelp(
                          'Enter your number without the leading 0. e.g. 241234567',
                        ),
                        const SizedBox(height: 14),
                        AuthField(
                          key: const Key('referralCode'),
                          label: 'Referral code (optional)',
                          hintText: 'e.g. KOFI24',
                          standalone: true,
                          keyboardType: TextInputType.text,
                          controller: _referralCodeController,
                          onChanged: (value) {
                            final upper = value.toUpperCase();
                            final cursor =
                                _referralCodeController.selection.baseOffset;
                            _referralCodeController.value = TextEditingValue(
                              text: upper,
                              selection: TextSelection.collapsed(
                                offset: cursor,
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 16),

                        // Terms & Conditions Section
                        RichText(
                          textAlign: TextAlign.left,
                          text: TextSpan(
                            style: DsText.caption,
                            children: [
                              TextSpan(text: localizations.bySigningUpYouAgree),
                              TextSpan(
                                text: localizations.termsAndConditions,
                                style: _linkStyle,
                                recognizer:
                                    TapGestureRecognizer()
                                      ..onTap = () {
                                        UrlLauncherUtils.launch(AppLinks.terms);
                                      },
                              ),
                              TextSpan(text: localizations.and),
                              TextSpan(
                                text: localizations.privacyPolicy,
                                style: _linkStyle,
                                recognizer:
                                    TapGestureRecognizer()
                                      ..onTap = () {
                                        UrlLauncherUtils.launch(
                                          AppLinks.privacy,
                                        );
                                      },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Action Buttons Section
              BlocBuilder<AuthBloc, AuthState>(
                builder: (context, state) {
                  return AuthFooter(
                    children: [
                      AppButton.filled(
                        key: const Key('register_continue'),
                        text: localizations.continueText,
                        isLoading: state is AuthLoading,
                        onPressed:
                            state is AuthLoading
                                ? null
                                : () {
                                  if (_step == 0) {
                                    setState(() => _step = 1);
                                  } else {
                                    _handleCreateAccount(context);
                                  }
                                },
                      ),
                      if (_step == 0)
                        AppButton.outlined(
                          key: const Key('login_button'),
                          text: 'I have an account',
                          onPressed: () {
                            if (state is AuthLoading) return;
                            context.pop();
                          },
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
