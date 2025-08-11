import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/otp_input.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';

class OtpView extends StatelessWidget {
  const OtpView({super.key});

  @override
  Widget build(BuildContext context) {
    // Extract phone number from route arguments
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final phoneNumber = args?['phoneNumber'] as String?;
    final email = args?['email'] as String?;

    return BlocProvider(
      create: (context) => VerificationBloc(),
      child: _OtpViewContent(
        phoneNumber: phoneNumber,
        email: email,
      ),
    );
  }
}

class _OtpViewContent extends StatefulWidget {
  final String? phoneNumber;
  final String? email;

  const _OtpViewContent({
    this.phoneNumber,
    this.email,
  });

  @override
  State<_OtpViewContent> createState() => _OtpViewContentState();
}

class _OtpViewContentState extends State<_OtpViewContent> {
  late Timer _timer;
  int _resendCountdown = 30;
  bool _canResend = false;
  String _currentOtp = '';

  @override
  void initState() {
    super.initState();
    _startResendTimer();
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
      context.read<VerificationBloc>().add(ResendOtpRequested());
      _startResendTimer();
    }
  }

  void _handleOtpChanged(String otp) {
    _currentOtp = otp;
    context.read<VerificationBloc>().add(OtpChanged(otp));
  }

  void _handleOtpCompleted(String otp) {
    _currentOtp = otp;
    context.read<VerificationBloc>().add(OtpSubmitted(otp));
  }

  String get _contactInfo {
    if (widget.phoneNumber != null) {
      return widget.phoneNumber!;
    } else if (widget.email != null) {
      return widget.email!;
    }
    return '';
  }

  String get _contactType {
    if (widget.phoneNumber != null) {
      return 'phone number';
    } else if (widget.email != null) {
      return 'email address';
    }
    return 'contact';
  }

  @override
  Widget build(BuildContext context) {
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
                content: const Text('Verification successful!'),
                backgroundColor: Colors.green,
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
              const SnackBar(
                content: Text('Verification code sent successfully!'),
                backgroundColor: AppColors.secondaryGreen,
                duration: Duration(seconds: 2),
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
                  'Enter OTP',
                  style: AppTextStyles.headingOne,
                ),
                
                const SizedBox(height: AppSpacing.spacingM),
                
                // Subtitle with contact info
                if (_contactInfo.isNotEmpty) ...[
                  Text(
                    'We sent a 6-digit code to your $_contactType',
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
                      "Didn't receive the code? ",
                      style: AppTextStyles.titleRegularM.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                    GestureDetector(
                      onTap: _canResend ? _handleResend : null,
                      child: Text(
                        _canResend ? 'Resend' : 'Resend in ${_resendCountdown}s',
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
                
                // const Spacer(),
                
                // // Verify button
                // BlocBuilder<VerificationBloc, VerificationState>(
                //   builder: (context, state) {
                //     final isLoading = state is VerificationLoading;
                    
                //     return AppButton(
                //       text: isLoading ? 'Verifying...' : 'Verify',
                //       onPressed: (_currentOtp.length == 6 && !isLoading) 
                //           ? () => _handleOtpCompleted(_currentOtp)
                //           : null,
                //       variant: ButtonVariant.fill,
                //       backgroundColor: AppColors.black,
                //       borderColor: AppColors.black,
                //       textColor: AppColors.onPrimaryWhite,
                //       isLoading: isLoading,
                //     );
                //   },
                // ),
                
                // const SizedBox(height: AppSpacing.spacingM),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
