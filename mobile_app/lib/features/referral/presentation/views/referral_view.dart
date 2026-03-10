import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:share_plus/share_plus.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';

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

class _ReferralContent extends StatelessWidget {
  final User? user;
  const _ReferralContent({required this.user});

  void _copyCode(BuildContext context, String code) {
    Clipboard.setData(ClipboardData(text: code));
    AppSnackBar.show(
      context,
      message: 'Referral code copied!',
      type: SnackBarType.success,
    );
  }

  void _shareCode(String code, String name) {
    final text =
        'Join me on Hogapay — the easiest way to save together! '
        'Use my referral code $code when you sign up. '
        'Download the app: https://hogapay.com';
    Share.share(text, subject: '$name invited you to Hogapay');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final code = user?.referralCode ?? '—';
    final name = user?.firstName ?? 'You';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Referral'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingM),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.spacingL),

            // ── Hero card ─────────────────────────────────────────────────
            _CodeCard(code: code, isDark: isDark, onCopy: () => _copyCode(context, code)),

            const SizedBox(height: AppSpacing.spacingL),

            // ── Share button ──────────────────────────────────────────────
            _ShareButton(onTap: () => _shareCode(code, name)),

            const SizedBox(height: AppSpacing.spacingL),

            // ── How it works ──────────────────────────────────────────────
            Text('How it works', style: AppTextStyles.titleBoldLg),
            const SizedBox(height: AppSpacing.spacingS),
            _StepTile(
              number: '1',
              title: 'Share your code',
              subtitle: 'Send your unique referral code to a friend.',
              isDark: isDark,
            ),
            const SizedBox(height: AppSpacing.spacingXs),
            _StepTile(
              number: '2',
              title: 'Friend signs up',
              subtitle: 'They enter your code during registration.',
              isDark: isDark,
            ),
            const SizedBox(height: AppSpacing.spacingXs),
            _StepTile(
              number: '3',
              title: 'You both earn',
              subtitle: 'Rewards are added automatically once they\'re active.',
              isDark: isDark,
            ),

            const SizedBox(height: AppSpacing.spacingL),

            // ── Benefits ─────────────────────────────────────────────────
            Text('Your benefits', style: AppTextStyles.titleBoldLg),
            const SizedBox(height: AppSpacing.spacingS),
            _BenefitCard(
              icon: Icons.savings_outlined,
              title: 'GHS 5 welcome bonus',
              subtitle:
                  'Earn GHS 5 when your friend\'s jar receives its very first contribution.',
              isDark: isDark,
            ),
            const SizedBox(height: AppSpacing.spacingXs),
            _BenefitCard(
              icon: Icons.percent_rounded,
              title: '20% fee share — forever',
              subtitle:
                  'Earn 20% of Hogapay\'s cut every time your friend withdraws from a jar.',
              isDark: isDark,
            ),

            const SizedBox(height: AppSpacing.spacingL),
          ],
        ),
      ),
    );
  }
}

// ── Code card ──────────────────────────────────────────────────────────────────

class _CodeCard extends StatelessWidget {
  final String code;
  final bool isDark;
  final VoidCallback onCopy;

  const _CodeCard({
    required this.code,
    required this.isDark,
    required this.onCopy,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.spacingM,
        vertical: AppSpacing.spacingL,
      ),
      decoration: BoxDecoration(
        color: isDark
            ? Theme.of(context).colorScheme.primary
            : const Color(0xFFFDF7EC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.black.withValues(alpha: 0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your referral code',
            style: AppTextStyles.titleMediumS.copyWith(
              color: isDark ? Colors.white60 : Colors.black45,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  code,
                  style: AppTextStyles.titleBoldLg.copyWith(
                    fontFamily: 'Courier',
                    fontSize: 36,
                    letterSpacing: 8,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ),
              GestureDetector(
                onTap: onCopy,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.1)
                        : Colors.black.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.copy_rounded,
                    size: 20,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Share this code with friends so they can use it at sign-up.',
            style: AppTextStyles.titleRegularXs.copyWith(
              color: isDark ? Colors.white54 : Colors.black45,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Share button ───────────────────────────────────────────────────────────────

class _ShareButton extends StatelessWidget {
  final VoidCallback onTap;
  const _ShareButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 55,
      child: FilledButton.icon(
        onPressed: onTap,
        icon: const Icon(Icons.share_rounded, size: 18),
        label: const Text('Share your code'),
        style: FilledButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(100),
          ),
        ),
      ),
    );
  }
}

// ── Step tile ──────────────────────────────────────────────────────────────────

class _StepTile extends StatelessWidget {
  final String number;
  final String title;
  final String subtitle;
  final bool isDark;

  const _StepTile({
    required this.number,
    required this.title,
    required this.subtitle,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.spacingS),
      decoration: BoxDecoration(
        color: isDark
            ? Theme.of(context).colorScheme.primary
            : const Color(0xFFFDF7EC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : Colors.black.withValues(alpha: 0.05),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Text(
              number,
              style: AppTextStyles.titleMediumS.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.spacingS),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTextStyles.titleMediumS.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: AppTextStyles.titleRegularXs.copyWith(
                    color: isDark ? Colors.white60 : Colors.black54,
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

// ── Benefit card ───────────────────────────────────────────────────────────────

class _BenefitCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isDark;

  const _BenefitCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.spacingS),
      decoration: BoxDecoration(
        color: isDark
            ? Theme.of(context).colorScheme.primary
            : const Color(0xFFFDF7EC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : Colors.black.withValues(alpha: 0.05),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 22),
          ),
          const SizedBox(width: AppSpacing.spacingS),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTextStyles.titleMediumS.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: AppTextStyles.titleRegularXs.copyWith(
                    color: isDark ? Colors.white60 : Colors.black54,
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
