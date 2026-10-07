import 'dart:async';

import 'package:flutter/material.dart';
import 'package:Hoga/core/services/rating_service.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/otp_input.dart';
import 'package:Hoga/features/authentication/presentation/widgets/auth_widgets.dart';
import 'package:share_plus/share_plus.dart';
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

  // Who is paying and how much, passed by the payer step (route extra).
  double? _amount;
  double? _contribution;
  String? _currency;
  String? _payerName;
  String? _phone;
  String? _network;
  bool _argsRead = false;

  // The success state can arrive twice (charge, then verify); handle it once.
  bool _completed = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_argsRead) return;
    _argsRead = true;
    Object? extra;
    try {
      extra = GoRouterState.of(context).extra;
    } catch (_) {}
    if (extra is Map) {
      _amount = (extra['amount'] as num?)?.toDouble();
      _contribution = (extra['contribution'] as num?)?.toDouble();
      _currency = extra['currency'] as String?;
      _payerName = extra['name'] as String?;
      _phone = extra['phone'] as String?;
      _network = extra['network'] as String?;
    }
  }

  String? get _firstName {
    final n = _payerName?.trim() ?? '';
    return n.isEmpty ? null : n.split(RegExp(r'\s+')).first;
  }

  String get _networkName => _network ?? (_isMtn ? 'MTN' : 'Telecel');

  String? get _numberLine =>
      (_phone == null || _phone!.isEmpty) ? null : '$_networkName · $_phone';

  String _money(double v) =>
      CurrencyUtils.formatAmount(v, (_currency ?? '').toUpperCase());

  void _close() => context.go(AppRoutes.jarDetail);

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
        if (_completed) return;
        _completed = true;
        if (_verificationTimer == null) {
          context.read<MomoPaymentBloc>().add(
            VerifyPaymentRequested(charge.reference!),
          );
        } else {
          _stopPaymentVerification(); // Stop verification timer
        }
        context.read<JarSummaryReloadBloc>().add(ReloadJarSummaryRequested());
        RatingService.instance.maybeRequestReview();
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
        final status = state is MomoPaymentSuccess ? state.charge.status : null;
        final isVoucher = status == 'send_otp';
        final isWaiting =
            state is MomoPaymentLoading ||
            status == 'pay_offline' ||
            status == 'ongoing';
        final bg = isVoucher ? AppColors.cream : AppColors.surfaceWhite;
        return Scaffold(
          backgroundColor: bg,
          appBar: CollectTopBar(
            background: bg,
            showBack: isVoucher,
            title: isVoucher ? 'Voucher code' : null,
            actions: [
              if (isWaiting)
                CollectBoxButton(
                  icon: Icons.close_rounded,
                  filled: true,
                  onTap: _close,
                ),
            ],
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
          return _received(context, charge);
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
              AppButton.filled(text: localizations.done, onPressed: _close),
              Builder(
                builder:
                    (btnContext) => CollectButton(
                      label: 'Share receipt',
                      style: CollectButtonStyle.ghost,
                      onTap: () => _shareReceipt(btnContext, state.charge),
                    ),
              ),
            ],
          );
        case 'pay_offline':
        case 'ongoing':
          return null;
        case 'send_otp':
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AuthKeypad(
                onDigit: (d) {
                  if (_otpController.text.length >= 6) return;
                  _otpController.text = '${_otpController.text}$d';
                },
                onBackspace: () {
                  final t = _otpController.text;
                  if (t.isNotEmpty) {
                    _otpController.text = t.substring(0, t.length - 1);
                  }
                },
              ),
              CollectFooter(
                background: AppColors.cream,
                children: [
                  AppButton.filled(
                    text: localizations.momoSubmitVoucher,
                    onPressed: () => _submitVoucher(state.charge.reference!),
                  ),
                ],
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
              _close();
            }
          },
        ),
        CollectButton(
          label: 'Change number',
          style: CollectButtonStyle.ghost,
          onTap: () {
            if (context.canPop()) {
              context.pop('change_number');
            } else {
              _close();
            }
          },
        ),
      ],
    );
  }

  void _shareReceipt(BuildContext context, MomoChargeModel charge) {
    final amount = _contribution ?? _amount;
    final lines = [
      'Hogapay receipt',
      if (amount != null) 'Payment received: ${_money(amount)}',
      if (_payerName != null && _payerName!.isNotEmpty) 'From: $_payerName',
      if (charge.reference != null) 'Reference: ${charge.reference}',
    ];
    final box = context.findRenderObject() as RenderBox?;
    Share.share(
      lines.join('\n'),
      sharePositionOrigin:
          box != null ? box.localToGlobal(Offset.zero) & box.size : null,
    );
  }

  // ---------------------------------------------------------------- states

  /// Big state icon, heading and one line, left-aligned as in the mockups.
  Widget _stateHeader({
    required IconData icon,
    required DsTone tone,
    required String title,
    String? body,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        DsIconTile(icon, tone: tone, size: 72),
        const SizedBox(height: 16),
        Text(title, style: DsText.title.copyWith(fontSize: 27)),
        if (body != null) ...[
          const SizedBox(height: 6),
          Text(body, style: DsText.body),
        ],
      ],
    );
  }

  Widget _waiting(
    BuildContext context,
    MomoChargeModel? charge, {
    required int current,
  }) {
    final localizations = AppLocalizations.of(context)!;
    final first = _firstName;
    final detail = [
      if (_amount != null) _money(_amount!),
      if (_phone != null && _phone!.isNotEmpty) '$_networkName $_phone',
    ].join(' · ');
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 30, 20, 24),
      children: [
        _stateHeader(
          icon: Icons.phone_iphone_rounded,
          tone: DsTone.pending,
          title:
              first != null
                  ? 'Waiting for $first to approve'
                  : localizations.momoCompleteAuthorization,
          body:
              detail.isNotEmpty
                  ? detail
                  : (charge?.displayText ?? localizations.momoDontClosePage),
        ),
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
      ],
    );
  }

  Widget _voucher(BuildContext context, MomoChargeModel charge) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        Text.rich(
          TextSpan(
            style: DsText.body,
            children: [
              const TextSpan(
                text:
                    'Telecel Cash and AirtelTigo Money payers can approve with a voucher. Dial ',
              ),
              TextSpan(
                text: '*110#',
                style: DsText.body.copyWith(
                  color: AppColors.navy,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const TextSpan(text: ' → Make payments → Generate voucher.'),
            ],
          ),
        ),
        const SizedBox(height: 14),
        AppOtpInput(
          length: 6,
          controller: _otpController,
          useSystemKeyboard: false,
          onCompleted: (_) {},
        ),
      ],
    );
  }

  Widget _received(BuildContext context, MomoChargeModel charge) {
    final amount = _contribution ?? _amount;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            _stateHeader(
              icon: Icons.check_rounded,
              tone: DsTone.positive,
              title: 'Payment received',
            ),
            if (amount != null) ...[
              const SizedBox(height: 6),
              DsMoney(amount, currency: null, size: 44, signed: true),
            ],
            const SizedBox(height: 22),
            _fillCard([
              if (_payerName != null && _payerName!.isNotEmpty)
                DsKeyValue('From', _payerName!),
              if (charge.reference != null)
                DsKeyValue('Reference', charge.reference!),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _failed(BuildContext context) {
    final first = _firstName;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            _stateHeader(
              icon: Icons.close_rounded,
              tone: DsTone.negative,
              title: "Payment didn't go through",
              body:
                  '${first ?? 'The payer'} declined the prompt or it timed out. Nothing was charged.',
            ),
            const SizedBox(height: 14),
            _fillCard([
              if (_amount != null) DsKeyValue('Amount', _money(_amount!)),
              if (_numberLine != null) DsKeyValue('Number', _numberLine!),
            ]),
          ],
        ),
      ),
    );
  }

  /// Grey key/value card (`card fill`); nothing when there are no rows.
  Widget _fillCard(List<Widget> rows) {
    if (rows.isEmpty) return const SizedBox.shrink();
    return Container(
      decoration: BoxDecoration(
        color: AppColors.fill,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0) const Divider(height: 1, color: AppColors.line),
            rows[i],
          ],
        ],
      ),
    );
  }
}
