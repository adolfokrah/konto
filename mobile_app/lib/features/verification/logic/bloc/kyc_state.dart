part of 'kyc_bloc.dart';

@immutable
sealed class KycState {}

final class KycInitial extends KycState {}

final class KycInProgress extends KycState {}

final class KycSuccess extends KycState {}

final class KycInReview extends KycState {}

final class KycFailure extends KycState {
  final String errorMessage;

  KycFailure(this.errorMessage);
}
