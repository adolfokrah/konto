import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_loading_overlay/flutter_loading_overlay.dart';

class DeleteAccountReasonsBottomSheet extends StatefulWidget {
  const DeleteAccountReasonsBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: false,
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

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocListener<UserAccountBloc, UserAccountState>(
      listener: (context, state) {
        if (state is UserAccountLoading) {
          startLoading();
        } else {
          stopLoading();
        }

        if (state is UserAccountError) {
          AppSnackBar.showError(context, message: state.message);
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppRadius.radiusM),
            topRight: Radius.circular(AppRadius.radiusM),
          ),
        ),
        child: Padding(
          padding: EdgeInsets.only(
            left: AppSpacing.spacingM,
            right: AppSpacing.spacingM,
            bottom:
                MediaQuery.of(context).viewInsets.bottom + AppSpacing.spacingM,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Fixed Header
              Center(child: DragHandle()),
              const SizedBox(height: AppSpacing.spacingM),
              Text(
                'Why are you deleting your account?',
                style: TextStyles.titleMedium,
              ),
              const SizedBox(height: AppSpacing.spacingXs),
              Text(
                'Please let us know why you\'re leaving. This helps us improve our service.',
                style: TextStyles.titleRegularSm,
              ),
              const SizedBox(height: AppSpacing.spacingL),

              // Scrollable Content Area
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      // Reasons list
                      ...List.generate(_reasons.length, (index) {
                        final reason = _reasons[index];
                        return ListTile(
                          leading: Icon(
                            selectedReason == reason
                                ? Icons.radio_button_checked
                                : Icons.radio_button_unchecked,
                          ),
                          title: Text(reason, style: TextStyles.titleRegularM),
                          onTap: () {
                            setState(() {
                              selectedReason = reason;
                              if (!isOtherSelected) {
                                _otherReasonController.clear();
                              }
                            });
                          },
                          contentPadding: EdgeInsets.zero,
                        );
                      }),

                      // Other reason text field (show when "Other" is selected)
                      if (isOtherSelected) ...[
                        const SizedBox(height: AppSpacing.spacingM),
                        AppTextInput(
                          controller: _otherReasonController,
                          hintText: 'Please specify your reason...',
                          maxLines: 3,
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Fixed Bottom Buttons
              const SizedBox(height: AppSpacing.spacingM),
              Row(
                children: [
                  Expanded(
                    child: AppButton.outlined(
                      text: localizations.cancel,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.spacingM),
                  Expanded(
                    child: AppButton.filled(
                      text: 'Delete Account',
                      onPressed:
                          selectedReason != null &&
                                  (!isOtherSelected ||
                                      _otherReasonController.text
                                          .trim()
                                          .isNotEmpty)
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
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
