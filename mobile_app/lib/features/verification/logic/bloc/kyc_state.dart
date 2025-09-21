part of 'kyc_bloc.dart';

@immutable
sealed class KycState {}

final class KycInitial extends KycState {}

final class KycInProgress extends KycState {}

final class KycSuccess extends KycState {}

final class KycFailure extends KycState {
  final String errorMessage;

  KycFailure(this.errorMessage);
}

final class KycDocument extends KycState {
  final String? documentType;
  final String? frontFilePath;
  final String? backFilePath;
  final String? photoFilePath;

  KycDocument({
    this.documentType,
    this.frontFilePath,
    this.backFilePath,
    this.photoFilePath,
  });
}
