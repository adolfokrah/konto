import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

const int _maxChars = 250;

class _CharLimitFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.length <= _maxChars) return newValue;
    return oldValue;
  }
}

/// Focused text edit for the thank-you message, with quick suggestions.
class JarThankYouMessageEditView extends StatefulWidget {
  const JarThankYouMessageEditView({super.key});

  @override
  State<JarThankYouMessageEditView> createState() =>
      _JarThankYouMessageEditViewState();
}

class _JarThankYouMessageEditViewState
    extends State<JarThankYouMessageEditView> {
  static const _suggestions = [
    '🙏 Thank you for your support',
    '💛 We\'re so grateful',
    'God bless you',
  ];

  late final TextEditingController _textController;
  late final FocusNode _focusNode;
  bool _isInitialized = false;
  int _chars = 0;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController();
    _focusNode = FocusNode();
    _textController.addListener(() {
      setState(() => _chars = _textController.text.length);
    });
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _focusNode.requestFocus(),
    );
  }

  @override
  void dispose() {
    _textController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _useSuggestion(String text) {
    final value = text.length > _maxChars ? text.substring(0, _maxChars) : text;
    _textController.value = TextEditingValue(
      text: value,
      selection: TextSelection.collapsed(offset: value.length),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    return BlocListener<UpdateJarBloc, UpdateJarState>(
      listener: (context, state) {
        if (state is UpdateJarSuccess) {
          context.pop();
          AppSnackBar.showSuccess(
            context,
            message: 'Thank you message updated successfully',
          );
        }
      },
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          final jarData = state is JarSummaryLoaded ? state.jarData : null;
          if (jarData != null && !_isInitialized) {
            _textController.text = jarData.thankYouMessage ?? '';
            _chars = _textController.text.length;
            _isInitialized = true;
          }

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: JarTopBar(
              title: 'Thank-you message',
              leadingIcon: Icons.close_rounded,
              actions: [
                if (jarData != null)
                  BlocBuilder<UpdateJarBloc, UpdateJarState>(
                    builder: (context, updateState) {
                      return JarBarLink(
                        localizations.save,
                        loading: updateState is UpdateJarInProgress,
                        onTap: () {
                          context.read<UpdateJarBloc>().add(
                            UpdateJarRequested(
                              jarId: jarData.id,
                              updates: {
                                'thankYouMessage': _textController.text.trim(),
                              },
                            ),
                          );
                        },
                      );
                    },
                  ),
              ],
            ),
            body:
                jarData == null
                    ? const SizedBox.shrink()
                    : ListView(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      children: [
                        JarField(
                          label: 'Shown after someone pays',
                          focused: true,
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(minHeight: 120),
                            child: TextField(
                              controller: _textController,
                              focusNode: _focusNode,
                              inputFormatters: [_CharLimitFormatter()],
                              maxLines: null,
                              minLines: 5,
                              keyboardType: TextInputType.multiline,
                              textCapitalization: TextCapitalization.sentences,
                              cursorColor: AppColors.navy,
                              style: DsText.rowTitle.copyWith(fontSize: 15.5),
                              decoration: InputDecoration(
                                isDense: true,
                                filled: false,
                                contentPadding: EdgeInsets.zero,
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                hintText:
                                    'Add a thank you message for ${jarData.name}',
                                hintStyle: DsText.rowTitle.copyWith(
                                  fontSize: 15.5,
                                  fontWeight: FontWeight.w400,
                                  color: AppColors.faint,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Short and personal works best',
                                  style: DsText.caption,
                                ),
                              ),
                              Text(
                                '$_chars / $_maxChars',
                                style: DsText.caption.copyWith(
                                  color:
                                      _chars >= _maxChars
                                          ? AppColors.negative
                                          : AppColors.muted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        const DsGroupLabel('Suggestions'),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            for (final s in _suggestions)
                              JarChip(label: s, onTap: () => _useSuggestion(s)),
                          ],
                        ),
                      ],
                    ),
          );
        },
      ),
    );
  }
}
