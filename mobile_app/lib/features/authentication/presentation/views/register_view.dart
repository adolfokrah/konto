import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/widgets/number_input.dart';
import 'package:konto/core/widgets/text_input.dart';

class RegisterView extends StatelessWidget {
  const RegisterView({super.key});

  @override
  Widget build(BuildContext context) {
    return  Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Register', style: Theme.of(context).textTheme.titleLarge),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.spacingM),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.spacingL),
            AppTextInput(
              label: 'Full name',
              keyboardType: TextInputType.name,
              controller: TextEditingController(),
              onChanged: (value) {
                // Handle email input
                print('Email: $value');
              },
            ),
            const SizedBox(height: AppSpacing.spacingS),
              AppTextInput(
              label: 'Email',
              keyboardType: TextInputType.emailAddress,
              controller: TextEditingController(),
              onChanged: (value) {
                // Handle email input
                print('Email: $value');
              },
            ),
             const SizedBox(height: AppSpacing.spacingS),
             NumberInput(
              selectedCountry: 'Ghana',
              countryCode: '+233',
              placeholder: 'Phone Number',
              onCountryChanged: (country, code) {
                // Handle country selection
                print('Selected: $country ($code)');
              },
              onPhoneNumberChanged: (phoneNumber) {
                // Handle phone number input
                print('Phone: $phoneNumber');
              },
             )
          ],
        ),
      ),
    );
  }
}