import 'package:flutter/material.dart';

class AnimatedNumberText extends StatefulWidget {
  final String value;
  final TextStyle? style;
  final Duration duration;
  final Curve curve;

  const AnimatedNumberText({
    super.key,
    required this.value,
    this.style,
    this.duration = const Duration(milliseconds: 800),
    this.curve = Curves.easeInOut,
  });

  @override
  State<AnimatedNumberText> createState() => _AnimatedNumberTextState();
}

class _AnimatedNumberTextState extends State<AnimatedNumberText>
    with TickerProviderStateMixin {
  late String _previousValue;
  late String _currentValue;
  late List<AnimationController> _controllers;
  late List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _previousValue = widget.value;
    _currentValue = widget.value;
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _controllers = [];
    _animations = [];

    for (int i = 0; i < _currentValue.length; i++) {
      final controller = AnimationController(
        duration: widget.duration,
        vsync: this,
      );
      final animation = Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(parent: controller, curve: widget.curve));

      _controllers.add(controller);
      _animations.add(animation);
    }
  }

  @override
  void didUpdateWidget(AnimatedNumberText oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.value != widget.value) {
      _previousValue = _currentValue;
      _currentValue = widget.value;

      // Dispose old controllers
      for (var controller in _controllers) {
        controller.dispose();
      }

      // Initialize new animations
      _initializeAnimations();

      // Start the animation
      _animateChange();
    }
  }

  void _animateChange() {
    // Add slight delays for a cascading effect
    for (int i = 0; i < _controllers.length; i++) {
      Future.delayed(Duration(milliseconds: i * 50), () {
        if (mounted) {
          _controllers[i].forward();
        }
      });
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  Widget _buildCharacter(
    String char,
    String? previousChar,
    Animation<double> animation,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        // Only animate if the character is a digit and has changed
        if (RegExp(r'\d').hasMatch(char) &&
            previousChar != null &&
            previousChar != char) {
          return Transform(
            alignment: Alignment.center,
            transform:
                Matrix4.identity()
                  ..setEntry(3, 2, 0.001) // perspective
                  ..rotateX(animation.value * 3.14159), // rotate around X-axis
            child:
                animation.value < 0.5
                    ? Text(previousChar, style: widget.style)
                    : Text(char, style: widget.style),
          );
        }

        // For non-digits or unchanged digits, just show the character
        return Text(char, style: widget.style);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(_currentValue.length, (index) {
        final char = _currentValue[index];
        final previousChar =
            index < _previousValue.length ? _previousValue[index] : null;
        final animation =
            index < _animations.length ? _animations[index] : null;

        if (animation != null) {
          return _buildCharacter(char, previousChar, animation);
        }

        return Text(char, style: widget.style);
      }),
    );
  }
}

// Alternative simpler version with scale animation
class AnimatedNumberTextScale extends StatefulWidget {
  final String value;
  final TextStyle? style;
  final Duration duration;

  const AnimatedNumberTextScale({
    super.key,
    required this.value,
    this.style,
    this.duration = const Duration(milliseconds: 600),
  });

  @override
  State<AnimatedNumberTextScale> createState() =>
      _AnimatedNumberTextScaleState();
}

class _AnimatedNumberTextScaleState extends State<AnimatedNumberTextScale>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this);
    // Start with visible text (scale: 1.0, opacity: 1.0)
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.elasticOut));
    _fadeAnimation = Tween<double>(
      begin: 1.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
  }

  @override
  void didUpdateWidget(AnimatedNumberTextScale oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      // Reset animations for the new value change
      _scaleAnimation = Tween<double>(
        begin: 0.8,
        end: 1.0,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.elasticOut));
      _fadeAnimation = Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
      _controller.reset();
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Opacity(
            opacity: _fadeAnimation.value,
            child: Text(widget.value, style: widget.style),
          ),
        );
      },
    );
  }
}

// Revolut-style counter animation with currency support
class RevolutStyleCounterWithCurrency extends StatefulWidget {
  final String value;
  final TextStyle? style;
  final Duration duration;

  const RevolutStyleCounterWithCurrency({
    super.key,
    required this.value,
    this.style,
    this.duration = const Duration(milliseconds: 800),
  });

  @override
  State<RevolutStyleCounterWithCurrency> createState() =>
      _RevolutStyleCounterWithCurrencyState();
}

