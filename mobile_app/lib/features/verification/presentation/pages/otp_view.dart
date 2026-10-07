import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/presentation/widgets/auth_widgets.dart';
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
    final args = GoRouterState.of(context).extra as Map<String, dynamic>?;
    final phoneNumber = args?['phoneNumber'] as String?;
    final email = args?['email'] as String?;
    final countryCode = args?['countryCode'] as String?;
    final skipInitialOtp = args?['skipInitialOtp'] as bool? ?? false;
    final isRegistering = args?['isRegistering'] as bool?;
    final onConfirm = args?['onConfirm'] as Future<bool> Function(String)?;

    return _OtpViewContent(
      phoneNumber: phoneNumber,
      email: email,
      countryCode: countryCode,
      skipInitialOtp: skipInitialOtp,
      isRegistering: isRegistering,
      onConfirm: onConfirm,
    );
  }
}

class _OtpViewContent extends StatefulWidget {
  final String? phoneNumber;
  final String? email;
  final String? countryCode;
  final bool skipInitialOtp;
  final bool? isRegistering;
  final Future<bool> Function(String)? onConfirm;

  const _OtpViewContent({
    this.phoneNumber,
    this.email,
    this.countryCode,
    this.skipInitialOtp = false,
    this.isRegistering,
    this.onConfirm,
  });

  @override
  State<_OtpViewContent> createState() => _OtpViewContentState();
}

class _OtpViewContentState extends State<_OtpViewContent> {
  Timer? _timer;
  int _resendCountdown = 30;
  final TextEditingController _codeController = TextEditingController();

  void _typeDigit(String d) {
    if (_confirming || _codeController.text.length >= 6) return;
    _codeController.text = _codeController.text + d;
  }

  void _backspace() {
    final t = _codeController.text;
    if (_confirming || t.isEmpty) return;
    _codeController.text = t.substring(0, t.length - 1);
  }

  bool _canResend = false;
  bool _confirming = false;
  String? _error;

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
        if (currentState is VerificationLoading ||
            currentState is VerificationCodeSent) {
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
    _codeController.dispose();
    _timer?.cancel();
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

  Future<void> _handleOtpCompleted(String otp) async {
    // Custom confirm handler (e.g. referral withdrawal)
    if (widget.onConfirm != null) {
      setState(() => _confirming = true);
      final success = await widget.onConfirm!(otp);
      if (!mounted) return;
      setState(() => _confirming = false);
      if (success) context.pop();
      return;
    }

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

  /// "Sent to +233 24 123 4567 · Change". Without a phone number (some
  /// verification-only flows) it falls back to the generic line.
  Widget _sentTo() {
    final phone = widget.phoneNumber ?? '';
    if (phone.isEmpty) {
      return const Text(
        'We sent a 6 digit code to your email and phone number',
        style: DsText.body,
      );
    }
    final code = widget.countryCode ?? '';
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text('Sent to $code $phone', style: DsText.body),
        if (widget.isRegistering != null && context.canPop()) ...[
          const Text(' · ', style: DsText.body),
          DsLink('Change', onTap: () => context.pop()),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: const AuthTopBar(),
      body: MultiBlocListener(
        listeners: [
          BlocListener<VerificationBloc, VerificationState>(
            listener: (context, state) {
              if (state is VerificationSuccess) {
                final args =
                    GoRouterState.of(context).extra as Map<String, dynamic>?;
                if (widget.isRegistering == false) {
                  // Login flow: dispatch RequestLogin directly
                  context.read<AuthBloc>().add(
                    RequestLogin(
                      phoneNumber: widget.phoneNumber ?? '',
                      countryCode: widget.countryCode ?? '',
                    ),
                  );
                } else if (widget.isRegistering == true) {
                  // Registration flow: dispatch RequestRegistration directly
                  context.read<AuthBloc>().add(
                    RequestRegistration(
                      phoneNumber: widget.phoneNumber ?? '',
                      countryCode: widget.countryCode ?? '',
                      country: args?['country'] ?? '',
                      firstName: args?['firstName'] ?? '',
                      lastName: args?['lastName'] ?? '',
                      username: args?['username'] ?? '',
                      email: widget.email ?? '',
                      referralCode: args?['referralCode'] as String?,
                      accountType:
                          args?['accountType'] as String? ?? 'individual',
                    ),
                  );
                } else {
                  // Verification-only flow (change phone, withdrawal): pop back
                  if (context.mounted) {
                    context.pop();
                  }
                }
              } else if (state is VerificationFailure) {
                setState(() => _error = state.errorMessage);
              }
            },
          ),
          BlocListener<AuthBloc, AuthState>(
            listener: (context, state) {
              if (state is AuthAuthenticated) {
                context.go(AppRoutes.home);
              } else if (state is AuthError) {
                AppSnackBar.showError(context, message: state.error);
              }
            },
          ),
        ],
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AuthHeader(
                        title: 'Enter the code',
                        subtitleWidget: _sentTo(),
                      ),
                      const SizedBox(height: 24),

                      // OTP Input
                      AppOtpInput(
                        length: 6,
                        controller: _codeController,
                        useSystemKeyboard: false,
                        hasError: _error != null,
                        enabled: !_confirming,
                        onChanged: (_) {
                          if (_error != null) setState(() => _error = null);
                        },
                        onCompleted: _handleOtpCompleted,
                      ),

                      if (_error != null) ...[
                        const SizedBox(height: 14),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(top: 2),
                              child: Icon(
                                Icons.error_outline_rounded,
                                size: 16,
                                color: AppColors.negative,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                _error!,
                                style: DsText.small.copyWith(
                                  color: AppColors.negative,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],

                      const SizedBox(height: 20),

                      // Resend code section
                      Row(
                        children: [
                          Expanded(
                            child: Text("Didn't get it?", style: DsText.small),
                          ),
                          if (_canResend)
                            DsLink('Resend code', onTap: _handleResend)
                          else
                            Text(
                              'Resend in 0:${_resendCountdown.toString().padLeft(2, '0')}',
                              style: DsText.small.copyWith(
                                color: AppColors.muted,
                              ),
                            ),
                        ],
                      ),

                      if (_confirming) ...[
                        const SizedBox(height: 24),
                        const Center(
                          child: SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: AppColors.navy,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              AuthKeypad(onDigit: _typeDigit, onBackspace: _backspace),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
