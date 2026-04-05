part of 'referral_bloc.dart';

@immutable
sealed class ReferralState {}

final class ReferralInitial extends ReferralState {}

final class ReferralLoading extends ReferralState {}

final class ReferralLoaded extends ReferralState {
  final double balance;
  final double totalEarned;

  ReferralLoaded({required this.balance, required this.totalEarned});
}

final class ReferralError extends ReferralState {
  final String message;
  ReferralError({required this.message});
}
