import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:share_plus/share_plus.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/services/rating_service.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/referral/data/referral_api_provider.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/payout_account_widgets.dart';
import 'package:Hoga/route.dart';

class ReferralView extends StatelessWidget {
  const ReferralView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final user = state is AuthAuthenticated ? state.user : null;
        return _ReferralContent(user: user);
      },
    );
  }
}

class _ReferralContent extends StatefulWidget {
  final User? user;
  const _ReferralContent({required this.user});

  @override
  State<_ReferralContent> createState() => _ReferralContentState();
}

class _ReferralContentState extends State<_ReferralContent> {
  late Future<Map<String, dynamic>> _bonusesFuture;
  bool _initiating = false;

  @override
  void initState() {
    super.initState();
    _bonusesFuture = getIt<ReferralApiProvider>().fetchMyBonuses();
    // Needed by the withdraw pre-flight below, which checks the saved accounts.
    final waBloc = context.read<WithdrawalAccountsBloc>();
    if (waBloc.state.status == WithdrawalAccountsStatus.initial) {
      waBloc.add(LoadWithdrawalAccounts());
    }
  }

  void _reload() {
    setState(() {
      _bonusesFuture = getIt<ReferralApiProvider>().fetchMyBonuses();
    });
  }

  void _copyCode(String code) {
    Clipboard.setData(ClipboardData(text: code));
    AppSnackBar.show(
      context,
      message: 'Referral code copied!',
      type: SnackBarType.success,
    );
  }

  void _shareCode(BuildContext ctx, String code, String name) {
    final box = ctx.findRenderObject() as RenderBox?;
    final text =
        'Join me on Hogapay — the easiest way to save together! '
        'Use my referral code $code when you sign up. '
        'Download the app: https://hogapay.com';
    Share.share(
      text,
      subject: '$name invited you to Hogapay',
      sharePositionOrigin:
          box == null ? null : box.localToGlobal(Offset.zero) & box.size,
    );
  }

  Future<void> _onWithdrawTap(double balance) async {
    // Pre-flight: check KYC + withdrawal account from AuthBloc
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) return;
    final user = authState.user;

    if (user.kycStatus != 'verified') {
      AppSnackBar.show(
        context,
        message: 'Complete your KYC verification first.',
        type: SnackBarType.error,
      );
      return;
    }

    // Source of truth is the saved withdrawal accounts, not the legacy flat
    // accountNumber/bank fields on the user — nothing writes those any more, so
    // reading them blocked every referral withdrawal.
    final waState = context.read<WithdrawalAccountsBloc>().state;
    if (waState.status == WithdrawalAccountsStatus.loaded &&
        waState.accounts.isEmpty) {
      AppSnackBar.show(
        context,
        message: 'Add a withdrawal account first (Account settings).',
        type: SnackBarType.error,
      );
      context.push(AppRoutes.withdrawalAccounts);
      return;
    }

    // Review sheet: amount and where it goes, before a code is sent.
    final confirmed = await _WithdrawSheet.show(context, balance: balance);
    if (confirmed != true || !mounted) return;

    // Call initiate — sends OTP + returns amount/masked phone
    setState(() => _initiating = true);
    final init = await getIt<ReferralApiProvider>().initiateWithdrawal();
    if (!mounted) return;
    setState(() => _initiating = false);

    if (init['success'] != true) {
      AppSnackBar.show(
        context,
        message: init['message'] ?? 'Could not initiate withdrawal',
        type: SnackBarType.error,
      );
      return;
    }

    // Navigate to shared OTP view with a custom confirm handler
    await context.push(
      AppRoutes.otp,
      extra: {
        'skipInitialOtp': true,
        'onConfirm': (String otp) async {
          final result = await getIt<ReferralApiProvider>().confirmWithdrawal(
            otp,
          );
          if (!mounted) return false;
          if (result['success'] == true) {
            AppSnackBar.show(
              context,
              message: result['message'] ?? 'Withdrawal submitted!',
              type: SnackBarType.success,
            );
            RatingService.instance.maybeRequestReview();
            return true;
          } else {
            AppSnackBar.show(
              context,
              message: result['message'] ?? 'Invalid OTP',
              type: SnackBarType.error,
            );
            return false;
          }
        },
      },
    );

    if (mounted) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final code = widget.user?.referralCode ?? '—';
    final name = widget.user?.firstName ?? 'You';

