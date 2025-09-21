import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';

class UploadingDocumentsView extends StatelessWidget {
  const UploadingDocumentsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('')),
      body: BlocBuilder<KycBloc, KycState>(
        builder: (context, state) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AppCard(
                  margin: const EdgeInsets.all(AppSpacing.spacingM),
                  padding: const EdgeInsets.all(AppSpacing.spacingL),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      SizedBox(height: AppSpacing.spacingL),
                      CircularProgressIndicator(color: Colors.white),
                      SizedBox(height: AppSpacing.spacingL),
                      Text('Verifying your documents, please wait...'),
                      SizedBox(height: AppSpacing.spacingL),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Document State:',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Text('State Type: ${state.runtimeType}'),
                      if (state is KycDocument) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Document Type: ${state.documentType ?? 'Not set'}',
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Front File: ${state.frontFilePath != null ? '✅ Captured' : '❌ Not captured'}',
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Back File: ${state.backFilePath != null ? '✅ Captured' : '❌ Not captured'}',
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Photo File: ${state.photoFilePath != null ? '✅ Captured' : '❌ Not captured'}',
                        ),
                        if (state.frontFilePath != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Front Path: ${state.frontFilePath}',
                            style: const TextStyle(fontSize: 10),
                          ),
                        ],
                        if (state.backFilePath != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Back Path: ${state.backFilePath}',
                            style: const TextStyle(fontSize: 10),
                          ),
                        ],
                        if (state.photoFilePath != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Photo Path: ${state.photoFilePath}',
                            style: const TextStyle(fontSize: 10),
                          ),
                        ],
                      ],
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
