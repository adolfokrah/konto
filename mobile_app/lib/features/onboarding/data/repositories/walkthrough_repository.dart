import 'package:Hoga/core/constants/local_storage_tokens.dart';
import 'package:Hoga/core/services/local_storage_service.dart';

class WalkthroughRepository {
  final LocalStorageService localStorageService;

  WalkthroughRepository({required this.localStorageService});

  Future<bool> checkWalkthroughStatus() async {
    final walkthroughCompleted = await localStorageService.getToken(
      LocalStorageTokens.walkthroughCompleted,
    );
    return walkthroughCompleted != null && walkthroughCompleted == 'true';
  }

  Future<void> completeWalkthrough() async {
    await localStorageService.saveToken(
      LocalStorageTokens.walkthroughCompleted,
      'true',
    );
  }

  Future<void> resetWalkthrough() async {
    await localStorageService.deleteToken(
      LocalStorageTokens.walkthroughCompleted,
    );
  }
}