    return Scaffold(
      appBar: AppBar(title: const Text('Invite & earn')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _bonusesFuture,
        builder: (context, snapshot) {
          final loading = snapshot.connectionState == ConnectionState.waiting;
          final summary =
              snapshot.data?['summary'] as Map<String, dynamic>? ?? {};
          final balance = (summary['balance'] as num?)?.toDouble() ?? 0.0;
          final totalEarned =
              (summary['totalEarned'] as num?)?.toDouble() ?? 0.0;
          final bonuses =
              (snapshot.data?['bonuses'] as List?)
                  ?.whereType<Map<String, dynamic>>()
                  .toList() ??
              const <Map<String, dynamic>>[];

          return RefreshIndicator(
            color: AppColors.navy,
            onRefresh: () async {
              _reload();
              await _bonusesFuture;
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                _BalanceCard(
                  loading: loading,
                  balance: balance,
                  totalEarned: totalEarned,
                  withdrawing: _initiating,
                  onWithdraw:
                      balance > 0 && !_initiating
                          ? () => _onWithdrawTap(balance)
                          : null,
                ),
                const SizedBox(height: 12),
                _CodeCard(
                  code: code,
                  onCopy: () => _copyCode(code),
                  onShare: (ctx) => _shareCode(ctx, code, name),
                ),
                const SizedBox(height: 12),
                if (!loading && bonuses.isEmpty) ...[
                  const DsCard(
                    child: DsEmptyState(
                      icon: Icons.card_giftcard_rounded,
                      tone: DsTone.lime,
                      title: 'No referrals yet',
                      message:
                          "Share your code. When your friend's jar gets its "
                          'first payment, you earn.',
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                const _HowYouEarnCard(),
                if (bonuses.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const DsGroupLabel('Earnings'),
                  const SizedBox(height: 8),
                  DsListCard(
                    children: [for (final b in bonuses) _BonusRow(bonus: b)],
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

// ── Balance ──────────────────────────────────────────────────────────────────

class _BalanceCard extends StatelessWidget {
  final bool loading;
  final double balance;
  final double totalEarned;
  final bool withdrawing;
  final VoidCallback? onWithdraw;

  const _BalanceCard({
    required this.loading,
    required this.balance,
    required this.totalEarned,
    required this.withdrawing,
    required this.onWithdraw,
  });

  @override
  Widget build(BuildContext context) {
    final dim = Colors.white.withValues(alpha: 0.6);
    return DsCard(
      color: AppColors.navy,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Referral balance',
            style: TextStyle(fontFamily: 'Supreme', fontSize: 12, color: dim),
          ),
          const SizedBox(height: 4),
          if (loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.lime,
                ),
              ),
            )
          else
            DsMoney(balance, size: 36, color: AppColors.surfaceWhite),
          const SizedBox(height: 4),
          Text(
            totalEarned > 0
                ? 'GHS ${totalEarned.toStringAsFixed(2)} earned in total'
                : "Earn GHS 5 when a friend's jar gets its first payment",
            style: TextStyle(fontFamily: 'Supreme', fontSize: 12, color: dim),
          ),
          if (!loading && balance > 0) ...[
            const SizedBox(height: 16),
            AppButton.filled(
              text: 'Withdraw',
              backgroundColor: AppColors.lime,
              textColor: AppColors.navy,
              isLoading: withdrawing,
              onPressed: onWithdraw,
            ),
          ],
        ],
      ),
    );
  }
}

// ── Code ─────────────────────────────────────────────────────────────────────

class _CodeCard extends StatelessWidget {
  final String code;
  final VoidCallback onCopy;
  final void Function(BuildContext ctx) onShare;

  const _CodeCard({
    required this.code,
    required this.onCopy,
    required this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    return DsCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your code', style: DsText.caption),
                const SizedBox(height: 2),
                Text(
                  code,
                  style: const TextStyle(
                    fontFamily: 'Chillax',
                    fontWeight: FontWeight.w600,
                    fontSize: 22,
                    letterSpacing: 2,
                    color: AppColors.navy,
                  ),
                ),
              ],
            ),
          ),
          AccRoundButton(icon: Icons.copy_rounded, size: 40, onTap: onCopy),
          const SizedBox(width: 8),
          Builder(
            builder:
                (ctx) => AccRoundButton(
                  icon: Icons.ios_share_rounded,
                  size: 40,
                  background: AppColors.navy,
                  foreground: AppColors.lime,
                  onTap: () => onShare(ctx),
                ),
          ),
        ],
      ),
    );
  }
}

// ── How you earn ─────────────────────────────────────────────────────────────

class _HowYouEarnCard extends StatelessWidget {
  const _HowYouEarnCard();

