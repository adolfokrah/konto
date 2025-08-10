import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import '../../../../core/widgets/number_input.dart';

class LoginView extends StatelessWidget {
  const LoginView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
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
            
            const Text(
              'Login',
              style: TextStyles.headingOne,
            ),
            
            const SizedBox(height: AppSpacing.spacingS),
            
            const Text(
              'Sign in to collect, contribute, or\ntrack with confidence.',
              style: TextStyles.headingTwo,
            ),
            
            const SizedBox(height: 40),
            
            NumberInput(
              selectedCountry: 'Ghana',
              countryCode: '+233',
              placeholder: 'Phone number',
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
            
            AppButton(text: "Login", variant: ButtonVariant.fill, onPressed: () => {},),
            const SizedBox(height: AppSpacing.spacingS),
            AppButton(text: "Create Account", variant: ButtonVariant.outline, onPressed: () => {},)
          ],
        ),
      ),
    );
  }
}
