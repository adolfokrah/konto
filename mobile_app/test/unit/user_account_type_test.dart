import 'package:flutter_test/flutter_test.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';

Map<String, dynamic> _userJson([Map<String, dynamic> extra = const {}]) => {
  'id': 'u1',
  'email': 'u1@test.hoga',
  'firstName': 'Ama',
  'lastName': 'Owusu',
  'username': 'ama',
  'phoneNumber': '241234567',
  'countryCode': '+233',
  'country': 'gh',
  'kycStatus': 'verified',
  'createdAt': '2026-10-06T00:00:00.000Z',
  'updatedAt': '2026-10-06T00:00:00.000Z',
  'sessions': <dynamic>[],
  ...extra,
};

void main() {
  group('User.accountType', () {
    test('defaults to individual when the server sends none', () {
      final user = User.fromJson(_userJson());
      expect(user.accountType, 'individual');
      expect(user.isOrganization, isFalse);
    });

    test('reads organization accounts', () {
      final user = User.fromJson(_userJson({'accountType': 'organization'}));
      expect(user.isOrganization, isTrue);
    });

    test('round-trips through toJson and copyWith', () {
      final user = User.fromJson(_userJson({'accountType': 'organization'}));
      expect(User.fromJson(user.toJson()).accountType, 'organization');
      expect(user.copyWith(accountType: 'individual').isOrganization, isFalse);
    });
  });
}
