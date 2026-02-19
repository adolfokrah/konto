import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class JarDescriptionEditView extends StatefulWidget {
  const JarDescriptionEditView({super.key});

  @override
  State<JarDescriptionEditView> createState() => _JarDescriptionEditViewState();
}

class _JarDescriptionEditViewState extends State<JarDescriptionEditView> {
  late final TextEditingController _textController;
  late final FocusNode _focusNode;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController();
    _focusNode = FocusNode();

    // Auto focus the text field when the page opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
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
      appBar: AppBar(title: Text(localizations.editJarDescription)),
      body: BlocListener<UpdateJarBloc, UpdateJarState>(
        listener: (context, state) {
          if (state is UpdateJarSuccess) {
            context.pop();
            AppSnackBar.showSuccess(
              context,
              message: localizations.jarDescriptionUpdatedSuccessfully,
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.spacingS),
          child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
            builder: (context, state) {
              if (state is JarSummaryLoaded) {
                final jarData = state.jarData;

                // Initialize the text controller with the jar description if not already done
                if (_isInitialized == false) {
                  _textController.text = jarData.description ?? '';
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
                          hintText: localizations.jarDescriptionHint(
                            jarData.name,
                          ),
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
                    SizedBox(height: AppSpacing.spacingXs),
                    SizedBox(
                      width: double.infinity,
                      child: BlocBuilder<UpdateJarBloc, UpdateJarState>(
                        builder: (context, state) {
                          return AppButton(
                            isLoading: state is UpdateJarInProgress,
                            onPressed: () {
                              context.read<UpdateJarBloc>().add(
                                UpdateJarRequested(
                                  jarId: jarData.id,
                                  updates: {
                                    'description': _textController.text,
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
              return Container();
            },
          ),
        ),
      ),
    );
  }
}
