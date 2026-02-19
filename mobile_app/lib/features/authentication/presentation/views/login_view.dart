import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/button_variants.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/phone_validation_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/number_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  String _phoneNumber = '';
  String _countryCode = '+233';
  String _selectedCountry = 'Ghana';
  bool _navigatedToOtp = false;

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: MultiBlocListener(
        listeners: [
          BlocListener<VerificationBloc, VerificationState>(
            listener: (context, state) {
              // RequestLogin is dispatched from the OTP view for the login flow
              if (state is VerificationFailure) {
                AppSnackBar.showError(context, message: state.errorMessage);
              }
            },
          ),
          BlocListener<AuthBloc, AuthState>(
            listener: (context, state) {
              bool? isCurrentRoute = ModalRoute.of(context)?.isCurrent;
              if (isCurrentRoute == false) {
                return;
              }

              if (state is AuthAuthenticated) {
                _navigatedToOtp = false;
                // Navigate to home on success
                context.go(AppRoutes.jarDetail);
              } else if (state is PhoneNumberAvailable) {
                _navigatedToOtp = false;
                // Phone number available for registration - redirect to register
                context.push(
                  AppRoutes.register,
                  extra: {
                    'initialPhoneNumber': state.phoneNumber,
                    'initialCountryCode': state.countryCode,
                    'initialSelectedCountry': _selectedCountry,
                  },
                );
              } else if (state is PhoneNumberNotAvailable) {
                if (_navigatedToOtp) return;
                _navigatedToOtp = true;
                // Phone number exists - proceed to login OTP
                context.push(
                  AppRoutes.otp,
                  extra: {
                    'phoneNumber': state.phoneNumber,
                    'countryCode': state.countryCode,
                    'email': state.email ?? '',
                    'isRegistering': false,
                  },
                );
              } else if (state is AuthError) {
                _navigatedToOtp = false;
                // Show error message from auth state
                AppSnackBar.showError(context, message: state.error);
              }
            },
          ),
        ],
        child: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.spacingM),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.spacingL),

                  Text(localizations.login, style: TextStyles.headingOne),

                  const SizedBox(height: AppSpacing.spacingS),

                  Text(
                    localizations.loginSubtitle,
                    style: TextStyles.headingTwo,
                  ),

                  const SizedBox(height: AppSpacing.spacingL),

                  NumberInput(
                    selectedCountry: _selectedCountry,
                    countryCode: _countryCode,
                    placeholder: localizations.phoneNumber,
                    textFieldKey: const Key('phone_number'),
                    onCountryChanged: (country, code) {
                      setState(() {
                        _selectedCountry = country;
                        _countryCode = code;
                      });
                    },
                    onPhoneNumberChanged: (phoneNumber) {
                      setState(() {
                        _phoneNumber = phoneNumber;
                      });
                    },
                  ),

                  const SizedBox(height: AppSpacing.spacingS),

                  AppButton(
                    text:
                        state is AuthLoading
                            ? localizations.checking
                            : localizations.login,
                    variant: ButtonVariant.fill,
                    key: const Key('login_button'),
                    onPressed:
                        state is AuthLoading
                            ? null
                            : () {
                              if (_phoneNumber.isEmpty) {
                                AppSnackBar.showError(
                                  context,
                                  message: localizations.pleaseEnterPhoneNumber,
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

                              // First check if user exists
                              context.read<AuthBloc>().add(
                                CheckUserExistence(
                                  phoneNumber: _phoneNumber,
                                  countryCode: _countryCode,
                                ),
                              );
                            },
                  ),
                  const SizedBox(height: AppSpacing.spacingS),

                  AppButton(
                    text: localizations.createAccount,
                    variant: ButtonVariant.outline,
                    onPressed: () {
                      context.push(AppRoutes.register);
                    },
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
