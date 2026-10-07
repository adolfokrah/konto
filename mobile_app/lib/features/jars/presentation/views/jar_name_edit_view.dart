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

/// Focused edit screen for the jar name, saved from the header.
class JarNameEditView extends StatefulWidget {
  const JarNameEditView({super.key});

  @override
  State<JarNameEditView> createState() => _JarNameEditViewState();
}

class _JarNameEditViewState extends State<JarNameEditView> {
  final TextEditingController _textController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _textController.addListener(() => setState(() {}));
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
    return BlocListener<UpdateJarBloc, UpdateJarState>(
      listener: (context, state) {
        if (state is UpdateJarSuccess) {
          context.pop();
          AppSnackBar.showSuccess(
            context,
            message: localizations.jarNameUpdatedSuccessfully,
          );
        }
      },
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is! JarSummaryLoaded) {
            return Scaffold(
              backgroundColor: AppColors.cream,
              appBar: JarTopBar(
                title: localizations.jarName,
                leadingIcon: Icons.close_rounded,
              ),
              body: const SizedBox.shrink(),
            );
          }
          final jarData = state.jarData;
          if (!_initialized) {
            _textController.text = jarData.name;
            _initialized = true;
          }

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: JarTopBar(
              title: localizations.jarName,
              leadingIcon: Icons.close_rounded,
              actions: [
                BlocBuilder<UpdateJarBloc, UpdateJarState>(
                  builder: (context, updateState) {
                    return JarBarLink(
                      localizations.save,
                      loading: updateState is UpdateJarInProgress,
                      onTap: () {
                        context.read<UpdateJarBloc>().add(
                          UpdateJarRequested(
                            jarId: jarData.id,
                            updates: {'name': _textController.text},
                          ),
                        );
                      },
                    );
                  },
                ),
              ],
            ),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                JarField(
                  label: localizations.jarName,
                  focused: true,
                  child: JarBareInput(
                    controller: _textController,
                    focusNode: _focusNode,
                    hintText: localizations.enterNewJarName,
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Contributors see this on your page',
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
