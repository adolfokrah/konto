import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// "Why are you leaving?" — reason list, then a red Close account button.
class DeleteAccountReasonsBottomSheet extends StatefulWidget {
  const DeleteAccountReasonsBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      isDismissible: true,
      enableDrag: true,
      builder: (context) => const DeleteAccountReasonsBottomSheet(),
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
    'No longer need the service',
    'Found a better alternative',
    'Privacy concerns',
    'Too expensive',
    'Technical issues',
    'Poor customer support',
    'Account security concerns',
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
      child: AccSheet(
        gap: 12,
        children: [
          AccSheetHeader(localizations.closeAccount),
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 12,
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4),
                    child: Text('Why are you leaving?', style: AccText.h1),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.cream,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        for (var i = 0; i < _reasons.length; i++) ...[
                          if (i > 0)
                            const Divider(height: 1, color: AppColors.line),
                          InkWell(
                            onTap: () {
                              setState(() {
                                selectedReason = _reasons[i];
                                if (!isOtherSelected) {
                                  _otherReasonController.clear();
                                }
                              });
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 15,
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      _reasons[i] == 'Other'
                                          ? 'Something else'
                                          : _reasons[i],
                                      style: DsText.rowTitle.copyWith(
                                        fontSize: 14,
                                      ),
                                    ),
                                  ),
                                  AccRadio(selectedReason == _reasons[i]),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (isOtherSelected)
                    AccField(
                      label: 'Tell us more',
                      hint: 'Please specify your reason...',
                      controller: _otherReasonController,
                      maxLines: 3,
                      onChanged: (_) => setState(() {}),
                    ),
                  DsNote(
                    tone: DsTone.negative,
                    icon: Icons.error_outline_rounded,
                    text: localizations.closeAccountDescription,
                  ),
                ],
              ),
            ),
          ),
          BlocBuilder<UserAccountBloc, UserAccountState>(
            builder: (context, state) {
              return AppButton.filled(
                text: localizations.closeAccount,
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
    );
  }
}
