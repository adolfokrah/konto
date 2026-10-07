import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/services/rating_service.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/core/utils/phone_validation_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/jars/data/models/custom_field_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:dio/dio.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/features/contribution/data/api_providers/charges_api_provider.dart';
import 'package:Hoga/features/contribution/data/models/charges_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

/// Step 2 of recording a payment: who paid and how (mobile money or cash),
/// then, for mobile money, a review with the fee before the prompt is sent.
class SaveContributionView extends StatefulWidget {
  const SaveContributionView({super.key});

  @override
  State<SaveContributionView> createState() => _SaveContributionViewState();
}

class _SaveContributionViewState extends State<SaveContributionView> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _accountNumberController =
      TextEditingController();
  String _selectedPaymentMethod = 'mobile-money'; // Store API format
  String _selectedOperator = 'MTN Mobile Money';

  // Mobile money goes through a review step before the request is sent.
  bool _reviewing = false;

  // Arguments from previous screen
  String? amount;
  String? currency;
  String? jarName;
  String? jarId;
  String? jarCreatorId;

  // Custom fields
  List<CustomFieldModel> _customFields = [];
  final Map<String, TextEditingController> _customFieldControllers = {};
  final Map<String, String?> _customFieldSelectValues = {};
  final Map<String, bool> _customFieldCheckboxValues = {};

  final List<String> _operators = ['MTN Mobile Money', 'Telecel Cash'];

  // Charges from backend (includes discount)
  ChargesModel? _charges;
  bool _chargesLoaded = false;

  @override
  void initState() {
    super.initState();
    // Preload the creator's withdrawal accounts so the mobile-money guard in
    // _handlePaymentRequest has a loaded list to check against.
    final waBloc = context.read<WithdrawalAccountsBloc>();
    if (waBloc.state.status == WithdrawalAccountsStatus.initial) {
      waBloc.add(LoadWithdrawalAccounts());
    }
  }

  Future<void> _loadCharges() async {
    final parsedAmount = double.tryParse(amount ?? '');
    if (parsedAmount == null || parsedAmount <= 0 || jarId == null) return;
    // Cash has no processing fee — no need to fetch a breakdown.
    if (_selectedPaymentMethod == 'cash') {
      if (mounted)
        setState(() {
          _charges = null;
          _chargesLoaded = true;
        });
      return;
    }
    if (mounted)
      setState(() {
        _charges = null;
        _chargesLoaded = false;
      });
    try {
      final charges = await ChargesApiProvider(
        dio: getIt<Dio>(),
        userStorageService: getIt<UserStorageService>(),
      ).getCharges(
        amount: parsedAmount,
        jarId: jarId!,
        paymentMethod: _selectedPaymentMethod,
      );
      if (mounted)
        setState(() {
          _charges = charges;
          _chargesLoaded = true;
        });
    } catch (_) {
      if (mounted) setState(() => _chargesLoaded = true);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    // Get arguments passed from add_contribution_view
    final arguments = GoRouterState.of(context).extra as Map<String, dynamic>?;

    if (arguments != null) {
      amount = arguments['amount'] as String?;
      currency = arguments['currency'] as String?;

      // Extract jar details from the jar object
      final jar = arguments['jar'];
      if (jar != null) {
        // Handle both Map and object types for jar data
        if (jar is Map<String, dynamic>) {
          jarId = jar['id'] as String?;
          jarName = jar['name'] as String?;
          // Extract creator ID - could be nested in creator object or direct field
          if (jar['creator'] != null) {
            if (jar['creator'] is Map<String, dynamic>) {
              jarCreatorId = jar['creator']['id'] as String?;
            } else if (jar['creator'] is String) {
              jarCreatorId = jar['creator'] as String?;
            }
          }
        } else {
          // Assume it's a jar model object
          jarId = jar.id as String?;
          jarName = jar.name as String?;
          // Extract creator ID from jar model object
          if (jar.creator != null) {
            jarCreatorId = jar.creator.id as String?;
          }
          // Extract custom fields from jar model
          if (jar.customFields != null) {
            _initCustomFields(jar.customFields as List<CustomFieldModel>);
          }
        }
      }

      if (!_chargesLoaded) _loadCharges();
    }
  }

  void _initCustomFields(List<CustomFieldModel> fields) {
    if (_customFields.isNotEmpty) return; // already initialised
    _customFields = fields;
    for (final field in fields) {
      final key = field.id ?? field.label;
      if (field.fieldType == 'checkbox') {
        _customFieldCheckboxValues[key] = false;
      } else if (field.fieldType == 'select') {
        _customFieldSelectValues[key] = null;
      } else {
        _customFieldControllers[key] = TextEditingController();
      }
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _nameController.dispose();
    _accountNumberController.dispose();
    for (final c in _customFieldControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  // ---------------------------------------------------------------- helpers

  bool get _isMomo => _selectedPaymentMethod == 'mobile-money';

  double get _contributionAmount => double.tryParse(amount ?? '') ?? 0.0;

  /// What the payer is charged: contribution plus the processing fee for
  /// mobile money (from get-charges), the contribution alone for cash.
  double get _totalAmount =>
      _isMomo
          ? (_charges?.amountPaidByContributor ?? _contributionAmount)
          : _contributionAmount;

  String _money(double v) => CurrencyUtils.formatAmount(v, currency ?? '');

  String _operatorKey(AppLocalizations localizations) =>
      PaymentMethodUtils.getMobileMoneyOperatorMap(
        localizations,
      ).entries.firstWhere((entry) => entry.value == _selectedOperator).key;

  String _shortOperatorName(String operator) {
    final net = DsNetworkLogo.fromProvider(operator);
    return switch (net) {
      DsNetwork.mtn => 'MTN',
      DsNetwork.telecel => 'Telecel',
      DsNetwork.airtelTigo => 'AirtelTigo',
      null => operator,
    };
  }

  void _backFromReview() {
    FocusScope.of(context).unfocus();
    setState(() => _reviewing = false);
  }

  // ---------------------------------------------------------------- build

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    // Create a mapping of API values to display names using utility function
    final Map<String, String> paymentMethodMap =
        PaymentMethodUtils.getPaymentMethodMap(localizations);

    return BlocListener<AddContributionBloc, AddContributionState>(
      listener: (context, state) {
        final localizations = AppLocalizations.of(context)!;
        if (state is AddContributionSuccess) {
          context.read<JarSummaryReloadBloc>().add(ReloadJarSummaryRequested());

          if (_selectedPaymentMethod == 'mobile-money') {
            context.read<MomoPaymentBloc>().add(
              MomoPaymentRequested(state.contributionId),
            );
            final provider = _operatorKey(localizations);
            // The waiting screen shows who is paying and how much; "Change
            // number" there comes back here to the payer step.
            context
                .push(
                  '${AppRoutes.awaitMomoPayment}?provider=$provider',
                  extra: {
                    'amount': _totalAmount,
                    'contribution': _contributionAmount,
                    'currency': currency,
                    'name': _nameController.text.trim(),
                    'phone': _phoneController.text.trim(),
                    'network': _shortOperatorName(_selectedOperator),
                  },
                )
                .then((result) {
                  if (result == 'change_number' && mounted) {
                    setState(() => _reviewing = false);
                  }
                });
          } else {
            RatingService.instance.maybeRequestReview();
            context.go(AppRoutes.jarDetail);
          }
          // Show success message
          AppSnackBar.showSuccess(
            context,
            message: localizations.paymentRequestSentSuccessfully,
          );
        } else if (state is AddContributionFailure) {
          // Show error message with specific error handling
          String errorMessage;
          if (state.errorMessage == 'UNKNOWN_ERROR') {
            errorMessage = localizations.unknownError;
          } else if (state.errorMessage.startsWith('UNEXPECTED_ERROR:')) {
            errorMessage = localizations.unexpectedError;
          } else {
            // Use the specific error message from server or fallback to generic
            errorMessage =
                state.errorMessage.isNotEmpty
                    ? state.errorMessage
                    : localizations.failedToSendPaymentRequest;
          }

          AppSnackBar.showError(context, message: errorMessage);
        }
      },
      child: BlocBuilder<AddContributionBloc, AddContributionState>(
        builder: (context, state) {
          final isLoading = state is AddContributionLoading;
          final reviewing = _reviewing && _isMomo;

          return PopScope(
            canPop: !isLoading && !reviewing,
            onPopInvokedWithResult: (didPop, _) {
              if (!didPop && reviewing && !isLoading) _backFromReview();
            },
            child: Scaffold(
              backgroundColor: AppColors.cream,
              appBar: CollectTopBar(
                title:
                    reviewing
                        ? 'Review'
                        : (amount != null && currency != null
                            ? _money(_contributionAmount)
                            : localizations.requestContribution),
                showBack: !isLoading,
                onBack: reviewing ? _backFromReview : () => context.pop(),
              ),
              bottomNavigationBar: CollectFooter(
                children: [_buildPrimaryButton(context, state, localizations)],
              ),
              body: GestureDetector(
                onTap: () => FocusScope.of(context).unfocus(),
                behavior: HitTestBehavior.opaque,
                child: SingleChildScrollView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  child:
                      reviewing
                          ? _buildReview(localizations)
                          : _buildPayer(localizations, paymentMethodMap),
                ),
              ),
            ),
          );
        }, // BlocBuilder ends
      ), // BlocListener ends
    );
  }

  Widget _buildPrimaryButton(
    BuildContext context,
    AddContributionState state,
    AppLocalizations localizations,
  ) {
    final isLoading = state is AddContributionLoading;
    if (_isMomo && !_reviewing) {
      // Payer step for mobile money: validate, then show the review.
      return AppButton.filled(
        text: 'Review',
        onPressed: () {
          FocusScope.of(context).unfocus();
          if (_validate(context)) setState(() => _reviewing = true);
        },
      );
    }

    String buttonText;
    if (isLoading) {
      buttonText = localizations.processing;
    } else if (_isMomo && amount != null) {
      buttonText =
          'Send request · ${(currency ?? '').toUpperCase()} ${_totalAmount.toStringAsFixed(2)}';
    } else if (_isMomo) {
      buttonText = localizations.requestPayment;
    } else if (amount != null) {
      final whole =
          _contributionAmount == _contributionAmount.truncateToDouble();
      buttonText =
          'Record ${(currency ?? '').toUpperCase()} ${whole ? DsMoney.group(_contributionAmount) : _contributionAmount.toStringAsFixed(2)} cash';
    } else {
      buttonText = localizations.saveContribution;
    }
    return AppButton.filled(
      key: const Key('submit_contribution_button'),
      isLoading: isLoading,
      text: buttonText,
      onPressed: () {
        _handlePaymentRequest(context);
      },
    );
  }

  // ---------------------------------------------------------------- payer step

  Widget _buildPayer(
    AppLocalizations localizations,
    Map<String, String> paymentMethodMap,
  ) {
    final phoneField = CollectField(
      key: const ValueKey('payer_phone'),
      controller: _phoneController,
      grouped: true,
      label: _isMomo ? "Payer's number" : 'Phone (optional, for a receipt)',
      hint: '024 000 0000',
      keyboardType: TextInputType.phone,
    );
    final nameField = CollectField(
      key: const ValueKey('payer_name'),
      controller: _nameController,
      grouped: true,
      label: "Contributor's name",
      hint: 'Full name',
      // Not TextInputType.name: on iOS that opens the number/name pad.
      keyboardType: TextInputType.text,
      textCapitalization: TextCapitalization.words,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Payment method: mobile money or cash only.
        CollectSegment<String>(
          value: _selectedPaymentMethod,
          options: [
            for (final entry in paymentMethodMap.entries)
              (
                entry.key,
                entry.value,
                entry.key == 'cash'
                    ? Icons.payments_outlined
                    : Icons.phone_android_rounded,
              ),
          ],
          onChanged: (value) {
            if (value == _selectedPaymentMethod) return;
            setState(() {
              _selectedPaymentMethod = value;
            });
            // Fee schedule differs per method — refresh the breakdown.
            _loadCharges();
          },
        ),
        const SizedBox(height: 12),

        // Network choice (only for mobile money)
        if (_isMomo) ...[
          Row(
            children: [
              for (var i = 0; i < _operators.length; i++) ...[
                if (i > 0) const SizedBox(width: 8),
                Expanded(child: _buildNetworkTile(_operators[i])),
              ],
            ],
          ),
          const SizedBox(height: 12),
        ],

        CollectFieldGroup(
          children: _isMomo ? [phoneField, nameField] : [nameField, phoneField],
        ),

        // Custom fields
        if (_customFields.isNotEmpty) ...[
          const SizedBox(height: 12),
          for (final field in _customFields)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildCustomFieldInput(field, field.id ?? field.label),
            ),
        ],

        if (!_isMomo) ...[
          const SizedBox(height: 12),
          const DsNote(
            tone: DsTone.neutral,
            icon: Icons.info_outline_rounded,
            text:
                "Cash is recorded, not collected. It counts toward the total but isn't transferred.",
          ),
        ],
      ],
    );
  }

  Widget _buildNetworkTile(String operator) {
    final selected = _selectedOperator == operator;
    final net = DsNetworkLogo.fromProvider(operator);
    return CollectOption(
      selected: selected,
      padding: const EdgeInsets.all(10),
      onTap: () => setState(() => _selectedOperator = operator),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (net != null)
            DsNetworkLogo(net, size: 32)
          else
            const DsIconTile(Icons.phone_android_rounded, size: 32),
          const SizedBox(height: 6),
          Text(
            _shortOperatorName(operator),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: DsText.rowTitle.copyWith(
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------- review step

  Widget _buildReview(AppLocalizations localizations) {
    final name = _nameController.text.trim();
    final feeAmount = _totalAmount - _contributionAmount;
    final feeLabel = !_chargesLoaded ? '…' : _money(feeAmount);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            children: [
              Text(
                '${name.isEmpty ? 'The payer' : name.split(RegExp(r'\s+')).first} will be asked to pay',
                style: DsText.caption,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: DsMoney(
                  _totalAmount,
                  currency: (currency ?? '').toUpperCase(),
                  size: 44,
                ),
              ),
            ],
          ),
        ),
        DsListCard(
          children: [
            DsKeyValue('Contribution', _money(_contributionAmount)),
            DsKeyValue('Processing fee', feeLabel),
            DsKeyValue(
              'From',
              '${_shortOperatorName(_selectedOperator)} · ${_phoneController.text.trim()}',
            ),
            DsKeyValue('Name', name),
            if (jarName != null) DsKeyValue('To jar', jarName!),
          ],
        ),
        const SizedBox(height: 12),
        const DsNote(
          tone: DsTone.info,
          icon: Icons.info_outline_rounded,
          text:
              "They'll get a prompt on their phone and approve with their PIN.",
        ),
      ],
    );
  }

  // ---------------------------------------------------------------- submit

  /// Same checks as before; returns false (after telling the user) when the
  /// form can't be sent yet.
  bool _validate(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    // Manual validation - validate contributor name (always required)
    if (_nameController.text.trim().isEmpty) {
      _showErrorSnackBar(localizations.pleaseEnterContributorName);
      return false;
    }

    // Validation for mobile money - phone number is required
    if (_selectedPaymentMethod == 'mobile-money') {
      // Validate phone number for mobile money
      if (_phoneController.text.trim().isEmpty) {
        _showErrorSnackBar(localizations.pleaseEnterMobileMoneyNumber);
        return false;
      }

      // Validate Ghana phone number format
      String phoneNumber = _phoneController.text.trim();
      if (!PhoneValidationUtils.isValidGhanaPhoneNumber(phoneNumber)) {
        _showErrorSnackBar(
          PhoneValidationUtils.getDetailedValidationError(phoneNumber),
        );
        return false;
      }

      // Check if the creator has set up a withdrawal account. Source of truth is
      // the withdrawal accounts list, not the legacy accountHolder field on the user.
      final authState = context.read<AuthBloc>().state;
      if (authState is AuthAuthenticated && authState.user.id == jarCreatorId) {
        final waState = context.read<WithdrawalAccountsBloc>().state;
        if (waState.status == WithdrawalAccountsStatus.loaded &&
            waState.accounts.isEmpty) {
          context.push(AppRoutes.withdrawalAccounts);
          return false;
        }
      }
    }

    if (_selectedPaymentMethod == 'bank') {
      // Validate account number for bank transfer
      if (_accountNumberController.text.trim().isEmpty) {
        _showErrorSnackBar(localizations.pleaseEnterAccountName);
        return false;
      }
    }

    // Validate required custom fields
    for (final field in _customFields) {
      if (!field.required) continue;
      final key = field.id ?? field.label;
      if (field.fieldType == 'select') {
        if (_customFieldSelectValues[key] == null ||
            _customFieldSelectValues[key]!.isEmpty) {
          _showErrorSnackBar('${field.label} is required');
          return false;
        }
      } else if (field.fieldType != 'checkbox') {
        final text = _customFieldControllers[key]?.text.trim() ?? '';
        if (text.isEmpty) {
          _showErrorSnackBar('${field.label} is required');
          return false;
        }
      }
    }
    return true;
  }

  void _handlePaymentRequest(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    if (!_validate(context)) {
      // Something changed since the review; send the user back to fix it.
      if (_reviewing) setState(() => _reviewing = false);
      return;
    }

    final customFieldValues =
        _customFields.isNotEmpty ? _collectCustomFieldValues() : null;

    context.read<AddContributionBloc>().add(
      AddContributionSubmitted(
        jarId: jarId ?? '',
        contributor: _nameController.text.trim(),
        contributorPhoneNumber:
            _phoneController.text
                .trim(), // Phone number not required for Cash and Bank Transfer
        paymentMethod: _selectedPaymentMethod,
        accountNumber:
            _selectedPaymentMethod == 'bank'
                ? _accountNumberController.text.trim()
                : null,
        amountContributed: double.tryParse(amount!) ?? 0.0,
        viaPaymentLink: false,
        mobileMoneyProvider: _operatorKey(localizations),
        customFieldValues: customFieldValues,
      ),
    );
  }

  Widget _buildCustomFieldInput(CustomFieldModel field, String key) {
    final label = field.required ? '${field.label} *' : field.label;

    switch (field.fieldType) {
      case 'checkbox':
        final checked = _customFieldCheckboxValues[key] ?? false;
        return CollectOption(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
          onTap:
              () => setState(() => _customFieldCheckboxValues[key] = !checked),
          child: Row(
            children: [
              Expanded(child: Text(label, style: DsText.rowTitle)),
              const SizedBox(width: 12),
              CollectCheck(checked),
            ],
          ),
        );
      case 'select':
        final options = field.options ?? [];
        return SelectInput<String>(
          label: label,
          value: _customFieldSelectValues[key],
          options:
              options
                  .map((o) => SelectOption(value: o.value, label: o.label))
                  .toList(),
          onChanged: (v) => setState(() => _customFieldSelectValues[key] = v),
          // Mockup list row: label above the answer, chevron on the right.
          suffixIcon: Icon(
            Icons.chevron_right_rounded,
            size: 20,
            color: AppColors.faint,
          ),
        );
      default:
        return CollectField(
          controller: _customFieldControllers[key]!,
          label: label,
          hint: field.placeholder ?? '',
          keyboardType:
              field.fieldType == 'number'
                  ? TextInputType.number
                  : field.fieldType == 'phone'
                  ? TextInputType.phone
                  : field.fieldType == 'email'
                  ? TextInputType.emailAddress
                  : TextInputType.text,
        );
    }
  }

  List<Map<String, dynamic>> _collectCustomFieldValues() {
    final result = <Map<String, dynamic>>[];
    for (final field in _customFields) {
      final key = field.id ?? field.label;
      dynamic value;
      if (field.fieldType == 'checkbox') {
        value = _customFieldCheckboxValues[key] ?? false;
      } else if (field.fieldType == 'select') {
        value = _customFieldSelectValues[key];
      } else {
        value = _customFieldControllers[key]?.text.trim();
      }
      result.add({'fieldId': key, 'label': field.label, 'value': value});
    }
    return result;
  }

  void _showErrorSnackBar(String message) {
    AppSnackBar.showError(context, message: message);
  }
}
