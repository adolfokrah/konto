import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/button_variants.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/presentation/widgets/auth_widgets.dart';
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
      backgroundColor: AppColors.cream,
      appBar: const AuthTopBar(),
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
            final loading = state is AuthLoading;
            return Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AuthHeader(
                          title: localizations.login,
                          subtitle: localizations.loginSubtitle.replaceAll(
                            '\n',
                            ' ',
                          ),
                        ),
                        const SizedBox(height: 24),
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
                        const SizedBox(height: 12),
                        const Row(
                          children: [
                            Icon(
                              Icons.lock_outline_rounded,
                              size: 15,
                              color: AppColors.muted,
                            ),
                            SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Your number is only used to sign in and send receipts.',
                                style: DsText.caption,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                AuthFooter(
                  children: [
                    AppButton(
                      text: loading ? localizations.checking : localizations.login,
                      variant: ButtonVariant.fill,
                      key: const Key('login_button'),
                      onPressed:
                          loading
                              ? null
                              : () {
                                if (_phoneNumber.isEmpty) {
                                  AppSnackBar.showError(
                                    context,
                                    message:
                                        localizations.pleaseEnterPhoneNumber,
                                  );
                                  return;
                                }

                                // Validate Ghana phone number format
                                if (!PhoneValidationUtils.isValidGhanaPhoneNumber(
                                  _phoneNumber,
                                )) {
                                  AppSnackBar.showError(
                                    context,
                                    message:
                                        PhoneValidationUtils.getDetailedValidationError(
                                          _phoneNumber,
                                        ),
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
                    AppButton(
                      text: localizations.createAccount,
                      variant: ButtonVariant.outline,
                      onPressed: () {
                        context.push(AppRoutes.register);
                      },
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
