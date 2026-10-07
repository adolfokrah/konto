import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/withdrawal_account_picker.dart';
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
/// review the amount, fee and destination, then confirm with a code.
class WithdrawView extends StatefulWidget {
  const WithdrawView({super.key});

  @override
  State<WithdrawView> createState() => _WithdrawViewState();
}

class _WithdrawViewState extends State<WithdrawView> {
  bool _isLoading = false;
  bool _isSendingOtp = false;
  bool _isLoadingSettings = true;

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
        AppSnackBar.show(
          context,
          message: localizations.withdrawSuccess,
          type: SnackBarType.success,
        );
        // Refresh jar summary to reflect updated balance
        context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
        context.pop();
        RatingService.instance.maybeRequestReview();
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
            size: 40,
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

    Widget? toCard;
    if (account != null) {
      final network =
          account.isMobileMoney
              ? DsNetworkLogo.fromProvider(account.provider)
              : null;
      toCard = Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.fill,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            if (network != null)
              DsNetworkLogo(network, size: 40)
            else
              DsIconTile(
                account.isMobileMoney
                    ? Icons.phone_android_rounded
                    : Icons.account_balance_outlined,
                tone: DsTone.info,
              ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('To', style: DsText.caption),
                  Text(
                    '${account.accountHolder} · ${account.maskedAccountNumber}',
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
    }

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
                        ? '${money(clearing)} is still clearing. It\'ll be ready to transfer soon.'
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
        if (toCard != null) ...[const SizedBox(height: 8), toCard],
        const SizedBox(height: 24),
        Text(
          'You\'ll receive',
          style: DsText.caption,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Center(child: DsMoney(total, currency: curCode, size: 40)),
        const SizedBox(height: 24),
        DsListCard(
          children: [
            DsKeyValue(localizations.payoutBalance, money(balance)),
            DsKeyValue(
              '${localizations.transferCharges} · ${_systemSettings.transferFeePercentage % 1 == 0 ? _systemSettings.transferFeePercentage.toStringAsFixed(0) : _systemSettings.transferFeePercentage}%',
              '− ${money(transferCharges)}',
            ),
            if (account != null) ...[
              DsKeyValue(
                'To',
                '${withdrawalAccountLabel(account)} · ${account.maskedAccountNumber}',
              ),
              DsKeyValue('Name', account.accountHolder.toUpperCase()),
            ],
            if (_systemSettings.payoutProcessingMessage != null &&
                _systemSettings.payoutProcessingMessage!.isNotEmpty)
              DsKeyValue('Arrives', _systemSettings.payoutProcessingMessage!),
            DsKeyValue(localizations.total, money(total), strong: true),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          'The full available balance is transferred. Payments still clearing aren\'t included.',
          style: DsText.caption,
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
              ? const JarLoading()
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
                    label:
                        nothingReady
                            ? localizations.withdraw
                            : '${localizations.withdraw} ${money(balance)}',
                    loading: busy,
                    onTap: (busy || nothingReady) ? null : _handleWithdraw,
                  ),
                ],
              ),
    );
  }
}
