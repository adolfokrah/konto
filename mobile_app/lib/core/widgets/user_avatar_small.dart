import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/route.dart';

class UserAvatarSmall extends StatelessWidget {
  final double radius;
  final Color? backgroundColor;

  const UserAvatarSmall({super.key, this.radius = 20, this.backgroundColor});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        String contributorName = '';
        String? avatarUrl;
        if (authState is AuthAuthenticated) {
          contributorName = authState.user.fullName;
          avatarUrl = authState.user.photo?.thumbnailURL;
        }

        return BlocBuilder<UserAccountBloc, UserAccountState>(
          builder: (context, uaState) {
            if (uaState is UserAccountSuccess) {
              contributorName = uaState.updatedUser.fullName;
              avatarUrl = uaState.updatedUser.photo?.thumbnailURL;
            }

            return GestureDetector(
              onTap: () {
                Navigator.of(context).pushNamed(AppRoutes.userAccountView);
              },
              child: ContributorAvatar(
                contributorName: contributorName,
                backgroundColor:
                    backgroundColor ??
                    (isDark
                        ? Theme.of(context).colorScheme.primary
                        : Colors.white),
                radius: radius,
                avatarUrl: avatarUrl,
              ),
            );
          },
        );
      },
    );
  }
}
