part of 'referral_bloc.dart';

@immutable
sealed class ReferralEvent {}

final class ReferralLoadRequested extends ReferralEvent {}

final class ReferralReloadRequested extends ReferralEvent {}
