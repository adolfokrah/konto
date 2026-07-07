part of 'business_kyb_bloc.dart';

@immutable
sealed class BusinessKybEvent {}

/// Load the authenticated user's current KYB status from the backend.
final class LoadKybStatus extends BusinessKybEvent {}

/// A single director's data collected from the form. The document fields hold
/// the ids of documents already uploaded to the private `business-documents`
/// collection (via the shared image uploader).
class KybDirectorInput {
  final String fullName;
  final String idFrontDocId;
  final String idBackDocId;

  const KybDirectorInput({
    required this.fullName,
    required this.idFrontDocId,
    required this.idBackDocId,
  });
}

/// Submit the KYB request. The document fields hold the ids of documents
/// already uploaded to the private `business-documents` collection; no further
/// upload happens here.
final class SubmitKybRequested extends BusinessKybEvent {
  final String businessName;
  final String companyRegDocId;
  final String proofOfAddressDocId;
  final List<KybDirectorInput> directors;

  SubmitKybRequested({
    required this.businessName,
    required this.companyRegDocId,
    required this.proofOfAddressDocId,
    required this.directors,
  });
}
