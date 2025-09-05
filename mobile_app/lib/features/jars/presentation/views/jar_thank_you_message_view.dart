import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

class JarThankYouMessageEditView extends StatefulWidget {
  const JarThankYouMessageEditView({super.key});

  @override
  State<JarThankYouMessageEditView> createState() =>
      _JarThankYouMessageEditViewState();
}

class _JarThankYouMessageEditViewState
    extends State<JarThankYouMessageEditView> {
  late final TextEditingController _textController;
  late final FocusNode _focusNode;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController();
    _focusNode = FocusNode();
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

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text('Edit Thank You Message')),
      body: BlocListener<UpdateJarBloc, UpdateJarState>(
        listener: (context, state) {
          if (state is UpdateJarSuccess) {
            Navigator.of(context).pop();
            AppSnackBar.showSuccess(
              context,
              message: 'Thank you message updated successfully',
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.spacingS),
          child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
            builder: (context, state) {
              if (state is JarSummaryLoaded) {
                final jarData = state.jarData;
                if (!_isInitialized) {
                  _textController.text = jarData.thankYouMessage ?? '';
                  _isInitialized = true;
                }

                return Column(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _textController,
                        focusNode: _focusNode,
                        cursorColor:
                            Theme.of(context).brightness == Brightness.dark
                                ? Colors.white
                                : Colors.black,
                        decoration: InputDecoration(
                          hintText:
                              'Add a thank you message for ${jarData.name}',
                          hintStyle: AppTextStyles.headingOne.copyWith(
                            color: Theme.of(
                              context,
                            ).hintColor.withValues(alpha: 0.2),
                            fontWeight: FontWeight.w400,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                        style: AppTextStyles.headingOne.copyWith(
                          fontWeight: FontWeight.w400,
                        ),
                        maxLines: null,
                        expands: true,
                        textAlignVertical: TextAlignVertical.top,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.spacingXs),
                    SizedBox(
                      width: double.infinity,
                      child: BlocBuilder<UpdateJarBloc, UpdateJarState>(
                        builder: (context, updateState) {
                          return AppButton(
                            isLoading: updateState is UpdateJarInProgress,
                            onPressed: () {
                              context.read<UpdateJarBloc>().add(
                                UpdateJarRequested(
                                  jarId: jarData.id,
                                  updates: {
                                    'thankYouMessage':
                                        _textController.text.trim(),
                                  },
                                ),
                              );
                            },
                            text: localizations.save,
                          );
                        },
                      ),
                    ),
                  ],
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ),
      ),
    );
  }
}
