import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/category_selector.dart';
import 'package:konto/core/widgets/currency_picker.dart';
import 'package:konto/core/widgets/icon_button.dart';
import 'package:konto/core/widgets/image_uploader_bottom_sheet.dart';
import 'package:konto/core/widgets/invited_collector_item.dart';
import 'package:konto/core/widgets/scrollable_background_image.dart';
import 'package:konto/core/widgets/small_button.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/features/jars/collaborators/presentation/views/invite_collaborators_view.dart';
import 'package:konto/features/jars/data/models/jar_model.dart';

class JarCreateView extends StatefulWidget {
  const JarCreateView({super.key});

  @override
  State<JarCreateView> createState() => _JarCreateViewState();
}

class _JarCreateViewState extends State<JarCreateView> {
  final ScrollController _scrollController = ScrollController();
  TextEditingController nameController = TextEditingController();
  String selectedJarGroup = '';
  Currency? selectedCurrency;
  List<InvitedCollector> invitedContributors = [];
  String jarImageUrl = 'http://192.168.0.160:3000/api/media/file/image.png';
  String jarImageId = '';
  double _scrollOffset = 0.0;

  // Dummy jar groups
  final List<String> jarGroups = [
    'Funeral',
    'Parties',
    'Trips',
    'Weddings',
    'Saving groups',
    'Other',
  ];

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
                name: contributor.name ?? 'Unknown',
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
    ImageUploaderBottomSheet.show(
      context,
      onImageSelected: (XFile? image) {
        if (image != null) {
          // Handle the selected image
          setState(() {
            jarImageUrl = image.path; // Use the local file path
          });

          // You can implement image upload to backend here
          // For now, we're just using the local path
          debugPrint('Image selected: ${image.path}');
        }
      },
    );
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

  void _scrollListener() {
    setState(() {
      _scrollOffset = _scrollController.offset;
    });
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
                          kToolbarHeight + MediaQuery.of(context).padding.top;
                      final double scrollProgress = ((expandedHeight - top) /
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
                                'Set up your jar',
                                style: TextStyle(
                                  fontSize:
                                      24.0 -
                                      (4.0 * scrollProgress), // From 24 to 20
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
                                : Theme.of(context).colorScheme.inversePrimary,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.spacingM),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AppTextInput(
                              label: 'Jar name',
                              hintText: "Enter jar name",
                              controller: nameController,
                            ),
                            const SizedBox(height: AppSpacing.spacingM),
                            CategorySelector(
                              categories: jarGroups,
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
                            const Text(
                              'Currency',
                              style: TextStyles.titleMedium,
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
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Collaborators',
                                  style: TextStyles.titleMedium,
                                ),
                                AppSmallButton(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: AppSpacing.spacingS,
                                    vertical: 6,
                                  ),
                                  onPressed: _showInviteCollaboratorsSheet,
                                  child: Row(
                                    children: [
                                      const Icon(Icons.add, size: 16),
                                      const SizedBox(
                                        width: AppSpacing.spacingXs,
                                      ),
                                      const Text(
                                        "Invite",
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
                                ),
                              ),
                            ),
                            // Add minimum height to ensure scrolling
                            SizedBox(
                              height: MediaQuery.of(context).size.height * 0.2,
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
              child: AppButton(text: 'Create Jar', onPressed: () {}),
            ),
          ),
        ],
      ),
    );
  }
}
