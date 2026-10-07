import 'dart:async';

import 'package:flutter/material.dart';
import 'package:Hoga/core/services/rating_service.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/contribution/data/models/momo_charge_model.dart';
import 'package:Hoga/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

class AwaitMomoPaymentView extends StatefulWidget {
  final String provider;

  const AwaitMomoPaymentView({super.key, this.provider = 'mtn'});

  @override
  State<AwaitMomoPaymentView> createState() => _AwaitMomoPaymentViewState();
}

class _AwaitMomoPaymentViewState extends State<AwaitMomoPaymentView> {
  late final TextEditingController _otpController;
  Timer? _verificationTimer;

  bool get _isMtn => widget.provider == 'mtn';

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

  void _submitVoucher(String reference) {
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

  void _listener(BuildContext context, MomoPaymentState state) {
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
        context.read<JarSummaryReloadBloc>().add(ReloadJarSummaryRequested());
        RatingService.instance.maybeRequestReview();
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
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<MomoPaymentBloc, MomoPaymentState>(
      listener: _listener,
      builder: (context, state) {
        final isVoucher =
            state is MomoPaymentSuccess && state.charge.status == 'send_otp';
        return Scaffold(
          backgroundColor: isVoucher ? AppColors.cream : AppColors.surfaceWhite,
          appBar: CollectTopBar(
            showBack: false,
            background: isVoucher ? AppColors.cream : AppColors.surfaceWhite,
            title: isVoucher ? 'Voucher code' : null,
          ),
          body: SafeArea(top: false, child: _buildBody(context, state)),
          bottomNavigationBar: _buildFooter(context, state),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, MomoPaymentState state) {
    if (state is MomoPaymentLoading) {
      return _waiting(context, null, current: 0);
    }
    if (state is MomoPaymentSuccess) {
      final charge = state.charge;
      switch (charge.status) {
        case 'success':
          return _received(context);
        case 'pay_offline':
        case 'ongoing':
          return _waiting(context, charge, current: 1);
        case 'send_otp':
          return _voucher(context, charge);
        case 'failed':
        default:
          return _failed(context);
      }
    }
    return _failed(context);
  }

  Widget? _buildFooter(BuildContext context, MomoPaymentState state) {
    final localizations = AppLocalizations.of(context)!;
    if (state is MomoPaymentSuccess) {
      switch (state.charge.status) {
        case 'success':
          return CollectFooter(
            children: [
              AppButton.filled(
                text: localizations.done,
                onPressed: () => context.go(AppRoutes.jarDetail),
              ),
            ],
          );
        case 'pay_offline':
        case 'ongoing':
          return null;
        case 'send_otp':
          return CollectFooter(
            children: [
              AppButton.filled(
                text: localizations.momoSubmitVoucher,
                onPressed: () => _submitVoucher(state.charge.reference!),
              ),
            ],
          );
      }
    } else if (state is MomoPaymentLoading) {
      return null;
    }
    // Failed (or the request could not be made)
    return CollectFooter(
      children: [
        AppButton.filled(
          text: localizations.tryAgain,
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(AppRoutes.jarDetail);
            }
          },
        ),
        CollectButton(
          label: 'Back to jar',
          style: CollectButtonStyle.ghost,
          onTap: () => context.go(AppRoutes.jarDetail),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------- states

  Widget _waiting(
    BuildContext context,
    MomoChargeModel? charge, {
    required int current,
  }) {
    final localizations = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      children: [
        const Align(
          alignment: Alignment.centerLeft,
          child: DsIconTile(
            Icons.hourglass_top_rounded,
            tone: DsTone.pending,
            size: 72,
          ),
        ),
        const SizedBox(height: 16),
        Text(localizations.momoCompleteAuthorization, style: DsText.title),
        const SizedBox(height: 6),
        Text(
          charge?.displayText ?? localizations.momoDontClosePage,
          style: DsText.body,
        ),
        if (charge?.displayText != null) ...[
          const SizedBox(height: 4),
          Text(localizations.momoDontClosePage, style: DsText.small),
        ],
        const SizedBox(height: 24),
        DsSteps(
          current: current,
          steps: [
            ('Request sent', null),
            (
              'Approve on phone',
              _isMtn
                  ? 'No prompt? Dial *170# → My Approvals'
                  : 'No prompt? Dial *110# → Approvals',
            ),
            ('Added to jar', null),
          ],
        ),
        const SizedBox(height: 24),
        if (current > 0) _buildApprovalInstructions(),
      ],
    );
  }

  Widget _buildApprovalInstructions() {
    final localizations = AppLocalizations.of(context)!;
    return DsCard(
      color: AppColors.fill,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            localizations.momoContributorNoPrompt,
            style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(localizations.momoAskContributorAuthorize, style: DsText.small),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DsNetworkLogo(
                _isMtn ? DsNetwork.mtn : DsNetwork.telecel,
                size: 32,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: _isMtn ? 'MTN MoMo: ' : 'Telecel Cash: ',
                        style: DsText.small.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.navy,
                        ),
                      ),
                      TextSpan(
                        text:
                            _isMtn
                                ? 'Dial *170# → My Wallet → My Approvals → Select the pending request → Enter PIN'
                                : 'Dial *110# → Telecel Cash → Approvals → Select the request → Enter PIN',
                        style: DsText.small,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _voucher(BuildContext context, MomoChargeModel charge) {
    final localizations = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        Text(
          charge.displayText ?? localizations.momoCompleteAuthorization,
          style: DsText.body,
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceWhite,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.navy, width: 2),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: TextField(
            controller: _otpController,
            autofocus: true,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            cursorColor: AppColors.navy,
            style: const TextStyle(
              fontFamily: 'Chillax',
              fontWeight: FontWeight.w600,
              fontSize: 28,
              letterSpacing: 6,
              color: AppColors.navy,
            ),
            decoration: InputDecoration(
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              filled: false,
              hintText: localizations.momoEnterVoucherCode,
              hintStyle: DsText.body.copyWith(
                color: AppColors.faint,
                letterSpacing: 0,
              ),
            ),
            onSubmitted: (_) => _submitVoucher(charge.reference!),
          ),
        ),
      ],
    );
  }

  Widget _received(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const DsIconTile(
              Icons.check_rounded,
              tone: DsTone.positive,
              size: 72,
            ),
            const SizedBox(height: 14),
            Text(
              'Payment received',
              style: DsText.title,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              'It has been added to the jar.',
              style: DsText.body,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _failed(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const DsIconTile(
              Icons.close_rounded,
              tone: DsTone.negative,
              size: 72,
            ),
            const SizedBox(height: 14),
            Text(
              "Payment didn't go through",
              style: DsText.title,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              localizations.momoPaymentFailedTryAgain,
              style: DsText.body,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
