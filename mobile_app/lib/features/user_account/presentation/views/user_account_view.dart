import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/main_shell.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_links.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:Hoga/features/user_account/presentation/widgets/confirmation_bottom_sheet.dart';
import 'package:Hoga/features/user_account/presentation/widgets/delete_account_reasons_bottom_sheet.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/core/utils/url_launcher_utils.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:Hoga/core/config/app_config.dart';

/// Profile tab: user card, referral card, grouped settings, log out / close.
class UserAccountView extends StatelessWidget {
  const UserAccountView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: MultiBlocListener(
        listeners: [
          BlocListener<AuthBloc, AuthState>(
            listener: (context, state) {
              if (state is AuthInitial) {
                // Navigate to login screen when user is logged out
                context.go(AppRoutes.onboarding);
              }
            },
          ),
          BlocListener<MediaBloc, MediaState>(
            listener: (context, state) {
              if (state is MediaLoaded &&
                  state.context == MediaUploadContext.userPhoto) {
                final media = state.media;
                // Dispatch update to attach new photo to user
                context.read<UserAccountBloc>().add(
                  UpdatePersonalDetails(photoId: media.id),
                );
              }
            },
          ),
        ],
        child: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            // Show loading indicator during logout
            if (state is AuthLoading) {
              return const SafeArea(bottom: false, child: _ProfileSkeleton());
            }
            if (state is AuthAuthenticated) {
              return _buildAccountView(context, state.user);
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildAccountView(BuildContext context, User user) {
    final l10n = AppLocalizations.of(context)!;
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: EdgeInsets.fromLTRB(
          16,
          12,
          16,
          MainShell.scrollBottom(context),
        ),
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(4, 4, 4, 14),
            child: Text('Profile', style: AccText.bigTitle),
          ),
          _UserCard(user: user),
          const SizedBox(height: 12),
          _ReferralCard(onTap: () => context.push(AppRoutes.referral)),
          const SizedBox(height: 12),
          ..._buildGroups(context, user, l10n),
          const SizedBox(height: 12),
          DsListCard(
            children: [
              DsRow(
                title: 'Log out',
                onTap: () => _confirmLogout(context, l10n),
              ),
              DsRow(
                title: 'Close account',
                titleColor: AppColors.negative,
                onTap: () => DeleteAccountReasonsBottomSheet.show(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _VersionLabel(),
        ],
      ),
    );
  }

  List<Widget> _buildGroups(
    BuildContext context,
    User user,
    AppLocalizations l10n,
  ) {
    final payoutRow =
        BlocBuilder<WithdrawalAccountsBloc, WithdrawalAccountsState>(
          builder: (context, waState) {
            final loaded = waState.status == WithdrawalAccountsStatus.loaded;
            return DsRow(
              leading: const AccRowIcon(Icons.account_balance_wallet_outlined),
              title: 'Payout accounts',
              trailing:
                  loaded && waState.accounts.isNotEmpty
                      ? DsTag('${waState.accounts.length}')
                      : null,
              chevron: true,
              // Navigate to the withdrawal accounts manager (multi-account)
              onTap: () => context.push(AppRoutes.withdrawalAccounts),
            );
          },
        );

    final personalRow = DsRow(
      leading: const AccRowIcon(Icons.person_outline_rounded),
      title: l10n.personalDetails,
      chevron: true,
      onTap: () => context.push(AppRoutes.personalDetails),
    );

    final isOrg = user.isOrganization;
    final kybApproved = user.kybStatus == 'approved';

    final phoneRow = DsRow(
      leading: const AccRowIcon(Icons.phone_iphone_rounded),
      title: 'Phone number',
      value: isOrg ? null : _maskPhone(user.phoneNumber),
      chevron: true,
      onTap: () => context.push(AppRoutes.changePhoneNumber),
    );

    final languageRow = BlocBuilder<UserAccountBloc, UserAccountState>(
      builder: (context, uaState) {
        final language =
            uaState is UserAccountSuccess
                ? uaState.updatedUser.appSettings.language
                : user.appSettings.language;
        return DsRow(
          leading: const AccRowIcon(Icons.language_rounded),
          title: l10n.language,
          value: language.displayName,
          chevron: true,
          onTap: () => context.push(AppRoutes.languageSettings),
        );
      },
    );

    final appGroup = [
      const SizedBox(height: 12),
      const DsGroupLabel('App'),
      const SizedBox(height: 8),
      DsListCard(
        children: [
          languageRow,
          DsRow(
            leading: const AccRowIcon(Icons.help_outline_rounded),
            title: 'Help & contact',
            chevron: true,
            onTap: () => _showHelp(context, l10n),
          ),
          DsRow(
            leading: const AccRowIcon(Icons.description_outlined),
            title: 'Legal',
            chevron: true,
            onTap: () => _showLegal(context, l10n),
          ),
        ],
      ),
    ];

    if (isOrg) {
      // Organizations get an organization block instead of "Upgrade".
      return [
        const DsGroupLabel('Organization'),
        const SizedBox(height: 8),
        DsListCard(
          children: [
            if (kybApproved)
              DsRow(
                leading: const AccRowIcon(Icons.public_rounded),
                title: 'Share organization page',
                chevron: true,
                onTap: () {
                  final url =
                      '${AppConfig.contributionPage}/organizations/${user.id}';
                  final box = context.findRenderObject() as RenderBox?;
                  Share.share(
                    'Support our campaigns on Hoga: $url',
                    sharePositionOrigin:
                        box == null
                            ? null
                            : box.localToGlobal(Offset.zero) & box.size,
                  );
                },
              ),
            DsRow(
              leading: const AccRowIcon(Icons.description_outlined),
              title: 'Business verification',
              trailing: _kybTag(user.kybStatus),
              chevron: !kybApproved,
              onTap:
                  kybApproved
                      ? null
                      : () => context.push(AppRoutes.businessKyb),
            ),
            payoutRow,
          ],
        ),
        const SizedBox(height: 12),
        const DsGroupLabel('Account'),
        const SizedBox(height: 8),
        DsListCard(children: [personalRow, phoneRow]),
        ...appGroup,
      ];
    }

    return [
      const DsGroupLabel('Account'),
      const SizedBox(height: 8),
      DsListCard(
        children: [
          personalRow,
          payoutRow,
          // Individuals become organizations by completing business verification.
          DsRow(
            leading: const AccRowIcon(Icons.apartment_rounded),
            title: 'Upgrade to organization',
            chevron: true,
            onTap: () => context.push(AppRoutes.businessKyb),
          ),
        ],
      ),
      const SizedBox(height: 12),
      const DsGroupLabel('Security'),
      const SizedBox(height: 8),
      DsListCard(children: [phoneRow]),
      ...appGroup,
    ];
  }

  /// Help & contact: support centre, contact form and store rating.
  void _showHelp(BuildContext context, AppLocalizations l10n) {
    _showLinksSheet(context, 'Help & contact', [
      (Icons.help_outline_rounded, 'Help centre', AppLinks.support),
      (Icons.mail_outline_rounded, l10n.contactUs, AppLinks.contact),
      (Icons.star_outline_rounded, 'Rate Hogapay', AppLinks.appStore),
    ]);
  }

  /// Legal: about, privacy policy and terms (external pages).
  void _showLegal(BuildContext context, AppLocalizations l10n) {
    _showLinksSheet(context, 'Legal', [
      (Icons.info_outline_rounded, l10n.aboutKonto, AppLinks.about),
      (Icons.shield_outlined, l10n.privacyPolicy, AppLinks.privacy),
      (Icons.description_outlined, l10n.termsOfServices, AppLinks.terms),
    ]);
  }

  void _showLinksSheet(
    BuildContext context,
    String title,
    List<(IconData, String, String)> links,
  ) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder:
          (sheetContext) => AccSheet(
            children: [
              AccSheetHeader(title),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(20),
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    for (var i = 0; i < links.length; i++) ...[
                      if (i > 0)
                        const Divider(height: 1, color: AppColors.line),
                      _externalRow(
                        links[i].$1,
                        links[i].$2,
                        links[i].$3,
                        background: AppColors.surfaceWhite,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
    );
  }

  Widget _externalRow(
    IconData icon,
    String title,
    String url, {
    Color? background,
  }) {
    return DsRow(
      leading: AccRowIcon(icon, background: background),
      title: title,
      trailing: const Icon(
        Icons.open_in_new_rounded,
        size: 17,
        color: AppColors.faint,
      ),
      onTap: () => UrlLauncherUtils.launch(url),
    );
  }

  Widget? _kybTag(String status) {
    switch (status) {
      case 'approved':
        return const DsTag('Approved', tone: DsTone.positive);
      case 'pending':
      case 'in_review':
      case 'submitted':
      case 'under-review':
        return const DsTag('In review', tone: DsTone.pending);
      case 'rejected':
        return const DsTag('Rejected', tone: DsTone.negative);
      default:
        return null;
    }
  }

  static String _maskPhone(String phone) {
    final p = phone.replaceAll(' ', '');
    if (p.length < 7) return p;
    return '${p.substring(0, 3)} ••• ${p.substring(p.length - 4)}';
  }

  void _confirmLogout(BuildContext context, AppLocalizations l10n) {
    ConfirmationBottomSheet.show(
      context,
      icon: Icons.logout_rounded,
      title: 'Log out of Hogapay?',
      description:
          'Your jars keep collecting. Log back in with your phone number.',
      confirmButtonText: 'Log out',
      cancelButtonText: l10n.cancel,
      onConfirm: () {
        // Trigger the SignOutRequested event in AuthBloc
        context.read<AuthBloc>().add(SignOutRequested());
      },
    );
  }
}

/// Avatar, name, @username and verification / account-type tags.
class _UserCard extends StatelessWidget {
  final User user;
  const _UserCard({required this.user});

  void _changePhoto(BuildContext context) {
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.userPhoto,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<UserAccountBloc, UserAccountState>(
      builder: (context, uaState) {
        final u = uaState is UserAccountSuccess ? uaState.updatedUser : user;
        final idTag = switch (u.kycStatus) {
          'verified' => const DsTag('ID verified', tone: DsTone.positive),
          'in_review' => const DsTag('ID in review', tone: DsTone.pending),
          _ => const DsTag('ID not verified', tone: DsTone.neutral),
        };
        // Organizations verify with KYB, individuals with KYC.
        final orgTag =
            !u.isOrganization
                ? null
                : switch (u.kybStatus) {
                  'approved' => const DsTag(
                    'Business verified',
                    tone: DsTone.positive,
                  ),
                  'pending' || 'in_review' || 'submitted' || 'under-review' =>
                    const DsTag('Business in review', tone: DsTone.pending),
                  _ => const DsTag('Business not verified'),
                };
        final showOrgTile = u.isOrganization && u.photo?.thumbnailURL == null;
        return DsCard(
          onTap: () => context.push(AppRoutes.personalDetails),
          child: Row(
            children: [
              GestureDetector(
                onTap: () => _changePhoto(context),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    if (showOrgTile)
                      const DsIconTile(
                        Icons.apartment_rounded,
                        tone: DsTone.dark,
                        size: 56,
                      )
                    else
                      ContributorAvatar(
                        contributorName: u.fullName,
                        backgroundColor: AppColors.limeSoft,
                        radius: 28,
                        avatarUrl: u.photo?.thumbnailURL,
                        showStatusOverlay: false,
                      ),
                    Positioned(
                      right: -3,
                      bottom: -3,
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: AppColors.navy,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.surfaceWhite,
                            width: 2,
                          ),
                        ),
                        child: const Icon(
                          Icons.camera_alt_rounded,
                          size: 11,
                          color: AppColors.lime,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      u.fullName,
                      style: AccText.h2,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (u.username.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text('@${u.username}', style: DsText.caption),
                    ] else if (u.email.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(u.email, style: DsText.caption),
                    ],
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: [
                        orgTag ?? idTag,
                        DsTag(u.isOrganization ? 'Organization' : 'Personal'),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                size: 20,
                color: AppColors.faint,
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Navy "Invite friends, earn GHS 5" card leading to the referral screen.
class _ReferralCard extends StatelessWidget {
  final VoidCallback onTap;
  const _ReferralCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return DsCard(
      color: AppColors.navy,
      padding: const EdgeInsets.all(14),
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.card_giftcard_rounded,
              size: 20,
              color: AppColors.lime,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Invite friends, earn GHS 5',
                  style: AccText.h3.copyWith(
                    fontSize: 14,
                    color: AppColors.surfaceWhite,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Plus 20% of our fees on their jars',
                  style: TextStyle(
                    fontFamily: 'Supreme',
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.75),
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right_rounded,
            size: 20,
            color: AppColors.surfaceWhite,
          ),
        ],
      ),
    );
  }
}

class _VersionLabel extends StatelessWidget {
  const _VersionLabel();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PackageInfo>(
      future: PackageInfo.fromPlatform(),
      builder: (context, snap) {
        final v = snap.data;
        if (v == null) return const SizedBox(height: 16);
        return Text(
          'Hogapay ${v.version}',
          textAlign: TextAlign.center,
          style: DsText.caption,
        );
      },
    );
  }
}

/// Profile while the account loads: title, user card, referral card and
/// grouped rows.
class _ProfileSkeleton extends StatelessWidget {
  const _ProfileSkeleton();

  @override
  Widget build(BuildContext context) => const DsSkeletonPage(
    padding: EdgeInsets.fromLTRB(16, 12, 16, 28),
    children: [
      Padding(
        padding: EdgeInsets.fromLTRB(4, 4, 4, 14),
        child: Align(
          alignment: Alignment.centerLeft,
          child: DsSkeletonHeader(width: 110),
        ),
      ),
      DsSkeletonCard(
        child: Row(
          children: [
            DsSkeletonCircle(size: 56),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DsSkeletonLine(width: 150, height: 16),
                  SizedBox(height: 8),
                  DsSkeletonLine(width: 110, height: 11),
                ],
              ),
            ),
          ],
        ),
      ),
      SizedBox(height: 12),
      DsSkeletonCard(height: 72),
      SizedBox(height: 20),
      DsSkeletonLabel(),
      DsSkeletonListCard(rows: 3, trailing: false),
      SizedBox(height: 20),
      DsSkeletonLabel(width: 90),
      DsSkeletonListCard(rows: 2, trailing: false),
    ],
  );
}
