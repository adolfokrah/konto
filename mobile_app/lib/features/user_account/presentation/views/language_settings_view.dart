import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/enums/app_language.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class LanguageSettingsView extends StatelessWidget {
  const LanguageSettingsView({super.key});

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

            if (selectedLanguage != null) {
              final l10n = AppLocalizations.of(context)!;
              final isUpdating = userAccountState is UserAccountLoading;
              return Scaffold(
                appBar: AppBar(title: Text(l10n.language)),
                body: SizedBox.expand(
                  child: Stack(
                    children: [
                      SingleChildScrollView(
                        child: Padding(
                          padding: const EdgeInsets.all(AppSpacing.spacingXs),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              AppCard(
                                variant: CardVariant.secondary,
                                child: _LanguageOptions(
                                  selected: selectedLanguage,
                                  onSelect: (lang) {
                                    context.read<UserAccountBloc>().add(
                                      UpdatePersonalDetails(appLanguage: lang),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(height: 24),
                            ],
                          ),
                        ),
                      ),
                      if (isUpdating)
                        Positioned.fill(
                          child: Container(
                            color: Colors.black.withValues(alpha: 0.4),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const CircularProgressIndicator(),
                                  const SizedBox(height: 16),
                                  Text(
                                    l10n.updatingLanguageSettings,
                                    style: TextStyle(
                                      color:
                                          Theme.of(context).colorScheme.surface,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            }
            return const SizedBox.shrink();
          },
        );
      },
    );
  }
}

class _LanguageOptions extends StatelessWidget {
  final AppLanguage selected;
  final ValueChanged<AppLanguage> onSelect;
  const _LanguageOptions({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final onSurface = Theme.of(context).colorScheme.onSurface;
    return Column(
      children:
          AppLanguage.values
              .map(
                (lang) => RadioListTile<AppLanguage>(
                  value: lang,
                  groupValue: selected,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                  activeColor: onSurface,
                  title: Text(
                    lang.displayName,
                    style: TextStyle(color: onSurface),
                  ),
                  onChanged: (v) {
                    if (v != null) onSelect(v);
                  },
                ),
              )
              .toList(),
    );
  }
}
