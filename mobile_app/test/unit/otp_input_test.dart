import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:Hoga/core/widgets/otp_input.dart';

/// Regression cover for the App Store rejection on submission
/// 631e42e1-cc29-47f1-b99a-031fc05cc82e (Guideline 2.1(a)): on an iPad Air
/// 11-inch the software keyboard disappeared from the second OTP digit onwards.
///
/// The cause was one TextFormField per digit with a manual
/// `_focusNodes[index + 1].requestFocus()` after every keystroke, which tore
/// down and rebuilt the platform text input connection mid-entry. These tests
/// lock in the invariant that fixes it: a single input that keeps focus for the
/// whole code, so the keyboard is never dismissed.
void main() {
  group('AppOtpInput', () {
    Widget wrap(Widget child) {
      return MaterialApp(home: Scaffold(body: child));
    }

    /// iPad Air 11-inch, the device Apple reviewed on.
    void useIpadViewport(WidgetTester tester) {
      tester.view.devicePixelRatio = 2.0;
      tester.view.physicalSize = const Size(1640, 2360);
      addTearDown(tester.view.reset);
    }

    testWidgets('renders a single text input, not one per digit', (
      tester,
    ) async {
      useIpadViewport(tester);
      await tester.pumpWidget(wrap(const AppOtpInput(length: 6)));

      // Six inputs is what broke the keyboard; there must be exactly one.
      expect(find.byType(EditableText), findsOneWidget);
    });

    testWidgets('focus never moves while typing all six digits', (
      tester,
    ) async {
      useIpadViewport(tester);
      await tester.pumpWidget(wrap(const AppOtpInput(length: 6)));

      final field = find.byType(EditableText);
      await tester.tap(field);
      await tester.pump();

      final focusAtStart = tester.binding.focusManager.primaryFocus;
      expect(focusAtStart, isNotNull);

      // Type one digit at a time, the way a user does. The old implementation
      // handed focus to a different node on each of these.
      const code = '123456';
      for (int i = 1; i <= code.length; i++) {
        await tester.enterText(field, code.substring(0, i));
        await tester.pump();
        expect(
          tester.binding.focusManager.primaryFocus,
          same(focusAtStart),
          reason: 'focus moved after entering digit $i, which drops the keyboard',
        );
      }
    });

    testWidgets('reports changes and completion', (tester) async {
      useIpadViewport(tester);
      final changes = <String>[];
      String? completed;

      await tester.pumpWidget(
        wrap(
          AppOtpInput(
            length: 6,
            onChanged: changes.add,
            onCompleted: (value) => completed = value,
          ),
        ),
      );

      final field = find.byType(EditableText);
      await tester.enterText(field, '12345');
      await tester.pump();

      expect(changes.last, '12345');
      expect(completed, isNull, reason: 'code is not complete yet');

      await tester.enterText(field, '123456');
      await tester.pump();

      expect(completed, '123456');
    });

    testWidgets('paints each digit in its own box', (tester) async {
      useIpadViewport(tester);
      await tester.pumpWidget(wrap(const AppOtpInput(length: 6)));

      await tester.enterText(find.byType(EditableText), '4821');
      await tester.pump();

      for (final digit in ['4', '8', '2', '1']) {
        expect(find.text(digit), findsOneWidget);
      }
    });

    testWidgets('a pasted code fills every box at once', (tester) async {
      useIpadViewport(tester);
      String? completed;

      await tester.pumpWidget(
        wrap(
          AppOtpInput(length: 6, onCompleted: (value) => completed = value),
        ),
      );

      // SMS autofill and paste arrive as one multi-character insertion.
      await tester.enterText(find.byType(EditableText), '987654');
      await tester.pump();

      expect(completed, '987654');
      expect(find.text('9'), findsOneWidget);
      expect(find.text('4'), findsOneWidget);
    });

    testWidgets('drops non-digits and caps at the configured length', (
      tester,
    ) async {
      useIpadViewport(tester);
      final changes = <String>[];

      await tester.pumpWidget(
        wrap(AppOtpInput(length: 4, onChanged: changes.add)),
      );

      await tester.enterText(find.byType(EditableText), '1a2b3c4d5e');
      await tester.pump();

      expect(changes.last, '1234');
    });

    testWidgets('obscureText hides the digits', (tester) async {
      useIpadViewport(tester);
      await tester.pumpWidget(
        wrap(const AppOtpInput(length: 4, obscureText: true)),
      );

      await tester.enterText(find.byType(EditableText), '1234');
      await tester.pump();

      expect(find.text('1'), findsNothing);
      expect(find.text('•'), findsNWidgets(4));
    });

    testWidgets('seeds an initial value', (tester) async {
      useIpadViewport(tester);
      await tester.pumpWidget(
        wrap(const AppOtpInput(length: 6, initialValue: '135')),
      );
      await tester.pump();

      expect(find.text('1'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
      expect(find.text('5'), findsOneWidget);
    });

    testWidgets('cannot be typed into when disabled', (tester) async {
      useIpadViewport(tester);
      final changes = <String>[];

      await tester.pumpWidget(
        wrap(
          AppOtpInput(length: 6, enabled: false, onChanged: changes.add),
        ),
      );

      expect(
        tester.widget<TextField>(find.byType(TextField)).enabled,
        isFalse,
      );
      expect(changes, isEmpty);
    });
  });
}
