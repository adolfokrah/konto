import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/withdrawal_account_picker.dart';

/// "About jar" sheet for collectors: photo, name, description, organizer,
/// payout destination, and Report / Leave actions.
/// Pops with 'report' or 'leave'.
class JarInfoSheet extends StatefulWidget {
  final JarSummaryModel jarData;

  const JarInfoSheet({super.key, required this.jarData});

  static Future<String?> show({
    required BuildContext context,
    required JarSummaryModel jarData,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      isScrollControlled: true,
      builder: (context) => JarInfoSheet(jarData: jarData),
    );
  }

  @override
  State<JarInfoSheet> createState() => _JarInfoSheetState();
}

class _JarInfoSheetState extends State<JarInfoSheet> {
  /// Opens the shared account picker to change the jar's linked payout account.
  Future<void> _openAccountPicker() async {
    final currentId = widget.jarData.withdrawalAccount?.id;

    await WithdrawalAccountPicker.show(
      context,
      currentId: currentId,
      onSelected: (selectedId) {
        if (!mounted) return;
        if (selectedId != currentId) {
          context.read<UpdateJarBloc>().add(
            UpdateJarRequested(
              jarId: widget.jarData.id,
              updates: {'withdrawalAccount': selectedId},
            ),
          );
        }
      },
    );
  }

  Future<void> _confirmLeave() async {
    final confirmed = await JarConfirmSheet.show(
      context: context,
      icon: Icons.logout_rounded,
      tone: DsTone.negative,
      title: 'Leave ${widget.jarData.name}?',
      message:
          'You\'ll stop collecting for this jar. The money you collected stays in the jar.',
      confirmText: 'Leave jar',
      cancelText: 'Stay',
    );
    if (confirmed == true && mounted) {
      Navigator.of(context).pop('leave');
    }
  }

  @override
  Widget build(BuildContext context) {
    final jar = widget.jarData;
    final imageUrl =
        jar.image?.url != null
            ? ImageUtils.constructImageUrl(jar.image!.url!)
            : null;
    final isCreator = jar.isCreator;
    final payoutAccount = jar.withdrawalAccount;
    final group = jar.jarGroup;

    return BlocListener<UpdateJarBloc, UpdateJarState>(
      // Refresh the jar summary when the payout account changes.
      listener: (context, state) {
        if (state is UpdateJarSuccess && !state.silent) {
          context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
          AppSnackBar.show(
            context,
            message: 'Payout account updated',
            type: SnackBarType.success,
          );
        } else if (state is UpdateJarFailure) {
          AppSnackBar.showError(context, message: state.errorMessage);
        }
      },
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: JarSheetFrame(
          children: [
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        JarThumb(imageUrl: imageUrl, size: 56),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                jar.name,
                                style: DsText.section.copyWith(fontSize: 20),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                [
                                  if (group != null && group.isNotEmpty) group,
                                  isCreator
                                      ? 'you\'re the organizer'
                                      : 'you\'re a collector',
                                ].join(' · '),
                                style: DsText.caption,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (jar.description != null &&
                        jar.description!.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      Text(jar.description!, style: DsText.small),
                    ],
                    const SizedBox(height: 14),
                    JarFillList(
                      children: [
                        DsKeyValue('Organizer', jar.creator.fullName),
                        if (isCreator)
                          InkWell(
                            onTap: _openAccountPicker,
                            child: Row(
                              children: [
                                Expanded(
                                  child: DsKeyValue(
                                    'Pays out to',
                                    payoutAccount == null
                                        ? 'Not set'
                                        : '${payoutAccount.label?.isNotEmpty == true ? payoutAccount.label! : withdrawalAccountLabel(payoutAccount)} ${payoutAccount.maskedAccountNumber}',
                                  ),
                                ),
                                const Padding(
                                  padding: EdgeInsets.only(right: 12),
                                  child: Icon(
                                    Icons.chevron_right_rounded,
                                    size: 20,
                                    color: AppColors.faint,
                                  ),
                                ),
                              ],
                            ),
                          )
                        else if (payoutAccount != null)
                          DsKeyValue(
                            'Pays out to',
                            '${withdrawalAccountLabel(payoutAccount)} ${payoutAccount.maskedAccountNumber}',
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: JarGhostButton(
                    label: 'Report',
                    icon: Icons.flag_outlined,
                    filled: true,
                    onTap: () => Navigator.of(context).pop('report'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: JarGhostButton(
                    label: 'Leave jar',
                    filled: true,
                    color: AppColors.negative,
                    onTap: _confirmLeave,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
