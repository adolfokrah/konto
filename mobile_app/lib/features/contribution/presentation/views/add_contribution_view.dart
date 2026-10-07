import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';

/// Step 1 of recording a payment: the amount, typed on an in-app keypad or
/// picked from the quick amounts.
class AddContributionView extends StatefulWidget {
  const AddContributionView({super.key});

  @override
  State<AddContributionView> createState() => _AddContributionViewState();
}

class _AddContributionViewState extends State<AddContributionView> {
  bool _isInitialized = false;

  /// What the user has typed, e.g. "200", "12.5". Empty means 0.
  String _input = '';

  // Predefined quick amount options
  final List<double> _quickAmounts = [10, 25, 50, 100];

  double get _selectedAmount => double.tryParse(_input) ?? 0.0;

  String _format(double v) =>
      v == v.truncateToDouble() ? v.toStringAsFixed(0) : v.toString();

  void _selectQuickAmount(double amount) {
    HapticUtils.light();
    setState(() => _input = _format(amount));
  }

  void _onKey(String key) {
    HapticUtils.light();
    setState(() {
      if (key == '<') {
        if (_input.isNotEmpty) _input = _input.substring(0, _input.length - 1);
        return;
      }
      if (key == '.') {
        if (_input.contains('.')) return;
        _input = _input.isEmpty ? '0.' : '$_input.';
        return;
      }
      final dot = _input.indexOf('.');
      if (dot >= 0 && _input.length - dot > 2) return; // two decimals max
      if (dot < 0 && _input.replaceAll('.', '').length >= 9) return;
      if (_input == '0') {
        _input = key;
      } else {
        _input = '$_input$key';
      }
    });
  }

  void _clear() {
    HapticUtils.medium();
    setState(() => _input = '');
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, state) {
        if (state is! JarSummaryLoaded) {
          return const Scaffold(backgroundColor: AppColors.surfaceWhite);
        }
        final jarData = state.jarData;
        final fixed = jarData.isFixedContribution;

        if (!_isInitialized) {
          _isInitialized = true;
          _input =
              fixed
                  ? _format(jarData.acceptedContributionAmount)
                  : _format(_quickAmounts.first);
        }

        return Scaffold(
          backgroundColor: AppColors.surfaceWhite,
          appBar: CollectTopBar(
            background: AppColors.surfaceWhite,
            filledButtons: true,
            leadingIcon: Icons.close_rounded,
            onBack: () => context.pop(),
            titleWidget: Container(
              height: 30,
              constraints: const BoxConstraints(maxWidth: 220),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.surfaceWhite,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.line),
              ),
              alignment: Alignment.center,
              child: Text(
                jarData.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: DsText.rowTitle.copyWith(fontSize: 13.5),
              ),
            ),
          ),
          body: SafeArea(
            top: false,
            child: Column(
              children: [
                Expanded(
                  child: Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: _AmountDisplay(
                              input: _input,
                              currency: jarData.currency.toUpperCase(),
                            ),
                          ),
                          if (fixed) ...[
                            const SizedBox(height: 10),
                            const DsTag('Fixed amount', tone: DsTone.lime),
                          ],
                          const SizedBox(height: 18),
                          Opacity(
                            opacity: fixed ? 0.4 : 1,
                            child: Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 6,
                              runSpacing: 6,
                              children: [
                                for (final amount in _quickAmounts)
                                  CollectChip(
                                    label: _format(amount),
                                    selected: _selectedAmount == amount,
                                    onTap:
                                        fixed
                                            ? null
                                            : () => _selectQuickAmount(amount),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (!fixed) _Keypad(onKey: _onKey, onClear: _clear),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: AppButton.filled(
                    text: localizations.next,
                    onPressed: () {
                      // Validate amount
                      if (_selectedAmount <= 0) {
                        AppSnackBar.show(
                          context,
                          message: localizations.pleaseEnterValidAmount,
                          type: SnackBarType.error,
                        );
                        return;
                      }

                      // Navigate to the payer step with jar and amount data
                      context.push(
                        AppRoutes.saveContribution,
                        extra: {
                          'jar': state.jarData,
                          'amount': _selectedAmount.toString(),
                          'currency': state.jarData.currency,
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// "GHS 200.00": currency small and muted, pesewas faint until typed.
class _AmountDisplay extends StatelessWidget {
  final String input;
  final String currency;

  const _AmountDisplay({required this.input, required this.currency});

  @override
  Widget build(BuildContext context) {
    final text = input.isEmpty ? '0' : input;
    final dot = text.indexOf('.');
    final whole = dot < 0 ? text : text.substring(0, dot);
    final typedCents = dot < 0 ? '' : text.substring(dot + 1);
    final grouped = DsMoney.group(double.tryParse(whole) ?? 0);

    const size = 64.0;
    const main = TextStyle(
      fontFamily: 'Chillax',
      fontWeight: FontWeight.w600,
      fontSize: size,
      letterSpacing: -0.4,
      height: 1.1,
      color: AppColors.navy,
      fontFeatures: [FontFeature.tabularFigures()],
    );
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(
            text: '$currency ',
            style: const TextStyle(
              fontFamily: 'Supreme',
              fontWeight: FontWeight.w500,
              fontSize: size * 0.42,
              color: AppColors.muted,
            ),
          ),
          TextSpan(text: grouped, style: main),
          if (dot >= 0) TextSpan(text: '.$typedCents', style: main),
          TextSpan(
            text:
                dot < 0
                    ? '.00'
                    : List.filled(2 - typedCents.length, '0').join(),
            style: main.copyWith(color: AppColors.faint),
          ),
        ],
      ),
      maxLines: 1,
    );
  }
}

class _Keypad extends StatelessWidget {
  final ValueChanged<String> onKey;
  final VoidCallback onClear;

  const _Keypad({required this.onKey, required this.onClear});

  @override
  Widget build(BuildContext context) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 4,
        crossAxisSpacing: 8,
        childAspectRatio: 2.1,
        children: [
          for (final k in keys)
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => onKey(k),
                onLongPress: k == '<' ? onClear : null,
                child: Center(
                  child:
                      k == '<'
                          ? const Icon(
                            Icons.backspace_outlined,
                            size: 22,
                            color: AppColors.navy,
                          )
                          : Text(
                            k,
                            style: const TextStyle(
                              fontFamily: 'Chillax',
                              fontWeight: FontWeight.w500,
                              fontSize: 25,
                              color: AppColors.navy,
                            ),
                          ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
