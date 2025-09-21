import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:Hoga/route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class DocumentTypeSelectionView extends StatefulWidget {
  const DocumentTypeSelectionView({super.key});

  @override
  State<DocumentTypeSelectionView> createState() =>
      _DocumentTypeSelectionViewState();
}

class _DocumentTypeSelectionViewState extends State<DocumentTypeSelectionView> {
  String? selectedDocumentType;

  final List<SelectOption<String>> documentTypeOptions = [
    const SelectOption(
      value: 'national_id',
      label: 'National ID',
      icon: Icon(Icons.credit_card),
    ),
    const SelectOption(
      value: 'drivers_license',
      label: 'Drivers License',
      icon: Icon(Icons.drive_eta),
    ),
    const SelectOption(
      value: 'international_passport',
      label: 'International Passport',
      icon: Icon(Icons.flight),
    ),
    const SelectOption(
      value: 'voters_id',
      label: 'Voters ID',
      icon: Icon(Icons.how_to_vote),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Document Type Selection')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.spacingM),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Choose the type of document you want to use for verification',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.spacingXs),
            SelectInput<String>(
              label: 'Document Type',
              hintText: 'Select a document type',
              value: selectedDocumentType,
              options: documentTypeOptions,
              onChanged: (value) {
                setState(() {
                  selectedDocumentType = value;
                });
              },
            ),
            const SizedBox(height: AppSpacing.spacingL),
            AppButton(
              text: 'Continue',
              onPressed:
                  selectedDocumentType == null
                      ? null
                      : () {
                        // Navigate to the next step with the selected document type
                        context.read<KycBloc>().add(
                          SetDocument(documentType: selectedDocumentType!),
                        );
                        Navigator.pushNamed(
                          context,
                          AppRoutes.uploadDocument,
                          arguments: {'side': 'front'},
                        );
                      },
            ),
          ],
        ),
      ),
    );
  }
}
