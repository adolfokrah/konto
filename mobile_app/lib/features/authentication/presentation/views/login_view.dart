import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/number_input.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
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
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is PhoneNumberAvailabilityResult) {
            if (state.shouldLogin) {
              // Phone number exists, proceed with OTP for login
              context.read<AuthBloc>().add(
                PhoneNumberSubmitted(
                  phoneNumber: state.phoneNumber,
                  countryCode: state.countryCode,
                ),
              );
            } else if (state.shouldRegister) {
              // Phone number doesn't exist, navigate to registration
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Phone number not found. Please register first.',
                    style: TextStyles.titleRegularSm,
                  ),
                  backgroundColor: Colors.orange,
                ),
              );
              // Navigate to register view with phone number and country information
              Navigator.pushNamed(
                context, 
                AppRoutes.register,
                arguments: {
                  'phoneNumber': state.phoneNumber,
                  'countryCode': state.countryCode,
                  'country': _selectedCountry,
                },
              );
            }
          } else if (state is AuthCodeSentSuccess) {
            // Navigate to OTP screen when code is sent
            Navigator.pushNamed(
              context, 
              AppRoutes.otp, 
              arguments: {
                'phoneNumber': state.phoneNumber,
                'verificationId': state.verificationId,
                'countryCode': state.countryCode,
              },
            );
          } else if (state is AuthFailure) {
            // Show error message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.error, style: TextStyles.titleRegularSm.copyWith(color: Colors.white)),
                backgroundColor: Colors.red,
                
              ),
            );
          } else if (state is AuthAuthenticated) {
            // User is authenticated, navigate to home
            Navigator.pushReplacementNamed(context, AppRoutes.home);
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
                  
                  Text(
                    localizations.login,
                    style: TextStyles.headingOne,
                  ),
                  
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
                    text: state is AuthLoading ? 'Checking...' : localizations.login,
                    variant: ButtonVariant.fill,
                    key: const Key('login_button'),
                    onPressed: state is AuthLoading ? null : () {
                      if (_phoneNumber.isNotEmpty) {
                        // First check if phone number is available
                        context.read<AuthBloc>().add(
                          PhoneNumberAvailabilityChecked(
                            phoneNumber: _phoneNumber,
                            countryCode: _countryCode,
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please enter a phone number'),
                            backgroundColor: Colors.orange,
                          ),
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
