import 'package:flutter_test/flutter_test.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';

UserModel _creator(Map<String, dynamic> fields) => UserModel.fromJson({
  'id': 'c1',
  'email': '',
  'firstName': 'Ama',
  'lastName': 'Owusu',
  'phoneNumber': '241234567',
  'countryCode': '+233',
  'country': 'gh',
  ...fields,
});

void main() {
  group('jar creator canCollect (mirrors server verification)', () {
    test('individual with KYC can collect', () {
      expect(_creator({'kycStatus': 'verified'}).canCollect, isTrue);
    });

    test('individual without KYC cannot', () {
      expect(_creator({'kycStatus': 'in_review'}).canCollect, isFalse);
    });

    test('organization needs KYB', () {
      expect(
        _creator({
          'accountType': 'organization',
          'kycStatus': 'verified',
          'kybStatus': 'in_review',
        }).canCollect,
        isFalse,
      );
      expect(
        _creator({
          'accountType': 'organization',
          'kycStatus': 'verified',
          'kybStatus': 'approved',
        }).canCollect,
        isTrue,
      );
    });

    test('organization does not need KYC', () {
      expect(
        _creator({
          'accountType': 'organization',
          'kycStatus': 'none',
          'kybStatus': 'approved',
        }).canCollect,
        isTrue,
      );
    });

    test('older payloads without the fields are not treated as verified', () {
      expect(_creator({}).canCollect, isFalse);
    });
  });
}
