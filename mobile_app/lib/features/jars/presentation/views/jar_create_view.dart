import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/currencies.dart';
import 'package:konto/core/constants/jar_groups.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/sms_utils.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/category_selector.dart';
import 'package:konto/core/widgets/currency_picker.dart';
import 'package:konto/core/widgets/icon_button.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/jars/logic/bloc/jar_create/jar_create_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/route.dart';
import 'package:konto/features/media/logic/bloc/media_bloc.dart';
import 'package:konto/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:konto/core/widgets/invited_collector_item.dart';
import 'package:konto/core/widgets/scrollable_background_image.dart';
import 'package:konto/core/widgets/small_button.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/features/collaborators/presentation/views/invite_collaborators_view.dart';
import 'package:konto/features/jars/data/models/jar_model.dart';
import 'package:konto/l10n/app_localizations.dart';

class JarCreateView extends StatefulWidget {
  const JarCreateView({super.key});

  @override
  State<JarCreateView> createState() => _JarCreateViewState();
}

class _JarCreateViewState extends State<JarCreateView> {
  final ScrollController _scrollController = ScrollController();
  TextEditingController nameController = TextEditingController();
  String selectedJarGroup = '';
  Currency? selectedCurrency = Currencies.defaultCurrency;
  List<InvitedCollector> invitedContributors = [];
  String jarImageUrl = '';
  String jarImageId = '';
  double _scrollOffset = 0.0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_scrollListener);
  }

  void _showInviteCollaboratorsSheet() {
    // Convert InvitedCollector to Contact for the sheet
    List<Contact> selectedContacts =
        invitedContributors
            .map(
              (contributor) => Contact(
                name: contributor.name ?? AppLocalizations.of(context)!.unknown,
                phoneNumber: contributor.phoneNumber ?? '',
                initials: _generateInitials(contributor.name ?? ''),
              ),
            )
            .toList();

    InviteCollaboratorsSheet.show(
      context,
      selectedContacts: selectedContacts,
      onContactsSelected: (contacts) {
        // Convert Contact back to InvitedCollector and update the list
        setState(() {
          invitedContributors =
              contacts
                  .map(
                    (contact) => InvitedCollector(
                      name: contact.name,
                      phoneNumber: contact.phoneNumber,
                      status: 'pending', // New invites are always pending
                    ),
                  )
                  .toList();
        });
      },
    );
  }

  void _showImageUploaderSheet() {
    ImageUploaderBottomSheet.show(context);
  }

  String _generateInitials(String name) {
    if (name.isEmpty) return '?';

    final words = name.trim().split(' ');
    if (words.length == 1) {
      return words[0].substring(0, 1).toUpperCase();
    } else {
      return '${words[0].substring(0, 1)}${words[words.length - 1].substring(0, 1)}'
          .toUpperCase();
    }
  }

  /// Send SMS invitations for newly created jar
  void _sendSmsInvitations(JarModel jar) async {
    // Check if there are invited contributors with phone numbers
    final phoneNumbers =
        invitedContributors
            .where(
              (contributor) =>
                  contributor.phoneNumber != null &&
                  contributor.phoneNumber!.isNotEmpty,
            )
            .map((contributor) => contributor.phoneNumber!)
            .toList();

    if (phoneNumbers.isEmpty) {
      return; // No phone numbers to send SMS to
    }

    try {
      // Use the SMS utility to open SMS app with the invitation message
      if (mounted) {
        await SmsUtils.openSmsAppForInvitation(
          context,
          jar.id,
          jar.name,
          phoneNumbers,
        );
      }
    } catch (e) {
      // Silently handle errors - don't disrupt the jar creation flow
      print('Could not send SMS invitations: $e');
    }
  }

  void _scrollListener() {
    setState(() {
      _scrollOffset = _scrollController.offset;
    });
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

    final invitedCollectorsData =
        invitedContributors
            .map(
              (contributor) => {
                'name': contributor.name,
                'phoneNumber':
                    contributor.phoneNumber, // Remove toString() call
                'status': contributor.status,
              },
            )
            .toList();

    context.read<JarCreateBloc>().add(
      JarCreateSubmitted(
        name: nameController.text,
        jarGroup: selectedJarGroup,
        currency: selectedCurrency?.code ?? 'GHS',
        invitedCollectors: invitedCollectorsData,
        imageId: jarImageId,
        isActive: true,
        acceptedPaymentMethods: ['mobile-money', 'bank-transfer', 'cash'],
        goalAmount: 0,
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.removeListener(_scrollListener);
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return MultiBlocListener(
      listeners: [
        BlocListener<MediaBloc, MediaState>(
          listener: (context, state) {
            if (state is MediaLoaded) {
              setState(() {
                jarImageUrl =
                    "${BackendConfig.imageBaseUrl}/${state.media.url}";
                jarImageId = state.media.id;
              });
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

              // 3. Send SMS invitations if there are invited contributors
              _sendSmsInvitations(state.jar);

              // 4. Replace the entire navigation stack with the jar detail view
              Navigator.of(
                context,
              ).pushNamedAndRemoveUntil(AppRoutes.jarDetail, (route) => false);
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

          return Scaffold(
            backgroundColor:
                jarImageUrl.isNotEmpty && !isDark
                    ? Theme.of(context).colorScheme.onPrimary
                    : Theme.of(context).colorScheme.primary,
            body: Column(
              children: [
                Expanded(
                  child: CustomScrollView(
                    controller: _scrollController,
                    slivers: [
                      SliverAppBar(
                        expandedHeight: 300.0,
                        floating: false,
                        pinned: true,
                        backgroundColor: Colors.transparent,
                        elevation: 0,
                        flexibleSpace: LayoutBuilder(
                          builder: (
                            BuildContext context,
                            BoxConstraints constraints,
                          ) {
                            // Calculate scroll progress
                            final double top = constraints.biggest.height;
                            final double expandedHeight = 200.0;
                            final double collapsedHeight =
                                kToolbarHeight +
                                MediaQuery.of(context).padding.top;
                            final double scrollProgress = ((expandedHeight -
                                        top) /
                                    (expandedHeight - collapsedHeight))
                                .clamp(0.0, 1.0);

                            return Container(
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.surface
                                    .withValues(alpha: scrollProgress),
                              ),
                              child: Stack(
                                children: [
                                  // Background gradient and image (if available)
                                  if (jarImageUrl.isNotEmpty)
                                    ScrollableBackgroundImage(
                                      imageUrl: jarImageUrl,
                                      scrollOffset: _scrollOffset,
                                      height: 400.0,
                                      maxScrollForOpacity: 100.0,
                                      baseOpacity: 0.50,
                                    ),

                                  // Title positioned independently of image
                                  Positioned(
                                    left:
                                        16.0 +
                                        (40.0 *
                                            scrollProgress), // Smoothly interpolate from 16 to 56
                                    top:
                                        MediaQuery.of(context).padding.top +
                                        kToolbarHeight +
                                        -7 -
                                        (32.0 *
                                            scrollProgress), // Adjusted to center properly when fully scrolled
                                    child: Text(
                                      AppLocalizations.of(
                                        context,
                                      )!.setUpYourJar,
                                      style: TextStyle(
                                        fontSize:
                                            24.0 -
                                            (4.0 *
                                                scrollProgress), // From 24 to 20
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),

                                  Positioned(
                                    bottom: AppSpacing.spacingXs,
                                    right: AppSpacing.spacingXs,
                                    child: AppIconButton(
                                      size: const Size(40, 40),
                                      onPressed: _showImageUploaderSheet,
                                      icon: Icons.camera,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      SliverList(
                        delegate: SliverChildBuilderDelegate((context, index) {
                          return Container(
                            decoration: BoxDecoration(
                              color:
                                  isDark
                                      ? Theme.of(context).colorScheme.surface
                                      : Theme.of(
                                        context,
                                      ).colorScheme.inversePrimary,
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(
                                AppSpacing.spacingM,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  AppTextInput(
                                    label:
                                        AppLocalizations.of(context)!.jarName,
                                    hintText:
                                        AppLocalizations.of(
                                          context,
                                        )!.enterJarName,
                                    controller: nameController,
                                  ),
                                  const SizedBox(height: AppSpacing.spacingM),
                                  CategorySelector(
                                    categories: JarGroups.groups,
                                    selectedCategory:
                                        selectedJarGroup.isEmpty
                                            ? null
                                            : selectedJarGroup,
                                    onCategorySelected: (category) {
                                      setState(() {
                                        selectedJarGroup = category;
                                      });
                                    },
                                  ),
                                  const SizedBox(height: AppSpacing.spacingM),
                                  Text(
                                    AppLocalizations.of(context)!.currency,
                                    style:
                                        Theme.of(context).textTheme.bodyLarge,
                                  ),
                                  const SizedBox(height: AppSpacing.spacingM),
                                  CurrencyPicker(
                                    onCurrencySelected: (currency) {
                                      setState(() {
                                        selectedCurrency = currency;
                                      });
                                    },
                                    selectedCurrency: selectedCurrency,
                                  ),
                                  const SizedBox(height: AppSpacing.spacingM),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        AppLocalizations.of(
                                          context,
                                        )!.collaborators,
                                        style: TextStyles.titleMedium,
                                      ),
                                      AppSmallButton(
                                        padding: EdgeInsets.symmetric(
                                          horizontal: AppSpacing.spacingS,
                                          vertical: 6,
                                        ),
                                        onPressed:
                                            _showInviteCollaboratorsSheet,
                                        child: Row(
                                          children: [
                                            const Icon(Icons.add, size: 16),
                                            const SizedBox(
                                              width: AppSpacing.spacingXs,
                                            ),
                                            Text(
                                              AppLocalizations.of(
                                                context,
                                              )!.invite,
                                              style: TextStyles.titleMediumS,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: AppSpacing.spacingM),
                                  ...invitedContributors.map(
                                    (contributor) => Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: AppSpacing.spacingS,
                                      ),
                                      child: InvitedCollectorItem(
                                        invitedCollector: contributor,
                                        onCancel: () {
                                          setState(() {
                                            invitedContributors.remove(
                                              contributor,
                                            );
                                          });
                                        },
                                      ),
                                    ),
                                  ),
                                  // Add minimum height to ensure scrolling
                                  SizedBox(
                                    height:
                                        MediaQuery.of(context).size.height *
                                        0.2,
                                  ),
                                ],
                              ),
                            ),
                          );
                        }, childCount: 1),
                      ),
                    ],
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    color:
                        isDark
                            ? Theme.of(context).colorScheme.surface
                            : Theme.of(context).colorScheme.inversePrimary,
                  ),
                  padding: EdgeInsetsGeometry.symmetric(
                    horizontal: AppSpacing.spacingM,
                    vertical: AppSpacing.spacingL,
                  ),
                  child: Center(
                    child: AppButton(
                      text: AppLocalizations.of(context)!.createJar,
                      onPressed: isLoading ? null : _createJar,
                      isLoading: isLoading,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
