// DEV ONLY — not for commit. Lets a host script drive navigation on the simulator
// by writing a route into <app Documents>/preview_route.txt.
import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/number_country_picker.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_group_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';

void startDevPreviewHook(GoRouter router) {
  if (!kDebugMode) return;
  String last = '';
  Timer.periodic(const Duration(milliseconds: 700), (_) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final f = File('${dir.path}/preview_route.txt');
      if (!await f.exists()) return;
      final r = (await f.readAsString()).trim();
      if (r.isEmpty || r == last) return;
      last = r;
      final ctx = router.routerDelegate.navigatorKey.currentContext;
      if (r.startsWith('picker:country') && ctx != null) {
        NumberCountryPicker.showCountryPickerDialog(
          ctx,
          selectedCountryCode: '+233',
          onCountrySelected: (_) {},
        );
      } else if (r.startsWith('picker:group') && ctx != null) {
        JarGroupPicker.show(
          ctx,
          currentJarGroup: 'Wedding',
          onJarGroupSelected: (_) {},
        );
      } else if (r.startsWith('tap:') && ctx != null) {
        _tapKey(r.substring(4).split('#').first);
      } else if (r.startsWith('push:')) {
        router.push(r.substring(5));
      } else if (r == 'pop') {
        if (router.canPop()) router.pop();
      } else {
        router.go(r.split('#').first);
      }
    } catch (_) {}
  });
}

void _tapKey(String key) {
  Element? target;
  void find(Element e) {
    if (target != null) return;
    if (e.widget.key == ValueKey<String>(key)) {
      target = e;
      return;
    }
    e.visitChildren(find);
  }

  WidgetsBinding.instance.rootElement?.visitChildren(find);
  if (target == null) return;
  VoidCallback? cb;
  void dig(Element e) {
    if (cb != null) return;
    final w = e.widget;
    if (w is InkWell && w.onTap != null) cb = w.onTap;
    if (w is GestureDetector && w.onTap != null) cb = w.onTap;
    if (w is ButtonStyleButton && w.onPressed != null) cb = w.onPressed;
    if (cb == null) e.visitChildren(dig);
  }

  dig(target!);
  cb?.call();
}
