import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/otp_input.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

class OtpView extends StatelessWidget {
  const OtpView({super.key});

  @override
  Widget build(BuildContext context) {
    // Extract phone number from route arguments
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
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

  const _OtpViewContent({this.phoneNumber, this.email, this.countryCode});

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

  void _initializeVerification() {
    // Initialize VerificationBloc with phone number and OTP from navigation arguments
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final phoneNumber = args?['phoneNumber'] as String?;
    final countryCode = args?['countryCode'] as String?;
    final fullPhoneNumber =
        phoneNumber != null && countryCode != null
            ? '$countryCode$phoneNumber'
            : phoneNumber;

    context.read<VerificationBloc>().add(
      PhoneNumberVerificationRequested(phoneNumber: fullPhoneNumber ?? ''),
    );
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

      AppSnackBar.showInfo(context, message: localizations.resendMessage);

      _initializeVerification();
    }
  }

  void _handleOtpCompleted(String otp) {
    final state = context.read<VerificationBloc>().state;
    if (state is! VerificationCodeSent) {
      return;
    }
    final sentOtp = state.otpCode;
    if (otp != sentOtp) {
      AppSnackBar.showError(
        context,
        message: "OTP does not match the sent code. Please try again.",
      );
      return;
    }

    context.read<VerificationBloc>().add(VerificationSuccessRequested());
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
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: BlocListener<VerificationBloc, VerificationState>(
        listener: (context, state) async {
          if (state is VerificationSuccess) {
            //remove the opt screen
            Navigator.pop(context);
          } else if (state is VerificationFailure) {
            AppSnackBar.showError(context, message: state.errorMessage);
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
                Text(localizations.enterOtp, style: AppTextStyles.headingOne),

                const SizedBox(height: AppSpacing.spacingM),

                // Subtitle with contact info
                if (_contactInfo.isNotEmpty) ...[
                  Text(
                    localizations.otpSubtitle(_getContactType(context)),
                    style: AppTextStyles.titleRegularM.copyWith(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.7),
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
