import 'package:Hoga/core/widgets/custom_cupertino_switch.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_links.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/core/widgets/icon_button.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/user_account/presentation/widgets/confirmation_bottom_sheet.dart';
import 'package:Hoga/features/user_account/presentation/widgets/delete_account_reasons_bottom_sheet.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/core/utils/url_launcher_utils.dart';
import 'package:go_router/go_router.dart';

/// User account view - profile screen with settings and account management
class UserAccountView extends StatelessWidget {
  const UserAccountView({super.key});

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(localizations.account), centerTitle: true),
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
            User? currentUser;

            // Show loading indicator during logout
            if (state is AuthLoading) {
              return Center(
                child: CircularProgressIndicator(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              );
            }

            // Get current user from auth state or service registry
            if (state is AuthAuthenticated) {
              currentUser = state.user;
              return _buildAccountView(context, currentUser);
            }
            return Container(); // Placeholder for unauthenticated users
          },
        ),
      ),
    );
  }

  Widget _buildAccountView(BuildContext context, User? user) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              children: [
                _buildUserProfile(context, user),
                const SizedBox(height: AppSpacing.spacingXs),
                _buildAccountSections(context, user),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Build user profile section with avatar and name
  Widget _buildUserProfile(BuildContext context, User? user) {
    return Column(
      children: [
        // User avatar
        GestureDetector(
          onTap: () {
            ImageUploaderBottomSheet.show(
              context,
              uploadContext: MediaUploadContext.userPhoto,
            );
          },
          child: BlocBuilder<UserAccountBloc, UserAccountState>(
            builder: (context, uaState) {
              final effectiveUser =
                  uaState is UserAccountSuccess ? uaState.updatedUser : user;
              return Stack(
                children: [
                  ContributorAvatar(
                    contributorName: effectiveUser?.fullName ?? '',
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    radius: 50,
                    avatarUrl: effectiveUser?.photo?.thumbnailURL,
                  ),
                  Positioned(
                    bottom: -4,
                    right: -4,
                    child: AppIconButton(
                      onPressed: () {
                        ImageUploaderBottomSheet.show(
                          context,
                          uploadContext: MediaUploadContext.userPhoto,
                        );
                      },
                      icon: Icons.camera_alt,
                      size: const Size(24, 24),
                    ),
                  ),
                ],
              );
            },
          ),
        ),

        const SizedBox(height: 10),

        // User name
        Text(user?.fullName ?? '', style: TextStyles.titleBoldLg),

        const SizedBox(height: 1),

        // User email
        Text(user?.email ?? '', style: TextStyles.titleRegularSm),
      ],
    );
  }

  /// Build main account sections
  Widget _buildAccountSections(BuildContext context, User? user) {
    final localizations = AppLocalizations.of(context)!;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingXs),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Main account sections
          _buildSectionCard([
            _buildMenuItem(
              context: context,
              title: localizations.personalDetails,
              onTap: () {
                // Navigate to personal details
                context.push(AppRoutes.personalDetails);
              },
            ),
            _buildMenuItem(
              context: context,
              title: localizations.withdrawalAccount,
              onTap: () {
                // Navigate to withdrawal account
                context.push(AppRoutes.withdrawalAccount);
              },
            ),
            _buildMenuItem(
              context: context,
              title: localizations.changePhoneNumber,
              onTap: () {
                // Navigate to change phone number
                context.push(AppRoutes.changePhoneNumber);
              },
            ),
          ]),

          const SizedBox(height: AppSpacing.spacingXs),

          // Security section
          // _buildSectionTitle(localizations.security),
          // const SizedBox(height: AppSpacing.spacingXs),

          // _buildSectionCard([
          //   _buildMenuItem(
          //     context: context,
          //     title: localizations.accountPin,
          //     onTap: () {
          //       // Navigate to transaction PIN
          //       _showComingSoon(context);
          //     },
          //   ),
          //   _buildToggleMenuItem(
          //     title: localizations.enableDisableBiometric,
          //     value: user?.appSettings.biometricAuthEnabled ?? true,
          //     onChanged: (value) {
          //       // Handle biometric toggle
          //       _showComingSoon(context);
          //     },
          //   ),
          // ]),
          const SizedBox(height: AppSpacing.spacingXs),

          // App Settings section
          _buildSectionTitle(localizations.appSettings),

          const SizedBox(height: AppSpacing.spacingXs),

          _buildSectionCard([
            _buildMenuItem(
              context: context,
              title: localizations.language,
              onTap: () {
                // _showComingSoon(context);
                context.push(AppRoutes.languageSettings);
              },
            ),
            // _buildMenuItem(
            //   context: context,
            //   title: localizations.notifications,
            //   onTap: () {
            //     // _showComingSoon(context);
            //     AppSnackBar.show(context, message: localizations.comingSoon);
            //   },
            // ),
          ]),

          const SizedBox(height: AppSpacing.spacingXs),

          // About section
          _buildSectionTitle(localizations.about),

          const SizedBox(height: AppSpacing.spacingXs),

          _buildSectionCard([
            _buildExternalMenuItem(
              title: localizations.aboutKonto,
              onTap: () => UrlLauncherUtils.launch(AppLinks.about),
            ),
            _buildExternalMenuItem(
              title: localizations.privacyPolicy,
              onTap: () => UrlLauncherUtils.launch(AppLinks.privacy),
            ),
            _buildExternalMenuItem(
              title: localizations.termsOfServices,
              onTap: () => UrlLauncherUtils.launch(AppLinks.terms),
            ),
            _buildExternalMenuItem(
              title: localizations.contactUs,
              onTap: () => UrlLauncherUtils.launch(AppLinks.contact),
            ),
            _buildExternalMenuItem(
              title: localizations.appRating,
              onTap: () => UrlLauncherUtils.launch(AppLinks.appStore),
            ),
          ]),

          const SizedBox(height: AppSpacing.spacingXs),

          // Logout section
          _buildSectionCard([
            _buildMenuItem(
              context: context,
              title: localizations.logout,
              onTap: () {
                ConfirmationBottomSheet.show(
                  context,
                  title: localizations.doYouWantToLogout,
                  description: localizations.logoutDescription,
                  confirmButtonText: localizations.continueText,
                  onConfirm: () {
                    // Trigger the SignOutRequested event in AuthBloc
                    context.read<AuthBloc>().add(SignOutRequested());
                  },
                  isDangerous: true,
                );
              },
            ),
          ]),

          const SizedBox(height: AppSpacing.spacingXs),

          // Close account section
          _buildSectionCard([
            _buildMenuItem(
              context: context,
              title: localizations.closeAccount,
              titleColor: AppColors.errorRed,
              onTap: () {
                ConfirmationBottomSheet.show(
                  context,
                  title: localizations.doYouWantToCloseAccount,
                  description: localizations.closeAccountDescription,
                  confirmButtonText: localizations.continueText,
                  onConfirm: () {
                    DeleteAccountReasonsBottomSheet.show(context);
                  },
                  isDangerous: true,
                );
              },
            ),
          ]),
        ],
      ),
    );
  }

  /// Build section title
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingS),
      child: Text(title, style: TextStyles.titleMedium),
    );
  }

  /// Build section card container
  Widget _buildSectionCard(List<Widget> children) {
    return AppCard(
      variant: CardVariant.secondary,
      padding: EdgeInsets.all(0),
      margin: EdgeInsets.symmetric(horizontal: AppSpacing.spacingS),
      child: Column(children: children),
    );
  }

  /// Build regular menu item
  Widget _buildMenuItem({
    required BuildContext context,
    required String title,
    required VoidCallback onTap,
    Color? titleColor,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.radiusM),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.spacingM),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: TextStyles.titleMediumS.copyWith(
                color:
                    titleColor ?? Theme.of(context).textTheme.bodyLarge?.color,
              ),
            ),
            const Icon(Icons.chevron_right, size: 20),
          ],
        ),
      ),
    );
  }

  /// Build external link menu item
  Widget _buildExternalMenuItem({
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.radiusM),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.spacingM),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: TextStyles.titleMediumS),
            const Icon(Icons.open_in_new, size: 20),
          ],
        ),
      ),
    );
  }
}
