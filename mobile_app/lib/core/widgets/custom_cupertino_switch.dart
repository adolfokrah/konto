import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class CustomCupertinoSwitch extends StatefulWidget {
  final bool defaultValue;
  final ValueChanged<bool>? onChanged;
  final Color? activeColor;
  final Color? thumbColor;
  final Color? trackColor;
  final bool? value; // Removed final to make it optional

  const CustomCupertinoSwitch({
    super.key,
    this.defaultValue = false,
    this.onChanged,
    this.activeColor,
    this.thumbColor,
    this.trackColor,
    this.value,
  });

  @override
  State<CustomCupertinoSwitch> createState() => _CustomCupertinoSwitchState();
}

class _CustomCupertinoSwitchState extends State<CustomCupertinoSwitch> {
  late bool _value;

  @override
  void initState() {
    super.initState();
    _value = widget.defaultValue;
  }

  @override
  void didUpdateWidget(CustomCupertinoSwitch oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update internal state if default value changes
    if (widget.defaultValue != oldWidget.defaultValue) {
      _value = widget.defaultValue;
    }
  }

  void _handleValueChange(bool newValue) {
    setState(() {
      _value = newValue;
    });
    // Call the external callback if provided
    widget.onChanged?.call(newValue);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Transform.scale(
      scale: 0.7, // Reduce size to 70% of original
      child: CupertinoSwitch(
        value: widget.value ?? _value,
        onChanged: _handleValueChange,
        activeTrackColor:
            widget.activeColor ?? (isDark ? Colors.white : Colors.black),
        thumbColor:
            widget.thumbColor ??
            (isDark ? Theme.of(context).colorScheme.surface : Colors.white),
        inactiveTrackColor: widget.trackColor,
      ),
    );
  }
}
