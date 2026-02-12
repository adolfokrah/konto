import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class WithdrawView extends StatefulWidget {
  const WithdrawView({super.key});

  @override
  State<WithdrawView> createState() => _WithdrawViewState();
}

class _WithdrawViewState extends State<WithdrawView> {
  bool _isLoading = false;
  bool _isSendingOtp = false;

  // Arguments from previous screen
  String? jarId;
  double? payoutBalance;
  String? currency;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    final arguments =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;

    if (arguments != null) {
      jarId = arguments['jarId'] as String?;
      payoutBalance = arguments['payoutBalance'] as double?;
      currency = arguments['currency'] as String?;
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
    await Navigator.pushNamed(
      context,
      '/otp',
      arguments: {
        'phoneNumber': phoneNumber,
        'email': email,
        'countryCode': countryCode,
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

    final localizations = AppLocalizations.of(context)!;

    setState(() {
      _isLoading = true;
    });

    try {
      final serviceRegistry = ServiceRegistry();
      final result = await serviceRegistry.momoRepository.requestPayout(
        jarId: jarId!,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        AppSnackBar.show(
          context,
          message: localizations.withdrawSuccess,
          type: SnackBarType.success,
        );
        // Refresh jar summary to reflect updated balance
        context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
        Navigator.pop(context);
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
    const double transferCharges = 0.0;
    final double total = balance - transferCharges;

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(
          localizations.withdraw,
          style: TextStyles.titleMediumLg.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.spacingM,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.spacingL),

            // Payout balance row
            _buildBreakdownRow(
              localizations.payoutBalance,
              CurrencyUtils.formatAmount(balance, cur),
              context,
            ),
            const SizedBox(height: AppSpacing.spacingM),

            // Transfer charges row
            _buildBreakdownRow(
              localizations.transferCharges,
              '-${CurrencyUtils.formatAmount(transferCharges, cur)}',
              context,
            ),
            const SizedBox(height: AppSpacing.spacingM),

            const Divider(),
            const SizedBox(height: AppSpacing.spacingM),

            // Total row
            _buildBreakdownRow(
              localizations.total,
              CurrencyUtils.formatAmount(total, cur),
              context,
              isBold: true,
            ),

            const Spacer(),

            // Withdraw button
            AppButton.filled(
              text: localizations.withdraw,
              isLoading: _isLoading || _isSendingOtp,
              onPressed: (_isLoading || _isSendingOtp) ? null : _handleWithdraw,
            ),
            const SizedBox(height: AppSpacing.spacingL),
          ],
        ),
      ),
    );
  }

  Widget _buildBreakdownRow(
    String label,
    String value,
    BuildContext context, {
    bool isBold = false,
  }) {
    final style =
        isBold
            ? TextStyles.titleMediumLg.copyWith(fontWeight: FontWeight.w600)
            : TextStyles.titleMedium;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: style),
        Text(value, style: style),
      ],
    );
  }
}
