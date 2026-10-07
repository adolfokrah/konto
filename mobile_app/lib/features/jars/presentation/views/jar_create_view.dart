import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/currencies.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_create/jar_create_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/core/services/rating_service.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/features/collaborators/presentation/views/invite_collaborators_view.dart';
import 'package:Hoga/features/jars/data/models/jar_model.dart';
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
  // Multiple photos (max 3)
  List<String> jarImageUrls = [];
  List<String> jarImageIds = [];
  String? selectedWithdrawalAccountId;

  @override
  void initState() {
    super.initState();
    _nameFocus.addListener(() => setState(() {}));
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

  void _showImageUploaderSheet() {
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.jarImage,
    );
  }

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

  void _createJar() {
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

    final invitedCollectorsData =
        newInvitedCollectors
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
        imageId: jarImageIds.isNotEmpty ? jarImageIds.first : null,
        imageIds: jarImageIds.isNotEmpty ? jarImageIds : null,
        isActive: true,
        goalAmount: 0,
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
    super.dispose();
  }

  // ------------------------------------------------------------ sections

  Widget _heading(String text, {String? sub}) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(text, style: DsText.title.copyWith(fontSize: 24)),
          if (sub != null) ...[
            const SizedBox(height: 4),
            Text(sub, style: DsText.small),
          ],
        ],
      ),
    );
  }

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
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _typeSection() {
    final quickValues = _quickGroups.map((g) => g.$1).toSet();
    final options = <Widget>[
      for (final g in _quickGroups)
        _typeOption(
          emoji: jarGroupEmoji(g.$1),
          label: g.$2,
          selected: selectedJarGroup == g.$1,
          onTap: () => setState(() => selectedJarGroup = g.$1),
        ),
      if (selectedJarGroup.isNotEmpty &&
          !quickValues.contains(selectedJarGroup))
        _typeOption(
          emoji: jarGroupEmoji(selectedJarGroup),
          label: selectedJarGroup,
          selected: true,
          onTap: _openGroupPicker,
        ),
      _typeOption(
        emoji: '🔎',
        label: 'More types',
        selected: false,
        onTap: _openGroupPicker,
      ),
    ];

    return Column(
      children: [
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

  Widget _photoDrop() {
    final canAdd = jarImageIds.length < 3;
    return GestureDetector(
      onTap: canAdd ? _showImageUploaderSheet : null,
      child: Container(
        width: 58,
        height: 58,
        decoration: BoxDecoration(
          color: AppColors.fill,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(
          Icons.photo_camera_outlined,
          color: canAdd ? AppColors.navy : AppColors.faint,
        ),
      ),
    );
  }

  Widget _photosRow() {
    if (jarImageUrls.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        children: [
          ...List.generate(
            jarImageUrls.length,
            (i) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  JarThumb(imageUrl: jarImageUrls[i], size: 64),
                  Positioned(
                    top: -6,
                    right: -6,
                    child: GestureDetector(
                      onTap:
                          () => setState(() {
                            jarImageUrls.removeAt(i);
                            jarImageIds.removeAt(i);
                          }),
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          color: AppColors.navy,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 13,
                          color: AppColors.surfaceWhite,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),
          Text('${jarImageIds.length} of 3', style: DsText.caption),
        ],
      ),
    );
  }

  Widget _currencyField() {
    final localizations = AppLocalizations.of(context)!;
    final c = selectedCurrency ?? Currencies.defaultCurrency;
    return JarField(
      label: localizations.currency,
      onTap: _openCurrencyPicker,
      trailing: const Icon(
        Icons.keyboard_arrow_down_rounded,
        color: AppColors.muted,
      ),
      child: Row(
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
      ),
    );
  }

  Widget _buildPayoutAccountPicker(BuildContext context) {
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

        return JarField(
          label: 'Payout account',
          onTap: _openPayoutAccountPicker,
          trailing: const Icon(
            Icons.keyboard_arrow_down_rounded,
            color: AppColors.muted,
          ),
          child: Row(
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
          ),
        );
      },
    );
  }

  Widget _collectorsSection() {
    final localizations = AppLocalizations.of(context)!;
    return DsListCard(
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
            title: c.collector?.fullName ?? c.name ?? localizations.unknown,
            subtitle: c.phoneNumber ?? c.collector?.phoneNumber,
            trailing: GestureDetector(
              onTap: () => setState(() => newInvitedCollectors.remove(c)),
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(
                  Icons.close_rounded,
                  size: 20,
                  color: AppColors.muted,
                ),
              ),
            ),
          ),
        DsRow(
          leading: const DsIconTile(Icons.person_add_alt_1_outlined),
          title: localizations.invite,
          subtitle: 'Name, username or phone',
          chevron: true,
          onTap: _showInviteCollaboratorsSheet,
        ),
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
            if (state is MediaLoaded &&
                state.context == MediaUploadContext.jarImage) {
              if (jarImageIds.length < 3) {
                setState(() {
                  jarImageUrls.add(
                    "${BackendConfig.imageBaseUrl}/${state.media.url}",
                  );
                  jarImageIds.add(state.media.id);
                });
              }
            } else if (state is MediaError) {
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

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: JarTopBar(
              title: 'New jar',
              leadingIcon: Icons.close_rounded,
            ),
            body: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
              children: [
                _heading('What\'s it for?'),
                _typeSection(),
                const SizedBox(height: 20),
                _heading('Name & photo'),
                Row(
                  children: [
                    _photoDrop(),
                    const SizedBox(width: 10),
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
                _photosRow(),
                const SizedBox(height: 10),
                _currencyField(),
                const SizedBox(height: 10),
                _buildPayoutAccountPicker(context),
                const SizedBox(height: 20),
                _heading(
                  'Who\'s collecting with you?',
                  sub:
                      'Collectors take payments for this jar. You can add them later.',
                ),
                _collectorsSection(),
              ],
            ),
            bottomNavigationBar: JarFooter(
              children: [
                JarPrimaryButton(
                  label:
                      invites > 0
                          ? '${localizations.createJar} · invite $invites'
                          : localizations.createJar,
                  loading: isLoading,
                  onTap: isLoading ? null : _createJar,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
