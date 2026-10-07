part of 'business_kyb_bloc.dart';

@immutable
sealed class BusinessKybState {}

final class BusinessKybInitial extends BusinessKybState {}

final class BusinessKybLoadingStatus extends BusinessKybState {}

final class BusinessKybStatusLoaded extends BusinessKybState {
  final String status;
  final String? rejectionReason;
  final String? businessName;

  BusinessKybStatusLoaded({
    required this.status,
    this.rejectionReason,
    this.businessName,
  });
}

final class BusinessKybSubmitting extends BusinessKybState {}

final class BusinessKybSubmitted extends BusinessKybState {}

final class BusinessKybFailure extends BusinessKybState {
  final String message;

  BusinessKybFailure(this.message);
}
