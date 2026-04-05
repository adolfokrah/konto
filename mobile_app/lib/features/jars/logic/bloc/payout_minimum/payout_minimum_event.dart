part of 'payout_minimum_bloc.dart';

@immutable
sealed class PayoutMinimumEvent {}

final class PayoutMinimumLoadRequested extends PayoutMinimumEvent {}
