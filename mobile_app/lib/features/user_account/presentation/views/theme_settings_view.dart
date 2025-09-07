import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/app_images.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/core/enums/app_theme.dart' as theme_enum;

class ThemeSettingsView extends StatelessWidget {
  const ThemeSettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        return BlocBuilder<UserAccountBloc, UserAccountState>(
          builder: (context, userAccountState) {
            theme_enum.AppTheme? selectedTheme;

            if (userAccountState is UserAccountSuccess) {
              selectedTheme = userAccountState.updatedUser.appSettings.theme;
            } else if (authState is AuthAuthenticated) {
              selectedTheme = authState.user.appSettings.theme;
            }
            if (selectedTheme != null) {
              final translation = AppLocalizations.of(context)!;
              final isUpdating = userAccountState is UserAccountLoading;
              return Scaffold(
                appBar: AppBar(title: Text(translation.themeSettingsTitle)),
                body: Padding(
                  padding: const EdgeInsets.all(AppSpacing.spacingS),
                  child: Stack(
                    children: [
                      SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AppCard(
                              variant: CardVariant.secondary,
                              child: Padding(
                                padding: const EdgeInsets.all(
                                  AppSpacing.spacingM,
                                ),
                                child: _ThemeOptionsRow(
                                  selected: selectedTheme,
                                  onSelect: (theme_enum.AppTheme value) {
                                    context.read<UserAccountBloc>().add(
                                      UpdatePersonalDetails(appTheme: value),
                                    );
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isUpdating)
                        Positioned.fill(
                          child: Container(
                            color: Colors.black.withAlpha(102),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const CircularProgressIndicator(),
                                  const SizedBox(height: 16),
                                  Text(
                                    translation.updatingThemeSettings,
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

class _ThemeOptionsRow extends StatelessWidget {
  final theme_enum.AppTheme selected;
  final ValueChanged<theme_enum.AppTheme> onSelect;

  const _ThemeOptionsRow({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _ThemeOption(
          label: AppLocalizations.of(context)!.light,
          asset: AppImages.lightMode,
          isSelected: selected == theme_enum.AppTheme.light,
          onTap: () => onSelect(theme_enum.AppTheme.light),
        ),
        const SizedBox(width: AppSpacing.spacingS),
        _ThemeOption(
          label: AppLocalizations.of(context)!.dark,
          asset: AppImages.darkMode,
          isSelected: selected == theme_enum.AppTheme.dark,
          onTap: () => onSelect(theme_enum.AppTheme.dark),
        ),
        const SizedBox(width: AppSpacing.spacingS),
        _ThemeOption(
          label: AppLocalizations.of(context)!.system,
          asset: AppImages.systemMode,
          isSelected: selected == theme_enum.AppTheme.system,
          onTap: () => onSelect(theme_enum.AppTheme.system),
        ),
      ],
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final String label;
  final String asset;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeOption({
    required this.label,
    required this.asset,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(22);
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                borderRadius: borderRadius,
                border:
                    isSelected
                        ? Border.all(
                          color: Theme.of(context).colorScheme.onSurface,
                          width: 2,
                        )
                        : null,
              ),
              child: Image.asset(asset, fit: BoxFit.cover),
            ),
            const SizedBox(height: AppSpacing.spacingS),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingM,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color:
                    isSelected
                        ? Theme.of(context).colorScheme.onSurface
                        : Colors.transparent,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color:
                      isSelected
                          ? Theme.of(context).colorScheme.surface
                          : Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
