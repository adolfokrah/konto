import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_balance_breakdown.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

/// "More" quick-action tile on the jar dashboard. Opens a sheet with the
/// jar's secondary actions (name, photo, settings, balance) and listens for
/// the jar photo upload it starts.
class JarMoreMenu extends StatelessWidget {
  /// The jar ID for actions that require it
  final String? jarId;

  /// Additional custom menu items
  final List<PopupMenuEntry<String>>? additionalMenuItems;

  /// Callback for handling custom menu actions
  final Function(String)? onCustomAction;

  /// When true only the upload listener is kept in the tree (no tile).
  final bool hidden;

  const JarMoreMenu({
    super.key,
    this.jarId,
    this.additionalMenuItems,
    this.onCustomAction,
    this.hidden = false,
  });

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    return MultiBlocListener(
      listeners: [
        BlocListener<MediaBloc, MediaState>(
          listener: (context, state) {
            if (state is MediaLoaded &&
                state.context == MediaUploadContext.jarImageHome) {
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
      child:
          hidden
              ? const SizedBox.shrink()
              : BlocBuilder<AuthBloc, AuthState>(
                builder: (context, authState) {
                  return BlocBuilder<JarSummaryBloc, JarSummaryState>(
                    builder: (context, state) {
                      if (state is! JarSummaryLoaded) {
                        return const SizedBox.shrink();
                      }
                      final jarData = state.jarData;
                      final isCreator =
                          authState is AuthAuthenticated &&
                          jarData.creator.id == authState.user.id;
                      return DsQuickAction(
                        key: const Key('more_menu'),
                        icon: Icons.more_horiz_rounded,
                        label: localizations.more,
                        onTap:
                            isCreator
                                ? () => _openSheet(
                                  context,
                                  canRename: jarData.contributions.isEmpty,
                                  hasImage: jarData.image != null,
                                )
                                : null,
                      );
                    },
                  );
                },
              ),
    );
  }

  Future<void> _openSheet(
    BuildContext context, {
    required bool canRename,
    required bool hasImage,
  }) async {
    final l = AppLocalizations.of(context)!;
    final choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (ctx) => JarSheetFrame(
            title: l.more,
            children: [
              JarFillList(
                children: [
                  // Only allow renaming while the jar has no contributions
                  if (canRename)
                    DsRow(
                      leading: const DsIconTile(Icons.edit_outlined, size: 36),
                      title: l.changeName,
                      chevron: true,
                      onTap: () => Navigator.of(ctx).pop('name'),
                    ),
                  DsRow(
                    leading: const DsIconTile(Icons.image_outlined, size: 36),
                    title: hasImage ? l.changeJarImage : l.setJarImage,
                    chevron: true,
                    onTap: () => Navigator.of(ctx).pop('image'),
                  ),
                  DsRow(
                    leading: const DsIconTile(
                      Icons.account_balance_wallet_outlined,
                      size: 36,
                    ),
                    title: l.balanceBreakdown,
                    chevron: true,
                    onTap: () => Navigator.of(ctx).pop('balance'),
                  ),
                  DsRow(
                    leading: const DsIconTile(
                      Icons.settings_outlined,
                      size: 36,
                    ),
                    title: 'Jar settings',
                    chevron: true,
                    onTap: () => Navigator.of(ctx).pop('settings'),
                  ),
                ],
              ),
            ],
          ),
    );
    if (choice == null || !context.mounted) return;
    _handleMenuSelection(context, choice);
  }

  void _handleMenuSelection(BuildContext context, String value) {
    switch (value) {
      case 'name':
        context.push(AppRoutes.jarNameEdit);
        break;
      case 'image':
        ImageUploaderBottomSheet.show(
          context,
          uploadContext: MediaUploadContext.jarImageHome,
        );
        break;
      case 'balance':
        JarBalanceBreakdown.show(context);
        break;
      case 'settings':
        context.push(AppRoutes.jarInfo);
        break;
      default:
        onCustomAction?.call(value);
    }
  }
}
