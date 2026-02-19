part of 'kyc_bloc.dart';

@immutable
sealed class KycEvent {}

final class RequestKycSession extends KycEvent {}
