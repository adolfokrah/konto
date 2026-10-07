import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/route.dart';

/// Collect, request and transfer for a jar, with the verification gates in
/// front of them. Shared by Home and the jar screen.
class JarActions {
  JarActions._();

  /// Verification gate by account type: individuals need personal KYC;
  /// organizations need business verification (KYB) only. Returns true if
  /// allowed; otherwise shows a message, routes to the right screen, and
  /// returns false.
  static bool requireVerification(BuildContext context) {
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) return false;

    final kyc = authState.user.kycStatus;
    final kyb = authState.user.kybStatus;

    // Organizations: business verification (KYB) only.
    if (authState.user.isOrganization) {
      if (kyb == 'approved') return true;
      final message =
          (kyb == 'in_review' || kyb == 'pending')
              ? 'Your business verification is under review. Please wait for approval.'
              : kyb == 'rejected'
              ? 'Your business verification was rejected. Please review and resubmit.'
              : 'Complete business verification to continue.';
      AppSnackBar.show(context, message: message, type: SnackBarType.info);
      context.push(AppRoutes.businessKyb);
      return false;
    }

    // Individuals: personal KYC only.
    if (kyc != 'verified') {
      final message =
          kyc == 'in_review'
              ? 'Your identity verification (KYC) is under review. Please wait for approval.'
              : 'Complete identity verification (KYC) to continue.';
      AppSnackBar.show(context, message: message, type: SnackBarType.info);
      // in_review users have nothing to do on the KYC screen, but it shows the pending state.
      context.push(AppRoutes.kycView);
      return false;
    }

    return true;
  }

  /// Gate for collecting (record a contribution, request link, QR). The server
  /// checks the jar creator's verification, so the creator is sent to finish
  /// their own verification; a collector is told the organizer isn't verified
  /// yet (nothing for them to do).
  static bool requireCollecting(BuildContext context, JarSummaryModel jarData) {
    if (jarData.isCreator) return requireVerification(context);
    if (jarData.creator.canCollect) return true;
    AppSnackBar.show(
      context,
      message:
          'This jar\'s organizer is still completing verification, so it can\'t collect contributions yet.',
      type: SnackBarType.info,
    );
    return false;
  }

  static void contribute(BuildContext context, JarSummaryModel jarData) {
    if (!requireCollecting(context, jarData)) return;
    context.push(AppRoutes.addContribution);
  }

  static void request(BuildContext context, JarSummaryModel jarData) {
    // Collecting needs the jar's creator to be verified.
    if (!requireCollecting(context, jarData)) return;
    context.push(
      AppRoutes.contributionRequest,
      extra: {'paymentLink': jarData.link, 'jarName': jarData.name},
    );
  }

  /// Navigate to withdraw, checking the payout destination and verification
  /// first.
  static void withdraw(BuildContext context, JarSummaryModel jarData) {
    // Setting up a payout destination needs no KYC or KYB — it moves no money —
    // so this runs before the verification gate. Otherwise an unverified user is
    // sent to KYC and can never reach account setup from here.
    //
    // The jar carries its own linked withdrawal account, but if the user has no
    // withdrawal accounts at all, route them to add one.
    final waState = context.read<WithdrawalAccountsBloc>().state;
    if (waState.status == WithdrawalAccountsStatus.loaded &&
        waState.accounts.isEmpty) {
      AppSnackBar.show(
        context,
        message: 'Add a withdrawal account to receive your payout.',
        type: SnackBarType.info,
      );
      context.push(AppRoutes.withdrawalAccounts);
      return;
    }

    // Payouts are the creator's: they need their own verification for their account type.
    if (!requireVerification(context)) return;

    context.push(
      AppRoutes.withdraw,
      extra: {
        'jarId': jarData.id,
        'payoutBalance': jarData.balanceBreakDown.totalAmountTobeTransferred,
        'currency': jarData.currency,
        'withdrawalAccount': jarData.withdrawalAccount,
      },
    );
  }
}
