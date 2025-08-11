import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/number_input.dart';
import 'package:konto/core/widgets/select_input.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/l10n/app_localizations.dart';

class RegisterView extends StatelessWidget {
  const RegisterView({super.key});

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    
    // Define options for the SelectInput
    final List<SelectOption<String>> countryOptions = [
      SelectOption(value: 'ghana', label: localizations.countryGhana),
      SelectOption(value: 'nigeria', label: localizations.countryNigeria)
    ];

    return  Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(localizations.register, style: Theme.of(context).textTheme.titleLarge),
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
              controller: TextEditingController(),
              onChanged: (value) {
                // Handle name input
                print('Name: $value');
              },
            ),
            const SizedBox(height: AppSpacing.spacingS),
              AppTextInput(
              label: localizations.email,
              keyboardType: TextInputType.emailAddress,
              controller: TextEditingController(),
              onChanged: (value) {
                // Handle email input
                print('Email: $value');
              },
            ),
             const SizedBox(height: AppSpacing.spacingS),
            SelectInput<String>(
              label: localizations.country,
              options: countryOptions,
              value: 'ghana',
              onChanged: (value) {
                // Handle country selection
                print('Selected country: $value');
              },
            ),
             const SizedBox(height: AppSpacing.spacingS),
             NumberInput(
              selectedCountry: localizations.countryGhana,
              countryCode: '+233',
              placeholder: localizations.phoneNumberPlaceholder,
              onCountryChanged: (country, code) {
                // Handle country selection
                print('Selected: $country ($code)');
              },
              onPhoneNumberChanged: (phoneNumber) {
                // Handle phone number input
                print('Phone: $phoneNumber');
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
                    style: TextStyle(
                      decoration: TextDecoration.underline,
                    ),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () {
                        // Handle Terms & Conditions tap
                        print('Terms & Conditions tapped');
                        // TODO: Navigate to Terms & Conditions page
                      },
                  ),
                  TextSpan(text: localizations.and),
                  TextSpan(
                    text: localizations.privacyPolicy,
                    style: TextStyle(
                      decoration: TextDecoration.underline,
                    ),
                    recognizer: TapGestureRecognizer()
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
                  onPressed: () {
                    // Handle create account
                    print('Create Account pressed');
                  },
                ),
                
                const SizedBox(height: AppSpacing.spacingS),
                
                // Login Button
                AppButton.outlined(
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
    );
  }
}