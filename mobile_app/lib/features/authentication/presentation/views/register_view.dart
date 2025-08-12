import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/number_input.dart';
import 'package:konto/core/widgets/select_input.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  String _phoneNumber = '';
  String _countryCode = '+233';
  String _selectedCountry = 'Ghana';
  bool _isLoading = false;
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    // Extract arguments passed from login view
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      final phoneNumber = args['phoneNumber'] as String?;
      final countryCode = args['countryCode'] as String?;
      final country = args['country'] as String?;
      
      if (phoneNumber != null && countryCode != null && country != null) {
        setState(() {
          _phoneNumber = phoneNumber;
          _countryCode = countryCode;
          _selectedCountry = country;
        });
        print('📱 Pre-filled registration: $countryCode $phoneNumber ($country)');
      }
    }
  }
  
  void _handleCreateAccount(BuildContext context) {
    // Validate input fields
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter your full name', style: AppTextStyles.titleRegularM),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }
    
    if (_emailController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter your email address', style: AppTextStyles.titleRegularM),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }
    
    if (_phoneNumber.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter your phone number', style: AppTextStyles.titleRegularM),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }
    
    // Map country name to country code for backend
    String getCountryCode(String countryName) {
      switch (countryName.toLowerCase()) {
        case 'ghana':
          return 'gh';
        case 'nigeria':
          return 'ng';
        default:
          return 'gh';
      }
    }
    
    // Trigger registration OTP request
    context.read<AuthBloc>().add(
      UserRegistrationOtpRequested(
        phoneNumber: _phoneNumber,
        countryCode: _countryCode,
        country: getCountryCode(_selectedCountry),
        fullName: _nameController.text.trim(),
        email: _emailController.text.trim(),
      ),
    );
  }
  
  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    
    // Define options for the SelectInput
    final List<SelectOption<String>> countryOptions = [
      SelectOption(value: 'ghana', label: localizations.countryGhana),
      SelectOption(value: 'nigeria', label: localizations.countryNigeria)
    ];
    
    // Map country name to option value
    String getCountryValue(String countryName) {
      switch (countryName.toLowerCase()) {
        case 'ghana':
          return 'ghana';
        case 'nigeria':
          return 'nigeria';
        default:
          return 'ghana'; // Default fallback
      }
    }

    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is UserRegistrationOtpSent) {
          // OTP sent successfully, navigate to OTP verification
          Navigator.pushNamed(
            context, 
            '/otp',
            arguments: {
              'phoneNumber': state.phoneNumber,
              'countryCode': state.countryCode,
              'verificationId': state.sentOtp, // Use 'verificationId' key that OTP view expects
              'country': state.country,
              'fullName': state.fullName,
              'email': state.email,
              'sentOtp': state.sentOtp,
              'isRegistration': true, // Flag to indicate this is for registration
            },
          );
        } else if (state is UserRegistrationFailure) {
          // Registration failed
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.error, style: AppTextStyles.titleRegularM),
              backgroundColor: AppColors.errorRed,
            ),
          );
        }
        
        // Update loading state
        setState(() {
          _isLoading = state is AuthLoading;
        });
      },
      child: Scaffold(
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
              controller: _nameController,
              key: const Key('fullName'),
            ),
            const SizedBox(height: AppSpacing.spacingS),
              AppTextInput(
              key: const Key('email'),
              label: localizations.email,
              keyboardType: TextInputType.emailAddress,
              controller: _emailController,
              onChanged: (value) {
                // Handle email input
                print('Email: $value');
              },
            ),
             const SizedBox(height: AppSpacing.spacingS),
            SelectInput<String>(
              key: const Key('country'),
              label: localizations.country,
              options: countryOptions,
              value: getCountryValue(_selectedCountry),
              onChanged: (value) {
                // Handle country selection and update corresponding state
                String countryName = value == 'ghana' ? 'Ghana' : 'Nigeria';
                String countryCode = value == 'ghana' ? '+233' : '+234';
                
                setState(() {
                  _selectedCountry = countryName;
                  _countryCode = countryCode;
                });
              },
            ),
             const SizedBox(height: AppSpacing.spacingS),
             NumberInput(
              key: const Key('phoneNumber'),
              selectedCountry: _selectedCountry,
              countryCode: _countryCode,
              phoneNumber: _phoneNumber, // Pre-fill with passed phone number
              placeholder: localizations.phoneNumberPlaceholder,
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
                  isLoading: _isLoading,
                  onPressed: _isLoading ? null : () {
                    _handleCreateAccount(context);
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
    ),
    );
  }
}