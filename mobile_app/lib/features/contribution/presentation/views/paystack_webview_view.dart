import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/route.dart';

class PaystackWebviewView extends StatefulWidget {
  const PaystackWebviewView({super.key});

  @override
  State<PaystackWebviewView> createState() => _PaystackWebviewViewState();
}

class _PaystackWebviewViewState extends State<PaystackWebviewView> {
  late final WebViewController _webViewController;
  Timer? _pollingTimer;
  bool _isLoadingPage = true;
  _PaymentStatus _status = _PaymentStatus.pending;

  String? _authorizationUrl;
  String? _transactionId;

  @override
  void initState() {
    super.initState();
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoadingPage = false);
          },
        ),
      );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = GoRouterState.of(context).extra as Map<String, dynamic>?;
    if (args != null && _authorizationUrl == null) {
      _authorizationUrl = args['authorizationUrl'] as String?;
      _transactionId = args['transactionId'] as String?;
      if (_authorizationUrl != null) {
        _webViewController.loadRequest(Uri.parse(_authorizationUrl!));
        _startPolling();
      }
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _webViewController.loadRequest(Uri.parse('about:blank'));
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      await _checkTransactionStatus();
    });
  }

  Future<void> _checkTransactionStatus() async {
    if (_transactionId == null) return;
    try {
      final dio = getIt<Dio>();
      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/transactions/payment-status',
        queryParameters: {'transactionId': _transactionId},
      );
      final data = response.data as Map<String, dynamic>;
      final status = data['data']?['status'] as String?;

      if (status == 'completed') {
        _pollingTimer?.cancel();
        if (mounted) {
          try {
            context.read<JarSummaryReloadBloc>().add(ReloadJarSummaryRequested());
          } catch (_) {}
          context.go(AppRoutes.jarDetail);
        }
      } else if (status == 'failed') {
        _pollingTimer?.cancel();
        if (mounted) setState(() => _status = _PaymentStatus.failed);
      }
    } on DioException catch (_) {
      // Network error — keep polling
    } catch (_) {
      // Unexpected error — keep polling
    }
  }

  void _retry() {
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    if (_status == _PaymentStatus.failed) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => context.go(AppRoutes.jarDetail),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cancel_outlined, size: 80, color: Colors.red),
                const SizedBox(height: 24),
                Text(
                  'Payment Failed',
                  style: TextStyles.titleBoldLg,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Your payment was not successful. Please try again.',
                  style: TextStyles.titleRegularSm,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                AppButton.filled(
                  text: 'Try Again',
                  onPressed: _retry,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            _pollingTimer?.cancel();
            context.go(AppRoutes.jarDetail);
          },
        ),
        title: Text('Complete Payment', style: TextStyles.titleMediumLg),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _webViewController),
          if (_isLoadingPage)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}

enum _PaymentStatus { pending, failed }
