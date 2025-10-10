import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/number_input.dart';
import 'package:Hoga/core/widgets/number_country_picker.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';

class ChangePhoneNumberView extends StatefulWidget {
  const ChangePhoneNumberView({super.key});

  @override
  State<ChangePhoneNumberView> createState() => _ChangePhoneNumberViewState();
}

class _ChangePhoneNumberViewState extends State<ChangePhoneNumberView> {
  String _selectedCountry = '';
  String _countryCode = '';
  String _phoneNumber = '';
  String _initialPhoneNumber = '';
  bool _hasInitialized = false;

  bool _isPhoneNumberChanged() {
    return _phoneNumber.isNotEmpty && _phoneNumber != _initialPhoneNumber;
  }

  void _handleChangePhoneNumber() {
    if (_isPhoneNumberChanged()) {
      // Navigate to OTP view
      Navigator.pushNamed(
        context,
        AppRoutes.otp,
        arguments: {'phoneNumber': _phoneNumber, 'countryCode': _countryCode},
      );
    }
  }

  void _handleUpdatePhoneNumber() {
    // Update the phone number in the user account
    context.read<UserAccountBloc>().add(
      UpdatePersonalDetails(
        phoneNumber: _phoneNumber,
        countryCode: _countryCode,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthAuthenticated) {
          // Initialize user data immediately
          if (!_hasInitialized) {
            _initialPhoneNumber = state.user.phoneNumber;
            _phoneNumber = state.user.phoneNumber;
            _countryCode = state.user.countryCode;

            // Get the country name based on the country code
            final countryFromCode = NumberCountryPicker.getCountryByCode(
              state.user.countryCode,
            );
            _selectedCountry = countryFromCode?.name ?? 'Ghana';

            _hasInitialized = true;
          }

          return Scaffold(
            appBar: AppBar(title: Text(localizations.changePhoneNumber)),
            body: MultiBlocListener(
              listeners: [
                BlocListener<VerificationBloc, VerificationState>(
                  listener: (context, state) {
                    if (state is VerificationSuccess) {
                      // Handle successful verification
                      _handleUpdatePhoneNumber();
                    } else if (state is VerificationFailure) {
                      // Show error message
                      AppSnackBar.showError(
                        context,
                        message: state.errorMessage,
                      );
                    }
                  },
                ),
                BlocListener<UserAccountBloc, UserAccountState>(
                  listener: (context, state) {
                    if (state is UserAccountSuccess) {
                      // Handle successful update
                      context.read<AuthBloc>().add(
                        UpdateUserData(
                          updatedUser: state.updatedUser,
                          token: state.token,
                        ),
                      );
                      AppSnackBar.showSuccess(
                        context,
                        message: localizations.phoneNumberUpdatedSuccessfully,
                      );
                    } else if (state is UserAccountError) {
                      // Show error message
                      AppSnackBar.showError(context, message: state.message);
                    }
                  },
                ),
              ],
              child: SingleChildScrollView(
                padding: EdgeInsets.all(AppSpacing.spacingXs),
                child: Column(
                  children: [
                    NumberInput(
                      selectedCountry: _selectedCountry,
                      countryCode: _countryCode,
                      phoneNumber: _phoneNumber,
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
                    const SizedBox(height: AppSpacing.spacingM),
                    AppButton(
                      onPressed:
                          _isPhoneNumberChanged()
                              ? _handleChangePhoneNumber
                              : null,
                      text: localizations.changePhoneNumber,
                      isLoading: state is UserAccountLoading,
                    ),
                    SizedBox(height: AppSpacing.spacingM),
                  ],
                ),
              ),
            ),
          );
        }

        // Show loading or error state
        return Scaffold(
          appBar: AppBar(title: Text(localizations.changePhoneNumber)),
          body: Center(
            child: CircularProgressIndicator(
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        );
      },
    );
  }
}
