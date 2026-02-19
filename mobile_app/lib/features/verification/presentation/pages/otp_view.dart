import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/otp_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class OtpView extends StatelessWidget {
  const OtpView({super.key});

  @override
  Widget build(BuildContext context) {
    // Extract phone number from route arguments
    final args =
        GoRouterState.of(context).extra as Map<String, dynamic>?;
    final phoneNumber = args?['phoneNumber'] as String?;
    final email = args?['email'] as String?;
    final countryCode = args?['countryCode'] as String?;
    final skipInitialOtp = args?['skipInitialOtp'] as bool? ?? false;
    final isRegistering = args?['isRegistering'] as bool? ?? true;

    return _OtpViewContent(
      phoneNumber: phoneNumber,
      email: email,
      countryCode: countryCode,
      skipInitialOtp: skipInitialOtp,
      isRegistering: isRegistering,
    );
  }
}

class _OtpViewContent extends StatefulWidget {
  final String? phoneNumber;
  final String? email;
  final String? countryCode;
  final bool skipInitialOtp;
  final bool isRegistering;

  const _OtpViewContent({
    this.phoneNumber,
    this.email,
    this.countryCode,
    this.skipInitialOtp = false,
    this.isRegistering = true,
  });

  @override
  State<_OtpViewContent> createState() => _OtpViewContentState();
}

class _OtpViewContentState extends State<_OtpViewContent> {
  late Timer _timer;
  int _resendCountdown = 30;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeVerification();
    });
  }

  void _initializeVerification({bool isResend = false}) {
    // If skipInitialOtp is true (withdrawal flow), OTP was already sent
    // Otherwise (login/register flow), send OTP now
    if (!widget.skipInitialOtp) {
      // Guard against duplicate OTP sends (e.g. GoRouter refresh rebuilding the widget)
      if (!isResend) {
        final currentState = context.read<VerificationBloc>().state;
        if (currentState is VerificationLoading || currentState is VerificationCodeSent) {
          return;
        }
      }

      final args = GoRouterState.of(context).extra as Map<String, dynamic>?;
      final phoneNumber = args?['phoneNumber'] as String?;
      final countryCode = args?['countryCode'] as String?;
      final email = args?['email'] as String?;

      context.read<VerificationBloc>().add(
            PhoneNumberVerificationRequested(
              phoneNumber: phoneNumber ?? '',
              email: email ?? '',
              countryCode: countryCode ?? '',
            ),
          );
    }

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
      final localizations = AppLocalizations.of(context)!;

      print('🔄 OTP View: Resend button tapped');
      AppSnackBar.showInfo(context, message: localizations.resendMessage);

      _initializeVerification(isResend: true);
    } else {
      print(
        '⏳ OTP View: Resend not available yet, countdown: $_resendCountdown',
      );
    }
  }

  void _handleOtpCompleted(String otp) {
    final state = context.read<VerificationBloc>().state;

    // Allow verification from both VerificationCodeSent and VerificationFailure states
    // This enables retry after failed attempts
    if (state is! VerificationCodeSent && state is! VerificationFailure) {
      return;
    }

    // Verify OTP via backend
    context.read<VerificationBloc>().add(
      OtpVerificationRequested(
        phoneNumber: widget.phoneNumber ?? '',
        countryCode: widget.countryCode ?? '',
        code: otp,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: MultiBlocListener(
        listeners: [
          BlocListener<VerificationBloc, VerificationState>(
            listener: (context, state) {
              if (state is VerificationSuccess) {
                if (!widget.isRegistering) {
                  // Login flow: dispatch RequestLogin directly from OTP view
                  context.read<AuthBloc>().add(
                    RequestLogin(
                      phoneNumber: widget.phoneNumber ?? '',
                      countryCode: widget.countryCode ?? '',
                    ),
                  );
                } else {
                  // Registration/other flow: pop back to caller
                  context.pop();
                }
              } else if (state is VerificationFailure) {
                AppSnackBar.showError(context, message: state.errorMessage);
              }
            },
          ),
          BlocListener<AuthBloc, AuthState>(
            listener: (context, state) {
              if (state is AuthAuthenticated) {
                context.go(AppRoutes.jarDetail);
              } else if (state is AuthError) {
                AppSnackBar.showError(context, message: state.error);
              }
            },
          ),
        ],
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.spacingS),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: AppSpacing.spacingL),

                // Title
                Text(localizations.enterOtp, style: AppTextStyles.headingOne),

                const SizedBox(height: AppSpacing.spacingM),

                // Subtitle with contact info
                Text(
                  'We sent a 6 digit code to your email and phone number',
                  style: AppTextStyles.titleRegularM.copyWith(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),

                const SizedBox(height: AppSpacing.spacingL),

                // OTP Input
                BlocBuilder<VerificationBloc, VerificationState>(
                  builder: (context, state) {
                    return AppOtpInput(
                      length: 6,
                      hasError: false,
                      onCompleted: _handleOtpCompleted,
                    );
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
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                    GestureDetector(
                      onTap: _canResend ? _handleResend : null,
                      child: Text(
                        _canResend
                            ? localizations.resend
                            : localizations.resendIn(_resendCountdown),
                        style: AppTextStyles.titleMediumM.copyWith(
                          color:
                              _canResend
                                  ? Theme.of(context).colorScheme.onSurface
                                  : Theme.of(context).colorScheme.onSurface
                                      .withValues(alpha: 0.5),
                          fontWeight: FontWeight.w600,
                          decoration:
                              _canResend ? TextDecoration.underline : null,
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
