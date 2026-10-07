import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

/// Focused text edit for the jar description, saved from the header.
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
    _textController.addListener(() => setState(() {}));
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
    return BlocListener<UpdateJarBloc, UpdateJarState>(
      listener: (context, state) {
        if (state is UpdateJarSuccess) {
          context.pop();
          AppSnackBar.showSuccess(
            context,
            message: localizations.jarDescriptionUpdatedSuccessfully,
          );
        }
      },
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          final jarData = state is JarSummaryLoaded ? state.jarData : null;

          // Initialize the text controller with the jar description if not already done
          if (jarData != null && !_isInitialized) {
            _textController.text = jarData.description ?? '';
            _isInitialized = true;
          }

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: JarTopBar(
              title: localizations.description,
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
                              updates: {'description': _textController.text},
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
                          label: 'Shown on your contribution page',
                          focused: true,
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(minHeight: 140),
                            child: JarBareInput(
                              controller: _textController,
                              focusNode: _focusNode,
                              maxLines: null,
                              minLines: 6,
                              keyboardType: TextInputType.multiline,
                              hintText: localizations.jarDescriptionHint(
                                jarData.name,
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
                                  'Say what it\'s for and where the money goes',
                                  style: DsText.caption,
                                ),
                              ),
                              Text(
                                '${_textController.text.length}',
                                style: DsText.caption,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
          );
        },
      ),
    );
  }
}