  static const _steps = [
    'Friend signs up with your code',
    'You both verify your ID',
    "Their jar's first payment earns you GHS 5",
    'Then 20% of our fees each time they withdraw from their first jar',
  ];

  @override
  Widget build(BuildContext context) {
    return DsCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('How you earn', style: AccText.h3),
          const SizedBox(height: 12),
          for (var i = 0; i < _steps.length; i++)
            Padding(
              padding: EdgeInsets.only(bottom: i < _steps.length - 1 ? 12 : 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      color: AppColors.fill,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${i + 1}',
                      style: const TextStyle(
                        fontFamily: 'Supreme',
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.navy,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(_steps[i], style: DsText.small),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ── Earnings rows ────────────────────────────────────────────────────────────

class _BonusRow extends StatelessWidget {
  final Map<String, dynamic> bonus;
  const _BonusRow({required this.bonus});

  static const _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  @override
  Widget build(BuildContext context) {
    final amount = (bonus['amount'] as num?)?.toDouble() ?? 0;
    final isWithdrawal = amount < 0;
    final type = bonus['bonusType'] as String?;
    final status = bonus['status'] as String?;
    final description = (bonus['description'] as String?)?.trim();

    final title =
        isWithdrawal
            ? 'Withdrawal'
            : description?.isNotEmpty == true
            ? description!
            : type == 'first_contribution'
            ? 'First payment bonus'
            : '20% fee share';

    final created = DateTime.tryParse(bonus['createdAt'] as String? ?? '');
    final date =
        created == null
            ? null
            : '${created.toLocal().day} ${_months[created.toLocal().month - 1]}';
    final subtitle = [
      if (!isWithdrawal && description?.isNotEmpty == true)
        type == 'first_contribution' ? 'First payment bonus' : '20% of fees',
      if (date != null) date,
    ].join(' · ');

    return DsRow(
      leading: DsIconTile(
        isWithdrawal ? Icons.send_rounded : Icons.card_giftcard_rounded,
        tone: isWithdrawal ? DsTone.neutral : DsTone.lime,
      ),
      title: title,
      subtitle: subtitle,
      trailing: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '${isWithdrawal ? '−' : '+'}${amount.abs().toStringAsFixed(2)}',
            style: TextStyle(
              fontFamily: 'Chillax',
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color: isWithdrawal ? AppColors.navy : AppColors.positive,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          if (status == 'pending' || status == 'failed') ...[
            const SizedBox(height: 2),
            DsTag(
              status == 'failed' ? 'Failed' : 'Pending',
              tone: status == 'failed' ? DsTone.negative : DsTone.pending,
            ),
          ],
        ],
      ),
    );
  }
}

// ── Withdraw review sheet ────────────────────────────────────────────────────

class _WithdrawSheet extends StatelessWidget {
  final double balance;
  const _WithdrawSheet({required this.balance});

  static Future<bool?> show(BuildContext context, {required double balance}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _WithdrawSheet(balance: balance),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<WithdrawalAccountsBloc, WithdrawalAccountsState>(
      builder: (context, state) {
        WithdrawalAccountModel? destination;
        for (final a in state.accounts) {
          if (a.isDefault) destination = a;
        }
        destination ??= state.accounts.isNotEmpty ? state.accounts.first : null;

        return AccSheet(
          children: [
            const AccSheetHeader('Withdraw earnings'),
            Center(
              child: Column(
                children: [
                  const Text('Referral balance', style: DsText.caption),
                  const SizedBox(height: 4),
                  DsMoney(balance, size: 40),
                ],
              ),
            ),
            if (destination != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(AppRadius.radiusCard),
                ),
                child: Row(
                  children: [
                    PayoutAccountLogo(account: destination, size: 32),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('To', style: DsText.caption),
                          Text(
                            '${payoutAccountTitle(destination)} · ${destination.maskedAccountNumber}',
                            style: AccText.h3.copyWith(fontSize: 14),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    DsLink(
                      'Change',
                      onTap: () {
                        final router = GoRouter.of(context);
                        Navigator.of(context).pop(false);
                        router.push(AppRoutes.withdrawalAccounts);
                      },
                    ),
                  ],
                ),
              ),
            const Text(
              "You'll confirm with a code sent to your phone.",
              style: DsText.caption,
            ),
            AppButton.filled(
              text: 'Withdraw GHS ${balance.toStringAsFixed(2)}',
              onPressed: () => Navigator.of(context).pop(true),
            ),
          ],
        );
      },
    );
  }
}
