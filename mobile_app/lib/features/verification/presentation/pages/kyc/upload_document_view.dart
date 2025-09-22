import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:Hoga/features/verification/presentation/widgets/capture_document.dart';
import 'package:Hoga/features/verification/presentation/widgets/select_document.dart';
import 'package:Hoga/route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

enum ImageType { capture, upload }

class UploadDocumentView extends StatefulWidget {
  const UploadDocumentView({super.key});

  @override
  State<UploadDocumentView> createState() => _UploadDocumentViewState();
}

class _UploadDocumentViewState extends State<UploadDocumentView> {
  ImageType currentImageType = ImageType.capture;

  @override
  Widget build(BuildContext context) {
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final side = args?['side'] ?? 'front';
    bool isUpload = currentImageType == ImageType.upload;

    return Scaffold(
      appBar: AppBar(title: Text('Upload Document')),
      body: BlocBuilder<KycBloc, KycState>(
        builder: (context, state) {
          if (state is KycDocument) {
            bool isImageSelected =
                ((side == 'back' && state.backFilePath != null) ||
                    (side == 'front' && state.frontFilePath != null));
            return SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.spacingXs),
              child: Column(
                children: [
                  if (!isUpload)
                    CaptureDocumentWidget(
                      title:
                          'Capture the $side side of your ${state.documentType?.replaceAll("_", " ")}',
                      side: side,
                    ),

                  if (isUpload)
                    SelectDocument(
                      title:
                          'Select the $side side of your ${state.documentType?.replaceAll("_", " ")} from your device',
                      side: side,
                    ),

                  AppButton.outlined(
                    text:
                        isImageSelected
                            ? "Continue"
                            : (isUpload ? "Capture Instead" : "Upload Instead"),
                    onPressed: () {
                      // If document is already captured for this side, navigate back
                      if (state.backFilePath != null &&
                          state.frontFilePath != null) {
                        // Both sides are captured, do nothing or navigate as needed
                        Navigator.pushNamed(context, AppRoutes.takePhoto);
                        return;
                      } else if ((side == 'back' &&
                              state.backFilePath != null) ||
                          (side == 'front' && state.frontFilePath != null)) {
                        Navigator.pushNamed(
                          context,
                          AppRoutes.uploadDocument,
                          arguments: {'side': 'back'},
                        );
                        return;
                      } else {
                        setState(() {
                          currentImageType =
                              isUpload ? ImageType.capture : ImageType.upload;
                        });
                      }
                    },
                  ),
                ],
              ),
            );
          }
          return Container();
        },
      ),
    );
  }
}
