import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:konto/core/utils/payment_status_utils.dart';
import 'package:konto/l10n/app_localizations.dart';

void main() {
  group('PaymentStatusUtils Tests', () {
    testWidgets('should return correct English payment status labels', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: [Locale('en'), Locale('fr')],
          locale: Locale('en'),
          home: Scaffold(),
        ),
      );

      final context = tester.element(find.byType(Scaffold));
      final localizations = AppLocalizations.of(context)!;

      expect(
        PaymentStatusUtils.getPaymentStatusLabel('pending', localizations),
        equals('Pending'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusLabel('completed', localizations),
        equals('Completed'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusLabel('failed', localizations),
        equals('Failed'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusLabel('transferred', localizations),
        equals('Transferred'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusLabel(
          'unknown_status',
          localizations,
        ),
        equals('Unknown'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusLabel(null, localizations),
        equals('Unknown'),
      );
    });

    testWidgets('should return correct French payment status labels', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: [Locale('en'), Locale('fr')],
          locale: Locale('fr'),
          home: Scaffold(),
        ),
      );

      final context = tester.element(find.byType(Scaffold));
      final localizations = AppLocalizations.of(context)!;

      expect(
        PaymentStatusUtils.getPaymentStatusLabel('pending', localizations),
        equals('En attente'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusLabel('completed', localizations),
        equals('Terminé'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusLabel('failed', localizations),
        equals('Échoué'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusLabel('transferred', localizations),
        equals('Transféré'),
      );
    });

    test('should return correct status type checks', () {
      expect(PaymentStatusUtils.isSuccessfulStatus('completed'), isTrue);
      expect(PaymentStatusUtils.isSuccessfulStatus('transferred'), isTrue);
      expect(PaymentStatusUtils.isSuccessfulStatus('pending'), isFalse);
      expect(PaymentStatusUtils.isSuccessfulStatus('failed'), isFalse);

      expect(PaymentStatusUtils.isInProgressStatus('pending'), isTrue);
      expect(PaymentStatusUtils.isInProgressStatus('completed'), isFalse);

      expect(PaymentStatusUtils.isFailedStatus('failed'), isTrue);
      expect(PaymentStatusUtils.isFailedStatus('completed'), isFalse);
    });

    test('should return correct color classes', () {
      expect(
        PaymentStatusUtils.getPaymentStatusColorClass('pending'),
        equals('warning'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusColorClass('completed'),
        equals('success'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusColorClass('failed'),
        equals('error'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusColorClass('transferred'),
        equals('info'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusColorClass('unknown'),
        equals('default'),
      );
      expect(
        PaymentStatusUtils.getPaymentStatusColorClass(null),
        equals('default'),
      );
    });
  });
}
