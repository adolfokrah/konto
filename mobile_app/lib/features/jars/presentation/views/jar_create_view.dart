import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/currencies.dart';
import 'package:Hoga/core/constants/jar_groups.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_create/jar_create_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/core/services/rating_service.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/features/media/data/models/media_model.dart' as media;
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/features/collaborators/presentation/views/invite_collaborators_view.dart';
import 'package:Hoga/features/jars/data/models/jar_model.dart';
import 'package:Hoga/features/jars/presentation/views/jar_photos_view.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_group_picker.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/withdrawal_account_picker.dart';
import 'package:Hoga/l10n/app_localizations.dart';

/// New jar: type, name & photo, currency and payout, collectors — one screen
/// laid out like the three-step mockup.
class JarCreateView extends StatefulWidget {
  const JarCreateView({super.key});

  @override
  State<JarCreateView> createState() => _JarCreateViewState();
}

/// Upload slot ids, echoed back by [MediaLoaded.contextId].
const String _coverSlot = 'jarCreateCover';
const String _moreSlot = 'jarCreateMore';

/// Same limit as the jar Photos screen and the CMS `images` maxRows.
const int _maxMorePhotos = JarPhotosView.maxPhotos;

class _JarCreateViewState extends State<JarCreateView> {
  /// Quick picks shown as tiles: (JarGroups value, short label).
  static const _quickGroups = [
    ('Weddings', 'Wedding'),
    ('Funeral', 'Funeral'),
    ('Church Contributions', 'Church'),
    ('Susu Collections', 'Susu'),
    ('Birthdays', 'Birthday'),
    ('Naming Ceremonies', 'Naming'),
  ];

  final ScrollController _scrollController = ScrollController();
  TextEditingController nameController = TextEditingController();
  final FocusNode _nameFocus = FocusNode();
  String selectedJarGroup = '';
  Currency? selectedCurrency = Currencies.defaultCurrency;
  List<InvitedCollector> newInvitedCollectors = [];

  /// Cover photo (the jar's `image`).
  media.MediaModel? _cover;

  /// More photos (the jar's `images`, up to [_maxMorePhotos]).
  final List<media.MediaModel> _morePhotos = [];

  /// Slots of uploads in flight, oldest first, for the spinner tiles.
  final List<String> _uploading = [];

  /// Slot the uploader sheet was last opened for; MediaLoading events while
  /// it is set are counted against that slot.
  String? _awaitingSlot;
  String? selectedWithdrawalAccountId;

