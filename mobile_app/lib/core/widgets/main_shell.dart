import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_actions.dart';

/// App shell for the signed-in tabs: Home, Jars, Activity,
/// Insights, Profile.
///
/// A floating navy bar sits under the content. The active tab expands into a
/// lime pill with its label; the others show only their icon.
class MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({super.key, required this.navigationShell});

  /// Bottom padding for a tab's scroll view so its last item clears the
  /// floating bar (the shell adds the bar's height to the bottom inset).
  static double scrollBottom(BuildContext context) =>
      MediaQuery.paddingOf(context).bottom + 24;

  static const _tabs = [
    _TabSpec('Home', Icons.home_outlined, Icons.home_rounded),
    _TabSpec('Jars', Icons.savings_outlined, Icons.savings_rounded),
    _TabSpec('Activity', Icons.receipt_long_outlined, Icons.receipt_long),
    _TabSpec('Insights', Icons.insights_outlined, Icons.insights_rounded),
    _TabSpec('Profile', Icons.person_outline_rounded, Icons.person_rounded),
  ];

  /// Jars, Activity and Insights open only once onboarding is complete.
  static const _lockedUntilOnboarded = {1, 2, 3};

  void _onTap(BuildContext context, int index, bool locked) {
    HapticUtils.light();
    if (locked && _lockedUntilOnboarded.contains(index)) {
      AppSnackBar.showInfo(
        context,
        message:
            'Finish setting up your account to open ${_tabs[index].label}.',
      );
      navigationShell.goBranch(0);
      return;
    }
    // Tapping the current tab again returns it to its first screen.
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    JarActions.watchOnboarding(context);
    // Null while jars load: only lock once we know setup isn't done.
    final locked = JarActions.onboardingComplete(context) == false;
    if (locked &&
        _lockedUntilOnboarded.contains(navigationShell.currentIndex)) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => navigationShell.goBranch(0),
      );
    }
    // extendBody: tab content scrolls under the capsule, so the bar floats.
    // Tabs pad their lists with [MainShell.scrollBottom].
    return Scaffold(
      extendBody: true,
      backgroundColor: AppColors.cream,
      body: navigationShell,
      bottomNavigationBar: SafeArea(
        top: false,
        minimum: const EdgeInsets.only(bottom: 8),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 6, 14, 6),
          child: Container(
            height: 64,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              color: AppColors.inkFill,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                for (var i = 0; i < _tabs.length; i++)
                  _TabButton(
                    spec: _tabs[i],
                    selected: i == navigationShell.currentIndex,
                    locked: locked && _lockedUntilOnboarded.contains(i),
                    onTap: () => _onTap(context, i, locked),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TabSpec {
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  const _TabSpec(this.label, this.icon, this.selectedIcon);
}

class _TabButton extends StatelessWidget {
  final _TabSpec spec;
  final bool selected;
  final bool locked;
  final VoidCallback onTap;

  const _TabButton({
    required this.spec,
    required this.selected,
    this.locked = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: spec.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          height: 48,
          // Five tabs must fit a 375pt phone: icon-only tabs stay narrow.
          padding: EdgeInsets.symmetric(horizontal: selected ? 14 : 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.lime : Colors.transparent,
            borderRadius: BorderRadius.circular(17),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                locked
                    ? Icons.lock_outline_rounded
                    : selected
                    ? spec.selectedIcon
                    : spec.icon,
                size: 22,
                color:
                    selected
                        ? AppColors.onLime
                        : AppColors.onInkFill.withValues(alpha: 0.6),
              ),
              if (selected) ...[
                const SizedBox(width: 6),
                Text(
                  spec.label,
                  style: TextStyle(
                    fontFamily: 'Supreme',
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                    color: AppColors.onLime,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
