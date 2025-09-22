import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class UploadingDocumentsView extends StatelessWidget {
  const UploadingDocumentsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<MediaBloc, MediaState>(
        builder: (context, state) {
          final isUploading = state is KycDocumentsUploading;
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AppCard(
                  margin: const EdgeInsets.all(AppSpacing.spacingM),
                  padding: const EdgeInsets.all(AppSpacing.spacingL),
                  child: Column(
                    children: [
                      SizedBox(height: AppSpacing.spacingL),
                      isUploading
                          ? CircularProgressIndicator(color: Colors.white)
                          : Icon(
                            Icons.check_circle,
                            size: 64,
                            color: Colors.green,
                          ),
                      SizedBox(height: AppSpacing.spacingL),
                      Text(
                        isUploading
                            ? 'Uploading documents...'
                            : 'Documents uploaded successfully!, we will notify you once verification is complete.',
                        style: TextStyles.titleMedium,
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: AppSpacing.spacingL),
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
