import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';

/// App shell for the signed-in tabs: Home, Jars, Activity, Profile.
///
/// A floating navy bar sits under the content. The active tab expands into a
/// lime pill with its label; the others show only their icon.
class MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({super.key, required this.navigationShell});

  static const _tabs = [
    _TabSpec('Home', Icons.home_outlined, Icons.home_rounded),
    _TabSpec('Jars', Icons.savings_outlined, Icons.savings_rounded),
    _TabSpec('Activity', Icons.receipt_long_outlined, Icons.receipt_long),
    _TabSpec('Profile', Icons.person_outline_rounded, Icons.person_rounded),
  ];

  void _onTap(int index) {
    HapticUtils.light();
    // Tapping the current tab again returns it to its first screen.
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
              color: AppColors.navy,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                for (var i = 0; i < _tabs.length; i++)
                  _TabButton(
                    spec: _tabs[i],
                    selected: i == navigationShell.currentIndex,
                    onTap: () => _onTap(i),
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
  final VoidCallback onTap;

  const _TabButton({
    required this.spec,
    required this.selected,
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
          padding: EdgeInsets.symmetric(horizontal: selected ? 16 : 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.lime : Colors.transparent,
            borderRadius: BorderRadius.circular(17),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                selected ? spec.selectedIcon : spec.icon,
                size: 22,
                color:
                    selected
                        ? AppColors.navy
                        : AppColors.cream.withValues(alpha: 0.6),
              ),
              if (selected) ...[
                const SizedBox(width: 8),
                Text(
                  spec.label,
                  style: const TextStyle(
                    fontFamily: 'Supreme',
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                    color: AppColors.navy,
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
