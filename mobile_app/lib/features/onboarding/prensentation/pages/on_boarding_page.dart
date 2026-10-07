import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/button_variants.dart';
import 'package:Hoga/core/utils/url_launcher_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/route.dart';

/// First-launch onboarding: three pages (Create, Give, Track), each a
/// scrapbook of real photos with a piece of the product on top.
class OnBoardingPage extends StatefulWidget {
  const OnBoardingPage({super.key});

  @override
  State<OnBoardingPage> createState() => _OnBoardingPageState();
}

class _OnBoardingPageState extends State<OnBoardingPage> {
  final PageController _controller = PageController();
  int _page = 0;

  static const _pages = [
    (
      'One jar for every cause',
      'Weddings, funerals, church projects, susu. Start a jar in two minutes and invite people to collect with you.',
    ),
    (
      'Pay with MoMo. No app needed.',
      'Contributors approve with their PIN or pay by card from your link. Every organizer is verified.',
    ),
    (
      'See every cedi, in and out',
      'Live totals, a statement for every jar, and transfers to MoMo or bank anytime.',
    ),
  ];

  bool get _isLast => _page == _pages.length - 1;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _goTo(int page) {
    _controller.animateToPage(
      page,
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      body: SafeArea(
        child: Column(
          children: [
            // Top bar: wordmark + Skip (or About on the last page)
            SizedBox(
              height: 48,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Image.asset('assets/images/logo.png', height: 18),
                    const Spacer(),
                    if (_isLast)
                      GestureDetector(
                        onTap:
                            () => UrlLauncherUtils.launch(
                              'https://hogapay.com/about',
                            ),
                        child: Text(
                          'About hogapay',
                          style: DsText.small.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.navy,
                          ),
                        ),
                      )
                    else
                      GestureDetector(
                        onTap: () => _goTo(_pages.length - 1),
                        child: Text(
                          'Skip',
                          style: DsText.small.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.navy,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (p) => setState(() => _page = p),
                itemBuilder: (context, index) {
                  final (title, body) = _pages[index];
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                          child: Center(
                            child: FittedBox(
                              fit: BoxFit.contain,
                              child: SizedBox(
                                width: 358,
                                height: 380,
                                child: switch (index) {
                                  0 => const _CreateHero(),
                                  1 => const _GiveHero(),
                                  _ => const _TrackHero(),
                                },
                              ),
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _PagerDots(count: _pages.length, current: _page),
                            const SizedBox(height: 14),
                            Text(
                              title,
                              style: DsText.display.copyWith(fontSize: 29),
                            ),
                            const SizedBox(height: 10),
                            Text(body, style: DsText.body),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: AnimatedSize(
                duration: const Duration(milliseconds: 200),
                child:
                    _isLast
                        ? Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            AppButton(
                              text: 'Create free account',
                              variant: ButtonVariant.fill,
                              onPressed: () => context.push(AppRoutes.register),
                            ),
                            const SizedBox(height: 10),
                            AppButton(
                              text: 'I have an account',
                              variant: ButtonVariant.outline,
                              onPressed: () => context.push(AppRoutes.login),
                            ),
                          ],
                        )
                        : AppButton(
                          text: 'Next',
                          variant: ButtonVariant.fill,
                          onPressed: () => _goTo(_page + 1),
                        ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PagerDots extends StatelessWidget {
  final int count;
  final int current;
  const _PagerDots({required this.count, required this.current});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(right: 6),
            width: i == current ? 22 : 7,
            height: 7,
            decoration: BoxDecoration(
              color: i == current ? AppColors.navy : AppColors.beige,
              borderRadius: BorderRadius.circular(7),
            ),
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------- heroes

const _lift = [
  BoxShadow(color: Color(0x1F1B232E), blurRadius: 30, offset: Offset(0, 12)),
];

/// Photo in a white frame, like a print in a scrapbook.
class _Photo extends StatelessWidget {
  final int image;
  final double radius;
  final bool framed;
  const _Photo(this.image, {this.radius = 20, this.framed = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: framed ? _lift : null,
      ),
      padding: EdgeInsets.all(framed ? 4 : 0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(framed ? radius - 4 : radius),
        child: Image.asset(
          'assets/images/onboarding/image$image.png',
          fit: BoxFit.cover,
          errorBuilder:
              (context, error, stackTrace) => Container(color: AppColors.fill),
        ),
      ),
    );
  }
}

class _FloatCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  const _FloatCard({
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.radius = 20,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: _lift,
      ),
      child: child,
    );
  }
}

class _CreateHero extends StatelessWidget {
  const _CreateHero();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          left: 6,
          right: 6,
          top: 18,
          bottom: 30,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.beige,
              borderRadius: BorderRadius.circular(28),
            ),
          ),
        ),
        const Positioned(
          left: 18,
          top: 0,
          width: 170,
          height: 228,
          child: _Photo(2, radius: 22),
        ),
        const Positioned(
          right: 14,
          top: 38,
          width: 130,
          height: 150,
          child: _Photo(4),
        ),
        const Positioned(
          right: 30,
          top: 200,
          width: 110,
          height: 110,
          child: _Photo(9),
        ),
        Positioned(
          left: 8,
          bottom: 0,
          width: 212,
          child: _FloatCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('💍', style: TextStyle(fontSize: 18)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Kofi & Ama's Wedding",
                            style: DsText.rowTitle.copyWith(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Text('Wedding jar', style: DsText.caption),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const DsMoney(12480, currency: null, size: 22),
                const SizedBox(height: 8),
                const DsProgress(0.62),
                const SizedBox(height: 4),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('62% of goal', style: DsText.caption),
                    Text('148 people', style: DsText.caption),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _GiveHero extends StatelessWidget {
  const _GiveHero();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned(
          left: 0,
          right: 0,
          top: 0,
          bottom: 40,
          child: _Photo(7, radius: 28, framed: false),
        ),
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          bottom: 40,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: [0.4, 1],
                colors: [Color(0x001B232E), Color(0x8C1B232E)],
              ),
            ),
          ),
        ),
        Positioned(
          left: 14,
          top: 16,
          child: _FloatCard(
            radius: 14,
            padding: const EdgeInsets.fromLTRB(8, 8, 12, 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const DsIconTile(
                  Icons.verified_user_outlined,
                  tone: DsTone.positive,
                  size: 32,
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Organizer', style: DsText.caption),
                    Text(
                      'Verified',
                      style: DsText.rowTitle.copyWith(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        Positioned(
          left: 24,
          right: 24,
          bottom: 0,
          child: _FloatCard(
            child: Column(
              children: [
                Row(
                  children: [
                    const DsNetworkLogo(DsNetwork.mtn, size: 40),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('MoMo prompt', style: DsText.caption),
                          Text(
                            'Pay GHS 203.90 to Hogapay?',
                            style: DsText.rowTitle.copyWith(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Row(
                  children: [
                    Expanded(child: _FakeButton('Cancel', primary: false)),
                    SizedBox(width: 8),
                    Expanded(child: _FakeButton('Approve', primary: true)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _FakeButton extends StatelessWidget {
  final String label;
  final bool primary;
  const _FakeButton(this.label, {required this.primary});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: primary ? AppColors.navy : AppColors.fill,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Supreme',
          fontWeight: FontWeight.w700,
          fontSize: 13.5,
          color: primary ? AppColors.surfaceWhite : AppColors.navy,
        ),
      ),
    );
  }
}

class _TrackHero extends StatelessWidget {
  const _TrackHero();

  static const _bars = [0.30, 0.22, 0.40, 0.35, 0.58, 1.0, 0.66];

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          left: 0,
          right: 0,
          top: 44,
          bottom: 50,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.limeSoft,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: const Color(0xFFE3F1B9)),
            ),
          ),
        ),
        const Positioned(
          right: 12,
          top: 20,
          width: 120,
          height: 150,
          child: _Photo(8),
        ),
        Positioned(
          left: 12,
          top: 64,
          width: 200,
          child: _FloatCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('This week', style: DsText.caption),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      '+3,820',
                      style: DsText.section.copyWith(fontSize: 22),
                    ),
                    const SizedBox(width: 6),
                    const DsTag('↑ 34%', tone: DsTone.positive),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 60,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      for (var i = 0; i < _bars.length; i++) ...[
                        if (i > 0) const SizedBox(width: 5),
                        Expanded(
                          child: FractionallySizedBox(
                            heightFactor: _bars[i],
                            alignment: Alignment.bottomCenter,
                            child: Container(
                              decoration: BoxDecoration(
                                color: i == 5 ? AppColors.navy : AppColors.beige,
                                borderRadius: BorderRadius.circular(5),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          left: 30,
          right: 6,
          bottom: 20,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceWhite,
              borderRadius: BorderRadius.circular(20),
              boxShadow: _lift,
            ),
            child: const Column(
              children: [
                _MiniRow(
                  leading: DsNetworkLogo(DsNetwork.mtn, size: 32),
                  title: 'Kwame Asante',
                  amount: '+200.00',
                  color: AppColors.positive,
                ),
                Divider(height: 1, color: AppColors.line),
                _MiniRow(
                  leading: DsIconTile(Icons.north_east_rounded, size: 32),
                  title: 'Transfer to MoMo',
                  amount: '−2,000.00',
                  color: AppColors.navy,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MiniRow extends StatelessWidget {
  final Widget leading;
  final String title;
  final String amount;
  final Color color;
  const _MiniRow({
    required this.leading,
    required this.title,
    required this.amount,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            leading,
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: DsText.rowTitle.copyWith(fontSize: 13.5),
              ),
            ),
            Text(
              amount,
              style: TextStyle(
                fontFamily: 'Chillax',
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: color,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
