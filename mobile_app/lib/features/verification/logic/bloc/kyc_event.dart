part of 'kyc_bloc.dart';

@immutable
sealed class KycEvent {}

final class SetDocument extends KycEvent {
  final String? documentType;
  final String? frontFilePath;
  final String? backFilePath;
  final String? photoFilePath;

  SetDocument({
    this.documentType,
    this.frontFilePath,
    this.backFilePath,
    this.photoFilePath,
  });
}

final class ClearDocumentSide extends KycEvent {
  final String side; // 'front' or 'back'

  ClearDocumentSide(this.side);
}
