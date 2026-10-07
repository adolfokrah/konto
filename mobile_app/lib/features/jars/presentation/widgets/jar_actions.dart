import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_list_model.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/route.dart';

/// Collect, request and transfer for a jar, with the verification gates in
/// front of them. Shared by Home and the jar screen.
class JarActions {
  JarActions._();

  /// Request and Transfer icons, shared so Home and the jar screen match.
  static const IconData requestIcon = Icons.south_west_rounded;
  static const IconData transferIcon = Icons.north_east_rounded;

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

  /// Whether the signed-in user still has to verify (KYC for individuals,
  /// KYB for organizations) before creating a jar. Matches the Home
  /// get-started order: verify your ID, then create your first jar.
  static bool needsVerification(BuildContext context) {
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) return false;
    final user = authState.user;
    return user.isOrganization
        ? user.kybStatus != 'approved'
        : user.kycStatus != 'verified';
  }

  /// Whether that verification has been submitted and is being reviewed.
  static bool verificationInReview(BuildContext context) {
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) return false;
    final user = authState.user;
    return user.isOrganization
        ? (user.kybStatus == 'in_review' || user.kybStatus == 'pending')
        : user.kycStatus == 'in_review';
  }

  /// Whether the user has no payout account yet. Only true once the accounts
  /// have loaded (Home preloads them), so an unknown state never blocks.
  static bool needsPayoutAccount(BuildContext context) {
    final WithdrawalAccountsState wa;
    try {
      wa = context.read<WithdrawalAccountsBloc>().state;
    } catch (_) {
      return false; // not provided (e.g. widget tests): don't block
    }
    return wa.status == WithdrawalAccountsStatus.loaded && wa.accounts.isEmpty;
  }

  /// Rebuild [context] when anything [needsSetup] reads changes.
  static void watchSetup(BuildContext context) {
    context.watch<AuthBloc>();
    try {
      context.watch<WithdrawalAccountsBloc>();
    } catch (_) {}
  }

  /// Anything left before the user can create a jar: verify, then add a
  /// payout account (Home's get-started order).
  static bool needsSetup(BuildContext context) =>
      needsVerification(context) || needsPayoutAccount(context);

  static void openPayoutAccounts(BuildContext context) =>
      context.push(AppRoutes.withdrawalAccounts);

  static void openVerification(BuildContext context) {
    final authState = context.read<AuthBloc>().state;
    final isOrg =
        authState is AuthAuthenticated && authState.user.isOrganization;
    context.push(isOrg ? AppRoutes.businessKyb : AppRoutes.kycView);
  }

  /// Every "Create jar" / "New jar" entry point goes through here so a new
  /// user verifies first instead of starting a jar they can't collect into.
  static void createJar(BuildContext context) {
    if (needsVerification(context)) {
      AppSnackBar.show(
        context,
        message:
            verificationInReview(context)
                ? 'Your verification is being reviewed. You can create a jar once it\'s approved.'
                : 'Verify your ID first. Then you can create your first jar.',
        type: SnackBarType.info,
      );
      openVerification(context);
      return;
    }
    if (needsPayoutAccount(context)) {
      AppSnackBar.show(
        context,
        message:
            'Add a payout account first, so the money you collect has somewhere to go.',
        type: SnackBarType.info,
      );
      openPayoutAccounts(context);
      return;
    }
    context.push(AppRoutes.jarCreate);
  }

  /// Thumbnail URL for a jar in the jars list, or null when it has none.
  static String? imageUrl(JarListItem jar) {
    final url = jar.image?.url;
    if (url == null || url.isEmpty) return null;
    return ImageUtils.constructImageUrl(url);
  }

  /// "Which jar?" sheet. Returns the picked jar, or null when dismissed.
  ///
  /// [asAction]: rows lead straight into an action (Collect, Request,
  /// Transfer), so they show a chevron and nothing is pre-selected — one tap
  /// picks the jar. Otherwise rows show radios with [selectedId] ticked.
  static Future<JarListItem?> pickJar(
    BuildContext context, {
    required String title,
    required List<JarListItem> jars,
    String? selectedId,
    bool asAction = false,
  }) async {
    final authState = context.read<AuthBloc>().state;
    final userId = authState is AuthAuthenticated ? authState.user.id : null;

    Widget row(JarListItem jar, bool selected, VoidCallback onTap) {
      return DsRow(
        leading: JarThumb(imageUrl: imageUrl(jar), size: 40),
        title: jar.name,
        subtitle: [
          jar.creator.id == userId ? 'Owner' : 'Collector',
          if (jar.isSealed) 'Sealed',
          if (jar.isFrozen) 'Frozen',
          if (jar.isClosed) 'Broken',
        ].join(' · '),
        trailing: asAction ? null : DsRadio(selected: selected),
        chevron: asAction,
        onTap: onTap,
      );
    }

    JarListItem? choice;
    await GenericPicker.showPickerDialog<JarListItem>(
      context,
      title: title,
      selectedValue:
          asAction
              ? ''
              : selectedId != null && jars.any((j) => j.id == selectedId)
              ? selectedId
              : jars.first.id,
      items: jars,
      showSearch: jars.length > 6,
      searchHint: 'Search jars',
      searchFilter: (j) => j.name,
      isItemSelected: (j, sel) => j.id == sel,
      onItemSelected: (j) => choice = j,
      itemBuilder: row,
      recentItemBuilder: row,
      searchResultBuilder: row,
    );
    return choice;
  }
}

/// Empty state used where a "Create jar" button would be while setup isn't
/// done: points to verification, then to adding a payout account.
class JarSetupCard extends StatelessWidget {
  const JarSetupCard({super.key});

  @override
  Widget build(BuildContext context) {
    JarActions.watchSetup(context);
    final authState = context.read<AuthBloc>().state;
    if (!JarActions.needsVerification(context) &&
        JarActions.needsPayoutAccount(context)) {
      return DsCard(
        child: DsEmptyState(
          icon: Icons.account_balance_wallet_outlined,
          tone: DsTone.lime,
          title: 'Add a payout account',
          message:
              'Add the MoMo wallet or bank account your money goes to. Then you can create your first jar.',
          actionLabel: 'Add payout account',
          onAction: () => JarActions.openPayoutAccounts(context),
        ),
      );
    }
    final isOrg =
        authState is AuthAuthenticated && authState.user.isOrganization;
    if (JarActions.verificationInReview(context)) {
      return DsCard(
        child: DsEmptyState(
          icon: Icons.hourglass_top_rounded,
          tone: DsTone.pending,
          title:
              isOrg
                  ? 'Your business is being reviewed'
                  : 'Your ID is being checked',
          message:
              'We\'ll let you know when it\'s done. Then you can create your first jar.',
        ),
      );
    }
    return DsCard(
      child: DsEmptyState(
        icon: Icons.verified_user_outlined,
        tone: DsTone.lime,
        title: isOrg ? 'Verify your business first' : 'Verify your ID first',
        message:
            isOrg
                ? 'Jars collect money, so we check your business before you create one.'
                : 'Jars collect money, so we check your ID before you create one. It takes about 3 minutes.',
        actionLabel: isOrg ? 'Verify business' : 'Verify ID',
        onAction: () => JarActions.openVerification(context),
      ),
    );
  }
}
