part of 'payout_minimum_bloc.dart';

@immutable
sealed class PayoutMinimumState {}

final class PayoutMinimumInitial extends PayoutMinimumState {}

final class PayoutMinimumLoaded extends PayoutMinimumState {
  final double minimumPayoutAmount;
  PayoutMinimumLoaded({required this.minimumPayoutAmount});
}
