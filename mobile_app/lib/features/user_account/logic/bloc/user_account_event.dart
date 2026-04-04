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
  final String? bank;     // display name, e.g. "MTN Mobile Money"
  final String? bankCode; // Paystack code, e.g. "MTN"
  final String? accountHolder;
  final String? withdrawalPaymentMethod;
  final AppTheme? appTheme;
  final AppLanguage? appLanguage;
  final String? photoId; // newly uploaded media document id
  final String? fcmToken; // new FCM token
  final String? platform; // 'android' or 'ios'

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
    this.bankCode,
    this.accountHolder,
    this.withdrawalPaymentMethod,
    this.appTheme,
    this.appLanguage,
    this.photoId,
    this.fcmToken,
    this.platform,
  });
}

final class DeleteAccount extends UserAccountEvent {
  final String reason; // Reason for account deletion

  DeleteAccount({required this.reason});
}

final class FetchPaymentMethods extends UserAccountEvent {
  final String country;
  FetchPaymentMethods({required this.country});
}

final class FetchBanks extends UserAccountEvent {
  final String country;
  final String paystackType; // 'mobile_money' or 'ghipss'
  FetchBanks({required this.country, required this.paystackType});
}
