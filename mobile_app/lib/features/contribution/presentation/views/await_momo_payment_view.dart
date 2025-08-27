import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:konto/route.dart';

class AwaitMomoPaymentView extends StatefulWidget {
  const AwaitMomoPaymentView({super.key});

  @override
  State<AwaitMomoPaymentView> createState() => _AwaitMomoPaymentViewState();
}

class _AwaitMomoPaymentViewState extends State<AwaitMomoPaymentView> {
  late final TextEditingController _otpController;
  Timer? _verificationTimer;

  @override
  void initState() {
    super.initState();
    _otpController = TextEditingController();
  }

  @override
  void dispose() {
    _otpController.dispose();
    _verificationTimer?.cancel();
    super.dispose();
  }

  /// Start periodic payment verification for pay_offline status
  void _startPaymentVerification(String reference) {
    _verificationTimer?.cancel(); // Cancel any existing timer
    _verificationTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (mounted) {
        context.read<MomoPaymentBloc>().add(VerifyPaymentRequested(reference));
      } else {
        timer.cancel();
      }
    });
  }

  /// Stop payment verification timer
  void _stopPaymentVerification() {
    _verificationTimer?.cancel();
    _verificationTimer = null;
  }

  _submitVoucher(String reference) {
    final voucherCode = _otpController.text.trim();
    if (voucherCode.isNotEmpty) {
      context.read<MomoPaymentBloc>().add(
        SubmitOtpRequested(otpCode: voucherCode, reference: reference),
      );
    } else {
      AppSnackBar.show(context, message: "Please enter a valid voucher code");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(leading: Container()),
      body: BlocListener<MomoPaymentBloc, MomoPaymentState>(
        listener: (context, state) {
          if (state is MomoPaymentSuccess) {
            final charge = state.charge;

            if (charge.status == 'success') {
              if (_verificationTimer == null) {
                context.read<MomoPaymentBloc>().add(
                  VerifyPaymentRequested(charge.reference!),
                );
              } else {
                _stopPaymentVerification(); // Stop verification timer
              }
              context.read<JarSummaryReloadBloc>().add(
                ReloadJarSummaryRequested(),
              );
              Navigator.popUntil(
                context,
                ModalRoute.withName(AppRoutes.jarDetail),
              );
            } else if (charge.status == 'pay_offline') {
              // Start periodic verification for offline payment
              if (charge.reference != null) {
                _startPaymentVerification(charge.reference!);
              }
              AppSnackBar.show(
                context,
                message: "Waiting for contributor to authorize payment...",
              );
            } else if (charge.status == 'pending') {
              AppSnackBar.show(
                context,
                message: "Waiting for contributor to authorize payment...",
              );
            } else if (charge.status == 'failed') {
              _stopPaymentVerification(); // Stop verification timer
              AppSnackBar.show(
                context,
                message: "Payment failed. Please try again.",
              );
            }
          }
        },
        child: BlocBuilder<MomoPaymentBloc, MomoPaymentState>(
          builder: (context, state) {
            if (state is MomoPaymentLoading) {
              return Center(child: CircularProgressIndicator());
            } else if (state is MomoPaymentSuccess) {
              return builderContent(context, state);
            }

            return Center(child: Text('Payment failed'));
          },
        ),
      ),
    );
  }

  builderContent(BuildContext context, MomoPaymentState state) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (state is MomoPaymentSuccess) {
      final charge = state.charge;

      switch (charge.status) {
        case 'success':
          return Center(child: Text('Payment Successful! ✅'));

        case 'pay_offline':
          return Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingL,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AppCard(
                    child: CircularProgressIndicator(
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingM),
                  Text(
                    charge.displayText ??
                        'Please complete authorization process on your mobile phone',
                    style: AppTextStyles.titleMediumLg,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.spacingM),
                  Text(
                    "Please don't close this page.",
                    style: AppTextStyles.titleMediumS,
                  ),
                ],
              ),
            ),
          );

        case 'send_otp' || 'pending':
          return Padding(
            padding: const EdgeInsets.all(AppSpacing.spacingM),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  charge.displayText ??
                      'Please complete authorization process on your mobile phone',
                  style: AppTextStyles.titleMediumS,
                ),
                const SizedBox(height: AppSpacing.spacingXs),
                AppTextInput(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  label: 'Enter voucher code',
                ),
                const SizedBox(height: AppSpacing.spacingXs),
                AppButton(
                  onPressed: () {
                    _submitVoucher(charge.reference!);
                  },
                  text: "Submit Voucher",
                ),
              ],
            ),
          );

        case 'failed':
        default:
          return Center(
            child: Text('Payment failed ❌', style: AppTextStyles.titleMedium),
          );
      }
    }
    return Container();
  }
}
