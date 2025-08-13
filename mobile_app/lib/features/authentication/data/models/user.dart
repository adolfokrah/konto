/// User model representing the authenticated user data
class User {
  final String id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String countryCode;
  final String country;
  final bool isKYCVerified;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<UserSession> sessions;
  final AppSettings appSettings;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    required this.countryCode,
    required this.country,
    required this.isKYCVerified,
    required this.createdAt,
    required this.updatedAt,
    required this.sessions,
    required this.appSettings,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      phoneNumber: json['phoneNumber'] as String,
      countryCode: json['countryCode'] as String,
      country: json['country'] as String,
      isKYCVerified: json['isKYCVerified'] as bool? ?? false,
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
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'countryCode': countryCode,
      'country': country,
      'isKYCVerified': isKYCVerified,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'sessions': sessions.map((session) => session.toJson()).toList(),
      'appSettings': appSettings.toJson(),
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? fullName,
    String? phoneNumber,
    String? countryCode,
    String? country,
    bool? isKYCVerified,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<UserSession>? sessions,
    AppSettings? appSettings,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      countryCode: countryCode ?? this.countryCode,
      country: country ?? this.country,
      isKYCVerified: isKYCVerified ?? this.isKYCVerified,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      sessions: sessions ?? this.sessions,
      appSettings: appSettings ?? this.appSettings,
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
  final String language;
  final bool darkMode;
  final bool biometricAuthEnabled;
  final NotificationSettings notificationsSettings;

  const AppSettings({
    required this.language,
    required this.darkMode,
    required this.biometricAuthEnabled,
    required this.notificationsSettings,
  });

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    return AppSettings(
      language: json['language'] as String? ?? 'en',
      darkMode: json['darkMode'] as bool? ?? false,
      biometricAuthEnabled: json['biometricAuthEnabled'] as bool? ?? false,
      notificationsSettings: NotificationSettings.fromJson(
        json['notificationsSettings'] as Map<String, dynamic>? ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'language': language,
      'darkMode': darkMode,
      'biometricAuthEnabled': biometricAuthEnabled,
      'notificationsSettings': notificationsSettings.toJson(),
    };
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
