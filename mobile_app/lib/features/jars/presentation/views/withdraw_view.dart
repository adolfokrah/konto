import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/payout_account_widgets.dart';
import 'package:dio/dio.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/features/contribution/data/repositories/momo_repository.dart';
import 'package:Hoga/features/settings/data/api_providers/system_settings_api_provider.dart';
import 'package:Hoga/features/settings/data/models/system_settings_model.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/services/rating_service.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/features/verification/presentation/pages/kyc_view.dart';
import 'package:Hoga/features/business_kyb/presentation/pages/business_kyb_view.dart';
import 'package:go_router/go_router.dart';

/// Transfer the jar's full available balance to its payout account:
/// review the amount, fee and destination, confirm with a code, then track it.
class WithdrawView extends StatefulWidget {
  const WithdrawView({super.key});

  @override
  State<WithdrawView> createState() => _WithdrawViewState();
}

class _WithdrawViewState extends State<WithdrawView> {
  bool _isLoading = false;
  bool _isSendingOtp = false;
  bool _isLoadingSettings = true;

  /// Set once the payout request succeeds: the screen switches to tracking.
  DateTime? _sentAt;
  double? _sentAmount;

  // Arguments from previous screen
  String? jarId;
  double? payoutBalance;
  String? currency;
  WithdrawalAccountModel? withdrawalAccount;

  SystemSettingsModel _systemSettings = SystemSettingsModel.defaultSettings;

  @override
  void initState() {
    super.initState();
    _loadSystemSettings();
  }

