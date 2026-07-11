import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/business_kyb/logic/bloc/business_kyb_bloc.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';

/// contextId prefixes used to route a completed [MediaLoaded] upload back to
/// the form slot that requested it.
const String _companyRegSlot = 'company-reg';
const String _proofOfAddressSlot = 'proof-of-address';

/// A document that has already been uploaded to the private
/// `business-documents` collection. Holds the created doc id and an optional
/// preview url/filename to render the picked state.
class _UploadedDoc {
  final String id;
  final String? url;
  final String? filename;

  const _UploadedDoc({required this.id, this.url, this.filename});
}

/// Holds the mutable form data for a single director row.
class _DirectorForm {
  /// Stable, unique id so completed uploads can be routed to this director even
  /// if the list is reordered or another director is removed meanwhile.
  final String slotId;
  final TextEditingController nameController = TextEditingController();
  _UploadedDoc? idFront;
  _UploadedDoc? idBack;

  _DirectorForm(this.slotId);

  String get frontContextId => 'director-$slotId-front';
  String get backContextId => 'director-$slotId-back';

  void dispose() {
    nameController.dispose();
  }
}

class BusinessKybView extends StatefulWidget {
  const BusinessKybView({super.key});

  @override
  State<BusinessKybView> createState() => _BusinessKybViewState();
}

class _BusinessKybViewState extends State<BusinessKybView> {
  final TextEditingController _businessNameController = TextEditingController();

  _UploadedDoc? _companyReg;
  _UploadedDoc? _proofOfAddress;
  int _directorSeq = 0;
  late final List<_DirectorForm> _directors = [_newDirector()];

  _DirectorForm _newDirector() => _DirectorForm('${_directorSeq++}');

  @override
  void initState() {
    super.initState();
    // Refresh the latest KYB status from the backend.
    context.read<BusinessKybBloc>().add(LoadKybStatus());
  }

  @override
  void dispose() {
    _businessNameController.dispose();
    for (final director in _directors) {
      director.dispose();
    }
    super.dispose();
  }

