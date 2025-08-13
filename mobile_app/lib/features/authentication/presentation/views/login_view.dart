import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/number_input.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/route.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  String _phoneNumber = '';
  String _countryCode = '+233';
  String _selectedCountry = 'Ghana';

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          bool? isCurrentRoute = ModalRoute.of(context)?.isCurrent;
          if(isCurrentRoute == false) {
            return;
          }
          if(state is PhoneNumberAvailable) {
            Navigator.pushNamed(
              context,
              AppRoutes.otp,
              arguments: {
                'phoneNumber': state.phoneNumber,
                'countryCode': state.countryCode,
              },
            );
          } else if (state is PhoneNumberNotAvailable) {
            // Navigate to registration screen if phone number is not available
            Navigator.pushNamed(context, AppRoutes.register, arguments: {
              'initialPhoneNumber': state.phoneNumber,
              'initialCountryCode': state.countryCode,
              'initialSelectedCountry': _selectedCountry,
            });
          } else if (state is AuthError) {
            // Show error message from auth state
            AppSnackBar.showError(context, message: state.error);
          }
        },
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
                            ? 'Checking...'
                            : localizations.login,
                    variant: ButtonVariant.fill,
                    key: const Key('login_button'),
                    onPressed:
                        state is AuthLoading
                            ? null
                            : () {
                              if (_phoneNumber.isNotEmpty) {
                                // First check if user exists
                                context.read<AuthBloc>().add(
                                  CheckUserExistence(
                                    phoneNumber: _phoneNumber,
                                    countryCode: _countryCode,
                                  ),
                                );
                              } else {
                                AppSnackBar.showError(
                                  context,
                                  message: 'Please enter a phone number',
                                );
                              }
                            },
                  ),
                  const SizedBox(height: AppSpacing.spacingS),

                  AppButton(
                    text: localizations.createAccount,
                    variant: ButtonVariant.outline,
                    onPressed: () {
                      Navigator.pushNamed(context, AppRoutes.register);
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
