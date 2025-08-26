import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/icon_button.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/features/media/logic/bloc/media_bloc.dart';
import 'package:konto/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/route.dart';

/// A reusable popup menu widget for jar actions
class JarMoreMenu extends StatelessWidget {
  /// The jar ID for actions that require it
  final String? jarId;

  /// Additional custom menu items
  final List<PopupMenuEntry<String>>? additionalMenuItems;

  /// Callback for handling custom menu actions
  final Function(String)? onCustomAction;

  const JarMoreMenu({
    super.key,
    this.jarId,
    this.additionalMenuItems,
    this.onCustomAction,
  });

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return MultiBlocListener(
      listeners: [
        BlocListener<MediaBloc, MediaState>(
          listener: (context, state) {
            if (state is MediaLoaded) {
              final jarImageId = state.media.id;
              context.read<UpdateJarBloc>().add(
                UpdateJarRequested(
                  jarId: jarId!,
                  updates: {'imageId': jarImageId},
                ),
              );
            } else if (state is MediaError) {
              AppSnackBar.showError(context, message: state.errorMessage);
            }
          },
        ),
      ],
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is JarSummaryLoaded) {
            final jarData = state.jarData;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                PopupMenuButton<String>(
                  color:
                      isDark
                          ? Theme.of(context).colorScheme.primary
                          : Colors.white,
                  onSelected: (String value) {
                    _handleMenuSelection(context, value);
                  },
                  itemBuilder:
                      (BuildContext context) => <PopupMenuEntry<String>>[
                        PopupMenuItem<String>(
                          value: 'name',
                          child: ListTile(
                            leading: Icon(Icons.wallet),
                            title: Text('Change name'),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                        PopupMenuItem<String>(
                          value: 'image',
                          child: ListTile(
                            leading: Icon(Icons.photo),
                            title: Text(
                              jarData.image != null
                                  ? 'Change jar image'
                                  : 'Set jar image',
                            ),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                        // Add additional menu items if provided
                        if (additionalMenuItems != null)
                          ...additionalMenuItems!,
                      ],
                  child: BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, authState) {
                      final isCreator =
                          authState is AuthAuthenticated &&
                          jarData.creator.id == authState.user.id;
                      return isCreator
                          ? CircleAvatar(
                            radius: 27,
                            foregroundColor:
                                isDark ? Colors.white : Colors.black,
                            backgroundColor:
                                isDark
                                    ? Theme.of(context).colorScheme.primary
                                    : Colors.white,
                            child: Icon(Icons.more_horiz),
                          )
                          : AppIconButton(
                            onPressed: null,
                            icon: Icons.more_horiz,
                          );
                    },
                  ),
                ),
                const SizedBox(height: AppSpacing.spacingXs),
                Text(localizations.more, style: TextStyles.titleMedium),
              ],
            );
          }
          return Container();
        },
      ),
    );
  }

  void _handleMenuSelection(BuildContext context, String value) {
    switch (value) {
      case 'name':
        Navigator.pushNamed(context, AppRoutes.jarNameEdit);
        break;
      case 'image':
        // Navigate to jar info/edit
        ImageUploaderBottomSheet.show(context);
        break;
    }
  }
}