class _RevolutStyleCounterWithCurrencyState
    extends State<RevolutStyleCounterWithCurrency>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  String _displayValue = '';
  String _previousValue = '';
  bool _hasInitialized = false;

  // Parse currency and number from formatted string
  Map<String, String> _parseValue(String value) {
    // Match patterns like "₵123.45", "$1,234.56", "123.45 USD", etc.
    final currencyFirst = RegExp(r'^([^\d\s]+)\s*(.+)$');
    final currencyLast = RegExp(r'^(.+?)\s*([^\d\s,\.]+)$');

    final firstMatch = currencyFirst.firstMatch(value);
    if (firstMatch != null) {
      return {
        'currency': firstMatch.group(1)!,
        'number': firstMatch.group(2)!,
        'position': 'before',
      };
    }

    final lastMatch = currencyLast.firstMatch(value);
    if (lastMatch != null) {
      return {
        'currency': lastMatch.group(2)!,
        'number': lastMatch.group(1)!,
        'position': 'after',
      };
    }

    // Fallback - treat entire value as number
    return {'currency': '', 'number': value, 'position': 'before'};
  }

  @override
  void initState() {
    super.initState();
    _displayValue = widget.value;
    _hasInitialized = true;
    _controller = AnimationController(duration: widget.duration, vsync: this);
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 1.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));
  }

  @override
  void didUpdateWidget(RevolutStyleCounterWithCurrency oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value && _hasInitialized) {
      _previousValue = _displayValue;
      _displayValue = widget.value;
      _controller.reset();
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentParsed = _parseValue(_displayValue);
    final previousParsed =
        _previousValue.isNotEmpty ? _parseValue(_previousValue) : null;

    // Show text immediately on first load, animate only on updates
    if (!_controller.isAnimating && _previousValue.isEmpty) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (currentParsed['position'] == 'before' &&
              currentParsed['currency']!.isNotEmpty) ...[
            Text(currentParsed['currency']!, style: widget.style),
            const SizedBox(width: 2),
          ],
          Text(currentParsed['number']!, style: widget.style),
          if (currentParsed['position'] == 'after' &&
              currentParsed['currency']!.isNotEmpty) ...[
            const SizedBox(width: 2),
            Text(currentParsed['currency']!, style: widget.style),
          ],
        ],
      );
    }

    return AnimatedBuilder(
      animation: _slideAnimation,
      builder: (context, child) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Currency symbol (if before number) - doesn't animate
            if (currentParsed['position'] == 'before' &&
                currentParsed['currency']!.isNotEmpty) ...[
              Text(currentParsed['currency']!, style: widget.style),
              const SizedBox(width: 2),
            ],
            // Animated number part
            ClipRect(
              child: Stack(
                children: [
                  // Previous number sliding out
                  if (_controller.isAnimating && previousParsed != null)
                    SlideTransition(
                      position: Tween<Offset>(
                        begin: Offset.zero,
                        end: const Offset(0.0, -1.0),
                      ).animate(_controller),
                      child: Text(
                        previousParsed['number']!,
                        style: widget.style,
                      ),
                    ),
                  // Current number sliding in
                  SlideTransition(
                    position: _slideAnimation,
                    child: Text(currentParsed['number']!, style: widget.style),
                  ),
                ],
              ),
            ),
            // Currency symbol (if after number) - doesn't animate
            if (currentParsed['position'] == 'after' &&
                currentParsed['currency']!.isNotEmpty) ...[
              const SizedBox(width: 2),
              Text(currentParsed['currency']!, style: widget.style),
            ],
          ],
        );
      },
    );
  }
}

// Scale animation version with currency support
class AnimatedNumberTextScaleWithCurrency extends StatefulWidget {
  final String value;
  final TextStyle? style;
  final Duration duration;

  const AnimatedNumberTextScaleWithCurrency({
    super.key,
    required this.value,
    this.style,
    this.duration = const Duration(milliseconds: 600),
  });

  @override
  State<AnimatedNumberTextScaleWithCurrency> createState() =>
      _AnimatedNumberTextScaleWithCurrencyState();
}

class _AnimatedNumberTextScaleWithCurrencyState
    extends State<AnimatedNumberTextScaleWithCurrency>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  // Parse currency and number from formatted string
  Map<String, String> _parseValue(String value) {
    // Match patterns like "₵123.45", "$1,234.56", "123.45 USD", etc.
    final currencyFirst = RegExp(r'^([^\d\s]+)\s*(.+)$');
    final currencyLast = RegExp(r'^(.+?)\s*([^\d\s,\.]+)$');

    final firstMatch = currencyFirst.firstMatch(value);
    if (firstMatch != null) {
      return {
        'currency': firstMatch.group(1)!,
        'number': firstMatch.group(2)!,
        'position': 'before',
      };
    }

    final lastMatch = currencyLast.firstMatch(value);
    if (lastMatch != null) {
      return {
        'currency': lastMatch.group(2)!,
        'number': lastMatch.group(1)!,
        'position': 'after',
      };
    }

    // Fallback - treat entire value as number
    return {'currency': '', 'number': value, 'position': 'before'};
  }

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this);
    // Start with visible text (scale: 1.0, opacity: 1.0)
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.elasticOut));
    _fadeAnimation = Tween<double>(
      begin: 1.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
  }

  @override
  void didUpdateWidget(AnimatedNumberTextScaleWithCurrency oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      // Reset animations for the new value change
      _scaleAnimation = Tween<double>(
        begin: 0.8,
        end: 1.0,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.elasticOut));
      _fadeAnimation = Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
      _controller.reset();
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final parsed = _parseValue(widget.value);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Currency symbol (if before number) - doesn't animate
        if (parsed['position'] == 'before' &&
            parsed['currency']!.isNotEmpty) ...[
          Text(parsed['currency']!, style: widget.style),
          const SizedBox(width: 2),
        ],
        // Animated number part
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
              child: Opacity(
                opacity: _fadeAnimation.value,
                child: Text(parsed['number']!, style: widget.style),
              ),
            );
          },
        ),
        // Currency symbol (if after number) - doesn't animate
        if (parsed['position'] == 'after' &&
            parsed['currency']!.isNotEmpty) ...[
          const SizedBox(width: 2),
          Text(parsed['currency']!, style: widget.style),
        ],
      ],
    );
  }
}
