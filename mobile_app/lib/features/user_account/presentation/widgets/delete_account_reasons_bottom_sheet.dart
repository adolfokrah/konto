import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Close account page (mockup "Close account"): "Why are you leaving?"
/// reason list, a red note, then a red Close account button.
///
/// Kept under its old name so callers don't change; it is now pushed as a
/// full page rather than shown as a sheet.
class DeleteAccountReasonsBottomSheet extends StatefulWidget {
  const DeleteAccountReasonsBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute<void>(
        builder: (_) => const DeleteAccountReasonsBottomSheet(),
      ),
    );
  }

  @override
  State<DeleteAccountReasonsBottomSheet> createState() =>
      _DeleteAccountReasonsBottomSheetState();
}

class _DeleteAccountReasonsBottomSheetState
    extends State<DeleteAccountReasonsBottomSheet> {
  String? selectedReason;
  final TextEditingController _otherReasonController = TextEditingController();
  bool get isOtherSelected => selectedReason == 'Other';

  final List<String> _reasons = [
    "I don't need it anymore",
    'Fees are too high',
    'Problems with payments',
    'Security concerns',
    'Other',
  ];

  @override
  void dispose() {
    _otherReasonController.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      selectedReason != null &&
      (!isOtherSelected || _otherReasonController.text.trim().isNotEmpty);

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocListener<UserAccountBloc, UserAccountState>(
      listener: (context, state) {
        if (state is UserAccountError) {
          AppSnackBar.showError(context, message: state.message);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.cream,
        appBar: const JarTopBar(title: 'Close account'),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 4),
              child: Text('Why are you leaving?', style: AccText.h1),
            ),
            const SizedBox(height: 12),
            DsListCard(
              children: [
                for (final reason in _reasons)
                  DsRow(
                    title: reason == 'Other' ? 'Something else' : reason,
                    trailing: AccRadio(selectedReason == reason),
                    onTap: () {
                      setState(() {
                        selectedReason = reason;
                        if (!isOtherSelected) {
                          _otherReasonController.clear();
                        }
                      });
                    },
                  ),
              ],
            ),
            if (isOtherSelected) ...[
              const SizedBox(height: 12),
              AccField(
                label: 'Tell us more',
                hint: 'Please specify your reason...',
                controller: _otherReasonController,
                maxLines: 3,
                onChanged: (_) => setState(() {}),
              ),
            ],
            const SizedBox(height: 12),
            DsNote(
              tone: DsTone.negative,
              icon: Icons.error_outline_rounded,
              text: localizations.closeAccountDescription,
            ),
          ],
        ),
        bottomNavigationBar: JarFooter(
          children: [
            BlocBuilder<UserAccountBloc, UserAccountState>(
              builder: (context, state) {
                return AppButton.filled(
                  text: 'Close account',
                  backgroundColor: AppColors.negative,
                  textColor: AppColors.surfaceWhite,
                  isLoading: state is UserAccountLoading,
                  onPressed:
                      _canSubmit
                          ? () {
                            context.read<UserAccountBloc>().add(
                              DeleteAccount(
                                reason:
                                    isOtherSelected
                                        ? _otherReasonController.text.trim()
                                        : selectedReason!,
                              ),
                            );
                          }
                          : null,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
