import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

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
        // Check current state before making verification request
        final currentState = context.read<MomoPaymentBloc>().state;
        if (currentState is MomoPaymentSuccess) {
          final status = currentState.charge.status;
          // Stop timer if payment is in final state (success or failed)
          if (status == 'success' || status == 'failed') {
            timer.cancel();
            _verificationTimer = null;
            return;
          }
        }
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
      final localizations = AppLocalizations.of(context)!;
      AppSnackBar.show(
        context,
        message: localizations.momoValidVoucherCodeRequired,
      );
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
            final localizations = AppLocalizations.of(context)!;

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
              context.go(AppRoutes.jarDetail);
            } else if (charge.status == 'pay_offline') {
              // Start periodic verification for offline payment (only once)
              if (_verificationTimer == null && charge.reference != null) {
                _startPaymentVerification(charge.reference!);
                AppSnackBar.show(
                  context,
                  message: localizations.momoWaitingAuthorization,
                );
              }
            } else if (charge.status == 'send_otp') {
              AppSnackBar.show(
                context,
                message: localizations.momoWaitingAuthorization,
              );
            } else if (charge.status == 'failed') {
              _stopPaymentVerification(); // Stop verification timer
              AppSnackBar.show(
                context,
                message: localizations.momoPaymentFailedTryAgain,
              );
            }
          }
        },
        child: BlocBuilder<MomoPaymentBloc, MomoPaymentState>(
          builder: (context, state) {
            final localizations = AppLocalizations.of(context)!;

            if (state is MomoPaymentLoading) {
              return Center(
                child: CircularProgressIndicator(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              );
            } else if (state is MomoPaymentSuccess) {
              return builderContent(context, state);
            }

            return Center(child: Text(localizations.momoPaymentFailed));
          },
        ),
      ),
    );
  }

  builderContent(BuildContext context, MomoPaymentState state) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final localizations = AppLocalizations.of(context)!;

    if (state is MomoPaymentSuccess) {
      final charge = state.charge;

      switch (charge.status) {
        case 'success':
          return Center(child: Text(localizations.momoPaymentSuccessful));

        case 'pay_offline':
        case 'ongoing':
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
                        localizations.momoCompleteAuthorization,
                    style: AppTextStyles.titleMediumLg,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.spacingM),
                  Text(
                    localizations.momoDontClosePage,
                    style: AppTextStyles.titleMediumS,
                  ),
                ],
              ),
            ),
          );

        case 'send_otp':
          return Padding(
            padding: const EdgeInsets.all(AppSpacing.spacingM),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  charge.displayText ?? localizations.momoCompleteAuthorization,
                  style: AppTextStyles.titleMediumS,
                ),
                const SizedBox(height: AppSpacing.spacingXs),
                AppTextInput(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  label: localizations.momoEnterVoucherCode,
                ),
                const SizedBox(height: AppSpacing.spacingXs),
                AppButton(
                  onPressed: () {
                    _submitVoucher(charge.reference!);
                  },
                  text: localizations.momoSubmitVoucher,
                ),
              ],
            ),
          );

        case 'failed':
        default:
          return Center(
            child: Text(
              localizations.momoPaymentFailed,
              style: AppTextStyles.titleMedium,
            ),
          );
      }
    }
    return Container();
  }
}
