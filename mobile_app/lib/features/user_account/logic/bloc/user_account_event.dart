part of 'user_account_bloc.dart';

@immutable
sealed class UserAccountEvent {}

final class UpdatePersonalDetails extends UserAccountEvent {
  final String? firstName;
  final String? lastName;
  final String? username;
  final String? phoneNumber;
  final String? countryCode;
  final String? country;
  final String? email;
  final String? accountNumber;
  final String? bank;
  final String? accountHolder;
  final AppTheme? appTheme;
  final AppLanguage? appLanguage;
  final String? photoId; // newly uploaded media document id
  final String? fcmToken; // new FCM token

  UpdatePersonalDetails({
    this.firstName,
    this.lastName,
    this.username,
    this.phoneNumber,
    this.countryCode,
    this.country,
    this.email,
    this.accountNumber,
    this.bank,
    this.accountHolder,
    this.appTheme,
    this.appLanguage,
    this.photoId,
    this.fcmToken,
  });
}

final class DeleteAccount extends UserAccountEvent {
  final String reason; // Reason for account deletion

  DeleteAccount({required this.reason});
}