  /// 0 = type, 1 = name & photo, 2 = collectors (mockup "1 of 3" … "3 of 3").
  int _step = 0;
  bool _hasGoal = false;
  final TextEditingController _goalController = TextEditingController();
  final FocusNode _goalFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    _nameFocus.addListener(() => setState(() {}));
    _goalFocus.addListener(() => setState(() {}));
    // Load the user's withdrawal accounts for the payout picker.
    context.read<WithdrawalAccountsBloc>().add(LoadWithdrawalAccounts());
  }

  void _showInviteCollaboratorsSheet() {
    // Convert InvitedCollector to Contact for the sheet
    List<Contact> selectedContacts =
        newInvitedCollectors
            .map(
              (contributor) => Contact(
                id:
                    contributor.collector?.id ??
                    AppLocalizations.of(context)!.unknown,
                fullName: contributor.collector!.fullName,
                email: contributor.collector!.email,
                phoneNumber: contributor.collector!.phoneNumber,
                photo: contributor.collector!.photo?.url,
              ),
            )
            .toList();

    InviteCollaboratorsSheet.show(
      context,
      selectedContacts: selectedContacts,
      onContactsSelected: (contacts) {
        // Convert Contact back to InvitedCollector and append to the list
        setState(() {
          // Get the set of already selected collector IDs to avoid duplicates
          final existingIds =
              newInvitedCollectors
                  .map((collector) => collector.collector?.id)
                  .where((id) => id != null)
                  .toSet();

          // Filter out contacts that are already in the list
          final newContacts =
              contacts
                  .where((contact) => !existingIds.contains(contact.id))
                  .toList();

          // Convert new contacts to InvitedCollector and append
          final newCollectors =
              newContacts
                  .map(
                    (contact) => InvitedCollector(
                      collector: UserModel(
                        id: contact.id,
                        fullName: contact.fullName,
                        email: contact.email,
                        phoneNumber: contact.phoneNumber,
                        countryCode: '', // We don't have this from Contact
                        country: '', // We don't have this from Contact
                        isKYCVerified: false, // Default value
                        photo:
                            contact.photo != null
                                ? MediaModel(
                                  id: '',
                                  alt: '',
                                  filename: '',
                                  url: contact.photo,
                                )
                                : null,
                      ),
                      name: contact.fullName,
                      phoneNumber: contact.phoneNumber,
                      status: 'pending', // New invites are always pending
                      photo: contact.photo,
                    ),
                  )
                  .toList();

          // Append new collectors to the existing list
          newInvitedCollectors = [...newInvitedCollectors, ...newCollectors];
        });
      },
    );
  }

  int get _pendingMore => _uploading.where((s) => s == _moreSlot).length;
  bool get _coverUploading => _uploading.contains(_coverSlot);
  int get _moreRoom => _maxMorePhotos - _morePhotos.length - _pendingMore;

  void _pickCover() {
    if (_coverUploading) return;
    _awaitingSlot = _coverSlot;
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.jarImage,
      contextId: _coverSlot,
    );
  }

  void _pickMorePhotos() {
    if (_moreRoom <= 0) return;
    _awaitingSlot = _moreSlot;
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.jarImage,
      contextId: _moreSlot,
      maxImages: _moreRoom,
    );
  }

  String? _photoUrl(media.MediaModel? m) =>
      m?.url != null ? ImageUtils.constructImageUrl(m!.url!) : null;

  String _translateError(String error) {
    // Handle translation keys from BLoC
    switch (error) {
      case 'failedToCreateJar':
        return AppLocalizations.of(context)!.failedToCreateJar;
      default:
        // Check if error starts with known translation keys
        if (error.startsWith('unexpectedErrorOccurred:')) {
          final details = error.substring('unexpectedErrorOccurred:'.length);
          return AppLocalizations.of(context)!.unexpectedErrorOccurred(details);
        }
        // Return original error if no translation found
        return error;
    }
  }

  double? _goalAmount() =>
      double.tryParse(_goalController.text.replaceAll(',', '').trim());

  /// Step 1 needs a type; step 2 needs a name, a payout account and (when
  /// the goal is on) an amount.
  bool _validateStep(int step) {
    final l = AppLocalizations.of(context)!;
    if (step == 0 && selectedJarGroup.isEmpty) {
      AppSnackBar.showError(context, message: l.pleaseSelectJarGroup);
      return false;
    }
    if (step == 1) {
      if (nameController.text.isEmpty) {
        AppSnackBar.showError(context, message: l.jarNameCannotBeEmpty);
        return false;
      }
      if (selectedWithdrawalAccountId == null ||
          selectedWithdrawalAccountId!.isEmpty) {
        AppSnackBar.showError(
          context,
          message: 'Please select a payout account',
        );
        return false;
      }
      if (_hasGoal && (_goalAmount() ?? 0) <= 0) {
        AppSnackBar.showError(context, message: 'Enter a goal amount');
        return false;
      }
    }
    return true;
  }

  void _continue() {
    if (!_validateStep(_step)) return;
    FocusScope.of(context).unfocus();
    setState(() => _step++);
  }

  void _back() {
    FocusScope.of(context).unfocus();
    if (_step > 0) {
      setState(() => _step--);
    } else if (context.canPop()) {
      context.pop();
    } else {
      Navigator.of(context).maybePop();
    }
  }

  void _createJar({bool skipInvites = false}) {
    if (nameController.text.isEmpty) {
      AppSnackBar.showError(
        context,
        message: AppLocalizations.of(context)!.jarNameCannotBeEmpty,
      );
      return;
    }

    if (selectedJarGroup.isEmpty) {
      AppSnackBar.showError(
        context,
        message: AppLocalizations.of(context)!.pleaseSelectJarGroup,
      );
      return;
    }

    if (selectedWithdrawalAccountId == null ||
        selectedWithdrawalAccountId!.isEmpty) {
      AppSnackBar.showError(context, message: 'Please select a payout account');
      return;
    }

    if (_hasGoal && (_goalAmount() ?? 0) <= 0) {
      AppSnackBar.showError(context, message: 'Enter a goal amount');
      return;
    }

    final invitedCollectorsData =
        (skipInvites ? <InvitedCollector>[] : newInvitedCollectors)
            .where((contributor) => contributor.collector?.id != null)
            .map(
              (contributor) => {
                'collector': contributor.collector!.id,
                'status': 'pending',
                'role': 'member',
              },
            )
            .toList();

    context.read<JarCreateBloc>().add(
      JarCreateSubmitted(
        name: nameController.text,
        jarGroup: selectedJarGroup,
        currency: selectedCurrency?.code ?? 'GHS',
        invitedCollectors: invitedCollectorsData,
        // No cover picked: the first extra photo stands in as the cover.
        imageId:
            _cover?.id ??
            (_morePhotos.isNotEmpty ? _morePhotos.first.id : null),
        imageIds:
            _morePhotos.isNotEmpty
                ? _morePhotos.map((m) => m.id).toList()
                : null,
        isActive: true,
        goalAmount: _hasGoal ? (_goalAmount() ?? 0) : 0,
        withdrawalAccount: selectedWithdrawalAccountId!,
      ),
    );
  }

  /// Opens the shared payout-account picker and stores the returned id.
  Future<void> _openPayoutAccountPicker() async {
    await WithdrawalAccountPicker.show(
      context,
      currentId: selectedWithdrawalAccountId,
      onSelected: (id) {
        if (!mounted) return;
        setState(() => selectedWithdrawalAccountId = id);
      },
    );
  }

  void _openGroupPicker() {
    JarGroupPicker.show(
      context,
      currentJarGroup: selectedJarGroup,
      onJarGroupSelected: (String selectedGroup) {
        setState(() {
          selectedJarGroup = selectedGroup;
        });
      },
    );
  }

  void _openCurrencyPicker() {
    final localizations = AppLocalizations.of(context)!;
    Widget row(Currency currency, bool isSelected, VoidCallback onTap) {
      return InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage: NetworkImage(currency.flagUrl),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '${CurrencyUtils.getLocalizedCurrencyName(currency.code, localizations)} · ${currency.code}',
                  style: DsText.rowTitle,
                ),
              ),
              DsRadio(selected: isSelected),
            ],
          ),
        ),
      );
    }

    final current = selectedCurrency ?? Currencies.defaultCurrency;
    GenericPicker.showPickerDialog<Currency>(
      context,
      selectedValue: current.code,
      items: Currencies.all,
      onItemSelected: (currency) {
        setState(() => selectedCurrency = currency);
      },
      itemBuilder: row,
      recentItemBuilder: row,
      searchResultBuilder: row,
      searchFilter:
          (currency) =>
              '${CurrencyUtils.getLocalizedCurrencyName(currency.code, localizations)} ${currency.code}',
      isItemSelected:
          (currency, selectedValue) => currency.code == selectedValue,
      searchHint: localizations.searchCurrencies,
      title: localizations.selectCurrency,
      recentSectionTitle: localizations.selectedCurrency,
      otherSectionTitle: localizations.availableCurrencies,
      showSearch: true,
      initialHeight: 0.9,
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _nameFocus.dispose();
    _goalFocus.dispose();
    _goalController.dispose();
    super.dispose();
  }

  // ------------------------------------------------------------ sections

  Widget _heading(String text, {String? sub}) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(text, style: DsText.title.copyWith(fontSize: 27)),
          if (sub != null) ...[
            const SizedBox(height: 8),
            Text(sub, style: DsText.small),
          ],
        ],
      ),
    );
  }

  /// White search-style field (mockup `.search.w`) that opens a picker.
  Widget _searchTrigger(String hint, VoidCallback onTap) {
    return Material(
      color: AppColors.surfaceWhite,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: SizedBox(
          height: 44,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                const Icon(
                  Icons.search_rounded,
                  size: 20,
                  color: AppColors.muted,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    hint,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: DsText.body.copyWith(color: AppColors.muted),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Type tile (mockup `.opt`): emoji on top, label below.
  Widget _typeOption({
    required String emoji,
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return Material(
      color: AppColors.surfaceWhite,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: selected ? AppColors.navy : AppColors.line,
          width: selected ? 2 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 22)),
              const SizedBox(height: 10),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: DsText.rowTitle.copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _typeStep() {
    final quickValues = _quickGroups.map((g) => g.$1).toSet();
    final options = <Widget>[
      for (final g in _quickGroups)
        _typeOption(
          emoji: jarGroupEmoji(g.$1),
          label: g.$2,
          selected: selectedJarGroup == g.$1,
          onTap: () => setState(() => selectedJarGroup = g.$1),
        ),
      // A type picked from search shows as its own selected tile.
      if (selectedJarGroup.isNotEmpty &&
          !quickValues.contains(selectedJarGroup))
        _typeOption(
          emoji: jarGroupEmoji(selectedJarGroup),
          label: selectedJarGroup,
          selected: true,
          onTap: _openGroupPicker,
        ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _heading('What\'s it for?'),
        _searchTrigger(
          'Search ${JarGroups.groups.length} types',
          _openGroupPicker,
        ),
        const SizedBox(height: 14),
        for (var i = 0; i < options.length; i += 2) ...[
          if (i > 0) const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: options[i]),
              const SizedBox(width: 8),
              Expanded(
                child:
                    i + 1 < options.length
                        ? options[i + 1]
                        : const SizedBox.shrink(),
              ),
            ],
          ),
        ],
      ],
    );
  }

  /// Cover slot (mockup `.drop`), 84x84 beside the name field.
  Widget _coverSlotTile() {
    return _PhotoSlot(
      size: 84,
      radius: 16,
      imageUrl: _photoUrl(_cover),
      uploading: _coverUploading,
      emptyIcon: Icons.photo_camera_outlined,
      onTap: _pickCover,
      onRemove: _cover == null ? null : () => setState(() => _cover = null),
    );
  }

  /// "More photos · n of 3": extra thumbnails, spinners for uploads in
  /// flight, and a dashed add tile while under the limit.
  Widget _morePhotosRow() {
    final count = _morePhotos.length;
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'More photos · $count of $_maxMorePhotos',
            style: DsText.caption,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final m in _morePhotos)
                _PhotoSlot(
                  key: ValueKey(m.id),
                  size: 64,
                  radius: 14,
                  imageUrl: _photoUrl(m),
                  onRemove: () => setState(() => _morePhotos.remove(m)),
                ),
              for (var i = 0; i < _pendingMore; i++)
                const _PhotoSlot(size: 64, radius: 14, uploading: true),
              if (_moreRoom > 0)
                _PhotoSlot(
                  size: 64,
                  radius: 14,
                  emptyIcon: Icons.add_rounded,
                  onTap: _pickMorePhotos,
                ),
            ],
          ),
        ],
      ),
    );
  }

  /// Label + value row inside the joined field group (mockup `.group .fl`).
  Widget _groupField({
    required String label,
    required Widget value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 58),
        padding: const EdgeInsets.fromLTRB(14, 9, 14, 10),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: DsText.caption),
                  const SizedBox(height: 2),
                  value,
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 20,
              color: AppColors.muted,
            ),
          ],
        ),
      ),
    );
  }

  Widget _currencyValue() {
    final localizations = AppLocalizations.of(context)!;
    final c = selectedCurrency ?? Currencies.defaultCurrency;
    return Row(
      children: [
        CircleAvatar(radius: 9, backgroundImage: NetworkImage(c.flagUrl)),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            '${CurrencyUtils.getLocalizedCurrencyName(c.code, localizations)} · ${c.code}',
            style: DsText.rowTitle.copyWith(fontSize: 15.5),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _payoutValue() {
    return BlocConsumer<WithdrawalAccountsBloc, WithdrawalAccountsState>(
      listenWhen: (prev, curr) => prev.accounts != curr.accounts,
      listener: (context, state) {
        // Auto-select the default (or first) account once loaded.
        if (selectedWithdrawalAccountId == null && state.accounts.isNotEmpty) {
          final def = state.accounts.firstWhere(
            (a) => a.isDefault,
            orElse: () => state.accounts.first,
          );
          setState(() => selectedWithdrawalAccountId = def.id);
        }
      },
      builder: (context, state) {
        WithdrawalAccountModel? selected;
        for (final a in state.accounts) {
          if (a.id == selectedWithdrawalAccountId) {
            selected = a;
            break;
          }
        }
        final network =
            selected != null && selected.isMobileMoney
                ? DsNetworkLogo.fromProvider(selected.provider)
                : null;

        return Row(
          children: [
            if (network != null) ...[
              DsNetworkLogo(network, size: 22),
              const SizedBox(width: 8),
            ] else if (selected != null) ...[
              Icon(
                selected.isMobileMoney
                    ? Icons.phone_android_rounded
                    : Icons.account_balance_outlined,
                size: 18,
                color: AppColors.navy,
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Text(
                selected == null
                    ? 'Select payout account'
                    : '${selected.label?.isNotEmpty == true ? selected.label! : withdrawalAccountLabel(selected)} ${selected.maskedAccountNumber}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: DsText.rowTitle.copyWith(
                  fontSize: 15.5,
                  color: selected == null ? AppColors.faint : null,
                  fontWeight: selected == null ? FontWeight.w400 : null,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _detailsStep() {
    final localizations = AppLocalizations.of(context)!;
    final cur = (selectedCurrency ?? Currencies.defaultCurrency).code;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _heading('Name & photo'),
        Row(
          children: [
            _coverSlotTile(),
            const SizedBox(width: 12),
            Expanded(
              child: JarField(
                label: localizations.jarName,
                focused: _nameFocus.hasFocus,
                onTap: () => _nameFocus.requestFocus(),
                child: JarBareInput(
                  controller: nameController,
                  focusNode: _nameFocus,
                  hintText: localizations.enterJarName,
                ),
              ),
            ),
          ],
        ),
        _morePhotosRow(),
        const SizedBox(height: 16),
        // Currency and payout joined in one bordered group.
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceWhite,
            borderRadius: BorderRadius.circular(AppRadius.radiusButton),
            border: Border.all(color: AppColors.line),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              _groupField(
                label: localizations.currency,
                value: _currencyValue(),
                onTap: _openCurrencyPicker,
              ),
              const Divider(height: 1, color: AppColors.line),
              _groupField(
                label: 'Payout account',
                value: _payoutValue(),
                onTap: _openPayoutAccountPicker,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Goal toggle (mockup `.card.outline`).
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.radiusCard),
            border: Border.all(color: AppColors.line),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      localizations.goal,
                      style: DsText.rowTitle.copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Show progress to contributors',
                      style: DsText.caption,
                    ),
                  ],
                ),
              ),
              JarToggle(
                value: _hasGoal,
                onChanged: (v) => setState(() => _hasGoal = v),
              ),
            ],
          ),
        ),
        if (_hasGoal) ...[
          const SizedBox(height: 12),
          JarField(
            label: 'Goal amount',
            focused: _goalFocus.hasFocus,
            onTap: () => _goalFocus.requestFocus(),
            child: Row(
              children: [
                Text('$cur ', style: DsText.rowTitle.copyWith(fontSize: 15.5)),
                Expanded(
                  child: JarBareInput(
                    controller: _goalController,
                    focusNode: _goalFocus,
                    hintText: '0',
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  /// Checkbox (mockup `.cb`): navy with a lime tick when on.
  Widget _checkbox(bool on) {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: on ? AppColors.navy : null,
        borderRadius: BorderRadius.circular(7),
        border:
            on ? null : Border.all(color: const Color(0xFFD0D4DB), width: 2),
      ),
      child:
          on ? const Icon(Icons.check, size: 14, color: AppColors.lime) : null,
    );
  }

  Widget _collectorsStep() {
    final localizations = AppLocalizations.of(context)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _heading(
          'Who\'s collecting with you?',
          sub: 'Collectors take payments for this jar. You can add them later.',
        ),
        _searchTrigger(
          'Name, username or phone',
          _showInviteCollaboratorsSheet,
        ),
        if (newInvitedCollectors.isNotEmpty) ...[
          const SizedBox(height: 12),
          DsListCard(
            children: [
              for (final c in newInvitedCollectors)
                DsRow(
                  leading: JarInitialsAvatar(
                    name: c.collector?.fullName ?? c.name ?? '',
                    imageUrl:
                        c.photo != null && c.photo!.startsWith('http')
                            ? c.photo
                            : null,
                  ),
                  title:
                      c.collector?.fullName ?? c.name ?? localizations.unknown,
                  subtitle: c.phoneNumber ?? c.collector?.phoneNumber,
                  trailing: _checkbox(true),
                  // Tapping a picked collector unticks (removes) them.
                  onTap: () => setState(() => newInvitedCollectors.remove(c)),
                ),
            ],
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return MultiBlocListener(
      listeners: [
        BlocListener<MediaBloc, MediaState>(
          listener: (context, state) {
            if (state is MediaLoading) {
              if (_awaitingSlot != null) {
                setState(() => _uploading.add(_awaitingSlot!));
              }
            } else if (state is MediaLoaded &&
                state.context == MediaUploadContext.jarImage &&
                (state.contextId == _coverSlot ||
                    state.contextId == _moreSlot)) {
              setState(() {
                _uploading.remove(state.contextId);
                if (state.contextId == _coverSlot) {
                  _cover = state.media;
                } else if (_morePhotos.length < _maxMorePhotos) {
                  _morePhotos.add(state.media);
                }
              });
            } else if (state is MediaError) {
              if (_uploading.isNotEmpty) {
                setState(() => _uploading.removeAt(0));
              }
              AppSnackBar.showError(context, message: state.errorMessage);
            }
          },
        ),
        BlocListener<JarCreateBloc, JarCreateState>(
          listener: (context, state) {
            if (state is JarCreateSuccess) {
              AppSnackBar.showSuccess(
                context,
                message: AppLocalizations.of(context)!.jarCreatedSuccessfully,
              );

              // Get the newly created jar ID from the JarModel
              final newJarId = state.jar.id;

              // 1. Set the newly created jar as current jar and load its summary
              context.read<JarSummaryBloc>().add(
                SetCurrentJarRequested(jarId: newJarId),
              );

              // 2. Refresh the jar list to include the new jar
              context.read<JarListBloc>().add(LoadJarList());

              // 3. Replace the entire navigation stack with the jar detail view
              context.go(AppRoutes.jarDetail);
              RatingService.instance.maybeRequestReview();
            } else if (state is JarCreateFailure) {
              AppSnackBar.showError(
                context,
                message: _translateError(state.error),
              );
            }
          },
        ),
      ],
      child: BlocBuilder<JarCreateBloc, JarCreateState>(
        builder: (context, jarCreateState) {
          final isLoading = jarCreateState is JarCreateLoading;
          final invites = newInvitedCollectors.length;
          final lastStep = _step == 2;

          return PopScope(
            canPop: _step == 0,
            onPopInvokedWithResult: (didPop, _) {
              if (!didPop) _back();
            },
            child: Scaffold(
              backgroundColor: AppColors.cream,
              appBar: JarTopBar(
                title: 'New jar',
                leadingIcon:
                    _step == 0 ? Icons.close_rounded : Icons.arrow_back_rounded,
                onLeading: _back,
              ),
              body: ListView(
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                children: [
                  switch (_step) {
                    0 => _typeStep(),
                    1 => _detailsStep(),
                    _ => _collectorsStep(),
                  },
                ],
              ),
              bottomNavigationBar: JarFooter(
                children: [
                  if (!lastStep)
                    JarPrimaryButton(
                      label: localizations.continueText,
                      onTap: _continue,
                    )
                  else ...[
                    JarPrimaryButton(
                      label:
                          invites > 0
                              ? '${localizations.createJar} · invite $invites'
                              : localizations.createJar,
                      loading: isLoading,
                      onTap: isLoading ? null : _createJar,
                    ),
                    const SizedBox(height: 4),
                    JarGhostButton(
                      label: 'Skip for now',
                      onTap:
                          isLoading
                              ? null
                              : () => _createJar(skipInvites: true),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Photo tile used on "Name & photo": dashed and empty (tap to add), or the
/// image with a remove button; a spinner covers it while uploading.
class _PhotoSlot extends StatelessWidget {
  final double size;
  final double radius;
  final String? imageUrl;
  final bool uploading;
  final IconData emptyIcon;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;

  const _PhotoSlot({
    super.key,
    required this.size,
    required this.radius,
    this.imageUrl,
    this.uploading = false,
    this.emptyIcon = Icons.photo_camera_outlined,
    this.onTap,
    this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl != null;
    final fallback = Center(
      child: Icon(
        Icons.image_outlined,
        size: size * 0.3,
        color: AppColors.muted,
      ),
    );

    Widget tile = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: hasImage || uploading ? AppColors.fill : AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(radius),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (hasImage)
            Image.network(
              imageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => fallback,
            )
          else if (!uploading)
            Icon(emptyIcon, size: size * 0.3, color: AppColors.muted),
          if (uploading)
            Container(
              color: AppColors.surfaceWhite.withValues(alpha: 0.6),
              alignment: Alignment.center,
              child: const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.navy,
                ),
              ),
            ),
          if (hasImage && !uploading && onRemove != null)
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: onRemove,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceWhite,
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: const Icon(
                    Icons.close_rounded,
                    size: 13,
                    color: AppColors.navy,
                  ),
                ),
              ),
            ),
        ],
      ),
    );

    if (!hasImage && !uploading) {
      tile = CustomPaint(
        foregroundPainter: _DashedRRectPainter(radius),
        child: tile,
      );
    }
    return GestureDetector(onTap: uploading ? null : onTap, child: tile);
  }
}

/// Dashed rounded border for empty photo slots.
class _DashedRRectPainter extends CustomPainter {
  final double radius;
  const _DashedRRectPainter(this.radius);

  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = const Color(0xFFD0D4DB)
          ..strokeWidth = 1.5
          ..style = PaintingStyle.stroke;
    final path =
        Path()..addRRect(
          RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)),
        );
    for (final metric in path.computeMetrics()) {
      double d = 0;
      while (d < metric.length) {
        canvas.drawPath(metric.extractPath(d, d + 5), paint);
        d += 9;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRRectPainter oldDelegate) =>
      oldDelegate.radius != radius;
}