  /// Launches the shared image uploader for a business document slot. The
  /// upload targets the private `business-documents` collection; the resulting
  /// doc id is captured in [_onMediaLoaded] via the [contextId].
  void _pickDocument(String contextId) {
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.businessDocument,
      collection: 'business-documents',
      contextId: contextId,
      allowFiles: true,
    );
  }

  /// Routes a completed business-document upload back to the requesting slot.
  void _onMediaLoaded(MediaLoaded state) {
    if (state.context != MediaUploadContext.businessDocument) return;

    final doc = _UploadedDoc(
      id: state.media.id,
      url: state.media.url,
      filename: state.media.filename,
    );

    setState(() {
      if (state.contextId == _companyRegSlot) {
        _companyReg = doc;
        return;
      }
      if (state.contextId == _proofOfAddressSlot) {
        _proofOfAddress = doc;
        return;
      }
      for (final director in _directors) {
        if (state.contextId == director.frontContextId) {
          director.idFront = doc;
          return;
        }
        if (state.contextId == director.backContextId) {
          director.idBack = doc;
          return;
        }
      }
    });
  }

  void _addDirector() {
    setState(() => _directors.add(_newDirector()));
  }

  void _removeDirector(int index) {
    setState(() {
      _directors[index].dispose();
      _directors.removeAt(index);
    });
  }

  bool get _isFormValid {
    if (_businessNameController.text.trim().isEmpty) return false;
    if (_companyReg == null) return false;
    if (_proofOfAddress == null) return false;
    if (_directors.isEmpty) return false;
    for (final director in _directors) {
      if (director.nameController.text.trim().isEmpty) return false;
      if (director.idFront == null) return false;
      if (director.idBack == null) return false;
    }
    return true;
  }

  void _submit() {
    if (!_isFormValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete all required fields.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    context.read<BusinessKybBloc>().add(
      SubmitKybRequested(
        businessName: _businessNameController.text.trim(),
        companyRegDocId: _companyReg!.id,
        proofOfAddressDocId: _proofOfAddress!.id,
        directors:
            _directors
                .map(
                  (director) => KybDirectorInput(
                    fullName: director.nameController.text.trim(),
                    idFrontDocId: director.idFront!.id,
                    idBackDocId: director.idBack!.id,
                  ),
                )
                .toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: Text('Business verification', style: TextStyles.titleMediumLg),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: BlocListener<MediaBloc, MediaState>(
        listener: (context, state) {
          if (state is MediaLoaded) {
            _onMediaLoaded(state);
          }
        },
        child: BlocConsumer<BusinessKybBloc, BusinessKybState>(
          listener: (context, state) {
            if (state is BusinessKybSubmitted) {
              // Reload user data to get updated KYB status.
              context.read<AuthBloc>().add(AutoLoginRequested());

              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Business verification submitted successfully!',
                  ),
                  backgroundColor: Colors.green,
                ),
              );
              context.pop();
            } else if (state is BusinessKybFailure) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          builder: (context, state) {
            return BlocBuilder<AuthBloc, AuthState>(
              builder: (context, authState) {
                // Resolve the effective KYB status. Prefer a freshly loaded
                // status from the bloc, otherwise fall back to the auth user's
                // kybStatus.
                String kybStatus = 'none';
                String? rejectionReason;

                if (authState is AuthAuthenticated) {
                  kybStatus = authState.user.kybStatus;
                }
                if (state is BusinessKybStatusLoaded) {
                  kybStatus = state.status;
                  rejectionReason = state.rejectionReason;
                }

                if (state is BusinessKybLoadingStatus) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (kybStatus == 'approved') {
                  return _buildStatusMessage(
                    icon: Icons.check_circle,
                    iconColor: Colors.green,
                    title: 'Business Verified',
                    message:
                        'Your business has been successfully verified. You can '
                        'now use all business features.',
                  );
                }

                if (kybStatus == 'in_review' ||
                    kybStatus == 'pending' ||
                    kybStatus == 'under-review') {
                  return _buildStatusMessage(
                    icon: Icons.hourglass_empty,
                    iconColor: Colors.orange,
                    title: 'Business Verification Pending',
                    message:
                        'Your business verification is currently being '
                        'reviewed. We will notify you once it\'s complete.',
                    subMessage: 'This usually takes 2-3 business days.',
                  );
                }

                // 'rejected' shows the reason above the form; 'none' shows the
                // plain form.
                return _buildForm(
                  context,
                  state,
                  isRejected: kybStatus == 'rejected',
                  rejectionReason: rejectionReason,
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatusMessage({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String message,
    String? subMessage,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.spacingM),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: iconColor),
            const SizedBox(height: 24),
            Text(
              title,
              style: TextStyles.titleBoldLg,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyles.titleRegularSm,
              textAlign: TextAlign.center,
            ),
            if (subMessage != null) ...[
              const SizedBox(height: 16),
              Text(
                subMessage,
                style: TextStyles.titleRegularSm.copyWith(
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildForm(
    BuildContext context,
    BusinessKybState state, {
    required bool isRejected,
    String? rejectionReason,
  }) {
    final isSubmitting = state is BusinessKybSubmitting;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.spacingM),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isRejected) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.spacingS),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.radiusM),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Verification rejected',
                    style: TextStyles.titleMediumS.copyWith(color: Colors.red),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    rejectionReason ??
                        'Your previous submission was rejected. Please review '
                            'your details and submit again.',
                    style: TextStyles.titleRegularSm,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.spacingM),
          ],

          Text('Business details', style: TextStyles.titleBoldLg),
          const SizedBox(height: 8),
          Text(
            'Provide your business information and documents to get verified.',
            style: TextStyles.titleRegularSm.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: AppSpacing.spacingM),

          AppTextInput(
            label: 'Business name',
            hintText: 'Enter your business name',
            controller: _businessNameController,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: AppSpacing.spacingM),

          _buildDocumentTile(
            title: 'Company Registration Document',
            doc: _companyReg,
            onPick: () => _pickDocument(_companyRegSlot),
            onClear: () => setState(() => _companyReg = null),
          ),
          const SizedBox(height: AppSpacing.spacingS),

          _buildDocumentTile(
            title: 'Proof of Business Address',
            doc: _proofOfAddress,
            onPick: () => _pickDocument(_proofOfAddressSlot),
            onClear: () => setState(() => _proofOfAddress = null),
          ),
          const SizedBox(height: AppSpacing.spacingL),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Directors', style: TextStyles.titleBoldLg),
              TextButton.icon(
                onPressed: _addDirector,
                style: ButtonStyle(
                  foregroundColor: WidgetStateProperty.all(Colors.white),
                  iconColor: WidgetStateProperty.all(Colors.white),
                  overlayColor: WidgetStateProperty.all(
                    Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                icon: Icon(Icons.add, color: Colors.white),
                label: Text('Add director', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.spacingS),

          ...List.generate(_directors.length, (index) {
            return _buildDirectorCard(index);
          }),

          const SizedBox(height: AppSpacing.spacingL),

          AppButton.filled(
            onPressed: isSubmitting ? null : _submit,
            text: isSubmitting ? 'Submitting...' : 'Submit for verification',
            isLoading: isSubmitting,
          ),
          const SizedBox(height: AppSpacing.spacingM),
        ],
      ),
    );
  }

  Widget _buildDirectorCard(int index) {
    final director = _directors[index];

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.spacingM),
      padding: const EdgeInsets.all(AppSpacing.spacingS),
      decoration: BoxDecoration(
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
        ),
        borderRadius: BorderRadius.circular(AppRadius.radiusM),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Director ${index + 1}', style: TextStyles.titleMediumS),
              if (_directors.length > 1)
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => _removeDirector(index),
                ),
            ],
          ),
          const SizedBox(height: 8),
          AppTextInput(
            label: 'Full name',
            hintText: 'Enter director full name',
            controller: director.nameController,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: AppSpacing.spacingS),
          _buildDocumentTile(
            title: 'ID Document',
            doc: director.idFront,
            onPick: () => _pickDocument(director.frontContextId),
            onClear: () => setState(() => director.idFront = null),
          ),
          const SizedBox(height: AppSpacing.spacingS),
          _buildDocumentTile(
            title: 'ID Document (back)',
            doc: director.idBack,
            onPick: () => _pickDocument(director.backContextId),
            onClear: () => setState(() => director.idBack = null),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentTile({
    required String title,
    required _UploadedDoc? doc,
    required VoidCallback onPick,
    required VoidCallback onClear,
  }) {
    final hasFile = doc != null;
    final previewUrl = doc?.url;

    return InkWell(
      onTap: onPick,
      borderRadius: BorderRadius.circular(AppRadius.radiusM),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.spacingS),
        decoration: BoxDecoration(
          border: Border.all(
            color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
          ),
          borderRadius: BorderRadius.circular(AppRadius.radiusM),
        ),
        child: Row(
          children: [
            if (hasFile && previewUrl != null && previewUrl.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.radiusM),
                child: Image.network(
                  previewUrl,
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                  errorBuilder:
                      (context, error, stackTrace) => const Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 32,
                      ),
                ),
              )
            else if (hasFile)
              const Icon(Icons.check_circle, color: Colors.green, size: 32)
            else
              Icon(
                Icons.upload_file,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            const SizedBox(width: AppSpacing.spacingS),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyles.titleMediumS),
                  const SizedBox(height: 4),
                  Text(
                    hasFile
                        ? (doc.filename ?? 'Uploaded. Tap to replace')
                        : 'Tap to capture',
                    style: TextStyles.titleRegularSm.copyWith(
                      color: Colors.grey[600],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (hasFile)
              IconButton(icon: const Icon(Icons.close), onPressed: onClear),
          ],
        ),
      ),
    );
  }
}
