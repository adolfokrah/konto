import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/enums/app_language.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class LanguageSettingsView extends StatelessWidget {
  const LanguageSettingsView({super.key});

  static String _flag(AppLanguage lang) => switch (lang) {
    AppLanguage.english => '🇬🇧',
    AppLanguage.french => '🇫🇷',
  };

  static String _nativeName(AppLanguage lang) => switch (lang) {
    AppLanguage.english => 'English',
    AppLanguage.french => 'Français',
  };

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        return BlocBuilder<UserAccountBloc, UserAccountState>(
          builder: (context, userAccountState) {
            AppLanguage? selectedLanguage;

            if (userAccountState is UserAccountSuccess) {
              selectedLanguage =
                  userAccountState.updatedUser.appSettings.language;
            } else if (authState is AuthAuthenticated) {
              selectedLanguage = authState.user.appSettings.language;
            }

            if (selectedLanguage == null) return const SizedBox.shrink();

            final l10n = AppLocalizations.of(context)!;
            final isUpdating = userAccountState is UserAccountLoading;
            return Scaffold(
              backgroundColor: AppColors.cream,
              appBar: JarTopBar(title: l10n.language),
              body: Stack(
                children: [
                  ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    children: [
                      DsListCard(
                        children: [
                          for (final lang in AppLanguage.values)
                            DsRow(
                              leading: Text(
                                _flag(lang),
                                style: const TextStyle(fontSize: 20),
                              ),
                              title: _nativeName(lang),
                              trailing: AccRadio(lang == selectedLanguage),
                              onTap:
                                  isUpdating || lang == selectedLanguage
                                      ? null
                                      : () =>
                                          context.read<UserAccountBloc>().add(
                                            UpdatePersonalDetails(
                                              appLanguage: lang,
                                            ),
                                          ),
                            ),
                        ],
                      ),
                    ],
                  ),
                  if (isUpdating)
                    Positioned.fill(
                      child: ColoredBox(
                        color: AppColors.cream.withValues(alpha: 0.7),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircularProgressIndicator(color: AppColors.navy),
                              const SizedBox(height: 16),
                              Text(
                                l10n.updatingLanguageSettings,
                                style: DsText.rowTitle,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
