import 'package:Hoga/core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/authentication/presentation/widgets/auth_widgets.dart';
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
      AppSnackBar.showError(
        context,
        message: 'Please complete all required fields.',
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

  /// Four parts of the checklist: name, certificate, proof of address,
  /// directors (all complete).
  int get _completedParts {
    var n = 0;
    if (_businessNameController.text.trim().isNotEmpty) n++;
    if (_companyReg != null) n++;
    if (_proofOfAddress != null) n++;
    if (_directors.isNotEmpty && _directors.every(_directorComplete)) n++;
    return n;
  }

  bool _directorComplete(_DirectorForm d) =>
      d.nameController.text.trim().isNotEmpty &&
      d.idFront != null &&
      d.idBack != null;

  @override
  Widget build(BuildContext context) {
    return BlocListener<MediaBloc, MediaState>(
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

            AppSnackBar.showSuccess(
              context,
              message: 'Business verification submitted successfully!',
            );
            context.pop();
          } else if (state is BusinessKybFailure) {
            AppSnackBar.showError(context, message: state.message);
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
                return const Scaffold(
                  backgroundColor: AppColors.cream,
                  appBar: AuthTopBar(
                    close: true,
                    title: 'Business verification',
                  ),
                  body: Center(
                    child: CircularProgressIndicator(color: AppColors.navy),
                  ),
                );
              }

              if (kybStatus == 'approved') {
                return _buildApproved();
              }

              if (kybStatus == 'in_review' ||
                  kybStatus == 'pending' ||
                  kybStatus == 'under-review') {
                return _buildInReview();
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
    );
  }

  Widget _buildApproved() {
    return Scaffold(
      backgroundColor: AppColors.surfaceWhite,
      appBar: const AuthTopBar(close: true, background: AppColors.surfaceWhite),
      body: const Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DsIconTile(
              Icons.account_balance_outlined,
              tone: DsTone.positive,
              size: 64,
            ),
            SizedBox(height: 18),
            AuthHeader(
              title: 'Your business is verified',
              subtitle:
                  'You can now use all business features, and your jars can '
                  'take payments.',
            ),
          ],
        ),
      ),
      bottomNavigationBar: AuthFooter(
        background: AppColors.surfaceWhite,
        children: [AppButton.filled(text: 'Done', onPressed: () => context.pop())],
      ),
    );
  }

  Widget _buildInReview() {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: const AuthTopBar(close: true, title: 'Business verification'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          DsCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Expanded(
                      child: Text('Your business', style: DsText.section),
                    ),
                    DsTag('In review', tone: DsTone.pending),
                  ],
                ),
                const SizedBox(height: 16),
                DsSteps(
                  current: 1,
                  steps: const [
                    ('Submitted', null),
                    ('Documents being checked', '2–3 business days'),
                    ('Approved', null),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const DsNote(
            tone: DsTone.neutral,
            text:
                'Your jars can be set up now. We\'ll notify you once the '
                'review is complete.',
          ),
        ],
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
    final done = _completedParts;

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: const AuthTopBar(close: true, title: 'Business verification'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          if (isRejected) ...[
            DsNote(
              tone: DsTone.negative,
              icon: Icons.error_outline_rounded,
              title: 'Action needed',
              text:
                  rejectionReason ??
                  'Your previous submission was rejected. Please review '
                      'your details and submit again.',
            ),
            const SizedBox(height: 12),
          ],

          DsCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '$done of 4 complete',
                        style: DsText.section.copyWith(fontSize: 16),
                      ),
                    ),
                    const Text('2–3 day review', style: DsText.caption),
                  ],
                ),
                const SizedBox(height: 10),
                DsProgress(done / 4),
              ],
            ),
          ),
          const SizedBox(height: 12),

          AuthField(
            label: 'Registered business name',
            hintText: 'Enter your business name',
            standalone: true,
            textCapitalization: TextCapitalization.words,
            controller: _businessNameController,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 14),

          const DsGroupLabel('Documents'),
          const SizedBox(height: 8),
          DsListCard(
            children: [
              _buildDocumentRow(
                title: 'Certificate of registration',
                hint: 'Company registration document',
                doc: _companyReg,
                onPick: () => _pickDocument(_companyRegSlot),
              ),
              _buildDocumentRow(
                title: 'Proof of address',
                hint: 'Under 3 months old',
                doc: _proofOfAddress,
                onPick: () => _pickDocument(_proofOfAddressSlot),
              ),
            ],
          ),
          const SizedBox(height: 14),

          const DsGroupLabel('Directors'),
          const SizedBox(height: 8),
          ...List.generate(_directors.length, _buildDirectorCard),
          DsCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            onTap: _addDirector,
            child: Row(
              children: [
                const Icon(Icons.add_rounded, size: 20, color: AppColors.navy),
                const SizedBox(width: 10),
                Text(
                  'Add director',
                  style: DsText.rowTitle.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: AuthFooter(
        children: [
          AppButton.filled(
            onPressed: isSubmitting ? null : _submit,
            text:
                isSubmitting
                    ? 'Submitting...'
                    : isRejected
                    ? 'Resubmit'
                    : 'Submit for review',
            isLoading: isSubmitting,
          ),
        ],
      ),
    );
  }

  Widget _buildDirectorCard(int index) {
    final director = _directors[index];
    final complete = _directorComplete(director);
    final missing =
        [
          director.nameController.text.trim().isEmpty,
          director.idFront == null,
          director.idBack == null,
        ].where((m) => m).length;
    final name = director.nameController.text.trim();
    final initials =
        name.isEmpty
            ? '${index + 1}'
            : name
                .split(RegExp(r'\s+'))
                .where((p) => p.isNotEmpty)
                .take(2)
                .map((p) => p[0].toUpperCase())
                .join();

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: DsListCard(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: AppColors.limeSoft,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initials,
                    style: DsText.rowTitle.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Director ${index + 1}',
                    style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                complete
                    ? const DsTag('Complete', tone: DsTone.positive)
                    : DsTag('$missing left', tone: DsTone.pending),
                if (_directors.length > 1)
                  IconButton(
                    icon: const Icon(
                      Icons.delete_outline_rounded,
                      color: AppColors.negative,
                      size: 20,
                    ),
                    onPressed: () => _removeDirector(index),
                  )
                else
                  const SizedBox(width: 8),
              ],
            ),
          ),
          AuthField(
            label: 'Full name',
            hintText: 'As on their ID',
            textCapitalization: TextCapitalization.words,
            controller: director.nameController,
            onChanged: (_) => setState(() {}),
          ),
          _buildDocumentRow(
            title: 'ID front',
            hint: 'Ghana Card or passport',
            doc: director.idFront,
            onPick: () => _pickDocument(director.frontContextId),
          ),
          _buildDocumentRow(
            title: 'ID back',
            hint: 'Back of the same ID',
            doc: director.idBack,
            onPick: () => _pickDocument(director.backContextId),
          ),
        ],
      ),
    );
  }

  /// Document list row: status tile, title, filename or hint, and an
  /// Upload / Replace action. Tapping the row also opens the uploader.
  Widget _buildDocumentRow({
    required String title,
    required String hint,
    required _UploadedDoc? doc,
    required VoidCallback onPick,
  }) {
    final hasFile = doc != null;
    final previewUrl = doc?.url;
    final isImage =
        previewUrl != null &&
        previewUrl.isNotEmpty &&
        !(doc?.filename ?? '').toLowerCase().endsWith('.pdf');

    Widget leading;
    if (hasFile && isImage) {
      leading = ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.network(
          previewUrl,
          width: 40,
          height: 40,
          fit: BoxFit.cover,
          errorBuilder:
              (context, error, stackTrace) =>
                  const DsIconTile(Icons.check_rounded, tone: DsTone.positive),
        ),
      );
    } else if (hasFile) {
      leading = const DsIconTile(Icons.check_rounded, tone: DsTone.positive);
    } else {
      leading = const DsIconTile(Icons.description_outlined);
    }

    return DsRow(
      leading: leading,
      title: title,
      subtitle: hasFile ? (doc.filename ?? 'Uploaded') : hint,
      onTap: onPick,
      trailing:
          hasFile
              ? DsLink('Replace', onTap: onPick)
              : DsSmallButton(label: 'Upload', secondary: true, onTap: onPick),
    );
  }
}
