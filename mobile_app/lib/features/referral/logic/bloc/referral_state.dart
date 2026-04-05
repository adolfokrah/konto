part of 'referral_bloc.dart';

@immutable
sealed class ReferralState {}

final class ReferralInitial extends ReferralState {}

final class ReferralLoading extends ReferralState {}

final class ReferralLoaded extends ReferralState {
  final double balance;
  final double totalEarned;
  final double minimumPayoutAmount;

  ReferralLoaded({
    required this.balance,
    required this.totalEarned,
    required this.minimumPayoutAmount,
  });
}

final class ReferralError extends ReferralState {
  final String message;
  ReferralError({required this.message});
}
