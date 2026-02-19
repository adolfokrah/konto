import '../../../../core/enums/index.dart';
import '../../../media/data/models/media_model.dart';

/// User model representing the authenticated user data
class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String username;
  final String phoneNumber;
  final String countryCode;
  final String country;
  final String kycStatus;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<UserSession> sessions;
  final AppSettings appSettings;
  final String? accountHolder;
  final String? accountNumber;
  final String? bank;

  /// Computed full name from firstName and lastName
  String get fullName => '$firstName $lastName'.trim();

  /// Rich media document for the user's profile photo (can include size variants)
  final MediaModel? photo;
  final String? paystackSubAccountCode;
  final String? collection; // e.g., 'users'
  final String? strategy; // _strategy in JSON

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.username,
    required this.phoneNumber,
    required this.countryCode,
    required this.country,
    required this.kycStatus,
    required this.createdAt,
    required this.updatedAt,
    required this.sessions,
    required this.appSettings,
    this.accountHolder,
    this.accountNumber,
    this.bank,
    this.photo,
    this.paystackSubAccountCode,
    this.collection,
    this.strategy,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      username: json['username'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String,
      countryCode: json['countryCode'] as String,
      country: json['country'] as String,
      kycStatus: json['kycStatus'] as String? ?? 'none',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      sessions:
          (json['sessions'] as List<dynamic>?)
              ?.map(
                (session) =>
                    UserSession.fromJson(session as Map<String, dynamic>),
              )
              .toList() ??
          [],
      appSettings: AppSettings.fromJson(
        json['appSettings'] as Map<String, dynamic>? ?? {},
      ),
      accountHolder: json['accountHolder'] as String?,
      accountNumber: json['accountNumber'] as String?,
      bank: json['bank'] as String?,
      photo: _parsePhoto(json['photo']),
      paystackSubAccountCode: json['paystackSubAccountCode'] as String?,
      collection: json['collection'] as String?,
      strategy: json['_strategy'] as String?,
    );
  }

  static MediaModel? _parsePhoto(dynamic raw) {
    if (raw == null) return null;
    if (raw is Map<String, dynamic>) {
      try {
        return MediaModel.fromJson(raw);
      } catch (_) {
        return null;
      }
    }
    // If backend sends just an ID/string, we ignore to avoid incomplete model
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'username': username,
      'phoneNumber': phoneNumber,
      'countryCode': countryCode,
      'country': country,
      'kycStatus': kycStatus,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'sessions': sessions.map((session) => session.toJson()).toList(),
      'appSettings': appSettings.toJson(),
      if (accountHolder != null) 'accountHolder': accountHolder,
      if (accountNumber != null) 'accountNumber': accountNumber,
      if (bank != null) 'bank': bank,
      if (photo != null) 'photo': photo!.toJson(),
      if (paystackSubAccountCode != null)
        'paystackSubAccountCode': paystackSubAccountCode,
      if (collection != null) 'collection': collection,
      if (strategy != null) '_strategy': strategy,
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? username,
    String? phoneNumber,
    String? countryCode,
    String? country,
    String? kycStatus,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<UserSession>? sessions,
    AppSettings? appSettings,
    String? accountHolder,
    String? accountNumber,
    String? bank,
    MediaModel? photo,
    String? paystackSubAccountCode,
    String? collection,
    String? strategy,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      username: username ?? this.username,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      countryCode: countryCode ?? this.countryCode,
      country: country ?? this.country,
      kycStatus: kycStatus ?? this.kycStatus,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      sessions: sessions ?? this.sessions,
      appSettings: appSettings ?? this.appSettings,
      accountHolder: accountHolder ?? this.accountHolder,
      accountNumber: accountNumber ?? this.accountNumber,
      bank: bank ?? this.bank,
      photo: photo ?? this.photo,
      paystackSubAccountCode:
          paystackSubAccountCode ?? this.paystackSubAccountCode,
      collection: collection ?? this.collection,
      strategy: strategy ?? this.strategy,
    );
  }
}

/// User session model
class UserSession {
  final String id;
  final DateTime createdAt;
  final DateTime expiresAt;

  const UserSession({
    required this.id,
    required this.createdAt,
    required this.expiresAt,
  });

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      id: json['id'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt.toIso8601String(),
      'expiresAt': expiresAt.toIso8601String(),
    };
  }
}

/// App settings model
class AppSettings {
  final AppLanguage language; // Type-safe language enum
  final AppTheme theme; // Type-safe theme enum
  final bool biometricAuthEnabled;
  final NotificationSettings notificationsSettings;

  const AppSettings({
    required this.language,
    required this.theme,
    required this.biometricAuthEnabled,
    required this.notificationsSettings,
  });

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    // Parse language from JSON string to enum
    final AppLanguage language = AppLanguage.fromString(
      json['language'] as String? ?? 'en',
    );

    // Handle backward compatibility: if theme is not present, derive from darkMode
    AppTheme theme;
    if (json['theme'] != null) {
      theme = AppTheme.fromString(json['theme'] as String);
    } else {
      // Backward compatibility: derive theme from darkMode
      final darkMode = json['darkMode'] as bool? ?? false;
      theme = darkMode ? AppTheme.dark : AppTheme.light;
    }

    return AppSettings(
      language: language,
      theme: theme,
      biometricAuthEnabled: json['biometricAuthEnabled'] as bool? ?? false,
      notificationsSettings: NotificationSettings.fromJson(
        json['notificationsSettings'] as Map<String, dynamic>? ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'language': language.value, // Convert enum to string
      'theme': theme.value,
      'biometricAuthEnabled': biometricAuthEnabled,
      'notificationsSettings': notificationsSettings.toJson(),
    };
  }

  AppSettings copyWith({
    AppLanguage? language,
    bool? darkMode,
    AppTheme? theme,
    bool? biometricAuthEnabled,
    NotificationSettings? notificationsSettings,
  }) {
    return AppSettings(
      language: language ?? this.language,
      theme: theme ?? this.theme,
      biometricAuthEnabled: biometricAuthEnabled ?? this.biometricAuthEnabled,
      notificationsSettings:
          notificationsSettings ?? this.notificationsSettings,
    );
  }
}

/// Notification settings model
class NotificationSettings {
  final bool pushNotificationsEnabled;
  final bool emailNotificationsEnabled;
  final bool smsNotificationsEnabled;

  const NotificationSettings({
    required this.pushNotificationsEnabled,
    required this.emailNotificationsEnabled,
    required this.smsNotificationsEnabled,
  });

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      pushNotificationsEnabled:
          json['pushNotificationsEnabled'] as bool? ?? true,
      emailNotificationsEnabled:
          json['emailNotificationsEnabled'] as bool? ?? true,
      smsNotificationsEnabled:
          json['smsNotificationsEnabled'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pushNotificationsEnabled': pushNotificationsEnabled,
      'emailNotificationsEnabled': emailNotificationsEnabled,
      'smsNotificationsEnabled': smsNotificationsEnabled,
    };
  }
}

/// Login response model
class LoginResponse {
  final bool success;
  final String message;
  final User user;
  final String token;
  final int exp;

  const LoginResponse({
    required this.success,
    required this.message,
    required this.user,
    required this.token,
    required this.exp,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      success: json['success'] as bool,
      message: json['message'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      token: json['token'] as String,
      exp: json['exp'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'user': user.toJson(),
      'token': token,
      'exp': exp,
    };
  }
}
