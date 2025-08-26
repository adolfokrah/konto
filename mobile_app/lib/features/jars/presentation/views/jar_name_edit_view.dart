import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

class JarNameEditView extends StatelessWidget {
  const JarNameEditView({super.key});

  @override
  Widget build(BuildContext context) {
    final TextEditingController textController = TextEditingController();
    final localizations = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.editJarName),
        centerTitle: false,
      ),
      body: BlocListener<UpdateJarBloc, UpdateJarState>(
        listener: (context, state) {
          if (state is UpdateJarSuccess) {
            Navigator.of(context).pop();
            AppSnackBar.showSuccess(
              context,
              message: localizations.jarNameUpdatedSuccessfully,
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.spacingXs),
          child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
            builder: (context, state) {
              if (state is JarSummaryLoaded) {
                final jarData = state.jarData;
                textController.text = jarData.name;
                return Column(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        child: AppTextInput(
                          controller: textController,
                          label: localizations.jarName,
                          hintText: localizations.enterNewJarName,
                        ),
                      ),
                    ),

                    BlocBuilder<UpdateJarBloc, UpdateJarState>(
                      builder: (context, state) {
                        return AppButton(
                          isLoading: state is UpdateJarInProgress,
                          text: localizations.save,
                          onPressed: () {
                            context.read<UpdateJarBloc>().add(
                              UpdateJarRequested(
                                jarId: jarData.id,
                                updates: {'name': textController.text},
                              ),
                            );
                          },
                        );
                      },
                    ),
                    SizedBox(height: AppSpacing.spacingM),
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
