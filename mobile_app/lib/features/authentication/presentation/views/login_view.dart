import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/number_input.dart';
import 'package:konto/l10n/app_localizations.dart';

class LoginView extends StatelessWidget {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 40),
            
            Text(
              localizations.login,
              style: TextStyles.headingOne,
            ),
            
            const SizedBox(height: AppSpacing.spacingS),
            
            Text(
              localizations.loginSubtitle,
              style: TextStyles.headingTwo,
            ),
            
            const SizedBox(height: 40),
            
            NumberInput(
              selectedCountry: 'Ghana',
              countryCode: '+233',
              placeholder: localizations.phoneNumber,
              onCountryChanged: (country, code) {
                // Handle country selection
                print('Selected: $country ($code)');
              },
              onPhoneNumberChanged: (phoneNumber) {
                // Handle phone number input
                print('Phone: $phoneNumber');
              },
            ),
            
            const SizedBox(height: AppSpacing.spacingS),
            
            AppButton(text: localizations.login, variant: ButtonVariant.fill, onPressed: () => {},),
            const SizedBox(height: AppSpacing.spacingS),
            AppButton(text: localizations.createAccount, variant: ButtonVariant.outline, onPressed: () => {},)
          ],
        ),
      ),
    );
  }
}