  Future<void> _loadSystemSettings() async {
    try {
      final apiProvider = SystemSettingsApiProvider(
        dio: getIt<Dio>(),
        userStorageService: getIt<UserStorageService>(),
      );
      final settings = await apiProvider.getSystemSettings();
      if (mounted) {
        setState(() {
          _systemSettings = settings;
          _isLoadingSettings = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingSettings = false;
        });
      }
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    final arguments = GoRouterState.of(context).extra as Map<String, dynamic>?;

    if (arguments != null) {
      jarId = arguments['jarId'] as String?;
      payoutBalance = arguments['payoutBalance'] as double?;
      currency = arguments['currency'] as String?;
      final acct = arguments['withdrawalAccount'];
      if (acct is WithdrawalAccountModel) withdrawalAccount = acct;
    }
  }

  /// Step 1: Send OTP to user's phone
  Future<void> _handleWithdraw() async {
    if (jarId == null || _isSendingOtp) return;

    final authState = context.read<AuthBloc>().state;

    if (authState is! AuthAuthenticated) {
      AppSnackBar.show(
        context,
        message: 'Please login to continue',
        type: SnackBarType.error,
      );
      return;
    }

    final user = authState.user;

    setState(() {
      _isSendingOtp = true;
    });

    try {
      // Send OTP to user's phone
      context.read<VerificationBloc>().add(
        PhoneNumberVerificationRequested(
          phoneNumber: user.phoneNumber,
          email: user.email,
          countryCode: user.countryCode,
        ),
      );

      // Wait for OTP to be sent, then show dialog
      await Future.delayed(const Duration(milliseconds: 500));

      if (!mounted) return;

      setState(() {
        _isSendingOtp = false;
      });

      // Show OTP verification dialog
      _showOtpDialog(user.phoneNumber, user.countryCode);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSendingOtp = false;
      });
      AppSnackBar.show(
        context,
        message: 'Failed to send OTP. Please try again.',
        type: SnackBarType.error,
      );
    }
  }

  /// Step 2: Navigate to OTP verification page
  Future<void> _showOtpDialog(String phoneNumber, String countryCode) async {
    final authState = context.read<AuthBloc>().state;
    final email = authState is AuthAuthenticated ? authState.user.email : '';

    // Navigate to existing OTP view
    // Pass skipInitialOtp flag since we already sent the OTP
    await context.push(
      AppRoutes.otp,
      extra: {
        'phoneNumber': phoneNumber,
        'email': email,
        'countryCode': countryCode,
        'skipInitialOtp': true, // OTP already sent before navigation
      },
    );

    // Check if widget is still mounted before accessing context
    if (!mounted) return;

    // After OTP view is closed, check if verification was successful
    final verificationState = context.read<VerificationBloc>().state;
    if (verificationState is VerificationSuccess) {
      // Process payout after successful verification
      _processPayout();
    }
  }

  /// Step 3: Process payout after OTP verification
  Future<void> _processPayout() async {
    if (jarId == null || _isLoading) return;

    // Dismiss keyboard so it doesn't block the result snackbar on iOS
    FocusManager.instance.primaryFocus?.unfocus();

    final localizations = AppLocalizations.of(context)!;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await getIt<MomoRepository>().requestPayout(jarId: jarId!);

      if (!mounted) return;

      if (result['success'] == true) {
        // Refresh jar summary to reflect updated balance
        context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
        // Show the tracking state; "Done" closes the screen.
        setState(() {
          _sentAmount = _systemSettings.calculateNetPayout(payoutBalance ?? 0);
          _sentAt = DateTime.now();
        });
      } else {
        AppSnackBar.show(
          context,
          message: result['message'] ?? localizations.withdrawFailed,
          type: SnackBarType.error,
        );
      }
    } catch (e) {
      if (!mounted) return;
      AppSnackBar.show(
        context,
        message: localizations.withdrawFailed,
        type: SnackBarType.error,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _finish() {
    context.pop();
    RatingService.instance.maybeRequestReview();
  }

  /// Tracking state after a successful request (mockup "Transfer · status").
  Widget _buildStatus(WithdrawalAccountModel? account, String curCode) {
    final at = _sentAt!;
    final time =
        '${at.hour.toString().padLeft(2, '0')}:${at.minute.toString().padLeft(2, '0')}';
    return Scaffold(
      backgroundColor: AppColors.surfaceWhite,
      appBar: JarTopBar(
        showLeading: false,
        fillButtons: true,
        actions: [
          JarNavButton(icon: Icons.close_rounded, fill: true, onTap: _finish),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: DsIconTile(Icons.send_rounded, tone: DsTone.lime, size: 72),
          ),
          const SizedBox(height: 14),
          const Text('Transfer on its way', style: DsText.title),
          const SizedBox(height: 4),
          DsMoney(_sentAmount ?? 0, currency: null, size: 32),
          if (account != null) ...[
            const SizedBox(height: 4),
            Text(
              'to ${payoutProviderName(account)} ${payoutMaskedNumber(account)}',
              style: DsText.small,
            ),
          ],
          const SizedBox(height: 22),
          DsSteps(
            current: 2,
            steps: [
              ('Requested', time),
              ('Sent by Hogapay', time),
              ('Arriving in your wallet', "We'll notify you"),
            ],
          ),
        ],
      ),
      bottomNavigationBar: JarFooter(
        children: [JarPrimaryButton(label: 'Done', onTap: _finish)],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final balance = payoutBalance ?? 0.0;
    final cur = currency ?? 'GHS';
    final curCode = cur.toUpperCase();
    final double transferCharges = _systemSettings.calculateTransferFee(
      balance,
    );
    final double total = _systemSettings.calculateNetPayout(balance);

    // Verification before a transfer, by account type: KYC for individuals, business
    // verification (KYB) for organizations.
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      if (authState.user.isOrganization) {
        if (authState.user.kybStatus != 'approved') {
          return const BusinessKybView();
        }
      } else if (authState.user.kycStatus != 'verified') {
        return const KycView();
      }
    }

    // The jar's linked withdrawal account is the only source now. The old fallback
    // to the user's flat accountHolder/accountNumber/bank fields is gone — nothing
    // writes those any more, so it always resolved to null.
    final account = withdrawalAccount;
    if (_sentAt != null) return _buildStatus(account, curCode);

    // Jar name, photo and clearing amount come from the loaded jar, when it matches.
    final jarState = context.watch<JarSummaryBloc>().state;
    final jar =
        jarState is JarSummaryLoaded && jarState.jarData.id == jarId
            ? jarState.jarData
            : null;
    final clearing = jar?.balanceBreakDown.upcomingBalance ?? 0;
    final busy = _isLoading || _isSendingOtp;
    final nothingReady = balance <= 0;

    String money(double v) =>
        '$curCode ${DsMoney.group(v)}.${((v.abs() * 100).round() % 100).toString().padLeft(2, '0')}';

    final fromCard = Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.fill,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          JarThumb(
            imageUrl:
                jar?.image?.url != null
                    ? ImageUtils.constructImageUrl(jar!.image!.url!)
                    : null,
            size: 32,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('From', style: DsText.caption),
                Text(
                  '${jar?.name ?? localizations.payoutBalance} · ${DsMoney.group(balance)}.${((balance * 100).round() % 100).toString().padLeft(2, '0')} available',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.rowTitle.copyWith(fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    final List<Widget> content;
    if (nothingReady) {
      content = [
        fromCard,
        const SizedBox(height: 12),
        DsCard(
          child: Column(
            children: [
              DsEmptyState(
                icon: Icons.schedule_rounded,
                tone: DsTone.pending,
                title: 'Nothing to transfer yet',
                message:
                    clearing > 0
                        ? '${money(clearing)} is still clearing from card payments. It\'ll be ready to transfer soon.'
                        : 'Money you collect shows up here once it\'s ready to transfer.',
              ),
              if (clearing > 0)
                JarFillList(
                  children: [
                    DsKeyValue(
                      'Clearing',
                      money(clearing),
                      valueColor: AppColors.pending,
                    ),
                  ],
                ),
            ],
          ),
        ),
      ];
    } else {
      content = [
        fromCard,
        const SizedBox(height: 22),
        const Text(
          'You\'ll receive',
          style: DsText.caption,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Center(child: DsMoney(total, currency: curCode, size: 42)),
        const SizedBox(height: 22),
        DsListCard(
          children: [
            DsKeyValue('Amount', money(balance)),
            DsKeyValue(
              'Fee · ${_systemSettings.transferFeePercentage % 1 == 0 ? _systemSettings.transferFeePercentage.toStringAsFixed(0) : _systemSettings.transferFeePercentage}%',
              '− ${money(transferCharges)}',
            ),
            if (account != null) ...[
              DsKeyValue(
                'To',
                '${payoutProviderName(account)} · ${payoutMaskedNumber(account)}',
              ),
              DsKeyValue('Name', account.accountHolder.toUpperCase()),
            ],
            if (_systemSettings.payoutProcessingMessage != null &&
                _systemSettings.payoutProcessingMessage!.isNotEmpty)
              DsKeyValue('Arrives', _systemSettings.payoutProcessingMessage!),
          ],
        ),
        const SizedBox(height: 10),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            'The full available balance is transferred. Cash and card '
            'payments still clearing aren\'t included.',
            style: DsText.caption,
          ),
        ),
      ];
    }

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: JarTopBar(
        title: localizations.withdraw,
        leadingIcon: Icons.close_rounded,
      ),
      body:
          _isLoadingSettings
              ? const DsSkeletonPage(
                children: [
                  DsSkeletonCard(
                    padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Row(
                      children: [
                        DsSkeletonBox(width: 32, height: 32, radius: 10),
                        SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              DsSkeletonLine(width: 40, height: 10),
                              SizedBox(height: 6),
                              DsSkeletonLine(width: 180, height: 12),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 22),
                  Center(child: DsSkeletonLine(width: 90, height: 11)),
                  SizedBox(height: 10),
                  Center(child: DsSkeletonLine(width: 200, height: 40)),
                  SizedBox(height: 22),
                  DsSkeletonKeyValueCard(rows: 4),
                ],
              )
              : ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                children: content,
              ),
      bottomNavigationBar:
          _isLoadingSettings
              ? null
              : JarFooter(
                children: [
                  JarPrimaryButton(
                    label: nothingReady ? 'Review' : 'Confirm with code',
                    loading: busy,
                    onTap: (busy || nothingReady) ? null : _handleWithdraw,
                  ),
                ],
              ),
    );
  }
}
