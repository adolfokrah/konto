/// Notification model representing a single notification document
/// Mirrors the Payload CMS `notifications` collection schema
/// Fields: type (select), message (text), data (json), status (select), user (relationship), timestamps

enum NotificationType {
  jarInvite('jarInvite'),
  info('info'),
  kyc('kyc');

  const NotificationType(this.value);
  final String value;

  static NotificationType fromString(String? v) {
    switch (v) {
      case 'jarInvite':
        return NotificationType.jarInvite;
      case 'info':
        return NotificationType.info;
      case 'kyc':
        return NotificationType.kyc;
      default:
        return NotificationType.info; // fallback
    }
  }
}

enum NotificationStatus {
  read('read'),
  unread('unread');

  const NotificationStatus(this.value);
  final String value;

  static NotificationStatus fromString(String? v) {
    switch (v) {
      case 'read':
        return NotificationStatus.read;
      case 'unread':
        return NotificationStatus.unread;
      default:
        return NotificationStatus.unread; // default fallback
    }
  }
}

class NotificationModel {
  final String id;
  final NotificationType type;
  final String message;
  final Map<String, dynamic>? data;
  final NotificationStatus status;
  final String userId; // relationship id (depth 0 fetch)
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const NotificationModel({
    required this.id,
    required this.type,
    required this.message,
    required this.data,
    required this.status,
    required this.userId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      type: NotificationType.fromString(json['type'] as String?),
      message: json['message'] as String? ?? '',
      data:
          (json['data'] is Map<String, dynamic>)
              ? json['data'] as Map<String, dynamic>
              : null,
      status: NotificationStatus.fromString(json['status'] as String?),
      userId: _extractUserId(json['user']),
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.value,
      'message': message,
      'data': data,
      'status': status.value,
      'user': userId,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  static String _extractUserId(dynamic userField) {
    if (userField == null) return '';
    if (userField is String) return userField; // depth 0 stores id string
    if (userField is Map<String, dynamic>) {
      // If depth > 0 populate occurs
      return userField['id'] as String? ?? userField['_id'] as String? ?? '';
    }
    return '';
  }

  static DateTime? _parseDate(dynamic v) {
    if (v is String && v.isNotEmpty) {
      try {
        return DateTime.parse(v);
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}
