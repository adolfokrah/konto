import 'package:flutter_test/flutter_test.dart';
import 'package:Hoga/core/utils/phone_validation_utils.dart';

void main() {
  group('PhoneValidationUtils Tests', () {
    group('isValidGhanaPhoneNumber', () {
      test('should validate MTN numbers correctly', () {
        // MTN prefixes: 24, 54, 55, 59
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0241234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0541234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0551234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0591234567'), true);
      });

      test('should validate Vodafone numbers correctly', () {
        // Vodafone prefixes: 20, 50
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0201234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0501234567'), true);
      });

      test('should validate AirtelTigo numbers correctly', () {
        // AirtelTigo prefixes: 26, 27, 56, 57
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0261234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0271234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0561234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0571234567'), true);
      });

      test('should validate Glo numbers correctly', () {
        // Glo prefix: 23
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0231234567'), true);
      });

      test('should accept numbers with +233 prefix', () {
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('+233241234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('+233501234567'), true);
      });

      test('should accept numbers with 233 prefix (no plus)', () {
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('233241234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('233501234567'), true);
      });

      test('should accept numbers without prefix (9 digits)', () {
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('241234567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('501234567'), true);
      });

      test('should handle numbers with spaces and special characters', () {
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('024 123 4567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('024-123-4567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('(024) 123 4567'), true);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('+233 24 123 4567'), true);
      });

      test('should reject invalid network prefixes', () {
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0101234567'), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0151234567'), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0281234567'), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('0991234567'), false);
      });

      test('should reject numbers that are too short', () {
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('024123456'), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('02412345'), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('+23324123456'), false);
      });

      test('should reject numbers that are too long', () {
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('02412345678'), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('024123456789'), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('+2332412345678'), false);
      });

      test('should reject empty or invalid input', () {
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber(''), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('abc'), false);
        expect(PhoneValidationUtils.isValidGhanaPhoneNumber('024abcd567'), false);
      });
    });

    group('normalizeToLocalFormat', () {
      test('should normalize +233 format to 0XX format', () {
        expect(
          PhoneValidationUtils.normalizeToLocalFormat('+233241234567'),
          '0241234567',
        );
        expect(
          PhoneValidationUtils.normalizeToLocalFormat('+233501234567'),
          '0501234567',
        );
      });

      test('should normalize 233 format to 0XX format', () {
        expect(
          PhoneValidationUtils.normalizeToLocalFormat('233241234567'),
          '0241234567',
        );
      });

      test('should normalize 9-digit format to 0XX format', () {
        expect(
          PhoneValidationUtils.normalizeToLocalFormat('241234567'),
          '0241234567',
        );
      });

      test('should keep 0XX format unchanged', () {
        expect(
          PhoneValidationUtils.normalizeToLocalFormat('0241234567'),
          '0241234567',
        );
      });

      test('should return empty string for invalid numbers', () {
        expect(PhoneValidationUtils.normalizeToLocalFormat('0101234567'), '');
        expect(PhoneValidationUtils.normalizeToLocalFormat('024123'), '');
        expect(PhoneValidationUtils.normalizeToLocalFormat('abc'), '');
      });
    });

    group('normalizeToInternationalFormat', () {
      test('should normalize 0XX format to +233 format', () {
        expect(
          PhoneValidationUtils.normalizeToInternationalFormat('0241234567'),
          '+233241234567',
        );
        expect(
          PhoneValidationUtils.normalizeToInternationalFormat('0501234567'),
          '+233501234567',
        );
      });

      test('should normalize 9-digit format to +233 format', () {
        expect(
          PhoneValidationUtils.normalizeToInternationalFormat('241234567'),
          '+233241234567',
        );
      });

      test('should keep +233 format unchanged', () {
        expect(
          PhoneValidationUtils.normalizeToInternationalFormat('+233241234567'),
          '+233241234567',
        );
      });

      test('should add + to 233 format', () {
        expect(
          PhoneValidationUtils.normalizeToInternationalFormat('233241234567'),
          '+233241234567',
        );
      });

      test('should return empty string for invalid numbers', () {
        expect(
          PhoneValidationUtils.normalizeToInternationalFormat('0101234567'),
          '',
        );
        expect(PhoneValidationUtils.normalizeToInternationalFormat('024123'), '');
      });
    });

    group('getNetworkName', () {
      test('should identify MTN networks', () {
        expect(PhoneValidationUtils.getNetworkName('0241234567'), 'MTN');
        expect(PhoneValidationUtils.getNetworkName('0541234567'), 'MTN');
        expect(PhoneValidationUtils.getNetworkName('0551234567'), 'MTN');
        expect(PhoneValidationUtils.getNetworkName('0591234567'), 'MTN');
      });

      test('should identify Vodafone networks', () {
        expect(PhoneValidationUtils.getNetworkName('0201234567'), 'Vodafone');
        expect(PhoneValidationUtils.getNetworkName('0501234567'), 'Vodafone');
      });

      test('should identify AirtelTigo networks', () {
        expect(PhoneValidationUtils.getNetworkName('0261234567'), 'AirtelTigo');
        expect(PhoneValidationUtils.getNetworkName('0271234567'), 'AirtelTigo');
        expect(PhoneValidationUtils.getNetworkName('0561234567'), 'AirtelTigo');
        expect(PhoneValidationUtils.getNetworkName('0571234567'), 'AirtelTigo');
      });

      test('should identify Glo networks', () {
        expect(PhoneValidationUtils.getNetworkName('0231234567'), 'Glo');
      });

      test('should work with different formats', () {
        expect(PhoneValidationUtils.getNetworkName('+233241234567'), 'MTN');
        expect(PhoneValidationUtils.getNetworkName('233201234567'), 'Vodafone');
        expect(PhoneValidationUtils.getNetworkName('261234567'), 'AirtelTigo');
      });

      test('should return Unknown for invalid numbers', () {
        expect(PhoneValidationUtils.getNetworkName('0101234567'), 'Unknown');
        expect(PhoneValidationUtils.getNetworkName('abc'), 'Unknown');
      });
    });

    group('getDetailedValidationError', () {
      test('should return appropriate error for empty string', () {
        expect(
          PhoneValidationUtils.getDetailedValidationError(''),
          'Phone number is required',
        );
      });

      test('should return appropriate error for too short numbers', () {
        final error = PhoneValidationUtils.getDetailedValidationError('024123');
        expect(error.contains('too short'), true);
      });

      test('should return appropriate error for too long numbers', () {
        final error = PhoneValidationUtils.getDetailedValidationError('02412345678');
        expect(error.contains('too long'), true);
      });

      test('should return appropriate error for invalid prefix', () {
        final error = PhoneValidationUtils.getDetailedValidationError('0101234567');
        expect(error.contains('Invalid network prefix'), true);
      });

      test('should return appropriate error for non-numeric characters', () {
        final error = PhoneValidationUtils.getDetailedValidationError('024abc4567');
        expect(error.contains('digits'), true);
      });
    });
  });
}
