import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/otp_input.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

class OtpView extends StatelessWidget {
  const OtpView({super.key});

  @override
  Widget build(BuildContext context) {
    // Extract phone number from route arguments
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final phoneNumber = args?['phoneNumber'] as String?;
    final email = args?['email'] as String?;
    final countryCode = args?['countryCode'] as String?;

    return _OtpViewContent(
      phoneNumber: phoneNumber,
      email: email,
      countryCode: countryCode,
    );
  }
}

class _OtpViewContent extends StatefulWidget {
  final String? phoneNumber;
  final String? email;
  final String? countryCode;

  const _OtpViewContent({
    this.phoneNumber,
    this.email,
    this.countryCode,
  });

  @override
  State<_OtpViewContent> createState() => _OtpViewContentState();
}

class _OtpViewContentState extends State<_OtpViewContent> {
  late Timer _timer;
  int _resendCountdown = 30;
  bool _canResend = false;
  bool _hasInitialized = false;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasInitialized) {
      _initializeVerification();
      _hasInitialized = true;
    }
  }

  void _initializeVerification() {
    // Initialize VerificationBloc with phone number and OTP from navigation arguments
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final phoneNumber = args?['phoneNumber'] as String?;
    final verificationId = args?['verificationId'] as String?; // This is actually the OTP
    final countryCode = args?['countryCode'] as String?;

    if (phoneNumber != null && verificationId != null && countryCode != null) {
      context.read<VerificationBloc>().add(
        InitializeVerification(
          phoneNumber: phoneNumber,
          sentOtp: verificationId,
          countryCode: countryCode,
        ),
      );
    }
  }
  
  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _startResendTimer() {
    _canResend = false;
    _resendCountdown = 30;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCountdown > 0) {
        setState(() {
          _resendCountdown--;
        });
      } else {
        setState(() {
          _canResend = true;
        });
        timer.cancel();
      }
    });
  }

  void _handleResend() {
    if (_canResend) {
      final localizations = AppLocalizations.of(context)!;
      // Show helpful message about potential rate limiting
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            localizations.resendMessage,
            style: TextStyles.titleRegularSm.copyWith(color: Colors.white),
          ),
          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
          duration: const Duration(seconds: 4),
        ),
      );
      
      context.read<VerificationBloc>().add(ResendOtpRequested());
      _startResendTimer();
    }
  }

  void _handleOtpChanged(String otp) {
    context.read<VerificationBloc>().add(OtpChanged(otp));
  }

  void _handleOtpCompleted(String otp) {
    context.read<VerificationBloc>().add(OtpSubmitted(otp));
  }

  String get _contactInfo {
    if (widget.phoneNumber != null) {
      // Format phone number with country code for display
      final countryCode = widget.countryCode ?? '';
      final phoneNumber = widget.phoneNumber!;
      
      if (countryCode.isNotEmpty) {
        return '$countryCode $phoneNumber';
      }
      return phoneNumber;
    } else if (widget.email != null) {
      return widget.email!;
    }
    return '';
  }

  String _getContactType(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    if (widget.phoneNumber != null) {
      return localizations.phoneNumberContactType;
    } else if (widget.email != null) {
      return localizations.emailContactType;
    }
    return localizations.contactType;
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: BlocListener<VerificationBloc, VerificationState>(
        listener: (context, state) {
          if (state is VerificationSuccess) {
            // Show success message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(localizations.verificationSuccessful),
                backgroundColor: AppColors.secondaryGreen,
                duration: const Duration(seconds: 2),
              ),
            );
            
            // Call success callback or navigate
            // Navigate to home on success
            Navigator.pushNamedAndRemoveUntil(
              context,
              '/home',
              (route) => false,
            );
          } else if (state is VerificationFailure) {
            // Show error message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage),
                backgroundColor: Theme.of(context).colorScheme.error,
                duration: const Duration(seconds: 3),
              ),
            );
          } else if (state is VerificationResendSuccess) {
            // Show resend success message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(localizations.verificationCodeSent),
                backgroundColor: AppColors.secondaryGreen,
                duration: const Duration(seconds: 2),
              ),
            );
          } else if (state is VerificationResendFailure) {
            // Show resend error
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage),
                backgroundColor: Theme.of(context).colorScheme.error,
                duration: const Duration(seconds: 3),
              ),
            );
          }
        },
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.spacingS),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: AppSpacing.spacingL),
                
                // Title
                Text(
                  localizations.enterOtp,
                  style: AppTextStyles.headingOne,
                ),
                
                const SizedBox(height: AppSpacing.spacingM),
                
                // Subtitle with contact info
                if (_contactInfo.isNotEmpty) ...[
                  Text(
                    localizations.otpSubtitle(_getContactType(context)),
                    style: AppTextStyles.titleRegularM.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingXs),
                  Text(
                    _contactInfo,
                    style: AppTextStyles.titleMediumM.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                
                const SizedBox(height: AppSpacing.spacingL),
                
                // OTP Input
                BlocBuilder<VerificationBloc, VerificationState>(
                  builder: (context, state) {
                    bool hasError = false;
                    if (state is VerificationOtpInput) {
                      hasError = state.hasError;
                    }
                    
                    return AppOtpInput(
                      length: 6,
                      hasError: hasError,
                      onChanged: _handleOtpChanged,
                      onCompleted: _handleOtpCompleted,
                    );
                  },
                ),
                
                const SizedBox(height: AppSpacing.spacingM),
                
                // Error message
                BlocBuilder<VerificationBloc, VerificationState>(
                  builder: (context, state) {
                    if (state is VerificationOtpInput && state.hasError && state.errorMessage != null) {
                      return Text(
                        state.errorMessage!,
                        style: AppTextStyles.titleRegularM.copyWith(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                
                const SizedBox(height: AppSpacing.spacingL),
                
                // Resend code section
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Text(
                      localizations.didntReceiveCode,
                      style: AppTextStyles.titleRegularM.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                    GestureDetector(
                      onTap: _canResend ? _handleResend : null,
                      child: Text(
                        _canResend ? localizations.resend : localizations.resendIn(_resendCountdown),
                        style: AppTextStyles.titleMediumM.copyWith(
                          color: _canResend 
                              ? Theme.of(context).colorScheme.onSurface
                              : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                          fontWeight: FontWeight.w600,
                          decoration: _canResend ? TextDecoration.underline : null,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
